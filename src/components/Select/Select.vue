<template>
  <div>
    <van-field
      v-model="label"
      readonly
      :name="item.prop"
      :label="item.label"
      :placeholder="'请选择' + item.label"
      :required="item.rules && item.rules.length > 0"
      is-link
      @click="showPicker = true"
    />
    <van-popup :show.sync="showPicker" position="bottom">
      <van-picker v-model="selected" :columns="item.options" :columns-field-names="customFieldName" @confirm="confirm" @cancel="showPicker = false" />
    </van-popup>
  </div>
</template>

<script>
export default {
  name: 'SelectVue',
  props: {
    modelValue: { type: [String, Number], default: () => null }, // 表单的v-model
    item: { type: Object, default: () => ({}) },
    isEdit: { type: Boolean, default: () => false }
  },
  data() {
    return {
      showPicker: false,
      label: null
    }
  },
  computed: {
    fieldValue: {
      get() {
        return this._props.modelValue
      },
      set(val) {
        this.$emit('update:modelValue', val)
      }
    },
    selected: {
      get() {
        return this._props.modelValue ? [this._props.modelValue] : []
      },
      set: (val) => val
    },
    customFieldName() {
      let opt = this._props.item.optProps
      if (!opt) {
        return { text: 'text', value: 'value' }
      } else {
        return { text: opt.label, value: opt }
      }
    }
  },
  methods: {
    confirm({ selectedValues, selectedOptions, selectedIndexes }) {
      // console.log(selectedValues, selectedOptions, selectedIndexes)
      this.showPicker = false
      this.label = selectedOptions[0][this.customFieldName.value.text]
      this.fieldValue = selectedValues[0]
      this._props.item.change && this._props.item.change(selectedValues[0])
    }
  }
}
</script>
