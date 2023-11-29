<template>
  <div>
    <FormVue ref="formComponent" :form-data.sync="form" :form-list.sync="formList" />
    <div style="height: 50px" />
    <!-- <van-action-bar-button type="default" text="清除" @click="handleClear" /> -->
    <ActionBarVue ref="actionBarVue" :loading="loading" :confirm-text="'确定'" @clear="handleClear" @confirm="confirm" />
  </div>
</template>

<script>
// import { getItem } from '@/utils/auth'
import FormVue from '@/components/Form/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'

// import { WMSAPI } from '@/api/generalAPI'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { formList } from './config'
import { AGVAPI } from '@/api/generalAGV'
export default {
  name: 'AgvDeliveryRelease',
  components: { FormVue, ActionBarVue },
  data() {
    return {
      APIName: 'agv/webapi',
      formList,
      form: {},
      loading: false
    }
  },
  created() {
    this.getFocus('agvNo')
    this.linkageEvent()
  },
  mounted() {},
  methods: {
    getFocus(params) {
      this.$nextTick(() => {
        this.$refs.formComponent.$refs[params][0].$children[0].focus()
      })
    },
    linkageEvent() {
      this.formList.forEach((item) => {
        switch (item.prop) {
          case 'agvNo': {
            item.enter = () => {
              this.agvEnter()
            }
          }
        }
      })
    },
    agvEnter() {
      this.confirm()
    },
    // 确定
    confirm() {
      this.$refs.formComponent.$refs.refForm.validate().then(() => {
        this.$dialog
          .confirm({
            title: '提示',
            message: '是否放行',
            width: '90%'
          })
          .then(() => {
            AGVAPI.get(this.APIName, { agvNo: this.form.agvNo }, 'AGVRelease').then((res) => {
              if (res && res.success) {
                _showSuccessToast(res.message)
              } else {
                _showFailToast(res.message)
              }
            })
          })
      })
    },
    // 清除
    handleClear() {
      this.form = {}
    }
  }
}
</script>
