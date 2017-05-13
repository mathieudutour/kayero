import Immutable from 'immutable'
import {
    TOGGLE_SAVE, FILE_SAVED, LOAD_MARKDOWN,
    UPDATE_META, UPDATE_CONTENT, DELETE_DATASOURCE, UPDATE_DATASOURCE
} from '../actions'

/*
 * This reducer simply keeps track of the state of the editor.
 */
const defaultEditor = Immutable.Map({
  saving: false,
  unsavedChanges: false
})

export default function editor (state = defaultEditor, action = {}) {
  switch (action.type) {
    case TOGGLE_SAVE:
      return state.set('saving', !state.get('saving'))
    case FILE_SAVED:
    case LOAD_MARKDOWN:
      return state.set('unsavedChanges', false)
    case UPDATE_META:
    case UPDATE_CONTENT:
    case DELETE_DATASOURCE:
    case UPDATE_DATASOURCE:
      return state.set('unsavedChanges', true)
    default:
      return state
  }
}
