<template>
  <div v-if="!item.hidden" class="menu-block">
    <!-- 菜单大标题 -->
    <div class="menu-title">
      <span v-if="item.meta">{{ item.meta.title }}</span>
    </div>
    <!-- 子菜单 -->
    <van-grid square :border="false" :column-num="columnNum" :gutter="gutter">
      <van-grid-item
        v-for="child in item.children.filter((r) => !r.hidden)"
        :key="child.path"
        :text="child.meta.title"
        :to="resolvePath(child.path)"
        class="border-grid"
      >
        <template #icon>
          <template v-if="child.meta.title === '维修完成' || child.meta.title === '维修验收' || child.meta.title === '报修接收'">
            <van-badge
              v-if="repairOrderCompleteList.length > 0 && child.meta.title === '维修完成'"
              :content="repairOrderCompleteList.length"
              :max="99"
              class="badgeType"
            />
            <van-badge
              v-if="repairOrderCheckList.length > 0 && child.meta.title === '维修验收'"
              :content="repairOrderCheckList.length"
              :max="99"
              class="badgeType"
            />
            <van-badge
              v-if="submitRepairOrderList.length > 0 && child.meta.title === '报修接收'"
              :content="submitRepairOrderList.length"
              :max="99"
              class="badgeType"
            />
          </template>
          <svg-icon :icon-class="child.meta.icon" style="block" class="svg-container" />
        </template>
      </van-grid-item>
    </van-grid>
  </div>
</template>

<script>
import path from 'path'
// import { generateTitle } from '@/utils/i18n'
import { isExternal } from '@/utils/validate'
import { API } from '@/api/generalAPI'

export default {
  name: 'MenuItem',
  props: {
    columnNum: { type: Number, default: 3 },
    gutter: { type: Number, default: 0 },
    item: { type: Object, required: true },
    isNest: { type: Boolean, default: false },
    basePath: { type: String, default: '' }
  },
  data() {
    // To fix https://github.com/PanJiaChen/vue-admin-template/issues/237
    // TODO: refactor with render function
    this.onlyOneChild = null
    return {
      repairOrderCompleteList: [],
      submitRepairOrderList: [],
      repairOrderCheckList: [],
      users: {}
    }
  },
  mounted() {
    if (this.item.path === '/device') {
      this.getRepairOrderComplete()
      this.getSubmitRepairOrder()
      this.getRepairOrderCheck()
    }
  },
  methods: {
    resolvePath(routePath) {
      if (isExternal(routePath)) {
        return routePath
      }
      if (isExternal(this.basePath)) {
        return this.basePath
      }
      return path.resolve(this.basePath, routePath)
    },

    getRepairOrderComplete() {
      let params = {
        pageNo: 1,
        pageSize: 100,
        query: {
          status: '维修中'
        }
      }
      API.dataPost('DeviceRepairOrder', params, 'GetList')
        .then((res) => {
          if (res.success) {
            this.repairOrderCompleteList = res.data.rows
          } else {
            this.$toast(res.message)
          }
        })
        .catch(() => {
          this.repairOrderCompleteList = []
        })
    },
    getSubmitRepairOrder() {
      let params = {
        pageNo: 1,
        pageSize: 100,
        query: {
          status: '待维修'
        }
      }
      API.dataPost('DeviceSubmitRepairOrder', params, 'GetList')
        .then((res) => {
          if (res.success) {
            this.submitRepairOrderList = res.data.rows
          } else {
            this.$toast(res.message)
          }
        })
        .catch(() => {
          this.submitRepairOrderList = []
        })
    },
    getRepairOrderCheck() {
      this.users = this.$store.getters.users
      let params = {
        pageNo: 1,
        pageSize: 100,
        query: {
          status: '待验收',
          submitRepairUser: this.users.account
        }
      }
      API.dataPost('DeviceRepairOrder', params, 'GetList')
        .then((res) => {
          if (res.success) {
            this.repairOrderCheckList = res.data.rows
          } else {
            this.$toast(res.message)
          }
        })
        .catch(() => {
          this.repairOrderCheckList = []
        })
    }

    // generateTitle
  }
}
</script>

<style scoped lang="scss">
.menu-block {
  width: 90%;
  border-radius: 10px;
  display: inline-block;
  vertical-align: middle;
  padding: 5px;
}
.menu-title {
  padding-left: 20px;
  text-align: left;
}
.menu-title span {
  width: 100%;
  height: 30px;
  line-height: 30px;
  font-size: 14px;
  text-align: left;
  position: relative;
}
.menu-title span::before {
  background: #000;
  content: '';
  width: 4px;
  height: 14px;
  position: absolute;
  top: 0px;
  left: -9px;
  background: $blue;
}
.svg-container {
  padding: 5px 0;
  font-size: 35px;
}
.border-grid ::v-deep .van-grid-item__content {
  padding: 8px;
  border-radius: 10px;
  box-shadow: 0 0 10px 2px #dde2ea;
}
.badgeType {
  position: absolute;
  top: -3px;
  right: -11px;
}
</style>
