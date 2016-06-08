import { ipcRenderer } from 'electron';
import { openFile, saveFile, saveAsFile, openFileName, newFile } from './actions';

export default function bindStoreToMenu(store) {
  ipcRenderer.on('new-file', (event) => {
    store.dispatch(newFile())
  });
  ipcRenderer.on('open-file', (event) => {
    store.dispatch(openFile());
  });
  ipcRenderer.on('open-filename', (event, filename) => {
    store.dispatch(openFileName(filename));
  });
  ipcRenderer.on('save-file', (event) => {
    store.dispatch(saveFile());
  });
  ipcRenderer.on('save-as-file', (event) => {
    store.dispatch(saveAsFile());
  });
}
