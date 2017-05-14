import Immutable from 'immutable'
import {
    RECEIVED_DATA,
    CODE_RUNNING,
    CODE_EXECUTED,
    CODE_ERROR,
    DELETE_BLOCK,
    DELETE_DATASOURCE,
    UPDATE_DATASOURCE,
    LOAD_MARKDOWN
} from '../actions'

/*
 * This reducer handles the state of execution of code blocks -
 * retaining results, carrying context around, and making note
 * of which blocks have and haven't been executed. It's also
 * where the obtained data is stored.
 */
export const initialState = Immutable.Map({
  executionContext: Immutable.Map(),
  data: Immutable.Map(),
  results: Immutable.Map(),
  blocksExecuted: Immutable.Set(),
  blocksRunning: Immutable.Set()
})

export default function execution (state = initialState, action = {}) {
  const { id, name, data, context } = action
  switch (action.type) {
    case LOAD_MARKDOWN:
      return initialState
    case CODE_RUNNING:
      return state.set('blocksRunning', state.get('blocksRunning').add(id))
    case CODE_EXECUTED:
      return state
        .setIn(['results', id], data)
        .set('blocksExecuted', state.get('blocksExecuted').add(id))
        .set('blocksRunning', state.get('blocksRunning').delete(id))
        .set('executionContext', context)
    case CODE_ERROR:
      return state
        .setIn(['results', id], data)
        .set('blocksRunning', state.get('blocksRunning').delete(id))
        .set('blocksExecuted', state.get('blocksExecuted').add(id))
    case RECEIVED_DATA:
      return state.setIn(['data', name], Immutable.fromJS(data))
    case DELETE_BLOCK:
      return state
        .set('blocksRunning', state.get('blocksRunning').delete(id))
        .set('blocksExecuted', state.get('blocksExecuted').remove(id))
        .removeIn(['results', id])
    case UPDATE_DATASOURCE:
    case DELETE_DATASOURCE:
      return state.deleteIn(['data', id])
    default:
      return state
  }
}
