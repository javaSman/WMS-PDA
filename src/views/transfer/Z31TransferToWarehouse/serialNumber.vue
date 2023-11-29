<template>
  <van-dialog v-model="show" :title="title" class="tableDialogVue">
    <!-- 列表信息总览 -->
    <van-sticky :offset-top="0">
      <van-grid direction="horizontal" :column-num="3" :border="false" style="border-top: 1px solid #ccc; border-bottom: 1px solid #ccc">
        <van-grid-item>总数：{{ list.length }}</van-grid-item>
        <van-grid-item>已扫描：{{ list.length }}</van-grid-item>
        <van-grid-item>剩余数：{{ list.length - list.length }}</van-grid-item>
      </van-grid>
    </van-sticky>
    <FormVue ref="formComponent" :form-data.sync="dataMap.form" :form-list="dataMap.formList" />
    <div class="SN_tableList">
      <TableVue ref="table" :table-data="list" :table-column="dataMap.tableColumn" :disabled-chk="true" />
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
      dataMap: {
        form: {},
        formList: SNFormList,
        tableList: [],
        tableColumn: SNTableColumn
      }
    }
  },
  computed: {
    show: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    }
  },
  mounted() {
    this.initConfig()
  },
  methods: {
    initConfig() {
      this.dataMap.formList.forEach((item) => {
        if (item.prop === 'equnr') {
          item.enter = this.handelScanBarcode
        }
      })
    },
    // TODO:这个功能还没有实现
    handelScanBarcode(val) {
      if (!val) {
        _showFailToast('请扫描序列号!')
        return
      }
      console.log(' this.list', this.list)
      // 判断该条码在数据中是否存在
      let target = this.list.find((item) => item.equnr === val)
      if (!target) {
        _showFailToast(`条码${this.barcode}中不存在序列号${val}`)
        this.dataMap.form.imBarcode = ''
        return
      }
      // 判断是否已经扫码过
      let _target = this.dataMap.tableList.find((item) => item.equnr === val)
      if (_target) {
        _showFailToast(`序列号${val}已存在，请勿重复扫码!`)
        this.dataMap.form.imBarcode = ''
        return
      }
      // 不存在
      this.dataMap.tableList.push(target)
      // 清除输入框
      this.dataMap.form = {}
    },
    // 确定是否可以过账
    handleConfirmIsPass() {
      if (this.props.list.length === this.dataMap.tableList.length) {
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
