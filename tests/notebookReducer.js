import test from 'ava'

import Immutable from 'immutable'
import requireMock from 'mock-require'
import sinon from 'sinon'

requireMock('electron', {
  remote: {
    dialog: {
      showOpenDialog (_, callback) {
        callback()
      }
    }
  }
})

// Mock stuff for execution
global.document = require('jsdom').jsdom('<body></body>')
global.window = document.defaultView
global.nv = {}

const reducer = require('../src/js/reducers/notebookReducer').default
const initialState = require('../src/js/reducers/notebookReducer').initialState
const actions = require('../src/js/actions')
import * as markdown from '../src/js/markdown'
import { kayeroHomepage } from '../src/js/config' // eslint-disable-line

function handleFirstChange (state) {
  return state.set(
    'undoStack', Immutable.List([state.remove('undoStack')])
  ).setIn(
    ['metadata', 'original'],
    Immutable.fromJS({
      title: undefined,
      url: 'about:blank'
    })
  )
}

const parsed = Immutable.fromJS({
  metadata: {
    title: 'Test notebook',
    author: 'Mr McTest',
    showFooter: true,
    datasources: {
      github: 'http://github.com'
    },
    original: {
      title: 'Blank Kayero notebook',
      url: 'http://joelotter.com/kayero/blank'
    }
  },
  content: ['1'],
  blocks: {
    '1': {
      type: 'text',
      id: '1',
      content: 'This is a blank text block'
    }
  },
  undoStack: []
})

test.beforeEach((t) => {
  sinon.stub(markdown, 'parse').returns(parsed)
  t.context.clock = sinon.useFakeTimers()
})

test.afterEach.always((t) => {
  markdown.parse.restore()
  t.context.clock.restore()
})

test('should return the initial state', (t) => {
  t.is(reducer(), initialState)
})

test('should update metadata on UPDATE_META', (t) => {
  const action = {
    type: actions.UPDATE_META,
    field: 'title',
    text: 'New Title'
  }
  const expectedState = handleFirstChange(initialState).setIn(
    ['metadata', 'title'], 'New Title'
  )
  const result = reducer(initialState, action).toJS()
  t.deepEqual(result, expectedState.toJS())
})

test('should correctly delete datasources on DELETE_DATASOURCE', (t) => {
  const action = {
    type: actions.DELETE_DATASOURCE,
    id: 'facebook'
  }
  const beforeState = initialState.setIn(
    ['metadata', 'datasources', 'facebook'], 'http://www.facebook.com'
  ).setIn(
    ['metadata', 'datasources', 'github'], 'http://github.com'
  )
  const afterState = handleFirstChange(beforeState).deleteIn(
    ['metadata', 'datasources', 'facebook']
  )
  t.deepEqual(reducer(beforeState, action).toJS(), afterState.toJS())
})

test('should correctly update a datasource on UPDATE_DATASOURCE', (t) => {
  const action = {
    type: actions.UPDATE_DATASOURCE,
    id: 'facebook',
    text: 'http://www.facebook.com'
  }
  const beforeState = initialState.setIn(
    ['metadata', 'datasources', 'facebook'], 'http://github.com'
  )
  const afterState = handleFirstChange(beforeState).setIn(
    ['metadata', 'datasources', 'facebook'], 'http://www.facebook.com'
  )
  t.deepEqual(reducer(beforeState, action).toJS(), afterState.toJS())
})

test('should correctly toggle metadata items', (t) => {
  const beforeState = initialState.setIn(['metadata', 'showFooter'], false)
  const afterState = handleFirstChange(beforeState).setIn(
    ['metadata', 'showFooter'], true
  )

  const action = {
    type: actions.TOGGLE_META,
    field: 'showFooter'
  }
  t.deepEqual(reducer(beforeState, action).toJS(), afterState.toJS())
})

test('should update the gist url after creation', (t) => {
  const action = {
    type: actions.GIST_CREATED,
    id: 'test_id'
  }
  const expected = initialState.setIn(
    ['metadata', 'gistUrl'],
    kayeroHomepage + '?id=test_id'
  )
  t.deepEqual(reducer(initialState, action).toJS(), expected.toJS())
})

test('should only update the parent link on first change', (t) => {
  const beforeState = handleFirstChange(initialState).setIn(
    ['metadata', 'title'],
    'Test Title'
  )
  const action = {
    type: actions.TOGGLE_META,
    field: 'showFooter'
  }
  const result = reducer(beforeState, action).getIn(['metadata', 'original'])
  t.deepEqual(result, beforeState.getIn(['metadata', 'original']))
})

test('should update the date on every change', (t) => {
  const beforeState = handleFirstChange(initialState).setIn(
    ['metadata', 'title'],
    'Test Title'
  )
  t.context.clock.tick(50000)
  const afterState = beforeState.setIn(
    ['metadata', 'title'],
    'New Title'
  ).set(
    'undoStack',
    beforeState.get('undoStack').push(beforeState.remove('undoStack'))
  )
  const action = {
    type: actions.UPDATE_META,
    field: 'title',
    text: 'New Title'
  }
  t.deepEqual(reducer(beforeState, action).toJS(), afterState.toJS())
})

test('should clear the gist url on any change', (t) => {
  const beforeState = initialState.setIn(
    ['metadata', 'gistUrl'],
    'http://testgisturl.com'
  )
  const afterState = handleFirstChange(beforeState).setIn(
    ['metadata', 'showFooter'], true
  ).removeIn(['metadata', 'gistUrl'])
  const action = {
    type: actions.TOGGLE_META,
    field: 'showFooter'
  }
  t.deepEqual(reducer(beforeState, action).toJS(), afterState.toJS())
})

const exampleTextBlock = Immutable.fromJS({
  id: '0',
  type: 'text',
  content: '##Hello!\nThis is a text block.'
})

const exampleCodeBlock = Immutable.fromJS({
  id: '1',
  type: 'code',
  content: 'return "Hello, world!";',
  language: 'javascript',
  option: 'runnable'
})

test('should move a block up on MOVE_BLOCK', (t) => {
  const beforeState = initialState.set('content', Immutable.List(['1', '2', '3', '4']))
  const afterState = handleFirstChange(beforeState).set(
    'content', Immutable.List(['2', '1', '3', '4'])
  )
  const action = {
    type: actions.MOVE_BLOCK,
    id: '2',
    nextIndex: 0
  }
  t.deepEqual(reducer(beforeState, action).toJS(), afterState.toJS())
})

test('should move a block up on MOVE_BLOCK', (t) => {
  const beforeState = initialState.set('content', Immutable.List(['1', '2', '3', '4']))
  const afterState = handleFirstChange(beforeState).set(
    'content', Immutable.List(['1', '3', '2', '4'])
  )
  const action = {
    type: actions.MOVE_BLOCK,
    id: '3',
    nextIndex: 1
  }
  t.deepEqual(reducer(beforeState, action).toJS(), afterState.toJS())
})

test('should move a block down on MOVE_BLOCK', (t) => {
  const beforeState = initialState.set('content', Immutable.List(['1', '2', '3', '4']))
  const afterState = handleFirstChange(beforeState).set(
    'content', Immutable.List(['1', '3', '2', '4'])
  )
  const action = {
    type: actions.MOVE_BLOCK,
    id: '2',
    nextIndex: 2
  }
  t.deepEqual(reducer(beforeState, action).toJS(), afterState.toJS())
})

//
// test('should do nothing on MOVE_BLOCK_UP with first block', (t) => {
//   const beforeState = initialState.set('content', Immutable.List(['1', '2', '3']))
//   const action = {
//     type: actions.MOVE_BLOCK_UP,
//     id: '1'
//   }
//   t.deepEqual(reducer(beforeState, action).toJS(), beforeState.toJS())
// })
//
// test('should move a block down on MOVE_BLOCK_DOWN', (t) => {
//   const beforeState = initialState.set('content', Immutable.List(['1', '2', '3']))
//   const afterState = handleFirstChange(beforeState).set(
//     'content', Immutable.List(['1', '3', '2'])
//   )
//   const action = {
//     type: actions.MOVE_BLOCK_DOWN,
//     id: '2'
//   }
//   t.deepEqual(reducer(beforeState, action).toJS(), afterState.toJS())
// })
//
// test('should do nothing on MOVE_BLOCK_DOWN with last block', (t) => {
//   const beforeState = initialState.set('content', Immutable.List(['1', '2', '3']))
//   const action = {
//     type: actions.MOVE_BLOCK_DOWN,
//     id: '3'
//   }
//   t.deepEqual(reducer(beforeState, action).toJS(), beforeState.toJS())
// })

test('should delete a block with given id on DELETE_BLOCK', (t) => {
  const beforeState = initialState
            .set('content', Immutable.List(['1', '2', '3']))
            .set('blocks', Immutable.Map({
              '1': {data: 'one'},
              '2': {data: 'two'},
              '3': {data: 'three'}
            }))
  const afterState = handleFirstChange(beforeState)
            .set('content', Immutable.List(['1', '3']))
            .set('blocks', Immutable.Map({
              '1': {data: 'one'},
              '3': {data: 'three'}
            }))
  const action = {
    type: actions.DELETE_BLOCK,
    id: '2'
  }
  t.deepEqual(reducer(beforeState, action).toJS(), afterState.toJS())
})

test('should update only block text on UPDATE_BLOCK', (t) => {
  const newCode = 'return 1 + 2 * 7;'
  const beforeState = initialState
            .set('blocks', Immutable.Map({
              '0': exampleTextBlock,
              '1': exampleCodeBlock
            }))
            .set('content', Immutable.List(['0', '1']))
  const afterState = handleFirstChange(beforeState)
            .setIn(['blocks', '1', 'content'], newCode)
  const action = {
    type: actions.UPDATE_BLOCK,
    id: '1',
    text: newCode
  }
  t.deepEqual(reducer(beforeState, action).toJS(), afterState.toJS())
})

test('should create a new block before the block with provided id', (t) => {
  const beforeState = initialState
            .setIn(['blocks', '0'], exampleTextBlock)
            .set('content', Immutable.List(['0']))
  const afterState = handleFirstChange(beforeState)
            .setIn(
              ['blocks', '1'],
              exampleCodeBlock.set('content', '// New code block')
            )
            .set('content', ['1', '0'])
  const action = {
    type: actions.ADD_BLOCK,
    blockType: 'code',
    id: '0'
  }
  t.deepEqual(reducer(beforeState, action).toJS(), afterState.toJS())
})

test('should push the new block to the end if no id is given', (t) => {
  const beforeState = initialState
            .set('blocks', Immutable.Map({
              '0': exampleTextBlock,
              '1': exampleCodeBlock
            }))
            .set('content', Immutable.List(['0', '1']))
  const afterState = handleFirstChange(beforeState)
            .setIn(['blocks', '2'], Immutable.Map({
              type: 'text',
              id: '2',
              content: 'New text block'
            }))
            .set('content', Immutable.List(['0', '1', '2']))
  const action = {
    type: actions.ADD_BLOCK,
    id: undefined,
    blockType: 'text'
  }
  t.deepEqual(reducer(beforeState, action).toJS(), afterState.toJS())
})

test('should change a runnable block to auto on option change', (t) => {
  const beforeState = initialState.setIn(
    ['blocks', '12'], Immutable.Map({
      option: 'runnable'
    })
  )
  const afterState = handleFirstChange(beforeState).setIn(
    ['blocks', '12', 'option'], 'auto'
  )
  const action = {
    type: actions.CHANGE_CODE_BLOCK_OPTION,
    id: '12'
  }
  t.deepEqual(reducer(beforeState, action).toJS(), afterState.toJS())
})

test('should change an auto block to hidden on option change', (t) => {
  const beforeState = initialState.setIn(
    ['blocks', '12'], Immutable.Map({
      option: 'auto'
    })
  )
  const afterState = handleFirstChange(beforeState).setIn(
    ['blocks', '12', 'option'], 'hidden'
  )
  const action = {
    type: actions.CHANGE_CODE_BLOCK_OPTION,
    id: '12'
  }
  t.deepEqual(reducer(beforeState, action).toJS(), afterState.toJS())
})

test('should change a hidden block to runnable on option change', (t) => {
  const beforeState = initialState.setIn(
    ['blocks', '12'], Immutable.Map({
      option: 'hidden'
    })
  )
  const afterState = handleFirstChange(beforeState).setIn(
    ['blocks', '12', 'option'], 'runnable'
  )
  const action = {
    type: actions.CHANGE_CODE_BLOCK_OPTION,
    id: '12'
  }
  t.deepEqual(reducer(beforeState, action).toJS(), afterState.toJS())
})

test('should change an optionless block to runnable on option change', (t) => {
  const beforeState = initialState.setIn(
    ['blocks', '12'], Immutable.Map({
      option: undefined
    })
  )
  const afterState = handleFirstChange(beforeState).setIn(
    ['blocks', '12', 'option'], 'runnable'
  )
  const action = {
    type: actions.CHANGE_CODE_BLOCK_OPTION,
    id: '12'
  }
  t.deepEqual(reducer(beforeState, action).toJS(), afterState.toJS())
})

test('should correctly create a graph block', (t) => {
  const action = {
    type: actions.ADD_BLOCK,
    id: undefined,
    blockType: 'graph'
  }
  const expected = handleFirstChange(initialState).setIn(
    ['blocks', '0'], Immutable.fromJS({
      id: '0',
      type: 'graph',
      language: 'javascript',
      option: 'runnable',
      graphType: 'pieChart',
      dataPath: 'data',
      content: 'return graphs.pieChart(data);',
      hints: {
        x: '', y: '', label: '', value: ''
      },
      labels: {x: '', y: ''}
    })
  ).set('content', Immutable.List(['0']))
  t.deepEqual(reducer(initialState, action).toJS(), expected.toJS())
})

test('should clear a graph block on CLEAR_GRAPH_BLOCK_DATA', (t) => {
  const beforeState = initialState.setIn(
    ['blocks', '0'], Immutable.fromJS({
      id: '0',
      type: 'code',
      language: 'javascript',
      option: 'runnable',
      graphType: 'pieChart',
      dataPath: 'data',
      content: 'return graphs.pieChart(data);',
      hints: {
        x: '', y: '', label: '', value: ''
      },
      labels: {x: '', y: ''}
    })
  ).set('content', Immutable.List(['0']))
  const afterState = beforeState.setIn(
    ['blocks', '0'], Immutable.fromJS({
      id: '0',
      type: 'code',
      content: 'return graphs.pieChart(data);',
      language: 'javascript',
      option: 'runnable'
    })
  )
  const action = {
    type: actions.CLEAR_GRAPH_BLOCK_DATA,
    id: '0'
  }
  t.deepEqual(reducer(beforeState, action).toJS(), afterState.toJS())
})

test('should regenerate code on graph type change', (t) => {
  const beforeState = initialState.setIn(
    ['blocks', '0'], Immutable.fromJS({
      id: '0',
      type: 'graph',
      language: 'javascript',
      option: 'runnable',
      graphType: 'pieChart',
      dataPath: 'data',
      content: 'return graphs.pieChart(data);',
      hints: {
        x: '', y: '', label: '', value: ''
      },
      labels: {x: '', y: ''}
    })
  ).set('content', Immutable.List(['0']))
  const afterState = handleFirstChange(beforeState).setIn(
    ['blocks', '0', 'graphType'], 'barChart'
  ).setIn(['blocks', '0', 'content'], "return graphs.barChart(data, '', '');")
  const action = {
    type: actions.UPDATE_GRAPH_BLOCK_PROPERTY,
    id: '0',
    property: 'graphType',
    value: 'barChart'
  }
  t.deepEqual(reducer(beforeState, action).toJS(), afterState.toJS())
})

test('should include hints in generated code, if present', (t) => {
  const beforeState = initialState.setIn(
    ['blocks', '0'], Immutable.fromJS({
      id: '0',
      type: 'graph',
      language: 'javascript',
      option: 'runnable',
      graphType: 'pieChart',
      dataPath: 'data',
      content: 'return graphs.pieChart(data);',
      hints: {
        x: 'stargazers', y: '', label: '', value: ''
      },
      labels: {x: '', y: ''}
    })
  ).set('content', Immutable.List(['0']))
  const afterState = handleFirstChange(beforeState).setIn(
    ['blocks', '0', 'hints', 'label'], 'name'
  ).setIn(
    ['blocks', '0', 'content'],
    "return graphs.pieChart(data, {label: 'name'});"
  )
  const action = {
    type: actions.UPDATE_GRAPH_BLOCK_HINT,
    id: '0',
    hint: 'label',
    value: 'name'
  }
  t.deepEqual(reducer(beforeState, action).toJS(), afterState.toJS())
})

test('should include labels in generated code', (t) => {
  const beforeState = initialState.setIn(
    ['blocks', '0'], Immutable.fromJS({
      id: '0',
      type: 'graph',
      language: 'javascript',
      option: 'runnable',
      graphType: 'barChart',
      dataPath: 'data',
      content: 'return graphs.barChart(data);',
      hints: {
        x: '', y: '', label: '', value: ''
      },
      labels: {x: '', y: ''}
    })
  ).set('content', Immutable.List(['0']))
  const afterState = handleFirstChange(beforeState).setIn(
    ['blocks', '0', 'labels', 'x'], 'name'
  ).setIn(
    ['blocks', '0', 'content'],
    "return graphs.barChart(data, 'name', '');"
  )
  const action = {
    type: actions.UPDATE_GRAPH_BLOCK_LABEL,
    id: '0',
    label: 'x',
    value: 'name'
  }
  t.deepEqual(reducer(beforeState, action).toJS(), afterState.toJS())
})

test('should merge in parsed notebook', (t) => {
  const action = {
    type: actions.LOAD_MARKDOWN,
    markdown: ''
  }
  t.deepEqual(reducer(initialState, action).toJS(), parsed.toJS())
})

test('should correctly change to the previous state', (t) => {
  const action1 = {
    type: actions.ADD_BLOCK,
    blockType: 'text',
    id: '12'
  }
  const action2 = {
    type: actions.UNDO
  }
  t.deepEqual(reducer(
    reducer(initialState, action1),
    action2
  ).toJS(), initialState.toJS())
})

test('should do nothing if in initial state', (t) => {
  const action = {
    type: actions.UNDO
  }
  t.deepEqual(reducer(initialState, action).toJS(), initialState.toJS())
})
