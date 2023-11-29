<template>
  <van-sticky :offset-top="46">
    <van-grid direction="horizontal" :column-num="4" :border="false" style="border-top: 1px solid #ccc; border-bottom: 1px solid #ccc">
      <van-grid-item>总数：{{ list.length }}</van-grid-item>
      <van-grid-item>已确认：{{ selectedList.length }}</van-grid-item>
      <van-grid-item>剩余数：{{ list.length - selectedList.length }}</van-grid-item>
      <van-grid-item>
        <van-checkbox v-model="checkAll" :disabled="chkDisabled" shape="square" @click="handleSelectAll">全选</van-checkbox>
      </van-grid-item>
    </van-grid>
  </van-sticky>
</template>
<script>
export default {
  name: 'SummaryCheck',
  props: {
    chkDisabled: { type: Boolean, default: () => false },
    selectAll: { type: Boolean, default: () => true }, // 是否全选
    selectedList: { type: Array, default: () => [] }, // 选中项集合
    list: { type: Array, default: () => [] } // 列表数据
  },
  computed: {
    checkAll: {
      get() {
        return this._props.selectedList.length === this._props.list.length && this._props.selectedList.length !== 0
      },
      set(val) {
        this.$emit('update:selectAll', val)
      }
    }
  },
  methods: {
    handleSelectAll() {
      this.$emit('handleSelectAll')
    }
  }
}
</script>
