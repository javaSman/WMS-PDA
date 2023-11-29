<template>
  <ToggleFormTransferAGV
    :form-list="formList"
    :show-form-list="showFormList"
    :table-column="tableColumn"
    :pass-a-p-i-name="passAPIName"
    :list-a-p-i-name="listAPIName"
    :code-type="codeType"
    :confirm-tips="confirmTips"
    :general-catalogue="false"
    confirm-text="确定"
    mode="addTo"
    scanl-key="pickingNo"
  />
</template>

<script>
// 后勤绑定配送-WMS
import ToggleFormTransferAGV from '../businessComponents/ToggleFormTransferAGV.vue'
import { formList, showFormList, tableColumn } from './config'
const cachedName = 'logisticsAGVDistribution.logisticsBindingDistribution'
export default {
  name: cachedName,
  components: {
    ToggleFormTransferAGV
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      passAPIName: 'agv/webapi/AGVBinding',
      listAPIName: 'agv/webapi/getPickingExits',
      codeType: 'pickingNo',
      confirmTips: '是否确认配送？'
    }
  }
}
</script>
