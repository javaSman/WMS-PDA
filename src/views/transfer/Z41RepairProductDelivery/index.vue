<template>
  <div>
    <ToggleFormVue
      :form-list="formList"
      :show-form-list="showFormList"
      :table-column="tableColumn"
      :pass-a-p-i-name="passAPIName"
      :list-a-p-i-name="listAPIName"
      mode="one"
      scanl-key="reqno"
      :is-alter-message="true"
      @clickHandler="handlePartList"
    />
    <!-- 配件清单对话框 -->
    <TableDialogVue :visible.sync="visible" :table-data="partList" :table-column="partListTableColumn" />
  </div>
</template>

<script>
// Z41维修品出库
const cachedName = 'transfer.Z41RepairProductDelivery'
import ToggleFormVue from '@/views/businessComponents/ToggleForm.vue'
import TableDialogVue from '@/views/businessComponents/TableDialog.vue'
import { formList, showFormList, tableColumn } from './config'
import mixinPartList from '@/views/mixins/PartList'
const passAPIName = 'divertBusiness/doPostZ41'
const listAPIName = 'divertBusiness/findListZ41'
export default {
  name: cachedName,
  components: {
    ToggleFormVue,
    TableDialogVue
  },
  mixins: [mixinPartList],
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      partList: [],
      visible: false,
      tableBtnParams: {},
      disabledChkAll: false,
      passAPIName,
      listAPIName
    }
  },
  methods: {
    handlePartList(key, data, index) {
      this.tableBtnParams = this.tableColumn[2].tableBtnParams
      this.getPartList(key, data, index)
    }
  }
}
</script>
