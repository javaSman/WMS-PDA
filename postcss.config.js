module.exports = {
  plugins: {
    autoprefixer: {
      browsers: ['Android >= 4.0', 'iOS >= 8']
    },
    'postcss-pxtorem': {
      rootValue: 37.5,
      propList: ['*']
    },
    'postcss-px2rem': {
      // viewportWidth: 375,  // 视窗的宽度，对应的是我们设计稿的宽度.
      // viewportHeight: 667, // 视窗的高度，对应的是我们设计稿的高度.(也可以不配置)
      // unitPrecision: 5, // 保留几位小数，指定`px`转换为视窗单位值的小数位数（很多时候无法整除）
      remUnit: 37.5
      // selectorBlackList: ['tab-bar', 'tab-bar-item','shopping-cart-bottom-bar'], // 指定不需要转换的类
      // minPixelValue: 1, // 小于或等于`1px`不转换为视窗单位.
      // mediaQuery: false // 允许在媒体查询中转换`px`
    }
  }
}
