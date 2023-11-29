<template>
  <ToggleFormWMSCustom :form-list="formList" :table-column="tableColumn" :get-detail-a-p-i-name="getDetailAPIName" :confirm-text="confirmText" />
</template>

<script>
import ToggleFormWMSCustom from './components/ToggleFormWMSCustom.vue'
import { formList, tableColumn } from './config'
const getDetailAPIName = 'business/webapi/GetMaterialBarcodeList'
const confirmText = '查询'
// 项目箱号查询
const cachedName = 'WMSManagement.ProjectBoxQuery-WMS'
export default {
  name: cachedName,
  components: {
    ToggleFormWMSCustom
  },
  data() {
    return {
      formList,
      tableColumn,
      getDetailAPIName,
      confirmText
    }
  }
}
</script>
