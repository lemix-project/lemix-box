const {ipcRenderer, remote} = require('electron')
ipcRenderer.on('webParent', (e, message) => {

})
window.__send_message = (type, parameters, isSync) => {
  let data = JSON.stringify({
    type: type,
    params: parameters,
    sync: isSync
  })
  console.log(data)
  ipcRenderer.sendToHost(data)
}
window.$lemix = {
  ui: {
    navigation: {
      push: (type, aim, config) => {
        __send_message(
          '__TYPE.UI.NAVIGATION.PUSH',
          {
            aim: aim,
            type: type,
            config: config
          }
        )
      },
      present: (type, aim, config) => {
        __send_message(
          '__TYPE.UI.NAVIGATION.PRESENT',
          {
            aim: aim,
            type: type,
            config: config
          }
        )
      }
    }
  }
}