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
      :is-auto-focus="false"
      :is-show-author="true"
      scanl-key="objnr"
    />
    <UserAuth :visible.sync="userAuthVisible" :extra.sync="extraParams" @comfir="authComfir" />
  </div>
</template>

<script>
// 261发料-仓库直发
const cachedName = 'shipment.261WarehouseDirectDelivery'
import ToggleFormVue from '@/views/businessComponents/ToggleForm.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
import { formList, showFormList, tableColumn } from './config'
import { MISWMSAPI } from '@/api/generalAPI'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { getEditableKey } from '@/utils/validateOperateForQty'

const passAPIName = '/exportGoodsBusiness/doPost261D'
const listAPIName = '/exportGoodsBusiness/findList261D'
export default {
  name: cachedName,
  components: {
    ToggleFormVue,
    UserAuth
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      userAuthVisible: true,
      extraParams: {},
      listAPIName,
      passAPIName
    }
  },
  methods: {
    /**
     * @description:自定义过账方法
     * @param {*} val 勾选的数据
     * @param {*} loading 过账按钮的loading效果控制
     */
    async customSubmit(val, loading) {
      let key = getEditableKey()
      // 构造参数,循环混入额外参数
      if (val.data.every((item) => Number(item[key]) <= 0)) {
        _showFailToast('所提交项中存在数量小于或等于0的项目，请检查')
        return
      }
      let temp = Object.assign({}, this.extraParams)
      let result = { ...val, data: val.data.map((item) => ({ ...item, ...temp })) }
      let res = await MISWMSAPI.post(passAPIName, result)
      if (res && res.success) {
        _showSuccessToast({
          message: res.msg,
          duration: 10 * 1000
        })
        // 清空表单和列表
        this.$refs.ToggleFormVueRef?.clearHandler()
      } else {
        _showFailToast(res.data)
      }
    },
    focusOnFirst() {
      this.$refs.ToggleFormVueRef.$refs.formComponent.$refs.imBarcode[0].$refs.inputRef.focus()
    },
    authComfir() {
      this.focusOnFirst()
    }
  }
}
</script>
