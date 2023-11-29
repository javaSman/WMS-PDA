<template>
  <ToggleFormWMSVue
    ref="toggleFormVue"
    :form-list="formList"
    :table-column="tableColumn"
    :pass-a-p-i-name="passAPIName"
    :list-a-p-i-name="listAPIName"
    :enter-after-event="handleReDataAgain"
    :type="imOclas"
    chk-disabled
    :is-disable-checked="true"
    mode="addTo"
  />
</template>

<script>
import ToggleFormWMSVue from '@/views/businessComponents/ToggleFormWMS.vue'
import { formList, tableColumn } from './config'
// Z01成品入库-线边仓WMS
const cachedName = 'receive.Z01FinishedToLineSideWarehouse-WMS'
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
const passAPIName = 'business/webapi/PostIn'
const imOclas = 'XWMSZ01'
export default {
  name: cachedName,
  components: {
    ToggleFormWMSVue
  },
  data() {
    return {
      formList,
      tableColumn,
      listAPIName,
      passAPIName,
      imOclas
    }
  },
  methods: {
    handleReDataAgain(list, _list) {
      list.forEach((item, index) => {
        item._erfmg = _list[index].erfmg
      })
    }
  }
}
</script>
