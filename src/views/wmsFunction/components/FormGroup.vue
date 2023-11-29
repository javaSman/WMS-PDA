<template>
  <div>
    <!-- 表单布局 -->
    <van-cell-group>
      <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
        <template v-if="showFormList.length > 0" #title>
          <van-icon :name="show ? 'arrow-down' : 'arrow'" @click="showMore = !showMore" />
        </template>
        <FormVue ref="formComponent" :form-data.sync="formData" :form-list="formList" class="form-group" />
      </van-cell>
    </van-cell-group>
    <!-- 隐藏字段布局 -->
    <van-cell-group v-show="show" :style="showFormList.length > 0 ? 'padding-left: 20px' : ''">
      <FormVue ref="showFormComponent" :form-data.sync="formData" :form-list="showFormList" class="form-group" />
    </van-cell-group>
  </div>
</template>
<script>
import FormVue from '@/components/Form/index.vue'
export default {
  name: 'FormGroup',
  components: {
    FormVue
  },
  props: {
    showFormList: { type: Array, default: () => [] }, // 需要展开显示的数据字段参数
    formList: { type: Array, default: () => [] }, // 表单字段参数
    form: { type: Object, default: () => ({}) }, // 表单对象
    show: { type: Boolean, default: () => true } // 点击左侧箭头是否展开
  },
  computed: {
    showMore: {
      get() {
        return this._props.show
      },
      set(val) {
        this.$emit('update:show', val)
      }
    },
    formData: {
      get() {
        return this._props.form
      },
      set(val) {
        this.$emit('update:form', val)
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.form-group {
  :deep(.van-cell__title) {
    width: 60px !important;
  }
}
</style>
