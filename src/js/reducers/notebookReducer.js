import Immutable from 'immutable'
import { parse } from '../markdown'
import { kayeroHomepage } from '../config'
import {
    LOAD_MARKDOWN,
    FILE_SAVED,
    UPDATE_CONTENT,
    UPDATE_META,
    TOGGLE_META,
    DELETE_DATASOURCE,
    UPDATE_DATASOURCE,
    GIST_CREATED,
    UNDO
} from '../actions'

/*
 * This reducer handles the state of the notebook's actual content,
 * obtained by parsing Markdown. This is kept separate from the execution
 * state to help with implementing 'undo' in the editor.
 */
export const initialState = Immutable.Map({
  metadata: Immutable.fromJS({
    datasources: {}
  }),
  content: '',
  blocks: Immutable.Map(),
  blockOrder: Immutable.List(),
  undoStack: Immutable.List()
})

export default function notebook (state = initialState, action = {}) {
  const { id, text, field } = action
  switch (action.type) {
    case LOAD_MARKDOWN:
      return parse(action.markdown, action.filename).set('undoStack', state.get('undoStack'))
    case FILE_SAVED:
      return state.setIn(['metadata', 'path'], action.filename)
    case UPDATE_CONTENT:
      return handleChange(
        state, state
          .set('blocks', action.blocks)
          .set('blockOrder', action.blockOrder)
          .set('content', action.content)
      )
    case UPDATE_META:
      return handleChange(
        state, state.setIn(['metadata', field], text)
      )
    case TOGGLE_META:
      return handleChange(
        state, state.setIn(['metadata', field], !state.getIn(['metadata', field]))
      )
    case DELETE_DATASOURCE:
      return handleChange(
        state, state.deleteIn(['metadata', 'datasources', id])
      )
    case UPDATE_DATASOURCE:
      return handleChange(
        state, state.setIn(['metadata', 'datasources', id], text)
      )
    case GIST_CREATED:
      return state.setIn(['metadata', 'gistUrl'], kayeroHomepage + '?id=' + id)
    case UNDO:
      return undo(state)
    default:
      return state
  }
}

/*
 * Handles changes, if they exist, by pushing to the undo stack.
 */
function handleChange (currentState, newState) {
  if (currentState.equals(newState)) {
    return newState
  }
  let result = newState.set(
    'undoStack',
    newState.get('undoStack').push(currentState.remove('undoStack'))
  ).deleteIn(
    ['metadata', 'gistUrl']
  )

    // If it's the first change, update the parent link.
  if (currentState.get('undoStack').size === 0) {
    result = result.setIn(['metadata', 'original'], Immutable.fromJS({
      title: currentState.getIn(['metadata', 'title']),
      url: window.location.href
    }))
  }
  return result
}

function undo (state) {
  if (state.get('undoStack').size === 0) {
    return state
  }
  return state.get('undoStack').last()
    .set('undoStack', state.get('undoStack').pop())
}
