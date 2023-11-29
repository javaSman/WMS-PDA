<template>
  <div>
    <ToggleFormWMSVue
      ref="toggleFormWMSVue"
      :form-list="formList"
      :show-form-list="showFormList"
      :table-column="tableColumn"
      :pass-a-p-i-name="passAPIName"
      :list-a-p-i-name="listAPIName"
      :type="imOclas"
      mode="one"
      scanl-key="objnr"
      :auto-submit="true"
      :chk-disabled="true"
      :is-disable-checked="true"
      :is-check-and-to-top="true"
      :is-all-select-and-submit="true"
      focus-key="imBarcode"
      :is-alter-message="true"
      :submit="customerSubmit"
      @clickHandler="handlePartList"
    />
    <!-- 配件清单对话框 -->
    <TableDialogVue :visible.sync="visible" :table-data.sync="partList" :table-column.sync="partListTableColumn" />
  </div>
</template>
<script>
import ToggleFormWMSVue from '@/views/businessComponents/ToggleFormWMS.vue'
import TableDialogVue from '@/views/businessComponents/TableDialog.vue'
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
const passAPIName = 'business/webapi/PostIn'
const imOclas = 'XWMS103'
import { formList, showFormList, tableColumn } from './config'
import mixinPartList from '@/views/mixins/PartList'
export default {
  name: 'Receive103POReceiveToQualityWMS',
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
      visible: false,
      tableBtnParams: {},
      showFormList,
      listAPIName,
      passAPIName,
      imOclas
    }
  },
  methods: {
    handlePartList(key, data, index) {
      this.tableBtnParams = this.tableColumn[4].tableBtnParams
      this.getPartList('idnrk', data, index)
    },
    // 自定义提交方法，增强提交参数
    async customerSubmit(data) {
      // 根据sap的kzkrr来增强wms的参数
      data.wmsPostInList = data.wmsPostInList.map((item, index) => ({
        ...item,
        kzkrr: data.zxstXmbeStruList[index].kzkrr
      }))
      return false
    }
  }
}
</script>
