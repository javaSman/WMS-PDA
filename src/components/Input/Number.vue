<template>
  <div>
    <van-field :name="item.label" :label="item.label" :required="item.rules && item.rules.length > 0">
      <template #input>
        <van-stepper
          v-model="fieldValue"
          :max="numberParams.max"
          :min="numberParams.min || ''"
          :step="numberParams.step"
          :decimal-length="numberParams.precision"
          :disabled="disabled"
          :integer="!numberParams.precision || numberParams.precision === 0"
          long-press
          @change="change"
          @blur="blur"
          @keyup.enter="enter"
        />
      </template>
    </van-field>
  </div>
</template>

<script>
export default {
  name: 'NumberVue',
  props: {
    value: { type: [Number, String], default: () => '' }, // 表单的v-model
    item: { type: Object, default: () => ({}) },
    isEdit: { type: Boolean, default: () => false }
  },
  computed: {
    fieldValue: {
      get() {
        return this._props.value
      },
      set(val) {
        this.$emit('update:value', val)
      }
    },
    numberParams() {
      return this._props.item.numberParams
    },
    disabled() {
      if (this._props.item.disabled) return true
      if (this._props.item.unique && this._props.isEdit) return true
      else return false
    }
  },
  methods: {
    blur(e) {
      let val = e.target.value.trim()
      if (!val && val !== 0) {
        this.fieldValue = null
      } else {
        this.fieldValue = Number(e.target.value.trim())
      }
      this._props.item.blur && this._props.item.blur(e.target.value.trim())
      this.$emit('blur', e.target.value.trim())
    },
    enter(e) {
      let val = e.target.value.trim()
      if (!val && val !== 0) {
        this.fieldValue = null
      } else {
        this.fieldValue = Number(e.target.value.trim())
      }

      this._props.item.enter && this._props.item.enter(val)
      this.$emit('enter', val)
    },
    change(val) {
      this._props.item.enter && this._props.item.enter(val)
      this.$emit('change', val)
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .van-stepper {
  width: 100%;
  border: 1px solid #eee;
  border-radius: 5px;
}
::v-deep .van-stepper__input {
  width: calc(100% - 60px);
  background-color: transparent;
}
</style>
