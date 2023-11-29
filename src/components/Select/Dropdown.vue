<template>
  <van-field
    v-model="fieldValue"
    readonly
    :name="item.prop"
    :label="item.label"
    :placeholder="'请选择' + item.label"
    :rules="item.rules"
    :required="item.rules && item.rules.length > 0"
    @click="showPicker = true"
  >
    <template #input>
      <van-dropdown-menu>
        <van-dropdown-item ref="dropdownItem" v-model="fieldValue" :options="optionsEx" @change="handleChange" />
      </van-dropdown-menu>
    </template>
  </van-field>
</template>

<script>
export default {
  name: 'DropdownVue',
  props: {
    value: { type: [String, Number], default: () => '' }, // 表单的v-model
    item: { type: Object, default: () => ({}) },
    options: { type: Array, default: () => [] },
    isEdit: { type: Boolean, default: () => false }
  },
  data() {
    return {
      dropdownItem: null,
      showPicker: false,
      label: null
    }
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
    customFieldName() {
      let opt = this.item.optProps
      if (!opt) {
        return { text: 'text', value: 'value' }
      } else {
        return { text: opt.label, value: opt.value }
      }
    },
    optionsEx() {
      let _ex = []
      let _this = this
      _this.item.options?.forEach((item) => {
        _ex.push({ text: item[_this.customFieldName.text], value: item[_this.customFieldName.value] })
      })
      return _ex
    }
  },
  // TODO: 这个地方如果时刻保持一致的话会有显示bug啊？
  watch: {
    value: {
      handler: function (val) {
        this.label = val
        // 该值需要时刻与value的值保持一致
      }
    }
  },
  methods: {
    handleChange(val) {
      this.item.change && this.item.change(val)
      let selected = this.item.options.filter((item) => item[this.customFieldName.value] === val)
      this.label = selected[0] ? selected[0][this.customFieldName.value] : ''
      this.$emit('change', val)
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .van-dropdown-menu {
  width: 100%;
}
::v-deep .van-dropdown-menu__bar {
  height: 24px;
  background: transparent;
  box-shadow: none;
}
::v-deep .van-dropdown-menu__item {
  justify-content: right;
}
::v-deep .van-cell__value {
  min-width: 20%;
}
</style>
