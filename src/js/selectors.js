export const metadataSelector = state => {
  return {
    metadata: state.notebook.get('metadata')
  }
}

export const contentSelector = state => {
  return {
    content: state.notebook.get('content'),
    blocks: state.notebook.get('blocks'),
    results: state.execution.get('results'),
    blocksExecuted: state.execution.get('blocksExecuted'),
    blocksRunning: state.execution.get('blocksRunning')
  }
}

export const editorSelector = state => {
  return state.editor.toJS()
}

export const saveSelector = state => {
  return {notebook: state.notebook}
}

export const dataSelector = state => {
  return {data: state.execution.get('data').toJS()}
}
