const { app, BrowserWindow, Menu, shell, autoUpdater } = require('electron')
const windowStateKeeper = require('electron-window-state')

const os = require('os')

const platform = os.platform() + '_' + os.arch()
const version = app.getVersion()

let menu
let template
let mainWindow = null

require('electron-debug')()

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

function execOnMainWindow (...args) {
  if (!mainWindow) {
    return initNewWindow(() => {
      mainWindow.webContents.send(...args)
    })
  }
  mainWindow.webContents.send(...args)
}

app.on('open-file', function (event, pathToOpen) {
  event.preventDefault()
  execOnMainWindow('open-filename', pathToOpen)
})

app.on('activate', function (event, hasVisibleWindows) {
  event.preventDefault()
  if (!hasVisibleWindows) {
    initNewWindow(() => app.focus())
  } else {
    app.focus()
  }
})

function initNewWindow (callback) {
  // Load the previous state with fallback to defaults
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1024,
    defaultHeight: 728
  })

  mainWindow = new BrowserWindow({
    'x': mainWindowState.x,
    'y': mainWindowState.y,
    'width': mainWindowState.width,
    'height': mainWindowState.height
  })

  mainWindowState.manage(mainWindow)

  mainWindow.loadURL(`file://${__dirname}/electron.html`)

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.show()
    mainWindow.focus()
    if (callback) {
      callback()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.openDevTools()
  }
}

app.on('ready', () => {
  initNewWindow()

  if (process.env.NODE_ENV === 'development') {
    try {
      BrowserWindow.addDevToolsExtension('~/Library/Application Support/Google/Chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/0.14.11_0')
    } catch (e) {
      console.error(e)
    }
  }

  if (process.platform === 'darwin') {
    template = [{
      label: 'Kayero',
      submenu: [{
        label: 'About Kayero',
        role: 'about'
      }, {
        label: 'Check for update',
        click () {
          autoUpdater.checkForUpdates()
        }
      }, {
        type: 'separator'
      }, {
        label: 'Services',
        role: 'services',
        submenu: []
      }, {
        type: 'separator'
      }, {
        label: 'Hide Kayero',
        accelerator: 'Command+H',
        role: 'hide'
      }, {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H',
        role: 'hideothers'
      }, {
        label: 'Show All',
        role: 'unhide'
      }, {
        type: 'separator'
      }, {
        label: 'Quit',
        accelerator: 'Command+Q',
        click () {
          app.quit()
        }
      }]
    }, {
      label: 'File',
      submenu: [{
        label: 'New File',
        accelerator: 'Command+N',
        click () {
          execOnMainWindow('new-file')
        }
      }, {
        label: 'Open...',
        accelerator: 'Command+O',
        click () {
          execOnMainWindow('open-file')
        }
      }, {
        type: 'separator'
      }, {
        label: 'Save',
        accelerator: 'Command+S',
        click () {
          execOnMainWindow('save-file')
        }
      }, {
        label: 'Save As...',
        accelerator: 'Shift+Command+S',
        click () {
          execOnMainWindow('save-as-file')
        }
      }, {
        type: 'separator'
      }, {
        label: 'Export',
        click () {
          execOnMainWindow('export')
        }
      }]
    }, {
      label: 'Edit',
      submenu: [{
        label: 'Re-run the notebook',
        accelerator: 'Command+R',
        click (e, focusedWindow) {
          execOnMainWindow('re-run')
        }
      }, {
        type: 'separator'
      }, {
        label: 'Undo',
        accelerator: 'Command+Z',
        role: 'undo'
      }, {
        label: 'Redo',
        accelerator: 'Shift+Command+Z',
        role: 'redo'
      }, {
        type: 'separator'
      }, {
        label: 'Cut',
        accelerator: 'Command+X',
        role: 'cut'
      }, {
        label: 'Copy',
        accelerator: 'Command+C',
        role: 'copy'
      }, {
        label: 'Paste',
        accelerator: 'Command+V',
        role: 'paste'
      }, {
        label: 'Select All',
        accelerator: 'Command+A',
        role: 'selectall'
      }]
    }, {
      label: 'View',
      submenu: [{
        label: 'Reload',
        accelerator: 'Command+Shift+R',
        click (e, focusedWindow) {
          if (focusedWindow) {
            focusedWindow.webContents.reload()
          }
        }
      }, {
        label: 'Toggle Full Screen',
        accelerator: 'Ctrl+Command+F',
        click (e, focusedWindow) {
          if (focusedWindow) {
            focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
          }
        }
      }, {
        label: 'Toggle Developer Tools',
        accelerator: 'Alt+Command+I',
        click (e, focusedWindow) {
          if (focusedWindow) {
            focusedWindow.toggleDevTools()
          }
        }
      }]
    }, {
      label: 'Window',
      role: 'window',
      submenu: [{
        label: 'Minimize',
        accelerator: 'Command+M',
        role: 'minimize'
      }, {
        label: 'Close',
        accelerator: 'Command+W',
        role: 'close'
      }, {
        type: 'separator'
      }, {
        label: 'Bring All to Front',
        selector: 'arrangeInFront:'
      }]
    }, {
      label: 'Help',
      role: 'help',
      submenu: [{
        label: 'Learn More',
        click () {
          shell.openExternal('https://github.com/mathieudutour/kayero')
        }
      }, {
        label: 'Documentation',
        click () {
          shell.openExternal('https://github.com/mathieudutour/kayero/tree/master/docs#readme')
        }
      }, {
        label: 'Community Discussions',
        click () {
          shell.openExternal('https://github.com/mathieudutour/kayero/issues')
        }
      }, {
        label: 'Search Issues',
        click () {
          shell.openExternal('https://github.com/mathieudutour/kayero/issues')
        }
      }]
    }]

    menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  } else {
    template = [{
      label: '&File',
      submenu: [{
        label: '&Open',
        accelerator: 'Ctrl+O'
      }, {
        label: '&Close',
        accelerator: 'Ctrl+W',
        click () {
          mainWindow.close()
        }
      }]
    }, {
      label: '&View',
      submenu: (process.env.NODE_ENV === 'development') ? [{
        label: '&Reload',
        accelerator: 'Ctrl+R',
        click () {
          mainWindow.webContents.reload()
        }
      }, {
        label: 'Toggle &Full Screen',
        accelerator: 'F11',
        click () {
          mainWindow.setFullScreen(!mainWindow.isFullScreen())
        }
      }, {
        label: 'Toggle &Developer Tools',
        accelerator: 'Alt+Ctrl+I',
        click () {
          mainWindow.toggleDevTools()
        }
      }] : [{
        label: 'Toggle &Full Screen',
        accelerator: 'F11',
        click () {
          mainWindow.setFullScreen(!mainWindow.isFullScreen())
        }
      }]
    }, {
      label: 'Help',
      submenu: [{
        label: 'Learn More',
        click () {
          shell.openExternal('https://github.com/mathieudutour/kayero')
        }
      }, {
        label: 'Documentation',
        click () {
          shell.openExternal('https://github.com/mathieudutour/kayero/tree/master/docs#readme')
        }
      }, {
        label: 'Community Discussions',
        click () {
          shell.openExternal('https://github.com/mathieudutour/kayero/issues')
        }
      }, {
        label: 'Search Issues',
        click () {
          shell.openExternal('https://github.com/mathieudutour/kayero/issues')
        }
      }]
    }]
    menu = Menu.buildFromTemplate(template)
    mainWindow.setMenu(menu)

    autoUpdater.setFeedUrl('https://getkayero.herokuapp.com/update/' + platform + '/' + version)
    autoUpdater.checkForUpdates()
  }
})

autoUpdater.on('error', (e) => {
  execOnMainWindow('log', 'error', e)
})

autoUpdater.on('checking-for-update', (e) => {
  execOnMainWindow('log', 'checking-for-update', e)
})

autoUpdater.on('update-available', (e) => {
  execOnMainWindow('log', version)
  execOnMainWindow('log', 'update-available', e)
})

autoUpdater.on('update-available', (e) => {
  execOnMainWindow('log', version)
  execOnMainWindow('log', 'update-available', e)
})

autoUpdater.on('update-downloaded', (e) => {
  execOnMainWindow('log', version)
  execOnMainWindow('log', 'update-downloaded', e)
  // autoUpdater.quitAndInstall()
})
