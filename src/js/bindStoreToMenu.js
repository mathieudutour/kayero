import { ipcRenderer } from 'electron' // eslint-disable-line
import { openFile, saveFile, saveAsFile, openFileName, newFile, toggleEdit, fetchData } from './actions'

export default function bindStoreToMenu (store) {
  ipcRenderer.on('new-file', (event) => {
    store.dispatch(newFile())
  })
  ipcRenderer.on('open-file', (event) => {
    store.dispatch(openFile())
  })
  ipcRenderer.on('open-filename', (event, filename) => {
    store.dispatch(openFileName(filename))
  })
  ipcRenderer.on('save-file', (event) => {
    store.dispatch(saveFile())
  })
  ipcRenderer.on('save-as-file', (event) => {
    store.dispatch(saveAsFile())
  })
  ipcRenderer.on('log', (...args) => {
    console.log(...args)
  })
  ipcRenderer.on('toggle-edit', () => {
    store.dispatch(toggleEdit())
  })
  ipcRenderer.on('re-run', () => {
    store.dispatch(fetchData())
  })
}
