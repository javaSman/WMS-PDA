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
  name: 'CardLoadingStatusWMS',
  components: { FormVue, ActionBarVue },
  data() {
    return {
      formList,
      form: {},
      loading: false,
      confirmText: '确认'
    }
  },
  created() {
    this.getFocus('boxNo')
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
          // 卡板
          case 'boxNo': {
            item.enter = () => {
              this.BoxNoEnter()
            }
            break
          }
        }
      })
    },
    BoxNoEnter() {
      WMSAPI.get('business/webapi', { boxNo: this.form.boxNo }, 'GetBox').then((res) => {
        if (res && res.success) {
          this.form[this.form.dqstatus] = res.result.status
          this.$set(this.form, 'dqstatus', res.result.status)
        }
      })
    },
    handleConfirm() {
      this.$refs.formComponent.$refs.refForm.validate().then(() => {
        let user = getItem('Users')
        let NowStatus = this.form.status
        let Dqstatus = this.form.dqstatus
        if (NowStatus === Dqstatus) {
          _showFailToast('载具装载状态不能等于当前卡板状态')
        } else {
          WMSAPI.post(
            'business/webapi',
            {
              boxNo: this.form.boxNo,
              status: this.form.status,
              operatorNo: user.userName,
              operatorName: user.name
            },
            'UpdateBoxStatus'
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
