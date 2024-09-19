import { startMicroApp } from './micro'
import './plugins'

import * as Sentry from '@sentry/vue'
import { Integrations } from '@sentry/tracing'

import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
// 引入组件包
import HdKit from '@hundun/hdkit'
/* import '@hundun/hdkit/theme-chalk/dark.min.css'
import '@hundun/hdkit/theme-chalk/light.min.css' */
import '@hundun/hdkit/lib/hdkit.css'
import '@hundun/hdkit/styles/lib/index.css'

import '@/styles/fontLocal.less'

Vue.use(HdKit, {
  elementOpts: {
    size: 'middle',
    zIndex: 2000
  }
})

const requireComponent = require.context(
  './components', // 组件所在目录的相对路径
  false, // 是否查询其子目录
  /\.vue$/
  // /Base[A-Z]\w+\.(vue|js)$/ //匹配基础组件文件名的正则表达式
)
requireComponent.keys().forEach((fileName) => {
  // 获取文件名
  var names = fileName
    .split('/')
    .pop()
    .replace(/\.\w+$/, '') // BaseBtn
  // 获取组件配置
  const componentConfig = requireComponent(fileName)
  // 若该组件是通过"export default"导出的，优先使用".default"，
  // 否则退回到使用模块的根
  Vue.component(names, componentConfig.default || componentConfig)
})

Vue.config.productionTip = false

// microApp.start()

const url = location.host
let environment = ''
if (url === 'uat.hundunyun.com') {
  environment = 'uat'
} else if (url === 'www.hundunyun.com.cn') {
  environment = 'prod'
} else if (url === 'test.venus.wxhundun.com') {
  environment = 'test'
} else if (url === 'dev.venus.wxhundun.com') {
  environment = 'dev'
}
if (environment) {
  Sentry.init({
    Vue,
    environment,
    dsn: 'https://f5c532c72351449280e522558f7f40f8@sentry.hundunyun.com.cn/4',
    beforeSendTransaction(event) {
      if (event.request?.url) {
        const flattenedFullMenu = store.getters['auth/flattenedFullMenu'] || []
        const activeMenu =
          store.state.auth.realActicve || localStorage.getItem('realActicve')
        const realUrl = flattenedFullMenu.find(
          (item) => item.id === activeMenu
        )?.lineUrl
        event.transaction = realUrl
      }
      return event
    },
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: environment === 'prod' ? 0.1 : 1
  })
}

const app = new Vue({
  router,
  store,
  render: (h) => h(App)
})

app.$mount('#gateway')

window.name = 'wonder'

startMicroApp(app)

// 用于iframe组态外部修改黑白模式的监听
if (store.state.utils.isInIframe) {
  window.addEventListener('storage', (e) => {
    if (e.key !== 'hundun-dark-light-theme') return
    const theme = e.newValue || 'light'
    document.documentElement.setAttribute('theme', theme)
    document.getElementsByTagName('body')[0].className = `${theme}-theme`
    store.commit('SET_DARK_LIGHT_THEME', theme)
  })
}
