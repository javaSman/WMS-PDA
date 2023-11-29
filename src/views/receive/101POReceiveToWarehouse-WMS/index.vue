<template>
  <ToggleFormWMSVue
    :form-list="formList"
    :show-form-list="showFormList"
    :table-column="tableColumn"
    :pass-a-p-i-name="passAPIName"
    :list-a-p-i-name="listAPIName"
    :type="imOclas"
    mode="one"
    scanl-key="objnr"
    :auto-submit="true"
    :is-check-and-to-top="true"
    :is-alter-message="true"
    :submit="customerSubmit"
  />
</template>

<script>
import ToggleFormWMSVue from '@/views/businessComponents/ToggleFormWMS.vue'
import { formList, showFormList, tableColumn } from './config'
const passAPIName = 'business/webapi/PostIn'
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
const imOclas = 'XWMS101'
// 101PO收货入库-WMS
const cachedName = 'receive.101POReceiveToWarehouse-WMS'
export default {
  name: cachedName,
  components: {
    ToggleFormWMSVue
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      passAPIName,
      listAPIName,
      imOclas
    }
  },
  methods: {
    // 自定义提交方法，增强提交参数
    async customerSubmit(data) {
      // 重新赋值barcode
      data.wmsPostInList = data.wmsPostInList.map((item, index) => ({
        ...item,
        barcode: data.zxstXmbeStruList[index].objnr
      }))
      return false
    }
  }
}
</script>
