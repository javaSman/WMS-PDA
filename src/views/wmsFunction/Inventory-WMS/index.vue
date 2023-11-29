<template>
  <div>
    <Table :column="tableColumn" :table-data="list" @clickRow="clickRow" />
    <ActionBarVue ref="actionBarVue" :loading="loading" confirm-text="刷新" @clear="handleClear" @confirm="handleClear" />
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
  </div>
</template>

<script>
import Table from '@/views/wmsFunction/components/Table.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { tableColumn } from './config'
const listApiName = 'business/inventoryheader/all'
// 盘点单-WMS
const cachedName = 'WMSFunction.Inventory-WMS'
import { WMSAPI } from '@/api/generalAPI'
export default {
  name: cachedName,
  components: {
    Table,
    ActionBarVue
  },
  data() {
    return {
      tableColumn,
      loading: false,
      scanLoading: false,
      list: []
    }
  },
  mounted() {
    this.getList()
  },
  methods: {
    clickRow(row) {
      this.$router.push({ name: 'WMSFunction.InventoryDetails-WMS', query: { inventoryID: row.inventoryID } })
    },
    async getList() {
      let res = await WMSAPI.get(listApiName)
      if (res.items) {
        this.list = res.items
      }
    },
    // 清空
    handleClear() {}
  }
}
</script>
