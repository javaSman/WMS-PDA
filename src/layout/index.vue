<template>
  <div class="layout-flex-container">
    <!-- 顶部导航栏 -->
    <NavBarVue :title="narBarTitle" :left-arrow="leftArrow" />
    <!-- 子路由出口 -->
    <div class="layout-flex-main">
      <router-view />
    </div>
  </div>
</template>

<script>
import NavBarVue from './components/NavBar.vue'
export default {
  name: 'LayoutIndex',
  components: { NavBarVue },
  props: {},
  data() {
    return {
      active: 0
    }
  },
  computed: {
    leftArrow() {
      return this.$route.name !== 'home'
    },
    narBarTitle() {
      let name = this.$route.name
      return name === 'second' ? this.$route.query.text : this.$route.meta.title
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
// 固定头部、底部-中间内容超出出现滚动条
.layout-flex-container {
  display: flex; // 父元素的定义为flex布局
  flex-direction: column; // 定义排列方向为竖排
  overflow: hidden;
  width: 100%;
  height: 100vh;
  text-align: center;
  // 中间分配剩下的所有空间
  // 菜单容器 位置定位，超出出现滚动条
  .layout-flex-main {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 5px;
  }
}
</style>
