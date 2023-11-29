<template>
  <div>
    <van-field
      v-model="fieldValue"
      is-link
      readonly
      :name="item.prop"
      :label="item.label"
      :placeholder="'请选择' + item.label"
      :rules="item.rules"
      :required="item.rules && item.rules.length > 0"
      input-align="right"
      @click="showCalendar = true"
    />
    <van-calendar v-model="showCalendar" :show-confirm="false" :min-date="_minDate" :max-date="_maxDate" @confirm="confirm" />
  </div>
</template>

<script>
import Dates from '@/utils/datetime'
export default {
  name: 'CalendarVue',
  props: {
    value: { type: String, default: () => null }, // 表单的v-model
    item: { type: Object, default: () => ({}) },
    isEdit: { type: Boolean, default: () => false }
  },
  data() {
    return {
      showCalendar: false
    }
  },
  computed: {
    fieldValue: {
      get() {
        // console.log(this._props)
        return this._props.value
      },
      set(val) {
        this.$emit('update:value', val)
      }
    },
    calendar() {
      return this._props.item.calendarParams
    },
    _minDate() {
      return this.calendar?.minDate || new Date()
    },
    _maxDate() {
      return this.calendar?.maxDate || new Date(Date.now() + 6 * 30 * 24 * 3600 * 1000)
    }
  },
  methods: {
    confirm(value) {
      let times = new Dates(value)
      this.fieldValue = times.strftime('YYYY-MM-DD')
      // console.log(fieldValue)
      this.showCalendar = false
      this._props.item.change && this._props.item.change(this.fieldValue)
    }
  }
}
</script>

<style scoped lang="scss">
::v-deep.van-cell__value {
  min-width: 55%;
}
</style>
