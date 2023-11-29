module.exports = {
  /**
   * @description 标题
   */
  title: 'WMS',

  /**
   * @description 导航栏标题
   */
  narBarTitle: 'WMS',

  /**
   * @description apk安装包名
   */
  appApkCode: 'WMS-PDA',
  // appApkCode: 'JBMES-PDA',

  /**
   * @description 请求超时时间，毫秒（默认1分钟）
   */
  timeout: 1000 * 10 * 6,

  /**
   * @description 非WMS业务使用
   */
  TokenKey: 'MISWMS-PDA',
  /**
   * @description WMS业务使用
   */
  TokenWMSKey: 'WMS-PDA',

  /**
   * @description 默认初始环境
   */
  defaultEnv: 'official',

  /**
   * @description 是否可切换环境
   */
  switchableEnv: true,

  /**
   * @description 重新登录是否跳回退出登录前的页面
   */
  useHistoryPath: false
}
