import deepClone from '@/utils/deepClone'
import { _showFailToast } from './message'
/**
 * @description 根据路由数组和权限数组匹配返回最终符合权限的路由数组
 * @param {*} routes
 * @param {*} permission
 * @returns
 */
function handlerRouteForAuth(routes, permission) {
  // TODO:如果用户没有权限，那么就直接原封不动返回先，现在因为后端权限控制还不完善，这些先这样控制先
  if (permission.length > 0) {
    let result = []
    let _result = deepClone(routes)
    result = _result.filter(item => {
      if (permission.includes(item.name)) {
        if (item.children) {
          item.children = handlerChild(item.children, permission)
        } else {
          return false
        }
        return true
      } else {
        return false
      }
    })
    // console.log('被处理之后的数据', result)
    return result
  } else {
    _showFailToast('当前用户没有菜单权限，请联系管理员')
    return []
  }
}

// 递归子节点
function handlerChild(arr, permission) {
  return arr.filter(item => {
    if (permission.includes(item.name)) {
      if (item.children) {
        item.children = handlerChild(item.children, permission)
      }
      return true
    } else {
      return false
    }
  })
}

export default handlerRouteForAuth
