<template>
  <ToggleFormVue
    mode="handler"
    :form-list="formList"
    :show-form-list="showFormList"
    :table-column="tableColumn"
    :pass-a-p-i-name="passAPIName"
    :list-a-p-i-name="listAPIName"
    :is-alter-message="true"
  />
</template>

<script>
// Z04工具退料
const cachedName = 'shipment.Z04ToolReturn'
import ToggleFormVue from '@/views/businessComponents/ToggleForm.vue'
import { formList, showFormList, tableColumn } from './config'

const passAPIName = '/exportGoodsBusiness/doPostZ04'
const listAPIName = '/exportGoodsBusiness/findListZ04'
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
