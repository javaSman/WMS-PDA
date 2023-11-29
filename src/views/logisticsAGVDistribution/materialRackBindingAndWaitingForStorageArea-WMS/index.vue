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

export default {
  name: 'MaterialRackBindingAndWaitingForStorageAreaWMS',
  components: { FormVue, ActionBarVue },
  data() {
    return {
      formList,
      form: {},
      loading: false,
      confirmText: '绑定/解绑'
    }
  },
  created() {
    this.getFocus('materialShelfNo')
  },
  mounted() {
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
          // 料架码
          case 'materialShelfNo': {
            item.enter = () => {
              this.handleEnter()
            }
            break
          }
        }
      })
    },
    handleEnter() {
      WMSAPI.get('business/webapi', { materialShelfNo: this.form.materialShelfNo }, 'GetLocation').then((res) => {
        if (res && res.success && res.result !== null) {
          this.form[this.form.locationNo] = res.result.locationNo
          this.$set(this.form, 'locationNo', this.form[this.form.locationNo])
          this.confirmText = '解绑'
        } else {
          _showFailToast('请输入待入库区')
          this.getFocus('locationNo')
          this.confirmText = '绑定'
        }
      })
    },
    handleConfirm() {
      this.$refs.formComponent.$refs.refForm.validate().then(() => {
        let user = getItem('Users')
        if (this.confirmText === '绑定') {
          WMSAPI.post(
            'business/webapi',
            {
              materialShelfNo: this.form.materialShelfNo,
              locationNo: this.form.locationNo,
              operatorNo: user.userName,
              operatorName: user.name
            },
            'UpdateLocationMaterialShelfNo'
          ).then((res) => {
            if (res && res.success) {
              _showSuccessToast(res.message)
              this.handleClear()
            } else {
              _showFailToast(res.message)
            }
          })
        } else {
          WMSAPI.post(
            'business/webapi',
            { locationNo: this.form.locationNo, operatorNo: user.userName, operatorName: user.name },
            'UpdateLocationMaterialShelfNo'
          ).then((res) => {
            if (res && res.success) {
              _showSuccessToast(res.message)
              this.handleClear()
            } else {
              _showFailToast(res.message)
            }
          })
        }
      })
    },
    // 清除按钮
    handleClear() {
      this.form = {}
      this.confirmText = '绑定/解绑'
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
