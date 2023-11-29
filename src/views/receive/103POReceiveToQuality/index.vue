<template>
  <ToggleFormWMSVue
    :form-list="formList"
    :show-form-list="showFormList"
    :table-column="tableColumn"
    :pass-a-p-i-name="passAPIName"
    :list-a-p-i-name="listAPIName"
    scanl-key="objnr"
    mode="one"
    :is-check-and-to-top="true"
    :is-all-select-and-submit="true"
    :auto-submit="true"
    :is-alter-message="true"
    :is-wcf-interface="true"
    :type="'XWMS103'"
  />
</template>

<script>
// 103PO收货到质检
const cachedName = 'receive.103POReceiveToQuality'
import ToggleFormWMSVue from '@/views/businessComponents/ToggleFormWMS.vue'
import { formList, showFormList, tableColumn } from './config'

const passAPIName = '9037Wcf/WarehouseService.svc/rest/ZxwmsXmbeCommonPostGr'
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
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
      listAPIName
    }
  }
}
</script>
