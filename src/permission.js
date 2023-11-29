// 现在路由层面权限的控制代码都在 @/permission.js
// Permission：权限钩子（类似java面向切面的意思）
import router, { resetRouter } from './router'
import store from './store'
import { getItem, setItem } from '@/utils/auth'
import defaultSettings from '@/settings'
import { Toast } from 'vant'
import { _showFailToast } from './utils/message'

const TokenKey = defaultSettings.TokenKey

const whiteList = ['/login', '/auth-redirect', '/download'] // 没有重定向白名单

// 加载Toast代替浏览器顶部的进度条
let spinRoute = {
  show() {
    // 加载中显示loading组件
    Toast.loading({
      // position: 'middle',
      forbidClick: true,
      message: '加载中...',
      duration: 0
    })
  },
  done() {
    Toast.clear() // 加载完成关闭loading组件
  }
}

/**
 * 全局路由守卫
 * to：即将进入的路由对象
 * form：正要离开的路由对象
 * next：路由的控制参数
 */
router.beforeEach(async (to, from, next) => {
  spinRoute.show() // 加载时开启loading
  // 确定用户是否已经登录-判断是否有token
  const hasToken = getItem(TokenKey)
  if (hasToken) {
    // 有token
    if (to.path === '/login') {
      // to登录页时，如果已登录，则重定向到主页
      next({
        path: '/'
      })
      spinRoute.done()
    } else {
      // 1.判断用户是否获得了权限角色
      // 2.判断当前用户是否已拉取完user_info信息
      // 3.如果是初次登录，在使用过后改变是否首次加载状态
      // 4.剩下的放行
      const roles = store.getters.roles
      if (roles.length === 0) {
        // 获取用户信息
        store.dispatch('user/getUserInfo').then(res => {
          // 拉取菜单
          loadMenus(next, to)
        }).catch(() => {
        // 报错就退出登录
          store.dispatch('user/logout').then(() => {
            // 用户登录界面提示
            setItem('point', 401)
            location.reload() // 为了重新实例化vue-router对象 避免bug
          })
        })
      } else if (store.getters.loadMenus) {
        // 设置状态，防止死循环
        store.dispatch('user/updateLoadMenus')
        // 拉取菜单
        loadMenus(next, to)
      } else {
        // 剩下的放行
        next()
      }
    }
  } else {
    _showFailToast('授权信息过期,请重新登录')
    setTimeout(() => {
       // 没有token
    if (whiteList.indexOf(to.path) !== -1) {
      // 在免登录白名单，直接进入
      next() // 记得当所有程序执行完毕后要进行next()，不然是无法继续进行的;
    } else {
      // 否则（其他没有访问权限的页面）全部重定向到登录页
      let { useHistoryPath } = defaultSettings // 重新登录是否跳回退出登录前的页面
      if (useHistoryPath) {
        next(`/login?redirect=${to.path}`)
      } else {
        next(`/login`)
      }
      // 在hash模式下 改变手动改变hash 重定向回来 不会触发afterEach 暂时hack方案 ps：history模式下无问题，可删除该行！
      spinRoute.done()
    }
    }, 1000)
  }
})

export const loadMenus = (next, to) => {
  const userInfo = getItem('Users')
  store.dispatch('permission/generateRoutes', userInfo.permissions).then(accessRoutes => {
    resetRouter()
    for (let i = 0; i < accessRoutes.length; i += 1) {
      let route_arr = accessRoutes[i]
      router.addRoute(route_arr)
    }
    next({ ...to, replace: true })
  }).catch(error => {
    console.log(error)
    store.dispatch('user/removeToken')
    Toast(error || 'Has Error')
    next(`/login?redirect=${to.path}`)
    spinRoute.done()
  })
}
router.afterEach(() => {
  spinRoute.done()
})
