<template>
  <van-dialog
    v-model="show"
    :close-on-click-overlay="true"
    :show-confirm-button="false"
    message-align="left"
    :title="dialogTitle"
    width="90%"
    class="dialog"
  >
    <van-cell-group class="cell-group">
      <van-field v-model="envUrl" placeholder="请输入环境(http://***/)" />
    </van-cell-group>
    <div class="btn-container">
      <van-grid direction="horizontal" :column-num="Object.keys(envCfg).length">
        <van-grid-item v-for="(item, index) in envCfg" :key="index" :text="item.envText + '环境'" @click="changeEnv(item.env)" />
      </van-grid>
    </div>
  </van-dialog>
</template>

<script>
import { getItemLocalS, setItemLocalS } from '@/utils/auth'
import { getEnv, getEnvUrl } from '@/utils/envConfig'
export default {
  name: 'EnvDialog',
  components: {},
  props: {
    isShowDialog: { type: Boolean, default: true }, // 弹窗显示状态
    dialogTitle: { type: String, default: '切换环境' } // 弹窗标题
  },
  data() {
    return {
      envUrl: '',
      envCfg: window.globalCfg.envCfg
    }
  },
  computed: {
    /** 弹窗显示状态 */
    show: {
      get() {
        return this.isShowDialog
      },
      set(val) {
        this.$emit('update:isShowDialog', val)
      }
    }
  },
  created() {},
  mounted() {
    this.getCurrentEnv()
  },
  methods: {
    /** 获取当前环境 */
    getCurrentEnv() {
      let env = getEnv()
      if (env !== 'other') {
        this.envUrl = getEnvUrl(env)
      } else {
        this.envUrl = getItemLocalS('baseUrl')
      }
    },
    /** 切换环境 */
    changeEnv(env) {
      setItemLocalS('baseEnv', env)
      if (env !== 'other') {
        this.envUrl = getEnvUrl(env)
      }
      setItemLocalS('baseUrl', this.envUrl)
      this.show = false
      this.$toast.loading('即将重新载入...')
      setTimeout(() => {
        this.restart()
      }, 1000)
    },

    /** 重启当前的应用/刷新页面 */
    restart() {
      if (!window.plus) {
        location.reload()
        return
      }
      plus.runtime.restart()
    }
  }
}
</script>
<style scoped lang="scss">
.cell-group {
  margin: 10px;
  border: 1px solid $gray;
}
.cell-group::after {
  border: none;
}
.btn-container {
  // margin: 10px;
  .btn {
    margin: 0 10px;
  }
  ::v-deep .van-grid-item__text {
    color: $blue;
  }
}
</style>
