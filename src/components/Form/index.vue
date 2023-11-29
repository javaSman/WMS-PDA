<template>
  <van-form ref="refForm" :label-width="labelWidth" :show-error="false" :submit-on-enter="false">
    <van-cell-group :inset="inset">
      <div v-for="item in formListFilter" :key="item.prop">
        <InputVue
          v-if="item.type === 'Input' || item.type === 'Textarea'"
          :ref="item.prop"
          :value.sync="form[item.prop]"
          :item="item"
          :is-edit="isEdit"
        />
        <NumberVue v-if="item.type === 'Number'" :value.sync="form[item.prop]" :item="item" :is-edit="isEdit" />
        <SelectVue v-if="item.type === 'Select'" :value.sync="form[item.prop]" :item="item" :is-edit="isEdit" />
        <CalendarVue v-if="item.type === 'Calendar'" :value.sync="form[item.prop]" :item="item" :is-edit="isEdit" />
        <!-- <CalendarRangeVue v-if="item.type === 'CalendarRange'" :value.sync="form[item.prop]" :item="item" :is-edit="isEdit" /> -->
        <DropdownVue
          v-if="item.type === 'Dropdown'"
          :value.sync="form[item.prop]"
          :item="item"
          :options="item.options"
          :is-edit="isEdit"
          @change="(val) => dropdownChange(val, item.prop)"
        />
        <van-field v-if="item.type === 'Text'" :name="item.prop" :label="item.label">
          <template #input>
            {{ form[item.prop] }}
          </template>
        </van-field>
      </div>
    </van-cell-group>
  </van-form>
</template>

<script>
import InputVue from '@/components/Input/Input.vue'
import NumberVue from '@/components/Input/Number.vue'
import SelectVue from '@/components/Select/Select.vue'
import CalendarVue from '@/components/Select/Calendar.vue'
// import CalendarRangeVue from '@/components/Select/CalendarRange.vue'
import DropdownVue from '@/components/Select/Dropdown.vue'
export default {
  name: 'FormVue',
  components: {
    InputVue,
    NumberVue,
    SelectVue,
    CalendarVue,
    // CalendarRangeVue,
    DropdownVue
  },
  props: {
    labelWidth: { type: Number, default: 80 }, // label 的宽度
    inset: { type: Boolean, default: false },
    formData: { type: Object, default: () => ({}) }, // 要清空的表单对象
    formList: { type: Array, default: () => [] }, // 表单字段参数
    isEdit: { type: Boolean, default: true },
    submit: {
      type: Function,
      default: () => {
        return false
      }
    }
  },
  computed: {
    form: {
      get() {
        return this._props.formData
      },
      set(val) {
        this.$emit('update:formData', val)
      }
    },
    formListFilter() {
      let arr = []
      arr = this._props.formList.filter((item) => !item.isHide)
      return arr
    }
  },
  methods: {
    dropdownChange(val, prop) {
      this.$emit('onDropdown', val, prop)
    }
  }
}
</script>
<style scoped lang="scss">
::v-deep .van-cell {
  border-radius: 0;
}
</style>
