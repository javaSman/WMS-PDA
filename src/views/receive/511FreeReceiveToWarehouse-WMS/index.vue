<template>
  <ToggleFormWMSVue
    :form-list="formList"
    :show-form-list="showFormList"
    :table-column="tableColumn"
    :pass-a-p-i-name="passAPIName"
    :list-a-p-i-name="listAPIName"
    :type="imOclas"
    mode="addTo"
    scanl-key="barcode"
  />
</template>
<script>
// 511免费收货入库
const cachedName = 'receive.511FreeReceiveToWarehouse'
import ToggleFormWMSVue from '@/views/businessComponents/ToggleFormWMS.vue'
import { formList, showFormList, tableColumn } from './config'
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
const passAPIName = 'business/webapi/PostIn'
const imOclas = 'XWMS511'
export default {
  name: cachedName,
  components: {
    ToggleFormWMSVue
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      passAPIName,
      listAPIName,
      imOclas
    }
  }
}
</script>
