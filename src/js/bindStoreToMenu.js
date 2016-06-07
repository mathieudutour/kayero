import { ipcRenderer } from 'electron';
import { openFile, saveFile } from './actions';

export default function bindStoreToMenu(store) {
  ipcRenderer.on('new-file', (event, filename) => {
    console.log('todo')
  });
  ipcRenderer.on('open-file', (event, filename) => {
    store.dispatch(openFile());
  });
  ipcRenderer.on('save-file', (event, filename) => {
    store.dispatch(saveFile());
  });
  ipcRenderer.on('save-as-file', (event, filename) => {
    store.dispatch(saveFile());
  });
}
