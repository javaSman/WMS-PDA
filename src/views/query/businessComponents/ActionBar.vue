<template>
  <div>
    <div style="height: 50px" />
    <div class="action_bar">
      <div class="clear" @click="handleClear">
        <van-button type="default" size="large">清除</van-button>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'ActionBarVue',
  methods: {
    handleClear() {
      this.$emit('clear')
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .van-action-bar-button--first,
::v-deep .van-action-bar-button--last {
  border-radius: 0;
}
.action_bar {
  height: 50px;
  position: fixed;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  .clear {
    flex: 1;
  }
}
</style>
