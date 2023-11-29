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
      mode="one"
      scanl-key="objnr"
      :is-check-and-to-top="true"
      :is-show-author="true"
    />
    <UserAuth :visible.sync="userAuthVisible" :extra.sync="extraParams" />
  </div>
</template>

<script>
// 261发料-供应商领料
const cachedName = 'shipment.261SupplierPicking'
import ToggleFormVue from '@/views/businessComponents/ToggleForm.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
import { formList, showFormList, tableColumn } from './config'
import { MISWMSAPI } from '@/api/generalAPI'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { getEditableKey } from '@/utils/validateOperateForQty'

const passAPIName = '/exportGoodsBusiness/doPost261W'
const listAPIName = '/exportGoodsBusiness/findList261W'
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
      // 构造参数,循环混入额外参数
      if (this.extraParams) {
        let key = getEditableKey()
        if (val.data.every((item) => Number(item[key]) > 0)) {
          let temp = Object.assign({}, this.extraParams)
          let result = { ...val, data: val.data.map((item) => ({ ...item, ...temp })) }
          let res = await MISWMSAPI.post(passAPIName, result)
          if (res && res.success) {
            _showSuccessToast({
              message: res.msg,
              duration: 10 * 1000
            })
            // _showSuccessToast(res.msg)
            // 清空表单和列表
            this.$refs.ToggleFormVueRef?.clearHandler()
          } else {
            _showFailToast(res.data)
          }
        } else {
          _showFailToast('所提交项中存在数量小于或等于0的项目，请检查')
        }
      }
    }
  }
}
</script>
