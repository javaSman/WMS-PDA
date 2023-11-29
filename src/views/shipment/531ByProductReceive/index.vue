<template>
  <ToggleFormVue
    :form-list="formList"
    :show-form-list="showFormList"
    :table-column="tableColumn"
    :pass-a-p-i-name="passAPIName"
    :list-a-p-i-name="listAPIName"
    auto-submit
    mode="one"
    scanl-key="barcode"
  />
</template>

<script>
// 531副产品收货
const cachedName = 'shipment.531ByProductReceive'
import ToggleFormVue from '@/views/businessComponents/ToggleForm.vue'
import { formList, showFormList, tableColumn } from './config'

const passAPIName = '/exportGoodsBusiness/doPost531'
const listAPIName = '/exportGoodsBusiness/findList531'
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
