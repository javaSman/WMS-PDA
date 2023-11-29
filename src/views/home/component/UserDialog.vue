<template>
  <!-- 用户信息弹窗 -->
  <van-dialog v-model="show" :show-confirm-button="false" :title="dialogTitle" width="80%" class="dialog-box-corner" overlay-class="dialog-box-mask">
    <div slot="title" class="dialog-title">
      <span>{{ dialogTitle }}</span>
    </div>
    <van-cell-group :border="false" class="group-container-info">
      <van-cell v-for="item in userItem" :key="item.prop" :border="false" class="cell-container">
        <CellCtx v-if="item.type === 'CellTag'" :item="item" :form-data="userForm">
          <div slot="default">
            <span>{{ userForm[`${item.envProp}`] }} {{ userForm[`${item.codeProp}`] }}</span>
            <van-tag v-show="hasUpdate" type="danger" @click="handleUpgrade">new</van-tag>
          </div>
        </CellCtx>
        <CellCtx v-if="item.type === 'Cell'" :item="item" :form-data="userForm" />
      </van-cell>
    </van-cell-group>
    <div class="dialog-btn">
      <van-button native-type="button" type="default" class="cancel-btn" @click="cancel">关闭</van-button>
    </div>
  </van-dialog>
</template>

<script>
import CellCtx from '@/components/FormItem/CellCtx'
import { getEnvText } from '@/utils/envConfig'
// import { appAPI } from '@/api/generalAPI'
import defaultSettings from '@/settings'
export default {
  name: 'UserDialog',
  components: { CellCtx },
  props: {
    isShowDialog: { type: Boolean, default: false },
    dialogTitle: { type: String, default: '个人信息' },
    dialogWidth: { type: String, default: '450' }
  },
  data() {
    return {
      defaultSettings,
      userForm: {},
      hasUpdate: false,
      /** 版本信息数据 */
      versionInfo: {
        isShowVersion: false,
        apkName: defaultSettings.appApkCode,
        versionMsg: {}
      },
      userItem: [
        { type: 'CellTag', label: '版本信息：', prop: 'env', envProp: 'env', codeProp: 'currentVersion' },
        { type: 'Cell', label: '用户工号：', prop: 'account' },
        { type: 'Cell', label: '用户名称：', prop: 'name' }
      ]
    }
  },
  computed: {
    show: {
      get() {
        if (this.isShowDialog) {
          this.getUserInfo()
        }
        return this.isShowDialog
      },
      set(val) {
        this.$emit('update:isShowDialog', val)
      }
    }
  },
  created() {},
  mounted() {},
  methods: {
    /** 获取用户信息、客户端版本号及环境 */
    getUserInfo() {
      this.userForm = this.$store.getters.users
      /** getEnvText 获取当前环境 */
      // this.getVersion()
      this.$set(this.userForm, 'env', getEnvText())
      if (!window.plus) {
        return
      }
      this.$set(this.userForm, 'currentVersion', plus.runtime.versionCode)
    },
    /** 对比当前版本和服务器最新版本，有新版本则推送更新 */
    // getVersion() {
    //   appAPI.get('AppClient', { appCode: this.versionInfo.apkName }, 'GetCurAppClient').then(res => {
    //     if (res.Success === true) {
    //       let resData = res.Data
    //       this.versionInfo.versionMsg = resData // 更新对应信息
    //       let newVersion = resData.VersionID // 更新版本名
    //       if (!window.plus) {
    //         return
    //       }
    //       let currentVersion = '' // 当前版本号
    //       currentVersion = plus.runtime.versionCode // 当前版本号
    //       this.$set(this.userForm, 'currentVersion', currentVersion)
    //       if (currentVersion !== newVersion) {
    //         this.hasUpdate = true
    //       } else {
    //         this.hasUpdate = false
    //       }
    //     } else {
    //       this.$toast('版本获取失败')
    //     }
    //   })
    // },
    /** 当前版本查看，有新版本则推送新版本，否则提示 */
    handleUpgrade() {
      if (this.hasUpdate) {
        this.versionInfo.isShowVersion = true
        this.$emit('updateVersion', this.versionInfo)
      } else {
        this.$toast('当前版本是最新版本')
      }
    },
    /** 弹窗关闭 */
    cancel() {
      this.show = false
    }
  }
}
</script>

<style scoped lang="scss">
// 单元格样式-重写
.group-container-info .van-cell {
  padding: 5px 16px;
}
.dialog-btn {
  text-align: center;
  padding: 5px;
}
</style>
