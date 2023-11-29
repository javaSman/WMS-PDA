<template>
  <ToggleFormWMSCustom
    :form-list="formList"
    :show-form-list="showFormList"
    :table-column="tableColumn"
    :pass-a-p-i-name="passAPIName"
    :get-detail-a-p-i-name="getDetailAPIName"
    :confirm-text="confirmText"
  />
</template>

<script>
import ToggleFormWMSCustom from './components/ToggleFormWMSCustom.vue'
import { formList, showFormList, tableColumn } from './config'
const passAPIName = 'business/webapi/BoxUnBindLocation'
const getDetailAPIName = 'business/webapi/GetBoxListByLocationNo'
const confirmText = '解绑'
// WMS区域查询
const cachedName = 'WMSManagement.LocationQuery-WMS'
export default {
  name: cachedName,
  components: {
    ToggleFormWMSCustom
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      passAPIName,
      getDetailAPIName,
      confirmText
    }
  }
}
</script>
