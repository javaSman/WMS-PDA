<template>
  <div>
    <ToggleFormVue
      ref="toggleFormRef"
      :form-list="formList"
      :show-form-list="showFormList"
      :table-column="tableColumn"
      :pass-a-p-i-name="passAPIName"
      :list-a-p-i-name="listAPIName"
      mode="addTo"
      scanl-key="barcode"
      :submit="customerSubmit"
      @clickHandler="handlePartList"
    />
    <!-- 配件清单对话框 -->
    <TableDialogVue :visible.sync="visible" :table-data.sync="partList" :table-column.sync="partListTableColumn" />
  </div>
</template>

<script>
// 511免费收货入库
import TableDialogVue from '@/views/businessComponents/TableDialog.vue'
const cachedName = 'receive.511FreeReceiveToWarehouse'
import ToggleFormVue from '@/views/businessComponents/ToggleForm.vue'
import { formList, showFormList, tableColumn } from './config'
import mixinPartList from '@/views/mixins/PartList'
const passAPIName = 'receivingAndWarehousing/doPost511'
const listAPIName = 'receivingAndWarehousing/findList511'
import { MISWMSAPI } from '@/api/generalAPI'
import dayjs from 'dayjs'
import { _showFailToast } from '@/utils/message'
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
    },
    // 自定义过账参数
    async customerSubmit(data) {
      this.$refs.toggleFormRef.loading = true
      data.data = data.data.map((item) => ({
        ...item,
        cpudt: dayjs(item.cpudt).format('YYYY-MM-DD HH:mm:ss')
      }))
      data.title = {
        ...data.title,
        cpudt: dayjs(data.title.cpudt).format('YYYY-MM-DD HH:mm:ss')
      }
      let res = await MISWMSAPI.post(this.passAPIName, data)
      console.log(res.success)
      if (res.success) {
        this.$dialog.alert({ message: res.msg })
        this.$refs.toggleFormRef.clearHandler()
      } else {
        _showFailToast(res.msg)
      }
    }
  }
}
</script>
