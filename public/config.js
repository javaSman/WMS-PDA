// 环境配置-------------
/**
 * envCfg：环境配置-多环境
 * env：环境标识，'dev':开发,'test':测试,'official':正式,'other':其他;-【必填】
 * envText:环境中文标识；【必填】
 * vConsoleEnable：vConsole调试工具启用状态;【必填】
 * envUrl:ip+backend_port,后端接口ip-端口;【必填】base:为默认版本
 */
window.globalCfg = {
  envCfg: {
    official: {
      env: 'official',
      envText: '生产',
      vConsoleEnable: false,
      envUrl: {
        base: 'http://192.168.30.33:508', // 508-网页反向代理地址
        api: 'http://192.168.30.33:508',
        commonMESAPI: 'http://192.168.30.33:508',
        ws: 'ws://192.168.30.33:503/',
        pda: 'http://192.168.30.33:508', // pad相关业务
        appAPI: 'http://192.168.32.2:8086' // App更新
      }
    },
    test: {
      env: 'test',
      envText: '测试',
      vConsoleEnable: true,
      envUrl: {
        base: 'http://10.0.7.22:400', // 网页反向代理地址-新
        api: 'http://10.0.7.22:400', // 86-框架
        commonMESAPI: 'http://10.0.7.22:400', // 8086-业务
        ws: 'ws://10.0.7.22:505/',
        pda: 'http://10.0.7.22:400', // pad相关业务
        appAPI: 'http://10.0.7.22:82' // 82-版本
      }
    },
    other: {
      env: 'other',
      envText: '自定义',
      vConsoleEnable: false,
      envUrl: {
        base: ''
      }
    }
  },

  projectTitle: '机加MES-建邦', // 项目标题-先用于登录页、主页-导航栏
  // 线上测试 或 本地运行 时使用以下
  changeOrigin: true, // 是否使用反向代理处理
  scanLimit: false // 是否使用扫码限制，关闭则可手动输入

  // 打包apk时使用以下配置
  // changeOrigin: false, // 是否使用反向代理处理
  // scanLimit: true // 是否使用扫码限制，关闭则可手动输入
}

// -------------环境配置
