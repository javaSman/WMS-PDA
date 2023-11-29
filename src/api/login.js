import { requestWMS as request } from '@/utils/requestMes'
import { getToken } from '@/utils/auth'
let url = process.env.VUE_APP_BASE_API
let urlWMS = process.env.VUE_APP_BASE_API_WMS
// let url = 'eip-mapp-umc-server/'

// 登陆过后根据用户工号获取企业云系统的keyId
export function getKeyIdQYY(account) {
  return request({
    url: getModeUrl() + 'eip-mapp-cmc-server/tokenService/getToken',
    method: 'post',
    data: {
      ...getModeKey(),
      signature: account
    }
  })
}

function getModeUrl() {
  if (process.env.NODE_ENV === 'development') {
    return url
  } else if (process.env.NODE_ENV === 'staging') {
    return 'http://192.168.11.133/'
  } else {
    return 'http://192.168.11.133/'
  }
}
function getModeKey() {
  if (process.env.NODE_ENV === 'development') {
    return {
      accessKey: 'd42d70e55904a01ac0a147c44e9920dc',
      secret: 'a9f168dbe28f879ef68d8f9ccc35e35e'
    }
  } else {
    return {
      accessKey: '3750cecbb32311ed93c0005056b83bdb',
      secret: '3e4863d9b32311ed93c0005056b83bdb'
    }
  }
}
// 第一个获取企业云的keyid之后再用这个获取一次keyid才是正确的
export function getKeyIdQYY2(tenantId, userId) {
  return request({
    url: url + 'eip-mapp-umc-server/user/selectTenant',
    method: 'post',
    data: {
      tenantId,
      userId
    }
  })
}
// WMS 登录接口
export function WMSLogin(data) {
  return request({
    url: urlWMS + 'connect/token',
    method: 'post',
    data
  })
}

// // 获取菜单列表树，TODO: 动态路由和权限的时候要改
// export function getInfo() {
//   return request({
//     url: url + 'workbench/sysFunAppDetailTreeByAppID',
//     method: 'post',
//     data: { appID: '7010' }
//   })
// }
// TODO: 等待提供接口
export function logout() {
  return request({
    url: 'user/logout',
    method: 'post',
    params: { keyId: getToken() }
  })
}

// export function login(userName, password) {
//   return request({
//     url: url + 'eip-mapp-umc-server/user/psnCodeLogin',
//     method: 'post',
//     data: {
//       userName,
//       password,
//       tenantId: 2288
//     }
//   })
// }
export function getuserInfo(account) {
  return request({
    url: urlWMS + 'api/business/webapi/GetUsersInfo',
    method: 'get',
    params: {
      userName: account
    }
  })
}
