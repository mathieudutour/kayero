import fs from 'fs'
import path from 'path'
import Zealot from 'zealot'

import Immutable from 'immutable'
import reshaper from 'reshaper'
import Smolder from 'smolder'
/* global d3, nv */
import Jutsu from 'jutsu' // Imports d3 and nv as globals
import {remote as electron} from 'electron' // eslint-disable-line

import { arrayToCSV } from './util'
import { gistUrl, gistApi } from './config' // eslint-disable-line
import { render } from './markdown'

/*
 * Action types
 */
export const LOAD_MARKDOWN = 'LOAD_MARKDOWN'
export const CODE_RUNNING = 'CODE_RUNNING'
export const CODE_EXECUTED = 'CODE_EXECUTED'
export const CODE_ERROR = 'CODE_ERROR'
export const RECEIVED_DATA = 'RECEIVED_DATA'
export const TOGGLE_EDIT = 'TOGGLE_EDIT'
export const UPDATE_BLOCK = 'UPDATE_BLOCK'
export const EDIT_BLOCK = 'EDIT_BLOCK'
export const UPDATE_META = 'UPDATE_META'
export const TOGGLE_META = 'TOGGLE_META'
export const ADD_BLOCK = 'ADD_BLOCK'
export const DELETE_BLOCK = 'DELETE_BLOCK'
export const MOVE_BLOCK = 'MOVE_BLOCK'
export const DELETE_DATASOURCE = 'DELETE_DATASOURCE'
export const UPDATE_DATASOURCE = 'UPDATE_DATASOURCE'
export const TOGGLE_SAVE = 'TOGGLE_SAVE'
export const GIST_CREATED = 'GIST_CREATED'
export const UNDO = 'UNDO'
export const CHANGE_CODE_BLOCK_OPTION = 'CHANGE_CODE_BLOCK_OPTION'
export const UPDATE_GRAPH_BLOCK_PROPERTY = 'UPDATE_GRAPH_BLOCK_PROPERTY'
export const UPDATE_GRAPH_BLOCK_HINT = 'UPDATE_GRAPH_BLOCK_HINT'
export const UPDATE_GRAPH_BLOCK_LABEL = 'UPDATE_GRAPH_BLOCK_LABEL'
export const CLEAR_GRAPH_BLOCK_DATA = 'CLEAR_GRAPH_BLOCK_DATA'
export const FILE_SAVED = 'FILE_SAVED'

function readFileName (filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err, markdown) => {
      if (err) {
        return reject(err)
      }
      resolve(markdown)
    })
  })
}

export function newFile () {
  return (dispatch, getState) => {
    return Promise.resolve(dispatch({
      type: LOAD_MARKDOWN,
      markdown:
`---
---`
    })).then(() => dispatch(fetchData()))
  }
}

export function openFileName (filename) {
  return (dispatch, getState) => {
    return Promise.resolve(filename)
      .then((filename) => {
        if (!filename) { throw new Error('no filename') }
        return readFileName(filename)
      }).then((markdown) => {
        electron.app.addRecentDocument(filename)
        electron.BrowserWindow.getFocusedWindow().setRepresentedFilename(filename)
        return dispatch({
          type: LOAD_MARKDOWN,
          markdown,
          filename
        })
      }).then(() => dispatch(fetchData()))
  }
}

export function openFile () {
  return (dispatch, getState) => {
    return new Promise((resolve) => {
      electron.dialog.showOpenDialog({
        title: 'Open notebook',
        filters: [
          {name: 'Notebooks', extensions: ['md']}
        ],
        properties: ['openFile']
      }, resolve)
    }).then((filename) => {
      if (!filename || !filename[0]) { throw new Error('no filename') }
      return Promise.all([readFileName(filename[0]), Promise.resolve(filename[0])])
    }).then(([markdown, filename]) => {
      electron.app.addRecentDocument(filename)
      electron.BrowserWindow.getFocusedWindow().setRepresentedFilename(filename)
      return dispatch({
        type: LOAD_MARKDOWN,
        markdown,
        filename
      })
    }).then(() => dispatch(fetchData()))
  }
};

function initDBs (getState) {
  const executionState = getState().execution
  let data = {}
  if (executionState) {
    const immutableData = executionState.get('data')
    data = immutableData && immutableData.toJS() || {}
  }
  const notebook = getState().notebook
  let filePath
  if (notebook) {
    const metadata = notebook.get('metadata')
    filePath = metadata && metadata.get('path')
  }
  const dbs = Object.keys(data)
    .filter((k) => data[k] && data[k].__type === 'mongodb')
    .reduce((prev, k) => {
      if (data[k] && data[k].__type === 'mongodb') {
        if (!data[k].__secure) {
          prev[k] = new Zealot(data[k].url)
          return prev
        }
        let uri = data[k].url.split('mongodb-secure://')[1]

        if (uri.indexOf('.') === 0) { // handle relative path
          if (filePath) {
            const directory = path.dirname(filePath)
            uri = path.join(directory, uri)
          }
        }

        const secret = JSON.parse(fs.readFileSync(uri, 'utf8'))
        if (Array.isArray(secret)) {
          prev[k] = new Zealot(...secret)
        } else {
          prev[k] = new Zealot(secret)
        }
      }
      return prev
    }, {})
  return dbs
}

function closeDBs (dbs) {
  Object.keys(dbs).forEach((k) => dbs[k].close())
  return
}

export function executeCodeBlock (id, dbs) {
  return (dispatch, getState) => {
    dispatch(codeRunning(id))
    const code = getState().notebook.getIn(['blocks', id, 'content'])
    const graphElement = document.getElementById('kayero-graph-' + id)

    const executionState = getState().execution
    const context = executionState.get('executionContext').toJS()
    const data = executionState.get('data').toJS()

    const soloExecution = !dbs
    if (!dbs) {
      dbs = initDBs(getState)
    }
    Object.keys(dbs).forEach((k) => {
      if (data[k] && data[k].__type === 'mongodb') {
        data[k] = dbs[k]
      }
    })

    const jutsu = Smolder(Jutsu(graphElement))

    return new Promise((resolve, reject) => {
      try {
        const result = new Function(
          ['d3', 'nv', 'graphs', 'data', 'reshaper', 'graphElement'], code
        ).call(
          context, d3, nv, jutsu, data, reshaper, graphElement
        )
        resolve(result)
      } catch (err) {
        reject(err)
      }
    })
    .then((result) => dispatch(
      codeExecuted(id, result, Immutable.fromJS(context))
    ))
    .catch((err) => {
      console.error(err)
      dispatch(codeError(id, err))
    })
    .then(() => {
      if (soloExecution) {
        return closeDBs(dbs)
      }
    })
  }
}

function codeRunning (id) {
  return {
    type: CODE_RUNNING,
    id
  }
}

function codeExecuted (id, result, context) {
  return {
    type: CODE_EXECUTED,
    id,
    data: result,
    context
  }
}

function codeError (id, err) {
  return {
    type: CODE_ERROR,
    id,
    data: err
  }
}

export function executeAuto () {
  return (dispatch, getState) => {
    const notebook = getState().notebook
    const blocks = notebook.get('blocks')
    const order = notebook.get('content')

    // init the database connections
    const dbs = initDBs(getState)

    // This slightly scary Promise chaining ensures that code blocks
    // are executed in order, even if they return Promises.
    return order.reduce((p, id) => {
      return p.then(() => {
        const option = blocks.getIn([id, 'option'])
        if (option === 'auto' || option === 'hidden') {
          return dispatch(executeCodeBlock(id, dbs))
        }
        return Promise.resolve()
      })
    }, Promise.resolve()).then(() => closeDBs(dbs))
  }
}

function receivedData (name, data) {
  return {
    type: RECEIVED_DATA,
    name,
    data
  }
}

export function fetchData () {
  return (dispatch, getState) => {
    let proms = []
    const currentData = getState().execution.get('data')
    getState().notebook.getIn(['metadata', 'datasources'])
      .forEach((url, name) => {
        if (currentData.has(name)) { return }
        if (url.indexOf('mongodb://') === 0 || url.indexOf('mongodb-secure://') === 0) {
          proms.push(Promise.resolve({
            __type: 'mongodb',
            __secure: url.indexOf('mongodb-secure://') === 0,
            url
          }).then(j => dispatch(receivedData(name, j))))
        } else {
          proms.push(
            fetch(url, {
              method: 'get'
            })
            .then(response => response.json())
            .then(j => dispatch(receivedData(name, j)))
          )
        }
      }
    )
    // When all data fetched, run all the auto-running code blocks.
    return Promise.all(proms).then(() => dispatch(executeAuto()))
  }
}

export function toggleEdit () {
  return {
    type: TOGGLE_EDIT
  }
}

export function updateBlock (id, text) {
  electron.BrowserWindow.getFocusedWindow().setDocumentEdited(true)
  return {
    type: UPDATE_BLOCK,
    id,
    text
  }
};

export function updateTitle (text) {
  return {
    type: UPDATE_META,
    field: 'title',
    text
  }
};

export function updateAuthor (text) {
  return {
    type: UPDATE_META,
    field: 'author',
    text
  }
};

export function toggleFooter () {
  return {
    type: TOGGLE_META,
    field: 'showFooter'
  }
};

export function addCodeBlock (id) {
  return {
    type: ADD_BLOCK,
    blockType: 'code',
    id
  }
};

export function addTextBlock (id) {
  return {
    type: ADD_BLOCK,
    blockType: 'text',
    id
  }
};

export function addGraphBlock (id) {
  return {
    type: ADD_BLOCK,
    blockType: 'graph',
    id
  }
};

export function deleteBlock (id) {
  return {
    type: DELETE_BLOCK,
    id
  }
};

export function moveBlock (id, nextIndex) {
  return {
    type: MOVE_BLOCK,
    id,
    nextIndex
  }
}

export function deleteDatasource (id) {
  return {
    type: DELETE_DATASOURCE,
    id
  }
};

export function updateDatasource (id, url) {
  return {
    type: UPDATE_DATASOURCE,
    id,
    text: url
  }
};

export function toggleSave () {
  return {
    type: TOGGLE_SAVE
  }
};

function gistCreated (id) {
  return {
    type: GIST_CREATED,
    id
  }
}

function fileSaved (filename) {
  electron.BrowserWindow.getFocusedWindow().setRepresentedFilename(filename)
  electron.BrowserWindow.getFocusedWindow().setDocumentEdited(false)
  return {
    type: FILE_SAVED,
    filename
  }
}

export function saveGist (title, markdown) {
  return (dispatch, getState) => {
    return fetch(gistApi, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json;charset=UTF-8'
      },
      body: JSON.stringify({
        description: title,
        'public': true,
        files: {
          'notebook.md': {
            content: markdown
          }
        }
      })
    })
    .then(response => response.json())
    .then(gist => dispatch(gistCreated(gist.id)))
  }
};

export function saveFile () {
  return (dispatch, getState) => {
    const notebook = getState().notebook
    const filePath = notebook.get('metadata').get('path')
    if (!filePath) { return dispatch(saveAsFile()) }
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, render(notebook), 'utf8', (err) => {
        if (err) {
          return reject(err)
        }
        resolve(filePath)
      })
    }).then((filePath) => dispatch(fileSaved(filePath)))
  }
};

export function saveAsFile () {
  return (dispatch, getState) => {
    return new Promise((resolve) => {
      electron.dialog.showSaveDialog({
        title: 'Save notebook',
        filters: [
          {name: 'Notebooks', extensions: ['md']}
        ]
      }, resolve)
    }).then((filename) => {
      if (!filename) { throw new Error('no filename') }
      return new Promise((resolve, reject) => {
        fs.writeFile(filename, render(getState().notebook), 'utf8', (err) => {
          if (err) {
            return reject(err)
          }
          resolve(filename)
        })
      })
    }).then((filename) => dispatch(fileSaved(filename)))
  }
};

export function exportToCSV (data) {
  return (dispatch, getState) => {
    return Promise.all([
      new Promise((resolve) => {
        electron.dialog.showSaveDialog({
          title: 'Save data as CSV',
          filters: [
            {name: 'Coma separated values', extensions: ['csv']}
          ]
        }, resolve)
      }),
      arrayToCSV(data)
    ]).then(([filename, csv]) => {
      if (!filename) { throw new Error('no filename') }
      return new Promise((resolve, reject) => {
        fs.writeFile(filename, csv, 'utf8', (err) => {
          if (err) {
            return reject(err)
          }
          resolve(filename)
        })
      })
    }).then((filename) => dispatch(fileSaved(filename)))
  }
};

export function undo () {
  return {
    type: UNDO
  }
}

export function changeCodeBlockOption (id) {
  return {
    type: CHANGE_CODE_BLOCK_OPTION,
    id
  }
}

export function updateGraphType (id, graph) {
  return {
    type: UPDATE_GRAPH_BLOCK_PROPERTY,
    id: id,
    property: 'graphType',
    value: graph
  }
}

export function updateGraphDataPath (id, dataPath) {
  return {
    type: UPDATE_GRAPH_BLOCK_PROPERTY,
    id: id,
    property: 'dataPath',
    value: dataPath
  }
}

export function updateGraphHint (id, hint, value) {
  return {
    type: UPDATE_GRAPH_BLOCK_HINT,
    id: id,
    hint: hint,
    value: value
  }
}

export function updateGraphLabel (id, label, value) {
  return {
    type: UPDATE_GRAPH_BLOCK_LABEL,
    id,
    label,
    value
  }
}

export function compileGraphBlock (id) {
  return {
    type: UPDATE_GRAPH_BLOCK_PROPERTY,
    id: id,
    property: 'type',
    value: 'code'
  }
}

export function clearGraphData (id) {
  return {
    type: CLEAR_GRAPH_BLOCK_DATA,
    id
  }
}

export function editBlock (id) {
  return {
    type: EDIT_BLOCK,
    id
  }
}
