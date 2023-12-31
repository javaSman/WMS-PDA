import Vue from 'vue'
import SvgIcon from '@/components/SvgIcon' // svg component// 引入svg组件

// register globally// 全局注册icon-svg
Vue.component('svg-icon', SvgIcon)

const req = require.context('./svg', false, /\.svg$/)
const requireAll = (requireContext) => requireContext.keys().map(requireContext)
requireAll(req)
