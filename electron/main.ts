import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { createApp } from './server'
import { execSync } from 'child_process'
import * as net from 'net'
import * as path from 'path'
import * as http from 'http'

function getFreePort(): Promise<number> {
  return new Promise((resolve) => {
    const srv = net.createServer()
    srv.listen(0, '127.0.0.1', () => {
      const port = (srv.address() as net.AddressInfo).port
      srv.close(() => resolve(port))
    })
  })
}

let mainWindow: BrowserWindow | null = null
let server: http.Server | null = null

ipcMain.on('window-minimize', () => {
  mainWindow?.minimize()
})

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.on('window-close', () => {
  mainWindow?.close()
})

ipcMain.on('window-zoom-in', () => {
  const currentZoom = mainWindow?.webContents.getZoomLevel() || 0
  mainWindow?.webContents.setZoomLevel(currentZoom + 0.5)
})

ipcMain.on('window-zoom-out', () => {
  const currentZoom = mainWindow?.webContents.getZoomLevel() || 0
  mainWindow?.webContents.setZoomLevel(currentZoom - 0.5)
})

ipcMain.on('window-zoom-reset', () => {
  mainWindow?.webContents.setZoomLevel(0)
})

ipcMain.on('window-toggle-devtools', () => {
  if (mainWindow?.webContents.isDevToolsOpened()) {
    mainWindow.webContents.closeDevTools()
  } else {
    mainWindow?.webContents.openDevTools({ mode: 'detach' })
  }
})

async function start() {
  const dbPath = app.isPackaged
    ? path.join(app.getPath('userData'), 'database.sqlite')
    : path.join(__dirname, '../../prisma/dev.db')

  process.env.DATABASE_URL = `file:${dbPath}`

  if (app.isPackaged) {
    try {
      execSync('npx prisma migrate deploy', {
        env: { ...process.env },
        cwd: path.join(__dirname, '../..'),
      })
    } catch (err) {
      dialog.showErrorBox('Migration Error', `Database migration failed:\n${String(err)}`)
      app.quit()
      return
    }
  }

  const port = await getFreePort()

  const expressApp = createApp()
  await new Promise<void>((resolve) => {
    server = expressApp.listen(port, '127.0.0.1', () => {
      console.log(`[Server] Running on http://127.0.0.1:${port}`)
      resolve()
    })
  })

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#18181a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
      additionalArguments: [`--backend-port=${port}`],
    },
  })

  const isDev = !app.isPackaged
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    // DevTools can be opened via View > Toggle Developer Tools in the ribbon
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => { mainWindow = null })
}

app.on('window-all-closed', () => {
  server?.close()
  app.quit()
})

app.on('before-quit', () => {
  server?.close()
})

app.whenReady().then(start).catch((err) => {
  dialog.showErrorBox('Startup Error', String(err))
  app.quit()
})
