/**
 * 解决hbuilder打包app之后点击手机返回键直接退出app,多次点击切换至后台运行
 */
document.addEventListener('plusready', function() {
  if (!window.plus) {
    return
  }
  // eslint-disable-next-line no-undef
  var webview = plus.webview.currentWebview()
  // currentWebview: 获取当前窗口的WebviewObject对象
  // canBack方法: 查询Webview窗口是否可后退
  // eslint-disable-next-line no-undef
  plus.key.addEventListener('backbutton', function() {
    webview.canBack(function(e) {
      if (e.canBack) {
        webview.back()
      } else {
        // webview.close() //hide,quit
        // plus.runtime.quit()方法 退出应用
        // 首页返回键处理
        // 处理逻辑：1秒内，连续两次按返回键，则则切换至后台运行；
        var first = null
        // eslint-disable-next-line no-undef
        plus.key.addEventListener(
          'backbutton',
          function() {
            // 首次按键，提示‘‘再按一次返回键,应用切换至后台运行’
            if (!first) {
              first = new Date().getTime()
              this.$toast({
                message: `再按一次返回键\n应用切换至后台运行`,
                // message: `再按一次返回键\n切换到后台运行`,
                duration: 2 * 1000
              })
              setTimeout(function() {
                first = null
              }, 1000)
            } else {
              if (new Date().getTime() - first < 1500) {
                // plus.runtime.quit()
                // eslint-disable-next-line no-undef
                var main = plus.android.runtimeMainActivity()
                main.moveTaskToBack(false)
              }
            }
          },
          false
        )
      }
    })
  })
})
