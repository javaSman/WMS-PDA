// import useStore from '@/store'
import {mapGetters} from 'vuex'
export const permission = {
  computed: {
    ...mapGetters(['roles'])
  },
  mounted(el, binding) {
    // let user = this.$store.state.account
    const { value } = binding
    const roles = this.roles
    if (value && value instanceof Array) {
      if (value.length > 0) {
        const permissionRoles = value
        // console.log('com-roles', roles)
        // console.log('com-permissionRoles', permissionRoles)
        const hasPermission = roles.some((role) => {
          // 配置'any'即为所有人都可操作的权限
          return permissionRoles.includes(role) || permissionRoles.includes('any')
        })
        // console.log('com-hasPermission', hasPermission)
        if (!hasPermission) {
          el.parentNode && el.parentNode.removeChild(el)
        }
      }
    } else {
      throw new Error(`使用方式： v-permission="['admin','editor']"`)
    }
  }
}
