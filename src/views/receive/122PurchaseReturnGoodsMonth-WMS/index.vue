<template>
  <ToggleFormWMSVue
    :form-list="formList"
    :show-form-list="showFormList"
    :table-column="tableColumn"
    :pass-a-p-i-name="passAPIName"
    :list-a-p-i-name="listAPIName"
    :type="imOclas"
    :is-alter-message="true"
    mode="allAntDisable"
    :chk-disabled="true"
  />
</template>

<script>
import ToggleFormWMSVue from '@/views/businessComponents/ToggleFormWMS.vue'
import { formList, showFormList, tableColumn } from './config'
const cachedName = 'receive.122PurchaseReturnGoodsMonth-WMS'
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
const passAPIName = 'business/webapi/OutStock'
const imOclas = 'XWMS122'
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
      listAPIName,
      passAPIName,
      imOclas
    }
  }
}
</script>
