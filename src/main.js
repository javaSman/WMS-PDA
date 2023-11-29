import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import 'amfe-flexible' // 动态设置 REM 基准值（html 标签的字体大小）

// import '@/plugins/vant.js' // vant 按需引入在vant.js文件用引入

import '@/icons' // svg图标
import '@/permission' // 权限控制
import '@/utils/h5Plus/appBack.js' // 点击返回键提示
import '@/utils/h5Plus/appPause.js' // 监听app后台运行是否超时，超时则退出软件
import Vant from 'vant'
import 'vant/lib/index.css'
import '@/styles/index.scss'

// import dict from '@/components/Dict' // 数据字典
Vue.use(Vant)
// import VConsole from 'vconsole' // 调试工具
// Vue.prototype.$vconsole = VConsole
Vue.config.productionTip = false

new Vue({
  el: '#app',
  router,
  store,
  render: (h) => h(App)
})
// console.log(process.env.NODE_ENV)
// console.log(process.env.VUE_APP_BASE_API)
// console.log(process.env.VUE_APP_WS_API)
