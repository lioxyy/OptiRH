import { contextBridge, ipcRenderer } from 'electron'

const portArg = process.argv.find((arg) => arg.startsWith('--backend-port='))

if (!portArg) {
  throw new Error(
    '[preload] --backend-port argument is missing from additionalArguments. ' +
    'Check the BrowserWindow webPreferences in main.ts.',
  )
}

const backendPort = portArg.split('=')[1]

contextBridge.exposeInMainWorld('electronAPI', {
  backendPort,
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  zoomIn: () => ipcRenderer.send('window-zoom-in'),
  zoomOut: () => ipcRenderer.send('window-zoom-out'),
  zoomReset: () => ipcRenderer.send('window-zoom-reset'),
})
