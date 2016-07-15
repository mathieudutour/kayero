import Immutable from 'immutable'
import {
    TOGGLE_EDIT, TOGGLE_SAVE, EDIT_BLOCK,
    FILE_SAVED, LOAD_MARKDOWN,
    UPDATE_BLOCK, UPDATE_META, ADD_BLOCK, DELETE_BLOCK, MOVE_BLOCK, DELETE_DATASOURCE, UPDATE_DATASOURCE, CHANGE_CODE_BLOCK_OPTION
} from '../actions'

/*
 * This reducer simply keeps track of the state of the editor.
 */
const defaultEditor = Immutable.Map({
  editable: false,
  saving: false,
  activeBlock: null,
  unsavedChanges: false
})

export default function editor (state = defaultEditor, action = {}) {
  switch (action.type) {
    case TOGGLE_EDIT:
      return state.set('editable', !state.get('editable'))
    case TOGGLE_SAVE:
      return state.set('saving', !state.get('saving'))
    case EDIT_BLOCK:
      return state.set('activeBlock', action.id)
    case FILE_SAVED:
    case LOAD_MARKDOWN:
      return state.set('unsavedChanges', false)
    case UPDATE_BLOCK:
    case UPDATE_META:
    case ADD_BLOCK:
    case DELETE_BLOCK:
    case MOVE_BLOCK:
    case DELETE_DATASOURCE:
    case UPDATE_DATASOURCE:
    case CHANGE_CODE_BLOCK_OPTION:
      return state.set('unsavedChanges', true)
    default:
      return state
  }
}
