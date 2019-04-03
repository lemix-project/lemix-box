const {ipcRenderer} = require('electron')

window.__send_message = (type, parameters, isSync) => {
  let data = JSON.stringify({
    type: type,
    params: parameters,
    sync: isSync
  })
  // 与主进程通信
  const res = ipcRenderer.sendSync('SEND_MESSAGE', data)
  console.log(res);
}

window.$lemix = {
  ui: {
    navigation: {
      push: (type, aim, config) => {
        __send_message(
          'ui.navigation.push',
          {
            aim: aim,
            type: type,
            config: config
          }
        )
      },
      pop: (layer) => {
        __send_message(
          'ui.navigation.pop',
          {
            layer: layer
          }
        )
      }
    }
  },
  net: {
    http: {
      asyncRequest: (config) => {
        let hConfig = __handle_config(config)
        __send_message(
          __TYPE.NET.HTTP.ASYNC_REQUEST,
          hConfig
        )
      }
    }
  }
}