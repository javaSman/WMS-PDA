<template>
  <div>
    <ToggleFormVue
      ref="toggleFormVue"
      :form-list="formList"
      :show-form-list="showFormList"
      :table-column="tableColumn"
      :pass-a-p-i-name="passAPIName"
      :list-a-p-i-name="listAPIName"
      :enter-after-event="handleReDataAgain"
      :submit="handleSubmit"
      mode="one"
      scanl-key="reqno"
      @clickHandler="handlePartList"
    />
    <!-- 配件清单对话框 -->
    <TableDialogVue :visible.sync="visible" :table-data="partList" :table-column="partListTableColumn" />
  </div>
</template>

<script>
// Z42维修品收货
const cachedName = 'transfer.Z42RepairGoodsReceipt'
import ToggleFormVue from '@/views/businessComponents/ToggleForm.vue'
import TableDialogVue from '@/views/businessComponents/TableDialog.vue'
import { formList, showFormList, tableColumn } from './config'
import { MISWMSAPI } from '@/api/generalAPI'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import mixinPartList from '@/views/mixins/PartList'
const passAPIName = 'divertBusiness/doPostZ42'
const listAPIName = 'divertBusiness/findListZ42'
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
      passAPIName,
      listAPIName
    }
  },
  methods: {
    handlePartList(key, data, index) {
      this.tableBtnParams = this.tableColumn[2].tableBtnParams
      this.getPartList(key, data, index)
    },
    // 输入框回车后重新组合数据
    handleReDataAgain(list, _list) {
      list.forEach((item, index) => {
        item._werks = `${_list[index].werks}-${_list[index].lgort}`
      })
    },
    // 提交前数据组合
    async handleSubmit(data) {
      let _this = this
      let _list = JSON.parse(JSON.stringify(data.data))
      let flag = true
      // 重新处理数据
      _list.forEach((item) => {
        let arr = item._werks.split('-')
        item.werks = arr[0]
        item.lgort = arr[1]
        delete item._werks
      })
      if (!flag) return

      return new Promise((resolve, rejects) => {
        MISWMSAPI.post(passAPIName, data)
          .then((res) => {
            if (res && res.success) {
              _showSuccessToast(res.msg)
              // 清空表单和列表
              _this.$refs.toggleFormVue.value?.clearHandler()
              resolve(true)
            } else {
              _showFailToast(res.data)
              resolve(true)
            }
          })
          .catch(() => {
            resolve(true)
          })
      })
    }
  }
}
</script>
