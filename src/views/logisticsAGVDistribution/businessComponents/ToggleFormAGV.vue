<template>
  <div>
    <!-- 表单布局 -->
    <div class="sticky_fix">
      <van-cell-group>
        <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
          <template v-if="showFormList.length > 0" #title>
            <van-icon :name="show ? 'arrow-down' : 'arrow'" @click="show = !show" />
          </template>
          <template>
            <FormVue ref="formComponent" :form-data.sync="formData" :form-list="formList" />
            <!-- 隐藏字段布局 -->
            <FormVue v-if="show" ref="showFormComponent" :form-data.sync="form" :form-list="showFormList" />
          </template>
        </van-cell>
      </van-cell-group>
    </div>
    <!-- 列表 -->
    <TableForQuery ref="table" :table-data.sync="tableData" :table-column="tableColumn" :form-list-length="formList.length" />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading.sync="loading" :confirm-text="confirmText" @clear="handleClear" @confirm="handleConfirm" />
  </div>
</template>

<script>
import FormVue from '@/components/Form/index.vue'
import TableForQuery from '@/views/businessComponents/TableForQuery.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
export default {
  name: 'QueryToggleFormVue',
  components: {
    FormVue,
    TableForQuery,
    ActionBarVue
  },
  props: {
    formList: { type: Array, default: () => [] }, // 表单项数组
    showFormList: { type: Array, default: () => [] }, // 需要展开显示的数据字段参数
    tableColumn: { type: Array, default: () => [] }, // 列表字段参数
    confirmText: { type: String, default: '查询' }, // 底部按钮显示文本
    tableData: { type: Array, default: () => [] } // 表格数据
  },
  data() {
    return {
      show: false,
      loading: false,
      formData: {} // 表单数据
    }
  },
  methods: {
    async handleConfirm() {
      try {
        // 表单验证
        await this.$refs.formComponent?.$refs.refForm.validate()
        this.$emit('confirm')
      } catch (e) {
        console.log(e)
      }
    },
    handleClear() {
      this.list = []
      // 表单
      this.formData = {}
    }
  }
}
</script>
<style scoped lang="scss">
.sticky_fix {
  position: sticky;
  top: 0;
  z-index: 99999;
}
</style>
