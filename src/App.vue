<template>
  <div id="app">
    <!-- 一级路由出口 -->
    <router-view />
  </div>
</template>

<script>
// import { getEnvCfg } from '@/utils/envConfig'
// import { getItem } from '@/utils/auth'
// import defaultSettings from '@/settings'
// const TokenKey = defaultSettings.TokenKey

// export default {
//   name: 'App',
//   mounted() {
//     // 调试工具
//     if (getEnvCfg().vConsoleEnable) {
//       new this.$vconsole()
//     }

//     // socket连接
//     this.$socket.start(getItem(TokenKey))
//   }
// }
</script>

<style>
html {
  font-size: 14px;
}
</style>
