<template>
  <ToggleFormVue
    :form-list="formList"
    :show-form-list="showFormList"
    :table-column="tableColumn"
    :pass-a-p-i-name="passAPIName"
    :list-a-p-i-name="listAPIName"
    mode="all"
    :chk-disabled="true"
    :is-alter-message="true"
  />
</template>

<script>
// 161跨月采购退货
const cachedName = 'receive.161PurchaseReturnGoodsExtendMonth'
import ToggleFormVue from '@/views/businessComponents/ToggleForm.vue'
import { formList, showFormList, tableColumn } from './config'

const passAPIName = 'receivingAndWarehousing/doPost161'
const listAPIName = 'receivingAndWarehousing/findList161'
export default {
  name: cachedName,
  components: {
    ToggleFormVue
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      passAPIName,
      listAPIName
    }
  }
}
</script>
