/**
 * 监听app后台运行是否超时，超时则退出软件
 */
document.addEventListener(
  'plusready',
  function() {
    console.log('plusready')
    if (!window.plus) {
      return
    }
    // eslint-disable-next-line no-undef
    document.addEventListener(
      'pause',
      function() {
        console.log('运行环境从前台切换到后台事件')
        var time = new Date().getTime()
        document.addEventListener(
          'resume',
          function() {
            console.log('运行环境从后台切换到前台事件')
            time = null
          },
          false
        )
        setTimeout(function() {
          console.log(new Date().getTime())
          console.log(time)
          console.log(new Date().getTime() - time)
          if (time && new Date().getTime() - time > 1000 * 60 * 60) {
            console.log('后台运行超时')
            // eslint-disable-next-line no-undef
            plus.runtime.quit()
          }
        }, 1000 * 60 * 20)
      },
      false
    )
  },
  false
)
