<template>
  <div>
    <FormVue ref="formComponent" :form-data.sync="form" :form-list.sync="formList" />
    <div style="height: 50px" />
    <!-- <van-action-bar-button type="default" text="清除" @click="handleClear" /> -->
    <ActionBarVue ref="actionBarVue" :loading="loading" :confirm-text="'确定'" @clear="handleClear" @confirm="handleQueryInstorage" />
  </div>
</template>

<script>
import { getItem } from '@/utils/auth'
import FormVue from '@/components/Form/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'

import { WMSAPI } from '@/api/generalAPI'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { formList } from './config'
import { AGVAPI } from '@/api/generalAGV'
export default {
  name: 'AGVInStorage',
  components: { FormVue, ActionBarVue },
  data() {
    return {
      APIName: 'business/webapi',
      apiname: 'agv/webapi',
      formList,
      form: {},
      loading: false
    }
  },
  created() {},
  mounted() {
    this.storehouse()
    this.linkageEvent()
  },
  methods: {
    // 获取仓库
    storehouse() {
      WMSAPI.get(this.APIName, {}, 'GetWarehouseNos').then((res) => {
        this.formList[0].options = res.result
      })
    },
    linkageEvent() {
      this.formList.forEach((item) => {
        switch (item.prop) {
          // 仓库
          case 'storehouse': {
            item.change = () => {
              this.getFloor()
            }
            break
          }
          // 箱子号
          case 'boxId': {
            item.enter = () => {
              this.getWharf()
            }
            break
          }
        }
      })
    },
    // 获取楼层
    getFloor() {
      WMSAPI.get(this.APIName, { warehouseNo: this.form.storehouse }, 'GetFloorHeight').then((res) => {
        if (res && res.success) {
          this.formList[3].options = res.result
        } else {
          _showFailToast(res.message)
        }
      })
    },
    // 获取码头
    getWharf() {
      WMSAPI.get(this.APIName, { boxNo: this.form.boxId }, 'GetBox').then((res) => {
        if (res && res.success) {
          // this.form[this.form.wharf] = res.result.locationNo
          this.$set(this.form, 'wharf', res.result.locationNo)
        } else {
          _showFailToast(res.message)
        }
      })
    },
    // 确定
    handleQueryInstorage() {
      this.$refs.formComponent.$refs.refForm.validate().then(() => {
        let user = getItem('Users')
        let data = {
          warehouseNo: this.form.storehouse,
          boxNo: this.form.boxId,
          locationNo: this.form.wharf,
          floor: this.form.stations.substring(0, this.form.stations.length - 1),
          operatorNo: user.userName,
          operatorName: user.name
        }
        AGVAPI.post(this.apiname, data, 'BoxInStorage').then((res) => {
          if (res && res.success) {
            _showSuccessToast(res.message)
          } else {
            _showFailToast(res.message)
          }
        })
      })
    },
    // 清除
    handleClear() {
      this.form = {}
      this.formList[3].options = []
    }
  }
}
</script>
