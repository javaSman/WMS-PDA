<template>
  <ToggleFormTransferAGV
    :form-list="formList"
    :show-form-list="showFormList"
    :table-column="tableColumn"
    :pass-a-p-i-name="passAPIName"
    :list-a-p-i-name="listAPIName"
    :enter-front-event="getImOclas"
    :type="imOclas"
    :location="location"
    mode="all"
    scanl-key="reqno"
  />
</template>

<script>
// 后勤备料-WMS
import ToggleFormTransferAGV from '../businessComponents/ToggleFormTransferAGV.vue'
import { formList, showFormList, tableColumn } from './config'
// import { WMSAPI } from '@/api/generalAPI'
import { _showFailToast } from '@/utils/message'
import { AGVAPI } from '@/api/generalAGV'
const cachedName = 'logisticsAGVDistribution.logisticsStock'
export default {
  name: cachedName,
  components: {
    ToggleFormTransferAGV
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      passAPIName: 'agv/webapi/PickingFinished',
      listAPIName: 'business/webapi/ZxwmsXmbeCommonListMrp',
      imOclas: '',
      location: '' // 配送地点
    }
  },
  methods: {
    async getImOclas(val) {
      // 根据备料单号查询备料单是否存在及当前状态
      try {
        let res = await AGVAPI.get('agv/webapi/getPickingExits', { pickingNo: val })
        if (res.success) {
          this.imOclas = res.oclas
          this.location = res.destination
          if (!res.oclas) {
            _showFailToast('未查到该领料单的移动类型')
            return true
          }
        } else {
          _showFailToast(res.message)
          return true
        }
      } catch (e) {
        console.log(e)
      }
    }
  }
}
</script>
