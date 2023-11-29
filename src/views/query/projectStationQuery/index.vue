<template>
  <QueryToggleFormVue
    :form-data.sync="form"
    :table-data.sync="list"
    :form-list.sync="formList"
    :show-form-list.sync="showFormList"
    :table-column.sync="tableColumn"
    :show-arrow="false"
    @confirm="comfirSearch"
  />
</template>

<script>
// 生产订单状态查询
import QueryToggleFormVue from '@/views/businessComponents/QueryToggleForm.vue'
import { formList, showFormList, tableColumn } from './config'
import { MISWMSAPI } from '@/api/generalAPI'
import { _showFailToast } from '@/utils/message'

const listAPIName = '/getData/getStateMateStock'
const cachedName = 'query.componentQuery'
export default {
  name: cachedName,
  components: {
    QueryToggleFormVue
  },
  data() {
    return {
      form: {},
      list: [],
      formList,
      showFormList,
      tableColumn,
      loading: false
    }
  },
  mounted() {
    //  这里项目号和条码都绑定enter事件
    this.formList[0].enter = this.enterHandler
  },
  methods: {
    // 条码或者项目号回车
    enterHandler() {
      this.loading = true
      MISWMSAPI.post(listAPIName, { objnr: this.form.barcode })
        .then((res) => {
          console.log(res)
          if (res && res.success) {
            this.list = res.data
            // 取出第一项赋值项目工位
            if (this.list.length > 0) {
              this.$set(this.form, 'projectNum', `${this.list[0].charg}-${this.list[0].workp}`)
              // this.form.projectNum = `${this.list[0].charg}-${this.list[0].workp}`
            }
          } else {
            _showFailToast(res.data)
          }
        })
        .finally(() => {
          this.loading = false
        })
    },
    comfirSearch() {
      this.enterHandler()
    }
  }
}
</script>
