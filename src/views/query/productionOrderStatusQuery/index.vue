<template>
  <QueryToggleFormVue
    :form-list.sync="formList"
    :show-form-list.sync="showFormList"
    :table-column.sync="tableColumn"
    :form-data.sync="form"
    :table-data.sync="list"
    :scan-loading="loading"
    @confirm="handleConfirm"
  />
</template>

<script>
// 生产订单状态查询
import QueryToggleFormVue from '@/views/businessComponents/QueryToggleForm.vue'
import { formList, showFormList, tableColumn } from './config'
import { MISWMSAPI } from '@/api/generalAPI'
import { _showFailToast } from '@/utils/message'
import { v4 as uuidv4 } from 'uuid'
const listAPIName = 'getData/getProdocInfo'
const cachedName = 'query.productionOrderStatusQuery'
export default {
  name: cachedName,
  components: {
    QueryToggleFormVue
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      loading: false,
      form: {},
      list: []
    }
  },
  mounted() {
    // 条码绑定回车
    this.formList[0].enter = this.barcodeEnter
  },
  methods: {
    // 条码回车
    async barcodeEnter(val) {
      if (!val) {
        _showFailToast('请输入条码')
        return
      }
      try {
        this.loading = true
        let res = await MISWMSAPI.post(listAPIName, { orderNumber: val })
        // console.log(res)
        if (res && res.success) {
          let _data = res.data
          this.form = Object.assign({}, this.form, _data.title)
          let arr = []
          // 增加uuid为唯一识别符
          _data.data.forEach((item, index) => {
            item.uuid = uuidv4()
            item.index = index + 1
            arr.push(item)
          })
          this.list = arr
        } else {
          _showFailToast(res.data)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.loading = false
        this.form[this.formList[0].prop] = ''
      }
    },

    // 查询
    handleConfirm() {
      if (!this.form.imBarcode) {
        _showFailToast('请输入条码或扫码查询！')
        return
      }
      this.barcodeEnter(this.form.imBarcode)
    }
  }
}
</script>
