// 通用API文件
import { requestAGV } from '@/utils/requestAgv'
// import {requestMIS} from '@/utils/requestMiswms'

function commonAPI(router, request) {
  const url = router || '/'
  const API = {
    /** 通用接口------起 */
    /** get 方法- params */
    get(name, params, other) {
      let end = ''
      if (other) {
        end = '/' + other
      }
      return request({
        url: url + name + end,
        method: 'get',
        params
      })
    },

    /** get 方法- data */
    dataGet(name, params, other) {
      let end = ''
      if (other) {
        end = '/' + other
      }
      return request({
        url: url + name + end,
        method: 'get',
        data: params
      })
    },

    /** get 方法-  params,data */
    bothGet(name, params, data, other) {
      let end = ''
      if (other) {
        end = '/' + other
      }
      return request({
        url: url + name + end,
        method: 'get',
        params,
        data: data
      })
    },

    /** get 方法- 根据id */
    getById(name, id, otheMethod, otherParams) {
      let methodName = '/get'
      let paramsName = '/id'
      if (otheMethod) {
        methodName = '/' + otheMethod
      }
      if (otherParams) {
        paramsName = '/' + otherParams
      }
      return request({
        // .../get/{id}/id
        url: url + name + methodName + '/' + id + paramsName,
        method: 'get'
      })
    },

    /** get 方法- 导出-响应的数据类型 */
    getExport(name, params, other, otherResType) {
      let end = ''
      if (other) {
        end = '/' + other
      }
      let resType = otherResType || 'blob'
      let extraFlag = resType === 'blob'
      return request({
        url: url + name + end,
        method: 'get',
        params,
        responseType: resType,
        extraFlag: extraFlag
      })
    },

    /** 特殊接口文件下载,文件类型，文件存储名，新文件名 */
    download(name, type, fileName, originalFileName, other) {
      let end = '/file'
      if (other) {
        end = '/' + other
      }
      return request({
        // ...file/download/{type}/{fileName}/{originalFileName}/file
        url: url + name + '/download/' + type + '/' + fileName + '/' + originalFileName + end,
        method: 'get',
        responseType: 'blob'
      })
    },

    /**
     * post 方法- params
     * 数据批量提交
     */
    post(name, params, other) {
      let end = ''
      if (other) {
        end = '/' + other
      }
      return request({
        url: url + name + end,
        method: 'post',
        data: params
      })
    },

    /**
     * post 方法- data
     * 默认新增，other可配置
     */
    dataPost(name, params, other) {
      let end = ''
      if (other) {
        end = '/' + other
      }
      return request({
        url: url + name + end,
        method: 'post',
        data: params
      })
    },

    /** post 方法- params,data */
    bothPost(name, params, data, other) {
      let end = ''
      if (other) {
        end = '/' + other
      }
      return request({
        url: url + name + end,
        method: 'post',
        params,
        data: data
      })
    },

    /** post 方法- 根据id */
    postById(name, id, otheMethod, otherParams) {
      let methodName = '/post'
      let paramsName = '/id'
      if (otheMethod) {
        methodName = '/' + otheMethod
      }
      if (otherParams) {
        paramsName = '/' + otherParams
      }
      return request({
        // .../post/{id}/id
        url: url + name + methodName + '/' + id + paramsName,
        method: 'post'
      })
    },

    /** post 方法- params,data,上传处理进度的事件配置 */
    bothPostUpload(name, params, data, other, onUploadPro) {
      let end = ''
      if (other) {
        end = '/' + other
      }
      return request({
        url: url + name + end,
        method: 'post',
        params,
        data: data,
        onUploadProgress: (progressEvent) => {
          // 原生获取上传进度的事件
          if (progressEvent.lengthComputable) {
            onUploadPro && onUploadPro(progressEvent)
          }
        }
      })
    },

    /** post 方法- params,data,下载处理进度的事件配置 */
    bothPostDownload(name, params, data, other, onDownloadPro) {
      let end = ''
      if (other) {
        end = '/' + other
      }
      return request({
        url: url + name + end,
        method: 'post',
        params,
        data: data,
        onDownloadProgress: (progressEvent) => {
          // 原生获取下载进度的事件
          if (progressEvent.lengthComputable) {
            onDownloadPro && onDownloadPro(progressEvent)
          }
        }
      })
    },

    /** post 方法- params */
    put(name, params, other) {
      let end = ''
      if (other) {
        end = '/' + other
      }
      return request({
        url: url + name + end,
        method: 'put',
        params
      })
    },

    /** put 方法- data */
    dataPut(name, params, other) {
      let end = ''
      if (other) {
        end = '/' + other
      }
      return request({
        url: url + name + end,
        method: 'put',
        data: params
      })
    },

    /** put 方法- 根据id */
    putById(name, id, otheMethod, otherParams) {
      let methodName = '/put'
      let paramsName = '/id'
      if (otheMethod) {
        methodName = '/' + otheMethod
      }
      if (otherParams) {
        paramsName = '/' + otherParams
      }
      return request({
        // .../put/{id}/id
        url: url + name + methodName + '/' + id + paramsName,
        method: 'put'
      })
    },

    /** put 方法-  params,data */
    bothPut(name, params, data, other) {
      let end = ''
      if (other) {
        end = '/' + other
      }
      return request({
        url: url + name + end,
        method: 'put',
        params,
        data: data
      })
    },

    /** delete 方法- params */
    delete(name, params, other) {
      let end = ''
      if (other) {
        end = '/' + other
      }
      return request({
        url: url + name + end,
        method: 'delete',
        params
      })
    },

    /** delete 方法- data */
    dataDelete(name, params, other) {
      let end = ''
      if (other) {
        end = '/' + other
      }
      return request({
        url: url + name + end,
        method: 'delete',
        data: params
      })
    },

    /** delete 方法- params,data */
    bothDelete(name, params, data, other) {
      let end = ''
      if (other) {
        end = '/' + other
      }
      return request({
        url: url + name + end,
        method: 'delete',
        params,
        data: data
      })
    },

    /** delete 方法- 根据id */
    deleteById(name, id, otheMethod, otherParams) {
      let methodName = '/delete'
      let paramsName = '/id'
      if (otheMethod) {
        methodName = '/' + otheMethod
      }
      if (otherParams) {
        paramsName = '/' + otherParams
      }
      return request({
        // .../delete/{id}/id
        url: url + name + methodName + '/' + id + paramsName,
        method: 'delete'
      })
    }
    /** 通用接口------终 */
  }
  return API
}

// export const url_agv = getModeUrl() // WMS业务
export const url_agv = process.env.VUE_APP_BASE_API_AGV + 'api/' // AGV业务
console.log(url_agv)
// export const url_miswms = '/sapwms-api' // 非WMS业务
// export const url_miswms = getModeUrl()

// export const MISWMSAPI = commonAPI(url_miswms, requestWMS) // 非WMS业务
export const AGVAPI = commonAPI(url_agv, requestAGV) // AGV业务
// tips:柏塘军令状查询特殊?通过抓包工具获取的内容显示要走sapwms-api
// export const MISWMSAPIFORBT = commonAPI('http://192.168.1.133/sapwms-api', requestMIS) // WMS业务
// function getModeUrl() {
//   if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
//     return process.env.VUE_APP_BASE_API_AGV + 'api/'
//   }
// }
// function getModeUrl() {
//   if (process.env.NODE_ENV === 'development') {
//     // 外网测试环境
//     return process.env.VUE_APP_BASE_API + 'eip-mapp-sapwms-server/'
//   } else if (process.env.NODE_ENV === 'staging') {
//     // 内网测试环境
//     return process.env.VUE_APP_BASE_API + 'sapwms-api/'
//   } else {
//     // 内网正式环境
//     return process.env.VUE_APP_BASE_API + 'eip-mapp-sapwms-server/'
//   }
// }
// function getModeUrl() {
//   if (process.env.NODE_ENV === 'development') {
//     return 'http://192.168.11.133/sapwms-api/'
//   } else {
//     return 'http://192.168.11.133/eip-mapp-sapwms-server/'
//   }
// }

// getModeUrl()
