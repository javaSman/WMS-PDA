<template>
  <ToggleFormWMSVue
    :form-list="formList"
    :show-form-list="showFormList"
    :table-column="tableColumn"
    :pass-a-p-i-name="passAPIName"
    :list-a-p-i-name="listAPIName"
    mode="all"
    :is-alter-message="true"
    computed-key="scrqty"
    auto-submit
    :type="'XWMS124'"
    :is-wcf-interface="true"
  />
</template>

<script lang="ts">
// 124不良品退货
const cachedName = 'receive.124RejectsReturnGoods'
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
