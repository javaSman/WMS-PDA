<template>
  <div>
    <van-field ref="inputRef" v-model="barcode" label="条码" placeholder="请输入条码" @keyup.enter="enterBarcode" />
    <TableVue ref="table" :table-data.sync="tableData" :table-column="tableColumn" />
    <ActionBar confirm-text="查询" @clear="clearHandler" @confirm="comfirHandler" />
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
  </div>
</template>

<script>
import { WMSAPI } from '@/api/generalAPI'
import ActionBar from '@/views/businessComponents/ActionBar.vue'
import TableVue from '@/components/Table/index.vue'
const queryAPIName = 'business/webapi/NewMaterialBarcode'
// const queryAPIName = 'getData/getStateMateStock'
// const queryAPIName2 = 'business/webapi/NewMaterialBarcode'
import { tableColumn } from './config'
export default {
  components: {
    ActionBar,
    TableVue
  },
  data() {
    return {
      tableColumn,
      barcode: '',
      tableData: [],
      scanLoading: false
    }
  },
  mounted() {
    this.$refs.inputRef.focus()
  },
  methods: {
    async enterBarcode() {
      this.tableData = []
      try {
        this.scanLoading = true
        let res = await WMSAPI.get(queryAPIName, { barcode: this.barcode })
        if (res.success) {
          await this.$dialog({
            message: res.message
          })
          this.barcode = ''
          this.$refs.inputRef.focus()
        } else {
          await this.$dialog({
            message: res.message
          })
          this.barcode = ''
          this.$refs.inputRef.focus()
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },
    // 清除
    clearHandler() {
      this.barcode = ''
      this.tableData = []
      this.$refs?.inputRef?.focus()
    },
    // 查询
    comfirHandler() {
      this.enterBarcode()
    }
  }
}
</script>

<style scoped lang="scss">
.loading_wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
