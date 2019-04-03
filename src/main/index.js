import {app, BrowserWindow, ipcMain} from 'electron'
import lemix from '../../static/lemix'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */

/**
 * 绑定‘SEND_MESSAGE’事件，用于和webview通信
 * create by Promi5e 2019-03-13 16:41
 */
ipcMain.on('SEND_MESSAGE_ASYNC', (event, message) => {
  const messageObject = JSON.parse(message)
  if (messageObject.type.split('.')[0] === 'net') {
    let params = messageObject.params
    let fn = lemix.common.fn.getFn(messageObject.type)
    fn(params).then(res => {
      event.returnValue = JSON.stringify(Object.assign(res.data, {success: true}))
    }).catch(err => {
      event.returnValue = JSON.stringify(Object.assign(err.response.data, {success: false}))
    })
  } else {
    // 分发消息
    mainWindow.webContents.send('MAIN_TO_RENDER', message)
    event.returnValue = null
  }

})

ipcMain.on('SEND_MESSAGE_SYNC', async (event, message) => {
  const messageObject = JSON.parse(message)
  /**
   * 需要判断是否需要界面操作，如style，navigation，statusBar 等
   * ----判断方式未确定----
   * 需要页面操作的要跳转到渲染进程 ipcRenderer
   */
  if (messageObject.type.split('.')[0] === 'net') {
    let params = messageObject.params
    let fn = lemix.common.fn.getFn(messageObject.type)
    // const res = await fn(params)
    // console.log(res.data)
    fn(params).then(res => {
      console.log(`res:${res.data}`);
      event.sender.send('LOAD_CALLBACK', [params.success, JSON.stringify(res.data)])
    }).catch(err => {
      console.log(err.response);
      event.sender.send('LOAD_CALLBACK', [params.failed, JSON.stringify(err.response.data)])
    })
  } else {
    // 分发消息
    mainWindow.webContents.send('MAIN_TO_RENDER', message)
  }
})

if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000,
    webPreferences: {webSecurity: false}
  })
  mainWindow.loadURL(winURL)
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
