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
import { AGVAPI } from '@/api/generalAGV'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { formList } from './config'

export default {
  name: 'MaterialRackStorageWMS',
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
          case 'materialShelfNo': {
            item.enter = () => {
              this.handleEnter()
            }
            break
          }
        }
      })
    },
    handleChange() {
      this.getFocus('materialShelfNo')
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
      this.loading = true
      this.$refs.formComponent.$refs.refForm.validate().then(() => {
        let user = getItem('Users')
        AGVAPI.post(
          'agv/webapi',
          {
            materialShelfNo: this.form.materialShelfNo,
            warehouseNo: this.form.warehouseNo,
            operatorNo: user.userName,
            operatorName: user.name
          },
          'ShelfInStorage'
        ).then((res) => {
          if (res && res.success) {
            _showSuccessToast(res.message)
            this.loading = false
          } else {
            _showFailToast(res.message)
          }
        })
      })
    },
    // 清除按钮
    handleClear() {
      this.form = {}
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
