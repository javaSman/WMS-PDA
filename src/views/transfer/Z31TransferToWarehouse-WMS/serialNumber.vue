<template>
  <van-dialog v-model="show" :title="title" class="tableDialogVue">
    <!-- 列表信息总览 -->
    <van-sticky :offset-top="0">
      <van-grid direction="horizontal" :column-num="3" :border="false" style="border-top: 1px solid #ccc; border-bottom: 1px solid #ccc">
        <van-grid-item>总数：{{ list.length }}</van-grid-item>
        <van-grid-item>已扫描：{{ tableList.length }}</van-grid-item>
        <van-grid-item>剩余数：{{ list.length - tableList.length }}</van-grid-item>
      </van-grid>
    </van-sticky>
    <FormVue ref="formComponent" :form-data.sync="form" :form-list="formList" />
    <div class="SN_tableList">
      <TableVue ref="table" :table-data="tableList" :table-column="tableColumn" :disabled-chk="true" />
    </div>
    <template #footer>
      <van-button square type="primary" size="normal" style="float: right; width: 40%" @click="handleConfirmIsPass">确定</van-button>
    </template>
  </van-dialog>
</template>

<script>
import TableVue from '@/components/Table/index.vue'
import FormVue from '@/components/Form/index.vue'
import { SNFormList, SNTableColumn } from './config'
import { _showFailToast } from '@/utils/message'
export default {
  name: 'SerialNumberDialogVue',
  components: {
    TableVue,
    FormVue
  },
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: '' },
    barcode: { type: String, default: '' },
    list: { type: Array, default: () => [] }, // 确认信息数组
    isPass: { type: Boolean, default: false } // 确认是否可以过账，默认为true，条件为list全部选中为true，否则为false
  },
  data() {
    return {
      form: {},
      formList: SNFormList,
      tableList: [],
      tableColumn: SNTableColumn
    }
  },
  computed: {
    show: {
      get() {
        return this._props.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    }
  },
  mounted() {
    this.formList[0].enter = this.handelScanBarcode
  },
  methods: {
    handelScanBarcode(val) {
      if (!val) {
        _showFailToast('请扫描序列号!')
        return
      }
      // 判断该条码在数据中是否存在
      let target = this._props.list.find((item) => item.equnr === val)
      if (!target) {
        _showFailToast(`条码${this._props.barcode}中不存在序列号${val}`)
        this.form.imBarcode = ''
        return
      }
      // 判断是否已经扫码过
      let _target = this.tableList.find((item) => item.equnr === val)
      if (_target) {
        _showFailToast(`序列号${val}已存在，请勿重复扫码!`)
        this.form.imBarcode = ''
        return
      }
      // 不存在
      this.tableList.push(target)
      // 清除输入框
      this.form = {}
    },
    handleConfirmIsPass() {
      if (this._props.list.length === this.tableList.length) {
        this.$emit('update:isPass', true)
      } else {
        this.$emit('update:isPass', false)
      }
      this.show = false
    }
  }
}
</script>

<style lang="scss" scoped>
.SN_tableList {
  height: calc(50vh - 93px);
  overflow: auto;
  overflow-x: hidden;
}
</style>
