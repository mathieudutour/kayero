import test from 'ava'

import Immutable from 'immutable'
import requireMock from 'mock-require'

requireMock('electron', {
  remote: {
    dialog: {
      showOpenDialog (_, callback) {
        callback()
      }
    }
  }
})

const reducer = require('../src/js/reducers/executionReducer').default
const initialState = require('../src/js/reducers/executionReducer').initialState
const actions = require('../src/js/actions')

test('should return the initial state', (t) => {
  t.is(reducer(), initialState)
})

test('should reset the execution state when loading another file', (t) => {
  const beforeState = initialState
          .setIn(['results', '12'], 120)
          .set('blocksExecuted', initialState.get('blocksExecuted').add('12'))
  t.is(reducer(beforeState, {type: actions.LOAD_MARKDOWN}), initialState)
})

test('should update the data on received data', (t) => {
  const action = {
    type: actions.RECEIVED_DATA,
    name: 'github',
    data: {repos: 12}
  }
  const newState = initialState.setIn(['data', 'github', 'repos'], 12)
  t.deepEqual(reducer(initialState, action).toJS(), newState.toJS())
})

test('should clear block results and executed state on update', (t) => {
  const action = {
    type: actions.UPDATE_BLOCK,
    id: '12'
  }
  const beforeState = initialState
          .setIn(['results', '12'], 120)
          .set('blocksExecuted', initialState.get('blocksExecuted').add('12'))
  t.deepEqual(reducer(beforeState, action).toJS(), initialState.toJS())
})

test('should clear block results and executed state on update', (t) => {
  const action = {
    type: actions.DELETE_BLOCK,
    id: '12'
  }
  const beforeState = initialState
          .setIn(['results', '12'], 120)
          .set('blocksExecuted', initialState.get('blocksExecuted').add('12'))
  t.deepEqual(reducer(beforeState, action).toJS(), initialState.toJS())
})

test('should clear datasource data when the datasource is deleted', (t) => {
  const action = {
    type: actions.DELETE_DATASOURCE,
    id: 'github'
  }
  const beforeState = initialState.setIn(['data', 'github', 'repos'], 12)
  t.deepEqual(reducer(beforeState, action).toJS(), initialState.toJS())
})

test('should clear datasource data when the datasource is updated', (t) => {
  const action = {
    type: actions.UPDATE_DATASOURCE,
    id: 'github'
  }
  const beforeState = initialState.setIn(['data', 'github', 'repos'], 12)
  t.deepEqual(reducer(beforeState, action).toJS(), initialState.toJS())
})

test('should update result, executed and context on CODE_EXECUTED', (t) => {
  const action = {
    type: actions.CODE_EXECUTED,
    id: '99',
    data: 3,
    context: Immutable.Map({number: 10})
  }
  const expected = initialState.setIn(['results', '99'], 3)
    .set('blocksExecuted', initialState.get('blocksExecuted').add('99'))
    .set('executionContext', Immutable.Map({number: 10}))
  t.deepEqual(reducer(initialState, action).toJS(), expected.toJS())
})

test('should update result and executed on CODE_ERROR', (t) => {
  const action = {
    type: actions.CODE_ERROR,
    id: '99',
    data: 'Some error'
  }
  const expected = initialState.setIn(['results', '99'], 'Some error')
    .set('blocksExecuted', initialState.get('blocksExecuted').add('99'))
  t.deepEqual(reducer(initialState, action).toJS(), expected.toJS())
})
