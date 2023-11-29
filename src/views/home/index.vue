<template>
  <!-- 需要加载有权限的菜单列表 -->
  <van-grid column-num="3" :gutter="5">
    <van-grid-item v-for="menu in menus" :key="menu.name" :text="menu.meta.title" class="border-grid" @click="handleToSecond(menu)">
      <van-image fit="fill" :src="getImg(menu.meta.icon)" />
      {{ menu.meta.title }}
    </van-grid-item>
  </van-grid>
</template>

<script>
// import MenuItem from './component/MenuItem'
// import ExternalMenu from './component/externalMenu'
import defaultSettings from '@/settings'
import { mapGetters } from 'vuex'
import { requestWMS as request } from '@/utils/requestMes'

export default {
  props: {},
  data() {
    return {
      narBarTitle: defaultSettings.narBarTitle, // 导航标题
      img: require(`@/assets/img/WMSLineSideWarehouse.png`)
    }
  },
  computed: {
    ...mapGetters(['permission_routes', 'menus']),
    getImg() {
      return (icon) => {
        if (!icon) {
          return require(`@/assets/img/lyric.png`)
        } else {
          return require(`@/assets/img/${icon}.png`)
        }
      }
    }
  },
  mounted() {
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
        }
      })
    }
  },
  methods: {
    handleToSecond(item) {
      if (!item.children || item.children.length === 0) {
        this.$toast(item.meta?.title + '暂无子目录')
        return
      }
      this.$router.push({ name: 'second', query: { name: item.name, text: item.meta.title, level: 'second' } })
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
    }
  }
}
</script>

<style scoped lang="scss">
// 固定头部、底部-中间内容超出出现滚动条
.home-flex-container {
  display: flex; // 父元素的定义为flex布局
  flex-direction: column; // 定义排列方向为竖排
  overflow: hidden;
  width: 100%;
  height: 100vh;
  text-align: center;
  // 中间分配剩下的所有空间
  // 菜单容器 位置定位，超出出现滚动条
  .home-flex-main {
    flex: 1;
    overflow: auto;
    padding-bottom: 5px;
  }
  // 头部-固定高度
  // .home-flex-header {
  // height: 46px;
  // }
  // // 底部-固定高度
  // .flex-footer {
  //   height: 50px;
  // }
}
// 图标
.svg-container {
  margin: 0 10px;
}
</style>
