<template>
  <div>
    <ToggleFormVue
      ref="ToggleFormVueRef"
      :submit="customSubmit"
      :form-list="formList"
      :show-form-list="showFormList"
      :table-column="tableColumn"
      :pass-a-p-i-name="passAPIName"
      :list-a-p-i-name="listAPIName"
      mode="all"
      scanl-key="matnr"
      :is-alter-message="true"
      :is-show-author="true"
      @clickHandler="handlePartList"
    />
    <UserAuth :visible.sync="userAuthVisible" :extra.sync="extraParams" @comfir="authComfir" />
    <TableDialogVue :visible.sync="visible" :table-data="partList" :table-column="partListTableColumn" />
  </div>
</template>

<script>
import ToggleFormVue from '@/views/businessComponents/ToggleForm.vue'
import TableDialogVue from '@/views/businessComponents/TableDialog.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
import { formList, showFormList, tableColumn } from './config'
import { MISWMSAPI } from '@/api/generalAPI'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { getEditableKey } from '@/utils/validateOperateForQty'
import mixinPartList from '@/views/mixins/PartList'
const passAPIName = '/exportGoodsBusiness/doPost201'
const listAPIName = '/exportGoodsBusiness/findList201'

// 201部门领料
const cachedName = 'shipment.201DeptPicking'
export default {
  name: cachedName,
  components: {
    ToggleFormVue,
    TableDialogVue,
    UserAuth
  },
  mixins: [mixinPartList],
  data() {
    return {
      formList,
      showFormList,
      listAPIName,
      passAPIName,
      partList: [],
      tableBtnParams: {},
      visible: false,
      extraParams: {},
      userAuthVisible: true,
      tableColumn
    }
  },
  methods: {
    async customSubmit(val, loading) {
      // 构造参数,循环混入额外参数
      if (!this.extraParams) {
        _showFailToast('授权参数为空')
        return
      }
      let key = getEditableKey()
      if (val.data.every((item) => Number(item[key]) <= 0)) {
        _showFailToast('所提交项中存在数量小于或等于0的项目，请检查')
        return
      }
      let temp = Object.assign({}, this.extraParams)
      let result = { ...val, data: val.data.map((item) => ({ ...item, ...temp })) }
      let res = await MISWMSAPI.post(passAPIName, result)
      if (res && res.success) {
        _showSuccessToast(res.msg)
        // 清空表单和列表
        this.$refs.ToggleFormVueRef?.clearHandler()
      } else {
        _showFailToast(res.data)
      }
    },
    handlePartList(key, data, index) {
      this.tableBtnParams = this.tableColumn[3].tableBtnParams
      this.getPartList(key, data, index)
    },
    authComfir() {
      this.$refs.ToggleFormVueRef.fousOfFirst()
    }
  }
}
</script>
