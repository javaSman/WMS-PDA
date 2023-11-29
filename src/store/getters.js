const getters = {
  // user.js
  token: (state) => state.user.token,
  users: (state) => state.user.users,
  account: (state) => state.user.account,
  name: (state) => state.user.name,
  authUserInfo: (state) => state.user.authUserInfo,
  avatar: (state) => state.user.avatar,
  roles: (state) => state.user.roles,
  permissions: (state) => state.user.permissions,
  menus: (state) => state.user.menus,
  loadMenus: (state) => state.user.loadMenus,
  // permission.js
  permission_routes: (state) => state.permission.routes,
  authPermission: (state) => state.permission.authPermission
}
export default getters
