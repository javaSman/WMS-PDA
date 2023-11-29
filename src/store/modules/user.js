import { getItem, setItem, removeItem, setKeyId, getKeyId } from '@/utils/auth'
import { resetRouter, asyncRoutes } from '@/router'
import { WMSLogin, getKeyIdQYY } from '@/api/login'
import { getAuthInfo } from '@/api/common'
import defaultSettings from '@/settings'
import handlerRouteForAuth from '@/utils/authRoute'
import { _showFailToast } from '@/utils/message'
// import { _showFailToast } from '@/utils/message'
const TokenKey = defaultSettings.TokenKey
const TokenWMSKey = defaultSettings.TokenWMSKey

/** 存储变量:初始化的数据 */
const state = {
  token: getItem(TokenKey) ? getItem(TokenKey) : null,
  keyId: getKeyId(TokenWMSKey),
  /** 当前用户所有信息 */
  users: getItem('Users'),
  /** 工号/账号 */
  account: '',
  /** 姓名 */
  name: '',
  /** 头像 */
  avatar: '',
  /** 角色数组 */
  roles: [],
  /** 权限数组 */
  permissions: [],
  /** 鉴权相关用户信息 */
  authUserInfo: {},
  /** 菜单 */
  menus: [],
  /** 是否首次加载菜单 */
  loadMenus: true
}

/** 改变state里面的值得方法-同步函数 */
const mutations = {
  // 存储token方法-设置token等于外部传递进来的值
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  // 存储企业云keyID
  SET_KEYID: (state, keyId) => {
    state.keyId = keyId
  },
  /** 存储用户信息对象 */
  SET_USERS: (state, users) => {
    state.users = users
  },
  /** 存储工号/账号 */
  SET_ACCOUNT: (state, account) => {
    state.account = account
  },
  /** 存储姓名 */
  SET_NAME: (state, name) => {
    state.name = name
  },
  /** 存储头像 */
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar
  },
  /** 存储角色 */
  SET_ROLES: (state, roles) => {
    state.roles = roles
  },
  /** 存储权限 */
  SET_PERMISSIONS: (state, permissions) => {
    state.permissions = permissions
  },
  /** 存储菜单 */
  SET_MENUS: (state, menus) => {
    state.menus = menus
  },
  /** 存储是否首次加载菜单状态 */
  SET_LOAD_MENUS: (state, status) => {
    state.loadMenus = status
  },
  /** 存储TOKEN信息 */
  SET_TOKEN_INFO: (state, data) => {
    setItem(TokenKey, data)
    state.token = data
  },
  /** 清空TOKEN信息 */
  RESET_TOKEN_INFO: (state) => {
    removeItem(TokenKey)
    removeItem(TokenWMSKey)
    state.token = ''
  },

  /** 存储用户信息 */
  SET_USER_INFO: (state, data) => {
    setItem('Users', data)
    state.users = data
    state.account = data.userName
    state.name = data.name
    state.roles = data.roles
    state.permissions = data.permissions
  },
  /** 清空用户信息 */
  RESET_USER_INFO: (state) => {
    removeItem('Users')
    removeItem('ifRepairUser')
    removeItem('userInfo')
    state.users = {}
    state.account = ''
    state.name = ''
    state.roles = []
    state.permissions = []
  },
  /** 鉴权相关用户信息 */
  SET_AUTH_USER_INFO: (state, data) => {
    state.authUserInfo = data
  }
}

/** 用于提交 mutation */
const actions = {
  /** 用户登录-获取token信息存储 */
  userLogin({ commit, dispatch }, data) {
    return new Promise((resolve, reject) => {
      WMSLogin(data)
        .then(async (res) => {
          if (!res.access_token) {
            // 调用reject方法后，Promise状态变为rejected，即操作失败状态
            reject('登录失败')
            return
          }
          // const userName = data.get('userName')
          // let res2 = await getuserInfo(userName)
          // TODO: 提交用户信息，写死
          let userinfo = {
            userName: res.users_name,
            name: res.name,
            roles: ['admin'],
            permissions: ['admin']
          }
          // 登录成功后将token存储在localStore之中
          setItem(TokenKey, res.access_token)
          commit('SET_TOKEN_INFO', res.access_token)
          // 第一次加载菜单时用到
          commit('SET_LOAD_MENUS', true)
          // 这里拉取权限数据存入Vuex和本地
          let res3 = await getAuthInfo()
          if (res3.success) {
            let result = res3.result ? res3.result.filter((item) => /^pda_*/g.test(item.name)).map((item) => item.name.replace(/pda_/g, '')) : []
            userinfo.permissions = result
            // 根据这个东西对比处理一下菜单数据，有代表有权限
            // tips:这个是测试权限算法的测试数据
            // userinfo.permissions = [
            //   'receive',
            //   'receive.101POReceiveToWarehouse',
            //   'receive.103POReceiveToQuality',
            //   'receive.105GoodToWarehouse',
            //   'shipment',
            //   'shipment.201DeptPicking',
            //   'shipment.202DeptReturn',
            //   'shipment.202DeptReturnWMS'
            // ]
            commit('SET_USER_INFO', userinfo)
            // TODO 这个功能先在测试上
            // if (process.env.NODE_ENV === 'development' && window.plus) {
            //   await PDABindUser({
            //    r_UserID: res.users_name,
            //    r_UserName: res.name,
            //    maC_Address: getCurrentDeviceWlanMacAddress()
            //   })
            // }
            // setItem('userInfo', userinfo)
            // tips:在开发环境下默认打开所有的权限
            if (process.env.NODE_ENV === 'development') {
              commit('SET_MENUS', asyncRoutes)
            } else {
              let result2 = handlerRouteForAuth(asyncRoutes, userinfo.permissions)
              // tips:填入权限即可
              commit('SET_MENUS', result2)
            }
            // resolve(true)
            // 获取keyid，这个是使用非WMS业务的关键，必须有keyid才能登入系统
            let qyyRes = await getKeyIdQYY(res.users_name)
            if (qyyRes.success) {
              commit('SET_KEYID', qyyRes.data.keyId)
              setKeyId(TokenWMSKey, qyyRes.data.keyId)
              resolve(true)
            } else {
              _showFailToast(qyyRes.msg)
              reject(false)
            }
          }
        })
        .catch((err) => {
          reject(err)
        })
    })
  },
  // // 根据当前登录用户工号，获取企业云接口的keyId
  // GetKeyIdQYY({ commit }, account) {
  //   getKeyIdQYY(account)
  //     .then((res) => {
  //       // console.log(res)
  //       commit('SET_KEYID', res.data.keyId)
  //       setKeyId(TokenWMSKey, res.data.keyId)
  //     })
  //     .catch((e) => {
  //       console.log(e)
  //     })
  // },
  /** 获取用户信息-存储用户信息-获取权限-存储权限数组 */
  getUserInfo({ commit }) {
    return new Promise((resolve, reject) => {
      let userInfo = getItem('Users')
      let token = getItem(TokenKey)
      let keyId = getItem(TokenWMSKey)
      // 三者缺一就要退出登录
      if (userInfo === null || token === null || keyId === null) {
        commit('RESET_USER_INFO')
        commit('SET_MENUS', [])
        reject({
          account: '',
          name: '',
          roles: [],
          permissions: []
        })
      } else {
        commit('SET_USER_INFO', userInfo)
        commit('SET_TOKEN_INFO', token)
        commit('SET_KEYID', keyId)
        // tips:在开发环境下默认打开所有的权限
        if (process.env.NODE_ENV === 'development') {
          commit('SET_MENUS', asyncRoutes)
        } else {
          commit('SET_MENUS', handlerRouteForAuth(asyncRoutes, userInfo.permissions))
        }
        resolve(userInfo)
      }
      // userAPI
      //   .get('getLoginUser')
      //   .then((res) => {
      //     let permissions = res.data.permissions
      //     if (!permissions || permissions.length <= 0) {
      //       reject('该用户没有任何权限！')
      //     } else {
      //       commit('SET_USER_INFO', res.data)
      //       resolve(res.data)
      //     }
      //   })
      //   .catch((err) => {
      //     reject(err)
      //   })
    })
  },

  /** 退出登录 */
  logout({ commit }) {
    return new Promise((resolve, reject) => {
      commit('RESET_USER_INFO')
      commit('RESET_TOKEN_INFO')
      removeItem('userInfo')
      resetRouter()
      resolve()
    })
  },

  /** 清空token */
  removeToken({ commit }) {
    return new Promise((resolve) => {
      commit('RESET_TOKEN_INFO')
      commit('SET_PERMISSIONS', [])
      resolve()
    })
  },
  /** 更新是否首次加载菜单状态 */
  updateLoadMenus({ commit }) {
    return new Promise(() => {
      commit('SET_LOAD_MENUS', false)
    })
  }
}

/** 获取设备mac地址 */
//  function getCurrentDeviceWlanMacAddress() {
//       let deviceWlanMacAddress = ''
//       let networkInterface = window.plus.android.importClass('java.net.NetworkInterface')
//       let wlaNetworkInterface0 = networkInterface.getByName('wlan0')
//       let hardwareAddressByte = wlaNetworkInterface0.getHardwareAddress()
//       for (let i = 0; i < hardwareAddressByte.length; i++) {
//         let temp = ''
//         let number = hardwareAddressByte[i]
//         if (number < 0) {
//           temp = (255 + number + 1).toString(16)
//         } else {
//           temp = number.toString(16)
//         }
//         if (temp.length === 1) {
//           temp = '0' + temp
//         }

//         if (i < hardwareAddressByte.length - 1) {
//           temp += ':'
//         }

//         deviceWlanMacAddress += temp
//       }
//       _showFailToast(deviceWlanMacAddress)
//       return deviceWlanMacAddress
//     }

// 输出模块
export default {
  namespaced: true,
  state,
  mutations,
  actions
}
