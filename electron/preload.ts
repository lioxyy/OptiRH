import { contextBridge } from 'electron'

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
})
