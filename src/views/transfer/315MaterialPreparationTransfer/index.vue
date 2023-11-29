<template>
  <ToggleFormVue
    :form-list="formList"
    :show-form-list="showFormList"
    :table-column="tableColumn"
    :pass-a-p-i-name="passAPIName"
    :list-a-p-i-name="listAPIName"
    mode="one"
    scanl-key="objnr"
    :is-check-and-to-top="true"
  />
</template>

<script>
// 315备料转移
const cachedName = 'transfer.315MaterialPreparationTransfer'
import ToggleFormVue from '@/views/businessComponents/ToggleForm.vue'
import { formList, showFormList, tableColumn } from './config'

const passAPIName = 'divertBusiness/doPost315'
const listAPIName = 'divertBusiness/findList315'
export default {
  name: cachedName,
  components: {
    ToggleFormVue
  },
  data() {
    return {
      passAPIName,
      listAPIName,
      formList,
      showFormList,
      tableColumn
    }
  }
}
</script>
