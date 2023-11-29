<template>
  <div>
    <ToggleFormWMSVue
      :form-list="formList"
      :show-form-list="showFormList"
      :table-column="tableColumn"
      :pass-a-p-i-name="passAPIName"
      :list-a-p-i-name="listAPIName"
      mode="one"
      :auto-submit="true"
      scanl-key="objnr"
      :is-check-and-to-top="true"
      :is-alter-message="true"
      :type="'XWMS101'"
      :is-wcf-interface="true"
      @clickHandler="handlePartList"
    />
    <!-- 配件清单对话框 -->
    <TableDialogVue :visible.sync="visible" :table-data="partList" :table-column="partListTableColumn" />
  </div>
</template>

<script>
// 101PO收货入库
const cachedName = 'receive.101POReceiveToWarehouse'
import ToggleFormWMSVue from '@/views/businessComponents/ToggleFormWMS.vue'
import TableDialogVue from '@/views/businessComponents/TableDialog.vue'
import { formList, showFormList, tableColumn } from './config'
import mixinPartList from '@/views/mixins/PartList'
const passAPIName = '9037Wcf/WarehouseService.svc/rest/ZxwmsXmbeCommonPostGr'
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'

export default {
  name: cachedName,
  components: {
    ToggleFormWMSVue,
    TableDialogVue
  },
  mixins: [mixinPartList],
  data() {
    return {
      formList,
      tableColumn,
      partList: [],
      showFormList,
      visible: false,
      tableBtnParams: {},
      passAPIName,
      listAPIName
    }
  },
  methods: {
    handlePartList(key, data, index) {
      this.tableBtnParams = this.tableColumn[3].tableBtnParams
      this.getPartList(key, data, index)
    }
  }
}
</script>
