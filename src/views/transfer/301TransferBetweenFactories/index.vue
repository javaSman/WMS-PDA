<template>
  <ToggleFormVue
    :form-list="formList"
    :show-form-list="showFormList"
    :table-column="tableColumn"
    :pass-a-p-i-name="passAPIName"
    :list-a-p-i-name="listAPIName"
    mode="all"
    scanl-key="reqno"
  />
</template>

<script>
// 301工厂间调拨
const cachedName = 'transfer.301TransferBetweenFactories'
import ToggleFormVue from '@/views/businessComponents/ToggleForm.vue'
import { formList, showFormList, tableColumn } from './config'

const passAPIName = 'divertBusiness/doPost301'
const listAPIName = 'divertBusiness/findList301'
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
