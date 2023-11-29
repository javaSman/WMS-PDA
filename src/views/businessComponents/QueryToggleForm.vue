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
            <FormVue ref="formComponent" :form-data.sync="form" :form-list.sync="formList" />
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
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
  </div>
</template>

<script>
import FormVue from '@/components/Form/index.vue'
// import TableVue from '@/components/Table/index.vue'
import TableForQuery from './TableForQuery.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
export default {
  name: 'QueryToggleFormVue',
  components: {
    FormVue,
    // TableVue,
    TableForQuery,
    ActionBarVue
  },
  props: {
    formList: { type: Array, default: () => [] }, // 表单项数组
    showFormList: { type: Array, default: () => [] }, // 需要展开显示的数据字段参数
    tableColumn: { type: Array, default: () => [] }, // 列表字段参数
    confirmText: { type: String, default: '查询' }, // 底部按钮显示文本
    formData: { type: Object, default: () => {} }, // 表单数据
    tableData: { type: Array, default: () => [] }, // 表格数据
    scanLoading: { type: Boolean, default: false } // 扫码loading
  },
  data() {
    return {
      table: null,
      show: false,
      loading: false
    }
  },
  computed: {
    form: {
      // 与不写get  set方法的形式有区别
      // 一个计算属性的getter
      get() {
        // 三个值变化的时候，result的值会自动更新，也会自动更新DOM结构
        return this.formData
      },
      // 一个计算属性的setter
      set(val) {
        this.$emit('update:formData', val)
      }
    }
  },
  methods: {
    handleConfirm() {
      this.$emit('confirm')
    },
    handleClear() {
      this.$emit('update:tableData', [])
      // this.tableData = []
      // 表单
      this.form = {}
      this.$refs.formComponent.$refs[this.formList[0].prop][0].$refs.inputRef.focus()
    }
  }
}
</script>
<style scoped lang="scss">
.sticky_fix {
  position: sticky;
  top: 0;
}
.loading_wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  z-index: 999;
}
</style>
