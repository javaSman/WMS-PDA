// 请求头，以及错误提示信息等。它封装了全局 request拦截器、response拦截器、
// 统一的错误处理、统一做了超时处理、baseURL设置等
import router from '../router'
import axios from 'axios'
import defaultSettings from '@/settings'

import store from '../store'
import { getItem, setItem } from '@/utils/auth'
import { _showFailToast } from './message'

// const TokenKey = defaultSettings.TokenKey
const TokenWMSKey = defaultSettings.TokenWMSKey
const timeout = defaultSettings.timeout

// 创建axios实例：传两个参数（timeout（超时时间）、baseUrl（服务器路径））
// 根据环境变量创建axios实例，让它具有不同的baseURL。
function commonRequest() {
  const service = axios.create({
    baseURL: process.env.NODE_ENV === 'production' ? process.env.VUE_APP_BASE_API : '/', // api 的 base_url
    timeout: timeout
  })

  // request interceptor 拦截器
  service.interceptors.request.use(
    (config) => {
      if (!config.headers) {
        throw new Error(`Expected 'config' and 'config.headers' not to be undefined`)
      }
      // sap 业务代理
      let sap = config.url?.startsWith(process.env.VUE_APP_BASE_API_SAP + 'Sap/')
      // 非wms业务代理，走企业云
      // let miswms = config.url?.startsWith('/sapwms-api')
      // let miswms = config.url?.startsWith(process.env.VUE_APP_BASE_API + 'eip-mapp-sapwms-server')
      // console.log(config.url)
      // console.log('wms: ', wms)
      // console.log('非: ', miswms)
      // let token = getItem(TokenKey)
      let keyId = getItem(TokenWMSKey)
      if (sap) {
        // debugger
        config.headers['Content-Type'] = 'application/json'
      }
      // if (miswms && keyId) {
      //   // debugger
      // }
      config.headers['Content-Type'] = 'application/json'
      config.headers.keyId = keyId
      return config
    },
    (error) => {
      // 处理请求错误
      console.log(error)
      return Promise.reject(error)
    }
  )

  // response 拦截器
  service.interceptors.response.use(
    (response) => {
      // 指定responseType === 'blob'为true时，响应返回response
      if (response.request.responseType === 'blob') {
        return response
      } else {
        // code 存在表示走企业云接口
        let code = response.data.code
        if (code) {
          if (!response.data.success && code !== '0000') {
            if (code === '0500') {
              const errorMsg = response.data.data || '操作失败'
              if (errorMsg !== undefined) {
                _showFailToast(errorMsg)
                // this.$toast({
                //   type: 'fail',
                //   position: 'top',
                //   message: errorMsg,
                //   duration: 5 * 1000
                // })
              }
              return Promise.reject(errorMsg)
            } else if (code === '0405') {
              _showFailToast('未登录')
              // 未登录
              // this.$toast({
              //   type: 'fail',
              //   position: 'top',
              //   message: '未登录',
              //   duration: 5 * 1000
              // })
              store.dispatch('user/logout').then(() => {
                // 用户登录界面提示
                setItem('point', 401)
                location.reload() // 为了重新实例化vue-router对象 避免bug
              })
            } else if (code === '0410' || code === '0401') {
              // 针对菜单接口、业务报错接口，专门返回 null
              const errorMsg = response.data.msg
              if (errorMsg !== '') {
                _showFailToast(errorMsg)
                // this.$toast({
                //   type: 'fail',
                //   position: 'top',
                //   message: errorMsg,
                //   duration: 5 * 1000
                // })
              }
              return Promise.reject(null)
            } else {
              _showFailToast(response.data.msg)
              // this.$toast({
              //   type: 'fail',
              //   position: 'top',
              //   message: response.data.msg,
              //   duration: 5 * 1000
              // })
              // return Promise.reject(response.data)
            }
          } else {
            return response.data
          }
        }
        // 不存在走wms接口
        // 登录
        let status = response.status
        if (status === 200) {
          return response.data
        } else {
          console.log(response)
        }
      }
    },
    (error) => {
      // console.log(error.response.data)
      // 兼容blob下载出错json提示
      if (error.response.data instanceof Blob && error.response.data.type.toLowerCase().indexOf('json') !== -1) {
        const reader = new FileReader()
        reader.readAsText(error.response.data, 'utf-8')
        reader.onload = () => {
          const errorMsg = JSON.parse(reader.result).message
          _showFailToast(errorMsg)
          // this.$toast({
          //   type: 'fail',
          //   position: 'top',
          //   message: errorMsg,
          //   duration: 5 * 1000
          // })
        }
      } else {
        let code = 0
        console.log(error.response.data.status)
        try {
          code = error.response.data.status
        } catch (e) {
          if (error.toString().indexOf('Error: timeout') !== -1) {
            _showFailToast('网络请求超时')
            // this.$toast({
            //   type: 'fail',
            //   position: 'top',
            //   message: '网络请求超时',
            //   duration: 5 * 1000
            // })
            return Promise.reject(error)
          }
        }
        if (code) {
          if (code === 401) {
            store.dispatch('user/logout').then(() => {
              // 用户登录界面提示
              setItem('point', 401)
              location.reload() // 为了重新实例化vue-router对象 避免bug
            })
          } else if (code === 403) {
            router.push({ path: '/401' })
          } else {
            const errorMsg = error.response.data.message
            if (errorMsg !== undefined) {
              _showFailToast(errorMsg)
              // this.$toast({
              //   type: 'fail',
              //   position: 'top',
              //   message: errorMsg,
              //   duration: 5 * 1000
              // })
            }
          }
        } else {
          _showFailToast('接口请求失败')
          // this.$toast({
          //   type: 'fail',
          //   position: 'top',
          //   message: '接口请求失败',
          //   duration: 5 * 1000
          // })
        }
      }
      return Promise.reject(error)
    }
  )
  return service
}

export const requestMIS = commonRequest()
