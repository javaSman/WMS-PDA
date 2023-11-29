<template>
  <div>
    <van-field ref="inputRef" v-model="barcode" label="条码" placeholder="请输入条码" @keyup.enter="barcodeEnter" />
    <SimpleTable :columns="tableColumn" :show-msg="showTextValue" />
    <ActionBar confirm-text="查询" @confirm="comfirSearch" @clear="clearHandler" />
  </div>
</template>

<script>
// 条码查询
import SimpleTable from '@/views/businessComponents/SimpleTable.vue'
import ActionBar from '@/views/businessComponents/ActionBar.vue'
import { tableColumn } from './config'
import { MISWMSAPI } from '@/api/generalAPI'
import { _showFailToast } from '@/utils/message'
const listAPIName = '/getData/getValidBarcode'
const cachedName = 'query.barcodeQuery'
export default {
  name: cachedName,
  components: {
    SimpleTable,
    ActionBar
  },
  data() {
    return {
      barcode: '',
      showTextValue: {},
      tableColumn
    }
  },
  methods: {
    barcodeEnter() {
      this.comfirSearch()
    },
    comfirSearch() {
      // 确定查询按钮
      if (!this.barcode) {
        _showFailToast('请输入条码')
        return
      }
      MISWMSAPI.post(listAPIName, { imBarcode: this.barcode })
        .then((res) => {
          if (res && res.success) {
            // Object.assign(this.showTextValue, res.data)
            // tips:针对物料编码特殊处理一下，去0
            this.showTextValue = { ...res.data, matnr: res.data.matnr.replace(/^0+/gi, '') }
          } else {
            _showFailToast(res.data)
          }
        })
        .finally(() => {
          console.log(111)
        })
    },

    clearHandler() {
      // 清除按钮
      this.showTextValue = {}
      this.barcode = ''
      this.$refs?.inputRef?.focus()
    }
  }
}
</script>
