<template>
  <div>
    <div v-for="(item, index) in testMenu" :key="index" class="menu-block">
      <div class="menu-title">
        <span>{{ item.title }}</span>
      </div>
      <van-grid square :border="false">
        <van-grid-item v-for="child in item.children" :key="child.path" :text="child.title" :to="child.path">
          <template #icon>
            <svg-icon :icon-class="child.icon" style="block" class="svg-container" />
          </template>
        </van-grid-item>
      </van-grid>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MenuItem',
  props: {
    testMenu: {
      type: Array,
      default: () => [],
      required: true
    }
  },
  data() {
    return {}
  },
  methods: {}
}
</script>

<style scoped lang="scss">
.menu-block {
  width: 90%;
  border-radius: 10px;
  display: inline-block;
  vertical-align: middle;
  background: #fff;
  margin-top: 10px;
  padding: 10px;
}
.menu-title {
  padding-left: 20px;
  text-align: left;
}
.menu-title span {
  width: 100%;
  height: 30px;
  line-height: 30px;
  font-size: 14px;
  text-align: left;
  position: relative;
}
.menu-title span::before {
  background: #000;
  content: '';
  width: 4px;
  height: 14px;
  position: absolute;
  top: 0px;
  left: -9px;
  background: $blue;
}
.svg-container {
  padding-bottom: 10px;
  font-size: 25px;
}
</style>
