'use strict'
const path = require('path')
const defaultSettings = require('./src/settings.js')

function resolve(dir) {
  return path.join(__dirname, dir)
}
const name = defaultSettings.title || 'vue vant app' // page title

const port = process.env.port || process.env.npm_config_port || 8091 // dev port

function buildModel() {
if (process.env.NODE_ENV === 'development') {
    return 'TestDist'
  } else if (process.env.NODE_ENV === 'staging') {
    return 'StagingDist'
  } else {
    return 'dist'
  }
}
module.exports = {
  // publicPath: '/',
  publicPath: './', // 公共路径【(打包需要改成这样)】-部署生产环境和开发环境下的URL：可对当前环境进行区分
  outputDir: buildModel(), // 输出文件目录：在npm run build时，生成文件的目录名称
  assetsDir: 'static', // 放置生成的静态资源 (js、css、img、fonts) 的 (相对于 outputDir 的) 目录
  lintOnSave: process.env.NODE_ENV === 'development', //  代码保存时进行eslint检测
  productionSourceMap: false, // 是否在构建生产包时生成 sourceMap 文件，false将提高构建速度
  /* webpack-dev-server 相关配置 */
  devServer: {
    host: '0.0.0.0',
    port: port,
    open: false /* 是否自动打开浏览器 */,
    overlay: {
      warnings: false,
      errors: true
    },

    // vue 项目中配置代理避开所有限制
    proxy: {
      // 非WMS业务，走企业云
      '/sapwms-api': {
        target: process.env.VUE_APP_BASE_API,
        changeOrigin: true,
        pathRewrite: {
          '^/sapwms-api': 'sapwms-api'
        }
      }
    }
  },
  configureWebpack: {
    name: name,
    resolve: {
      alias: {
        '@': resolve('src'),
        '@crud': resolve('src/components/Crud')
      }
    }
  },
  // 调整内部的webpack配置
  chainWebpack(config) {
    config.plugins.delete('preload') // TODO: need test
    config.plugins.delete('prefetch') // TODO: need test

    // set svg-sprite-loader
    config.module.rule('svg').exclude.add(resolve('src/icons')).end()
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })
      .end()

    config.module
      .rule('vue')
      .use('vue-loader')
      .loader('vue-loader')
      .tap((options) => {
        options.compilerOptions.preserveWhitespace = true
        return options
      })
      .end()

    config
      // https://webpack.js.org/configuration/devtool/#development
      .when(process.env.NODE_ENV === 'development', (config) => config.devtool('cheap-source-map'))

    config.when(process.env.NODE_ENV !== 'development', (config) => {
      config
        .plugin('ScriptExtHtmlWebpackPlugin')
        .after('html')
        .use('script-ext-html-webpack-plugin', [
          {
            inline: /runtime\..*\.js$/
          }
        ])
        .end()
      config.optimization.splitChunks({
        chunks: 'all',
        cacheGroups: {
          libs: {
            name: 'chunk-libs',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'initial' // only package third parties that are initially dependent
          },
          commons: {
            name: 'chunk-commons',
            test: resolve('src/components'), // can customize your rules
            minChunks: 3, //  minimum common number
            priority: 5,
            reuseExistingChunk: true
          }
        }
      })
      config.optimization.runtimeChunk('single')
    })
  },
  // css引入sass全局变量
  pluginOptions: {
    'style-resources-loader': {
      preProcessor: 'scss',
      patterns: [
        // 两种路径写法都可以，这里的路径不能使用 @ 符号，否则会报错
        path.resolve(__dirname, 'src/styles/variables.scss')
      ]
    }
  }
}
