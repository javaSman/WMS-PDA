<template>
  <van-list>
    <van-cell
      v-for="item in menuList"
      :key="item.name"
      class="second"
      :is-link="item.children && item.children.length > 0"
      @click="handleToThird(item)"
    >
      <van-icon name="balance-list-o" />
      <span>{{ item.meta.title }}</span>
    </van-cell>
  </van-list>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  data() {
    return {
      //
    }
  },
  computed: {
    ...mapGetters(['permission_routes', 'menus']),
    menuList() {
      let { name, level } = this.$route.query
      let menus = []
      if (level === 'second') {
        menus = this.menus.filter((item) => item.name === name)[0].children
      } else if (level === 'third') {
        let secName = name.split('.')[0]
        let parentMenu = this.menus.filter((item) => item.name === secName)[0].children
        menus = parentMenu.filter((item) => item.name === name)[0].children
      }

      return menus
    }
  },
  methods: {
    handleToThird(item) {
      if (item.children && item.children.length) {
        this.$router.push({ name: 'second', query: { name: item.name, text: item.meta.title, level: 'third' } })
      } else {
        this.$router.push({ name: item.name })
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.second {
  border-radius: 0;
  ::v-deep .van-cell__value {
    font-size: 0.5rem;
    line-height: 1rem;
  }
  ::v-deep .van-icon {
    font-size: 0.7rem;
    margin-right: 5px;
  }
}
</style>
