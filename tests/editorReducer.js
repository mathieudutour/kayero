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

const reducer = require('../src/js/reducers/editorReducer').default
const actions = require('../src/js/actions')

test('should do nothing for an unhandled action type', (t) => {
  t.deepEqual(reducer(Immutable.Map({editable: false}), {type: 'FAKE_ACTION'}),
                      Immutable.Map({editable: false}))
})

test('should toggle editor state for TOGGLE_EDIT', (t) => {
  t.deepEqual(
    reducer(Immutable.Map({editable: false}), {type: actions.TOGGLE_EDIT}).toJS(),
    {editable: true})
  t.deepEqual(
    reducer(Immutable.Map({editable: true}), {type: actions.TOGGLE_EDIT}).toJS(),
    {editable: false})
})

test('should return the inital state', (t) => {
  t.deepEqual(reducer(), Immutable.Map({
    editable: false,
    saving: false,
    activeBlock: null,
    unsavedChanges: false
  }))
})

test('should toggle save state for TOGGLE_SAVE', (t) => {
  t.deepEqual(reducer(Immutable.Map({saving: false}), {type: actions.TOGGLE_SAVE}).toJS(),
              {saving: true})
  t.deepEqual(reducer(Immutable.Map({saving: true}), {type: actions.TOGGLE_SAVE}).toJS(),
              {saving: false})
})

test('should set the editing block on EDIT_BLOCK', (t) => {
  t.deepEqual(reducer(Immutable.Map({activeBlock: null}), {type: actions.EDIT_BLOCK, id: '12'}).toJS(),
              {activeBlock: '12'})
})
