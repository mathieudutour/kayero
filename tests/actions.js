import test from 'ava'

import Immutable from 'immutable'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import fetchMock from 'fetch-mock'
import requireMock from 'mock-require'

requireMock('electron', {
  remote: {
    dialog: {
      showOpenDialog (_, callback) {
        callback()
      }
    },
    app: {
      addRecentDocument () {}
    },
    BrowserWindow: {
      getFocusedWindow () {
        return {
          setRepresentedFilename () {},
          setDocumentEdited () {}
        }
      }
    }
  }
})

import { gistUrl, gistApi } from '../src/js/config' // eslint-disable-line
const actions = require('../src/js/actions')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

// Mock stuff for execution
global.document = require('jsdom').jsdom('<body></body>')
global.window = document.defaultView
global.nv = {}

test.afterEach.always((t) => {
  fetchMock.restore()
})

test('should create RECEIVED_DATA, trigger auto exec when data is received with URLs', (t) => {
  fetchMock.mock('http://example.com/data1', {body: {thing: 'data1'}})
           .mock('http://example.com/data2', {body: {thing: 'data2'}})

  const store = mockStore({
    notebook: Immutable.fromJS({
      metadata: {
        datasources: {
          one: 'http://example.com/data1',
          two: 'http://example.com/data2'
        }
      },
      blocks: {
        '12': {
          option: 'auto'
        }
      },
      content: ['12']
    }),
    execution: Immutable.fromJS({
      data: {},
      executionContext: {}
    })
  })

  const expecteds = [
    {type: actions.RECEIVED_DATA, name: 'one', data: {thing: 'data1'}},
    {type: actions.RECEIVED_DATA, name: 'two', data: {thing: 'data2'}}
  ]

  return store.dispatch(actions.fetchData())
    .then(() => {
      t.deepEqual(store.getActions().slice(0, 2), expecteds)
      t.is(store.getActions().length, 4)
      t.is(store.getActions()[2].type, actions.CODE_RUNNING)
      t.is(store.getActions()[3].type, actions.CODE_EXECUTED)
    })
})

test('should create RECEIVED_DATA, trigger auto exec when data is received with mongo connection', (t) => {
  const store = mockStore({
    notebook: Immutable.fromJS({
      metadata: {
        datasources: {
          one: 'mongodb://localhost',
          two: 'mongodb-secure://./secret.json'
        }
      },
      blocks: {
        '12': {
          option: 'auto'
        }
      },
      content: ['12']
    }),
    execution: Immutable.fromJS({
      data: {},
      executionContext: {}
    })
  })

  const expecteds = [
    {type: actions.RECEIVED_DATA, name: 'one', data: {
      __type: 'mongodb',
      __secure: false,
      url: 'mongodb://localhost'
    }},
    {type: actions.RECEIVED_DATA, name: 'two', data: {
      __type: 'mongodb',
      __secure: true,
      url: 'mongodb-secure://./secret.json'
    }}
  ]

  return store.dispatch(actions.fetchData())
    .then(() => {
      t.deepEqual(store.getActions().slice(0, 2), expecteds)
      t.is(store.getActions().length, 4)
      t.is(store.getActions()[2].type, actions.CODE_RUNNING)
      t.is(store.getActions()[3].type, actions.CODE_EXECUTED)
    })
})

test('should not fetch data unless necessary', (t) => {
  fetchMock.mock('http://example.com/data1', {body: {thing: 'data1'}})
           .mock('http://example.com/data2', {body: {thing: 'data2'}})

  const store = mockStore({
    notebook: Immutable.fromJS({
      metadata: {
        datasources: {
          one: 'http://example.com/data1',
          two: 'http://example.com/data2'
        }
      },
      blocks: {},
      content: []
    }),
    execution: Immutable.fromJS({
      data: {one: 'hooray'}
    })
  })

  const expected = [
    {type: actions.RECEIVED_DATA, name: 'two', data: {thing: 'data2'}}
  ]

  return store.dispatch(actions.fetchData())
    .then(() => {
      t.deepEqual(store.getActions(), expected)
    })
})

test('should save a gist and return a GIST_CREATED action', (t) => {
  fetchMock.mock(gistApi, 'POST', {
    id: 'test_gist_id'
  })

  const store = mockStore({})
  const expected = [{type: actions.GIST_CREATED, id: 'test_gist_id'}]

  return store.dispatch(actions.saveGist('title', '## markdown'))
    .then(() => {
      t.deepEqual(store.getActions(), expected)
    })
})

test('should create CODE_EXECUTED on successful block execution', (t) => {
  const store = mockStore({
    notebook: Immutable.fromJS({
      blocks: {
        '0': {
          type: 'code',
          language: 'javascript',
          option: 'runnable',
          content: 'return 1 + 2;'
        }
      }
    }),
    execution: Immutable.fromJS({
      data: {},
      executionContext: {}
    })
  })

  const expected = [{
    type: actions.CODE_RUNNING,
    id: '0'
  }, {
    type: actions.CODE_EXECUTED,
    id: '0',
    data: 3,
    context: Immutable.fromJS({})
  }]

  return store.dispatch(actions.executeCodeBlock('0'))
    .then(() => {
      t.deepEqual(store.getActions(), expected)
    })
})

test('should create CODE_ERROR on error in block execution', (t) => {
  const store = mockStore({
    notebook: Immutable.fromJS({
      blocks: {
        '0': {
          type: 'code',
          language: 'javascript',
          option: 'runnable',
          content: 'some bullshit;'
        }
      }
    }),
    execution: Immutable.fromJS({
      data: {},
      executionContext: {}
    })
  })

  const expected = [{
    type: actions.CODE_RUNNING,
    id: '0'
  }, {
    type: actions.CODE_ERROR,
    id: '0',
    data: Error('SyntaxError: Unexpected identifier')
  }]

  return store.dispatch(actions.executeCodeBlock('0'))
    .then(() => {
      t.deepEqual(store.getActions(), expected)
    })
})

test('should pass context along for use with "this"', (t) => {
  const store = mockStore({
    notebook: Immutable.fromJS({
      blocks: {
        '0': {
          type: 'code',
          language: 'javascript',
          option: 'runnable',
          content: 'this.number = 100; return 5;'
        }
      }
    }),
    execution: Immutable.fromJS({
      data: {},
      executionContext: {}
    })
  })

  const expected = [{
    type: actions.CODE_RUNNING,
    id: '0'
  }, {
    type: actions.CODE_EXECUTED,
    id: '0',
    context: Immutable.Map({number: 100}),
    data: 5
  }]

  return store.dispatch(actions.executeCodeBlock('0'))
    .then(() => {
      t.deepEqual(store.getActions(), expected)
    })
})

test('should make context contents available in code blocks', (t) => {
  const store = mockStore({
    notebook: Immutable.fromJS({
      blocks: {
        '0': {
          type: 'code',
          language: 'javascript',
          option: 'runnable',
          content: 'return this.number;'
        }
      }
    }),
    execution: Immutable.fromJS({
      data: {},
      executionContext: {number: 100}
    })
  })

  const expected = [{
    type: actions.CODE_RUNNING,
    id: '0'
  }, {
    type: actions.CODE_EXECUTED,
    id: '0',
    context: Immutable.Map({number: 100}),
    data: 100
  }]

  return store.dispatch(actions.executeCodeBlock('0'))
    .then(() => {
      t.deepEqual(store.getActions(), expected)
    })
})

test('should resolve returned promises', (t) => {
  const store = mockStore({
    notebook: Immutable.fromJS({
      blocks: {
        '0': {
          type: 'code',
          language: 'javascript',
          option: 'runnable',
          content: 'return Promise.resolve(5);'
        }
      }
    }),
    execution: Immutable.fromJS({
      data: {},
      executionContext: {}
    })
  })

  const expected = [{
    type: actions.CODE_RUNNING,
    id: '0'
  }, {
    type: actions.CODE_EXECUTED,
    id: '0',
    context: Immutable.Map(),
    data: 5
  }]

  return store.dispatch(actions.executeCodeBlock('0'))
    .then(() => {
      t.deepEqual(store.getActions(), expected)
    })
})

test('should auto execute auto and hidden code blocks', (t) => {
  const store = mockStore({
    notebook: Immutable.fromJS({
      blocks: {
        '0': {
          type: 'code',
          language: 'javascript',
          option: 'auto',
          content: 'return Promise.resolve(5);'
        },
        '1': {
          type: 'code',
          language: 'javascript',
          option: 'runnable',
          content: 'return 10;'
        },
        '2': {
          type: 'code',
          language: 'javascript',
          option: 'hidden',
          content: 'return 15;'
        }
      },
      content: ['0', '1', '2']
    }),
    execution: Immutable.fromJS({
      data: {},
      executionContext: {}
    })
  })

  const expected = [{
    type: actions.CODE_RUNNING,
    id: '0'
  }, {
    type: actions.CODE_EXECUTED,
    id: '0',
    context: Immutable.Map(),
    data: 5
  }, {
    type: actions.CODE_RUNNING,
    id: '2'
  }, {
    type: actions.CODE_EXECUTED,
    id: '2',
    context: Immutable.Map(),
    data: 15
  }]

  return store.dispatch(actions.executeAuto())
    .then(() => {
      t.deepEqual(store.getActions(), expected)
    })
})

test('should create an action for toggling the editor', (t) => {
  const expected = {
    type: actions.TOGGLE_EDIT
  }
  t.deepEqual(actions.toggleEdit(), expected)
})

test('should create an action for updating a block', (t) => {
  const id = '12'
  const text = '## some markdown'
  const expected = {
    type: actions.UPDATE_BLOCK,
    id,
    text
  }
  t.deepEqual(actions.updateBlock(id, text), expected)
})

test('should create an action for adding a new text block', (t) => {
  const id = '12'
  const expected = {
    type: actions.ADD_BLOCK,
    blockType: 'text',
    id
  }
  t.deepEqual(actions.addTextBlock(id), expected)
})

test('should create an action for adding a new code block', (t) => {
  const id = '12'
  const expected = {
    type: actions.ADD_BLOCK,
    blockType: 'code',
    id
  }
  t.deepEqual(actions.addCodeBlock(id), expected)
})

test('should create an action for deleting a block', (t) => {
  const id = '12'
  const expected = {
    type: actions.DELETE_BLOCK,
    id
  }
  t.deepEqual(actions.deleteBlock(id), expected)
})

test('should create an action for updating the title', (t) => {
  const text = 'New title'
  const expected = {
    type: actions.UPDATE_META,
    field: 'title',
    text
  }
  t.deepEqual(actions.updateTitle(text), expected)
})

test('should create an action for updating the author', (t) => {
  const text = 'New author'
  const expected = {
    type: actions.UPDATE_META,
    field: 'author',
    text
  }
  t.deepEqual(actions.updateAuthor(text), expected)
})

test('should create an action for toggling the footer', (t) => {
  const expected = {
    type: actions.TOGGLE_META,
    field: 'showFooter'
  }
  t.deepEqual(actions.toggleFooter(), expected)
})

test('should create an action for moving a block', (t) => {
  const id = '12'
  const nextIndex = 3
  const expected = {
    type: actions.MOVE_BLOCK,
    id,
    nextIndex
  }
  t.deepEqual(actions.moveBlock(id, nextIndex), expected)
})

test('should create an action for updating a datasource', (t) => {
  const name = 'github'
  const url = 'http://github.com'
  const expected = {
    type: actions.UPDATE_DATASOURCE,
    id: name,
    text: url
  }
  t.deepEqual(actions.updateDatasource(name, url), expected)
})

test('should create an action for deleting a datasource', (t) => {
  const name = 'github'
  const expected = {
    type: actions.DELETE_DATASOURCE,
    id: name
  }
  t.deepEqual(actions.deleteDatasource(name), expected)
})

test('should create an action to toggle the save form', (t) => {
  const expected = {
    type: actions.TOGGLE_SAVE
  }
  t.deepEqual(actions.toggleSave(), expected)
})

test('should create an action for undo', (t) => {
  const expected = {
    type: actions.UNDO
  }
  t.deepEqual(actions.undo(), expected)
})

test('should create an action for changing code block option', (t) => {
  const expected = {
    type: actions.CHANGE_CODE_BLOCK_OPTION,
    id: 'testId',
    option: undefined
  }
  t.deepEqual(actions.changeCodeBlockOption('testId'), expected)
})

test('should create an action for changing code block option with a specified option', (t) => {
  const expected = {
    type: actions.CHANGE_CODE_BLOCK_OPTION,
    id: 'testId',
    option: 'runnable'
  }
  t.deepEqual(actions.changeCodeBlockOption('testId', 'runnable'), expected)
})

test('should create an action for creating a graph block', (t) => {
  const expd = {
    type: actions.ADD_BLOCK,
    blockType: 'graph',
    id: '12'
  }
  t.deepEqual(actions.addGraphBlock('12'), expd)
})

test('should create an action for changing graph type', (t) => {
  const expd = {
    type: actions.UPDATE_GRAPH_BLOCK_PROPERTY,
    property: 'graphType',
    value: 'pieChart',
    id: '12'
  }
  t.deepEqual(actions.updateGraphType('12', 'pieChart'), expd)
})

test('should create an action for updating graph block data path', (t) => {
  const expd = {
    type: actions.UPDATE_GRAPH_BLOCK_PROPERTY,
    property: 'dataPath',
    value: 'data.popular',
    id: '12'
  }
  t.deepEqual(actions.updateGraphDataPath('12', 'data.popular'), expd)
})

test('should create an action for updating graph block hint', (t) => {
  const expd = {
    type: actions.UPDATE_GRAPH_BLOCK_HINT,
    hint: 'label',
    value: 'name',
    id: '12'
  }
  t.deepEqual(actions.updateGraphHint('12', 'label', 'name'), expd)
})

test('should create an action for updating graph block label', (t) => {
  const expd = {
    type: actions.UPDATE_GRAPH_BLOCK_LABEL,
    label: 'x',
    value: 'Repos',
    id: '12'
  }
  t.deepEqual(actions.updateGraphLabel('12', 'x', 'Repos'), expd)
})

test('should create an action for saving graph block to code', (t) => {
  const expd = {
    type: actions.UPDATE_GRAPH_BLOCK_PROPERTY,
    property: 'type',
    value: 'code',
    id: '12'
  }
  t.deepEqual(actions.compileGraphBlock('12'), expd)
})

test('should create an action for clearing graph data', (t) => {
  const expd = {
    type: actions.CLEAR_GRAPH_BLOCK_DATA,
    id: '12'
  }
  t.deepEqual(actions.clearGraphData('12'), expd)
})

test('should create an action for editing a block', (t) => {
  const expd = {
    type: actions.EDIT_BLOCK,
    id: '12'
  }
  t.deepEqual(actions.editBlock('12'), expd)
})
