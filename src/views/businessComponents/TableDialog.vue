<template>
  <van-dialog v-model="show" :title="title" class="tableDialogVue" show-cancel-button :cancel-button-text="cancelText">
    <div class="dialogWrapper">
      <TableVue ref="table" :table-data="tableData" :table-column="tableColumn" />
      <!-- <div class="footer">
        <span style="line-height: 44px">总计{{ tableData.length }}个</span>
        <van-button square type="primary" size="normal" style="float: right; width: 40%" @click="show = false">确定</van-button>
      </div> -->
    </div>
  </van-dialog>
</template>
<script>
import TableVue from '@/components/Table/index.vue'
export default {
  name: 'TableDialogVue',
  components: {
    TableVue
  },
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: '配件清单' },
    tableColumn: { type: Array, default: () => [] }, // 列表字段参数
    tableData: { type: Array, default: () => [] } // 清单列表数据
  },
  computed: {
    show: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    },
    cancelText() {
      return `总计${this.tableData.length}`
    }
  }
}
</script>
<style lang="scss" scoped>
.dialogWrapper {
  position: relative;
  height: 100%;
  width: 100%;
  .footer {
    width: 100%;
    position: absolute;
    left: 0;
    bottom: 0;
  }
}
</style>
