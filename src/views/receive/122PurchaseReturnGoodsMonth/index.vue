<template>
  <ToggleFormVue
    :form-list="formList"
    :show-form-list="showFormList"
    :table-column="tableColumn"
    :pass-a-p-i-name="passAPIName"
    :list-a-p-i-name="listAPIName"
    :is-alter-message="true"
    mode="all"
    chk-disabled
  />
</template>

<script>
// 122当月采购退货
const cachedName = 'receive.122PurchaseReturnGoodsMonth'
import ToggleFormVue from '@/views/businessComponents/ToggleForm.vue'
import { formList, showFormList, tableColumn } from './config'

const passAPIName = 'receivingAndWarehousing/doPost122'
const listAPIName = 'receivingAndWarehousing/findList122'
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
