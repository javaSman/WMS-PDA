<template>
  <div>
    <van-nav-bar class="nav-bar" :safe-area-inset-top="true">
      <template #left>
        <div class="box-container">
          <div class="left-container" @click="clickLeft">
            <van-icon v-if="leftArrow" name="arrow-left" class="left-icon" />
            <span>{{ title }}</span>
          </div>
          <div class="right-container" @click="handleLogout">
            <span>{{ '【' + account + '】' + name }}</span>
          </div>
        </div>
      </template>
    </van-nav-bar>
    <van-action-sheet v-model="show" :actions="actions" cancel-text="取消" close-on-click-action @select="onSelect" @opened="opened" />
    <van-action-sheet v-model="isShowPrinterList" :actions="printList" cancel-text="取消" close-on-click-action @select="printSelect" />
    <!-- <van-dialog v-model="scanShow" title="测试环境安装包下载地址" show-cancel-button>
      <div class="scanWrapper">
        <img :src="require('../../assets/download.apk.png')" />
      </div>
    </van-dialog> -->
  </div>
</template>

<script>
import { Dialog } from 'vant'
import { setItem } from '@/utils/auth'
import { mapGetters } from 'vuex'
import { requestWMS as request } from '@/utils/requestMes'
import { _showFailToast } from '@/utils/message'
import { GetDeviceList } from '@/utils/printTools'
import { setItemLocalS, getItemLocalS } from '@/utils/auth'
export default {
  name: 'NavBarVue',
  props: {
    title: { type: String, default: '' }, // 导航栏标题
    leftArrow: { type: Boolean, default: true } // 是否显示左箭头
  },
  data() {
    return {
      show: false,
      // actions: [{ name: '检查更新' }, { name: '退出登录' }, { name: '获取MAC地址' }],
      actions: [
        { name: '检查更新', subname: '网页版会显示这行内容，手机版这里是版本' },
        { name: '绑定打印机', subname: '请选择一个打印机' },
        { name: '退出登录' }
      ],
      scanShow: false,
      timer: null,
      isShowPrinterList: false,
      printList: [],
      bluetooths: []
    }
  },
  computed: {
    ...mapGetters(['account', 'name'])
  },
  mounted() {
    this.timer = setInterval(() => {
      this.autoCheckUpdate()
    }, 10 * 1000)
  },
  destroyed() {
    clearInterval(this.timer)
    this.timer = null
  },
  methods: {
    opened() {
      let _this = this

      plus.runtime.getProperty(plus.runtime.appid, async (data) => {
        let version = data.version
        _this.actions[0].subname = `当前版本:${version}`
      })
      // 获取上次选择的打印机
      let print = getItemLocalS('CURRENT_PRINT')
      if (print) {
        this.actions[1].subname = `当前选择的打印机是：${print.name}`
      }
    },
    clickLeft() {
      this.$router.go(-1)
    },
    onSelect(val) {
      switch (val.name) {
        case '检查更新':
          this.checkUpdate()
          break
        case '绑定打印机':
          this.openPrinterList()
          break
        case '退出登录':
          this.comfirmLogOut()
          break
      }
      console.log(val)
    },
    handleLogout() {
      this.show = true
    },
    comfirmLogOut() {
      Dialog.confirm({
        title: '提示',
        message: '确认要退出吗？'
      })
        .then(() => {
          this.$store.dispatch('user/logout').then(() => {
            // 用户登录界面提示
            setItem('point', 401)
            location.reload() // 为了重新实例化vue-router对象 避免bug
          })
        })
        .catch(() => {
          // on cancel
        })
    },
    autoCheckUpdate() {
      if (window.plus) {
        plus.runtime.getProperty(plus.runtime.appid, async (data) => {
          let versionCode = data.versionCode
          let res = await request({
            url: process.env.VUE_APP_VERSION_API,
            method: 'GET',
            params: {
              t: new Date().getTime()
            }
          })
          if (Number(res.versionCode) > Number(versionCode)) {
            this.checkUpdate()
          }
        })
      }
    },
    async checkUpdate() {
      if (window.plus) {
        plus.runtime.getProperty(plus.runtime.appid, async (data) => {
          let versionCode = data.versionCode
          let res = await request({
            url: process.env.VUE_APP_VERSION_API,
            method: 'GET',
            params: {
              t: new Date().getTime()
            }
          })
          if (Number(res.versionCode) > Number(versionCode)) {
            this.$dialog
              .confirm({
                title: '版本更新',
                message: `本次版本${res.version},更新内容:${res.message.join(',')}`
              })
              .then(() => {
                console.log('开始更新')
                plus.nativeUI.showWaiting('下载最新文件中,请稍候...')
                plus.downloader
                  .createDownload(res.wgtUrl, {}, (d, status) => {
                    if (status === 200) {
                      plus.nativeUI.closeWaiting()
                      console.log('下载wgt成功：' + d.filename)
                      this.installWgt(d.filename)
                    } else {
                      console.log('下载wgt失败！')
                      plus.nativeUI.alert('下载wgt失败！')
                    }
                  })
                  .start()
              })
              .catch(() => {
                console.log('取消更新')
              })
          } else {
            _showFailToast('当前没有新版本')
          }
        })
      }
    },
    installWgt(path) {
      plus.nativeUI.showWaiting('安装wgt文件...')
      plus.runtime.install(
        path,
        {
          force: true
        },
        function () {
          plus.nativeUI.closeWaiting()
          console.log('安装wgt文件成功！')
          plus.nativeUI.alert('应用资源更新完成！', function () {
            plus.runtime.restart()
          })
        },
        function (e) {
          plus.nativeUI.closeWaiting()
          console.log('安装wgt文件失败[' + e.code + ']：' + e.message)
          plus.nativeUI.alert('安装wgt文件失败[' + e.code + ']：' + e.message)
        }
      )
    },
    // 打开当前连接的打印机列表，等待选择一个
    openPrinterList() {
      let device = GetDeviceList()
      this.bluetooths = device.map((item) => ({
        name: item.name,
        address: item.address
      }))
      // 格式化一下传入给显示面板
      this.printList = device.map((item) => ({ name: item.name, address: item.address }))
      console.log(JSON.stringify(this.printList))
      this.isShowPrinterList = true
    },
    // 选择一台打印机，保存在本地
    printSelect(val) {
      let target = this.bluetooths.find((item) => item.name === val.name)
      setItemLocalS('CURRENT_PRINT', target)
    }
    /** 获取设备mac地址 */
    // getCurrentDeviceWlanMacAddress() {
    //   let deviceWlanMacAddress = ''
    //   let networkInterface = window.plus.android.importClass('java.net.NetworkInterface')
    //   let wlaNetworkInterface0 = networkInterface.getByName('wlan0')
    //   let hardwareAddressByte = wlaNetworkInterface0.getHardwareAddress()
    //   for (let i = 0; i < hardwareAddressByte.length; i++) {
    //     let temp = ''
    //     let number = hardwareAddressByte[i]
    //     if (number < 0) {
    //       temp = (255 + number + 1).toString(16)
    //     } else {
    //       temp = number.toString(16)
    //     }
    //     if (temp.length === 1) {
    //       temp = '0' + temp
    //     }

    //     if (i < hardwareAddressByte.length - 1) {
    //       temp += ':'
    //     }

    //     deviceWlanMacAddress += temp
    //   }
    //   _showFailToast(deviceWlanMacAddress)
    //   return deviceWlanMacAddress
    // }
  }
}
</script>

<style scoped lang="scss">
// 垂直居中-水平居中
.nav-bar ::v-deep .van-nav-bar__left {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
.box-container {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  .left-container {
    text-align: left;
    width: 60%;
    // display: flex;
    align-items: center;
    text-overflow: ellipsis;
    overflow: hidden;
    word-break: keep-all;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }
  .right-container {
    justify-content: center;
    text-align: right;
    flex: 1;
    word-wrap: break-word;
    word-break: normal;
  }
}
.scanWrapper {
  height: 80%;
  width: 100%;
  img {
    width: 100%;
    height: 100%;
  }
}
</style>
