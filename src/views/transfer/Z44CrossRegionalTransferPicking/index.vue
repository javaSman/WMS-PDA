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
      @clickHandler="handlePartList"
    />
    <!-- 配件清单对话框 -->
    <TableDialogVue :visible.sync="visible" :table-data="partList" :table-column="partListTableColumn" />
  </div>
</template>

<script>
import ToggleFormVue from '@/views/businessComponents/ToggleForm.vue'
import TableDialogVue from '@/views/businessComponents/TableDialog.vue'
import { formList, showFormList, tableColumn } from './config'
import mixinPartList from '@/views/mixins/PartList'
// Z44跨区域调拨拣货
const cachedName = 'transfer.Z44CrossRegionalTransferPicking'
const passAPIName = 'divertBusiness/doPostZ44'
const listAPIName = 'divertBusiness/findListZ44'
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
      listAPIName,
      passAPIName,
      partList: [],
      visible: false,
      tableBtnParams: {}
    }
  },
  methods: {
    // 按钮-配件清单
    handlePartList(key, data, index) {
      this.tableBtnParams = this.tableColumn[3].tableBtnParams
      this.getPartList(key, data, index, this, this.tableBtnParams)
    }
  }
}
</script>
