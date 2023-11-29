<template>
  <div class="content">
    <!-- 列表 -->
    <div class="top_search">
      <FormVue ref="formComponent" :form-data.sync="form" :form-list="formList" />
    </div>
    <div class="table_wrapper">
      <TableVue ref="table" :table-data.sync="list" :table-column="tableColumn" />
    </div>
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" @clear="handleClear" />
  </div>
</template>

<script>
// 物料凭证查询
import FormVue from '@/components/Form/index.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '../businessComponents/ActionBar.vue'
import { MISWMSAPI } from '@/api/generalAPI'
import { formList, tableColumn } from './config'
import { _showFailToast } from '@/utils/message'
import Dates from '@/utils/datetime'
import { mapGetters } from 'vuex'

const queryAPIName = 'getData/getDataMateDoc'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
const cachedName = 'query.materialVoucherQuery'
export default {
  name: cachedName,
  components: {
    FormVue,
    TableVue,
    ActionBarVue
  },
  data() {
    return {
      list: [],
      formList,
      tableColumn,
      form: {
        imCardno: this.account,
        imPostdate: today,
        imMovetype: ''
      }
    }
  },
  computed: {
    ...mapGetters(['account', 'name'])
  },
  mounted() {
    this.initFormList()
  },
  methods: {
    initFormList() {
      // 初始化表单，给过账日期和移动类型加上change事件
      this.formList.forEach((item) => {
        if (item.prop === 'imPostdate') item.change = this.handleQueryMaterial
        if (item.prop === 'imMovetype') item.change = this.handleQueryMaterial
      })
    },
    handleQueryMaterial() {
      // 查询
      this.$refs?.formComponent?.$refs.refForm.validate().then(() => {
        MISWMSAPI.post(queryAPIName, this.form).then((res) => {
          // console.log(res)
          if (res && res.success) this.list = res.data
          else _showFailToast(res.data)
        })
      })
    },
    handleClear() {
      // 清除
      this.form = {
        imCardno: this.account,
        imPostdate: today,
        imMovetype: ''
      }
      this.list = []
      // 清除验证信息
      this.$refs?.formComponent?.$refs.refForm.resetValidation()
    }
  }
}
</script>

<style lang="scss" scoped>
.content {
  width: 100%;
  position: relative;
  .top_search {
    width: 100%;
    position: fixed;
    top: 47px;
    z-index: 999;
  }
  .table_wrapper {
    margin-top: 80px;
  }
}
</style>
