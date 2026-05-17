import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openCoverDialog: () => ipcRenderer.invoke('dialog:openCover')
});
