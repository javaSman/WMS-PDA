<template>
  <div>
    <ToggleFormVue
      ref="toggleFormVue"
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
// Z43跨区域调拨入库
const cachedName = 'transfer.Z43CrossRegionalTransferReceipt'
import ToggleFormVue from '@/views/businessComponents/ToggleForm.vue'
import TableDialogVue from '@/views/businessComponents/TableDialog.vue'
import { formList, showFormList, tableColumn } from './config'
const passAPIName = 'divertBusiness/doPostZ43'
const listAPIName = 'divertBusiness/findListZ43'
import mixinPartList from '@/views/mixins/PartList'
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
      passAPIName,
      listAPIName,
      partList: [],
      visible: false,
      tableBtnParams: {}
    }
  },
  methods: {
    handlePartList(key, data, index) {
      this.tableBtnParams = this.tableColumn[3].tableBtnParams
      this.getPartList(key, data, index)
    }
    // handleSelectAll(list, _list) {
    //   let uuidList = list.map((item) => item.uuid)
    //   this.$refs.toggleFormVue.value?.table?.handleSelect(uuidList)
    // }
  }
}
</script>
