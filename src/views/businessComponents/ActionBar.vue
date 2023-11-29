<template>
  <div>
    <div style="height: 50px" />
    <div class="action_bar">
      <div class="clear" @click="handleClear">
        <van-button type="default" size="large">清除</van-button>
      </div>
      <div class="comfir">
        <van-button type="info" size="large" :loading="loading" @click="handleConfirm">{{ confirmText }}</van-button>
      </div>
    </div>
    <!-- <van-tabbar>
      <van-tabbar-item>清除</van-tabbar-item>
      <van-tabbar-item :loading="loading" @click="handleConfirm">
        <van-button type="info" size="large">{{ confirmText }}</van-button>
      </van-tabbar-item>
    </van-tabbar> -->
    <!-- <van-action-bar>
      <van-action-bar-button type="default" text="清除" @click="handleClear" />
      <van-action-bar-button type="primary" :text="confirmText" :loading="loading" @click="handleConfirm" />
    </van-action-bar> -->
  </div>
</template>
<script>
export default {
  name: 'ActionBarVue',
  props: {
    loading: { type: Boolean, default: false },
    confirmText: { type: String, default: '过账' }
  },
  methods: {
    handleClear() {
      this.$emit('clear')
    },
    handleConfirm() {
      this.$emit('confirm')
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
  .comfir {
    flex: 1;
  }
}
</style>
