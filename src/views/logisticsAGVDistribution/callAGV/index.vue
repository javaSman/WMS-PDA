<template>
  <ToggleFormAGV
    ref="ToggleFormAGV"
    :table-data="list"
    :form-list="formList"
    :show-form-list="showFormList"
    :table-column="tableColumn"
    :show-arrow="false"
    confirm-text="确定"
    @confirm="enterHandler"
  />
</template>

<script>
// AGV叫车-WMS
import ToggleFormAGV from '../businessComponents/ToggleFormAGV.vue'
import { formList, showFormList, tableColumn } from './config'
// import { WMSAPI } from '@/api/generalAPI'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { AGVAPI } from '@/api/generalAGV'
const listAPIName = 'agv/webapi/AGVCalling'
const cachedName = 'logisticsAGVDistribution.callAGV'
export default {
  name: cachedName,
  components: { ToggleFormAGV },
  data() {
    return {
      tableColumn,
      showFormList,
      formList,
      form: {},
      list: []
    }
  },
  methods: {
    enterHandler() {
      this.$refs.ToggleFormAGV.loading = true
      AGVAPI.post(listAPIName, { destination: this.$refs.ToggleFormAGV.formData.destination, count: this.$refs.ToggleFormAGV.formData.count })
        .then((res) => {
          if (res && res.success) {
            this.list = res.data
            _showSuccessToast(res.message)
          } else {
            _showFailToast(res.message)
          }
        })
        .finally(() => {
          this.$refs.ToggleFormAGV.loading = false
        })
    }
  }
}
</script>
