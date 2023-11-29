<template>
  <van-field
    ref="inputRef"
    v-model="fieldValue"
    :type="type"
    :name="item.label"
    :label="item.label"
    :placeholder="'请输入' + item.label"
    :required="item.rules && item.rules.length > 0"
    :disabled="disabled"
    :rules="item.rules"
    :show-word-limit="inputParams.maxlength > 0"
    :autosize="inputParams.autosize || false"
    :rows="inputParams.rows || 1"
    :input-align="inputParams.align || 'left'"
    :left-icon="inputParams.leftIcon || null"
    clearable
    clear-trigger="always"
    @keyup.enter="enter"
    @blur="blur"
    @focus="inputFocus"
  >
    <template v-if="inputParams.btnLabel" #button>
      <van-button size="small" type="primary" @click="$emit(inputParams.clickFun)">{{ inputParams.btnLabel || '' }}</van-button>
    </template>
  </van-field>
  <!--     :placeholder="'请输入' + item.label" -->
</template>

<script>
export default {
  name: 'InputVue',
  props: {
    value: { type: String, default: () => '' }, // 表单的v-model
    item: { type: Object, default: () => ({}) },
    isEdit: { type: Boolean, default: () => false }
  },
  computed: {
    fieldValue: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('update:value', val)
      }
    },
    inputParams() {
      return this.item?.inputParams || {}
    },
    type() {
      if (this.item.type === 'Textarea') return 'textarea'
      else return 'text'
    },
    disabled() {
      if (this.item.disabled) return true
      if (this.item.unique && this.isEdit) return true
      else return false
    }
  },
  methods: {
    blur(e) {
      this.fieldValue = e.target.value.trim()
      this.item.blur && this.item.blur(e.target.value.trim())
      this.$emit('blur', e.target.value.trim())
    },
    enter(e) {
      this.fieldValue = e.target.value.trim()
      this.item.enter && this.item.enter(e.target.value.trim())
      //! 确认内容后使其失去焦点，配合loading效果使用
      // this.$refs.inputRef?.blur()
      this.$emit('enter', e.target.value.trim())
    },
    /** 解决pda获取光标时软键盘弹出问题 */
    inputFocus() {
      // tips:获取光标瞬间设置只读属性可以阻止键盘弹起
      this.$refs.inputRef.$refs.input.setAttribute('readonly', 'readonly')
      // this.$refs.inputRef.setAttribute('readonly', 'readonly')
      // tips:当键盘弹起被阻止后的200ms后移除这个属性，此时光标仍然会在输入框上，以此实现目的
      setTimeout(() => {
        this.$refs.inputRef.$refs.input.removeAttribute('readonly')
      }, 200)
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .van-cell {
  border-radius: 0;
}
</style>
