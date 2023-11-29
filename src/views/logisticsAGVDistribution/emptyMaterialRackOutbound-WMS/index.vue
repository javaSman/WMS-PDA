<template>
  <div>
    <!-- 表单布局 -->
    <van-cell-group>
      <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
        <FormVue ref="formComponent" :form-data.sync="form" :form-list.sync="formList" />
      </van-cell>
    </van-cell-group>
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" :confirm-text="confirmText" @clear="handleClear" @confirm="handleConfirm" />
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
  name: 'EmptyMaterialRackOutboundWMS',
  components: { FormVue, ActionBarVue },
  data() {
    return {
      formList,
      form: {},
      loading: false,
      confirmText: '确认'
    }
  },
  created() {},
  mounted() {
    WMSAPI.get('business/webapi', {}, 'GetWarehouseNos').then((res) => {
      this.formList[0].options = res.result
    })
    this.linkageEvent()
  },
  methods: {
    /** 聚集 */
    getFocus(params) {
      this.$nextTick(() => {
        this.$refs.formComponent.$refs[params][0].$children[0].focus()
      })
    },
    linkageEvent() {
      this.formList.forEach((item) => {
        switch (item.prop) {
          // 仓库
          case 'warehouseNo': {
            item.change = () => {
              this.handleChange()
            }
            break
          }
        }
      })
    },
    handleChange() {
      WMSAPI.get('business/webapi', { warehouseNo: this.form.warehouseNo }, 'GetEmptyMaterialShelfs').then((res) => {
        this.formList[1].options = res.result
      })
      WMSAPI.get('business/webapi', { warehouseNo: this.form.warehouseNo }, 'GetSiteNos').then((res) => {
        this.formList[2].options = res.result
      })
    },
    handleEnter() {
      WMSAPI.get('business/webapi', { materialShelfNo: this.form.materialShelfNo }, 'GetLocation').then((res) => {
        if (res && res.success) {
          this.form[this.form.locationNo] = res.result.locationNo
          this.$set(this.form, 'locationNo', this.form[this.form.locationNo])
        } else {
          _showFailToast(res.message)
        }
      })
    },
    handleConfirm() {
      this.$refs.formComponent.$refs.refForm.validate().then(() => {
        let user = getItem('Users')
        AGVAPI.post(
          'agv/webapi',
          { materialShelfNo: this.form.materialShelfNo, agvSite: this.form.agvSite, operatorNo: user.userName, operatorName: user.name },
          'EmptyShelfOutStorage'
        ).then((res) => {
          if (res && res.success) {
            _showSuccessToast(res.message)
          } else {
            _showFailToast(res.message)
          }
        })
      })
    },
    // 清除按钮
    handleClear() {
      this.form = {}
      this.formList[1].options = []
      this.formList[2].options = []
    }
  }
}
</script>

<style scoped lang="scss">
.loading_wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
