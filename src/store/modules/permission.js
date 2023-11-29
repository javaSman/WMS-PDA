// 通过用户的权限与router.js里面asyncRouterMap的每一个页面所需要的权限做匹配
// 最后返回一个该用户能够访问路由
// 根据角色生成动态路由

import { asyncRoutes, constantRoutes } from '@/router'
import handlerRouteForAuth from '@/utils/authRoute'

/**
 * 递归过滤异步路由表，返回符合用户角色权限的路由表
 * @param routes asyncRoutes：router文件定义的所有路由
 * @param permissions：当前用户权限
 */
export function filterAsyncRoutes(routes, permissions) {
  // TODO:把这里打开即可获得权限控制，但是这里的权限控制并没有做好所以暂时放开
  // tips:在开发环境下打开所有权限
  if (process.env.NODE_ENV === 'development') {
      return routes
  } else {
    let res = []
    res = handlerRouteForAuth(routes, permissions)
    return res
  }
}

/** 存储变量:初始化的数据 */
const state = {
  /** 所有路由：异步挂载的路由+常规路由 */
  routes: [],
  /** 异步挂载的路由 */
  addRoutes: []
}

/** 改变state里面的值得方法-同步函数 */
const mutations = {
  /** 存储路由 */
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes
    state.routes = constantRoutes.concat(routes)
  }
}

/** 用于提交 mutation */
const actions = {
  /**
   * @param asyncRoutes：router文件定义的所有路由
   * @param permissions：当前用户权限
   */
  generateRoutes({ commit }, permissions) {
    return new Promise((resolve) => {
      let accessedRoutes = asyncRoutes.sort((prev, next) => prev.sort - next.sort)
      if (permissions.length > 0) {
        // 重新根据权限数组匹配对应的路由数据
        accessedRoutes = filterAsyncRoutes(asyncRoutes, permissions)
      }
      commit('SET_ROUTES', accessedRoutes)
      resolve(accessedRoutes)
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
