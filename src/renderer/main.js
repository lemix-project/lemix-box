import Vue from 'vue'
import ElementUI from 'element-ui'

import App from './App'
import router from './router'
import store from './store'
import makeLogo from './makeLogo'
import callBat from './callBat'
import writeLog from './log'
import axios from './axios'

import 'element-ui/lib/theme-chalk/index.css'

//引入foo主进程
const foo = require('electron').remote.require('./foo')

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.use(ElementUI)
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false
Vue.prototype._makeLogo = makeLogo
Vue.prototype._callBat = callBat
Vue.prototype._writeLog = writeLog
//将 foo 挂载到 vue 的原型上
Vue.prototype.foo = foo;

/* eslint-disable no-new */
new Vue({
    el: "#app",
    components: {App},
    router,
    store,
    template: '<App/>'
})
