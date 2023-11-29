<template>
  <div>
    <!-- 表单布局-隐藏字段布局 -->
    <FormGroup ref="refFormGroup" :form-list="formList" :form.sync="form" :show.sync="show" />
    <!-- 列表 -->
    <TableVue ref="table" :table-data.sync="list" :table-column="tableColumn" @clickHandlerEvent="clickHandler" />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" :confirm-text="confirmText" @clear="handleClear" @confirm="getDetailEnter" />
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
    <van-dialog v-model="dialogShow" confirm-button-color="#000" class="tableDialogVue" @confirm="dialogShow = false">
      <TableVue ref="table" :table-data="curDetailsList" :table-column="detailsTableColumn" class="dlg-table" />
    </van-dialog>
  </div>
</template>

<script>
import FormGroup from '@/views/wmsFunction/components/FormGroup.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { WMSAPI } from '@/api/generalAPI'
import { v4 as uuidv4 } from 'uuid'
import { detailsTableColumn } from '../config/index'
import { _showFailToast } from '@/utils/message'
export default {
  name: 'ToggleFormWMSVue',
  components: {
    FormGroup,
    TableVue,
    ActionBarVue
  },
  props: {
    formList: { type: Array, default: () => [] }, // 表单项数组
    showFormList: { type: Array, default: () => [] }, // 需要展开显示的数据字段参数
    tableColumn: { type: Array, default: () => [] }, // 列表字段参数
    chkDisabled: { type: Boolean, default: () => false },
    submit: { type: Function, default: undefined }, // 过账按钮前执行事件
    passAPIName: { type: String, default: () => '' }, // 过账接口地址
    listAPIName: { type: String, default: () => '' }, // 扫码查询接口地址
    boxIDAPIName: { type: String, default: () => '' }, // 扫码箱子号查询接口地址
    getDetailAPIName: { type: String, default: () => '' }, //  扫码查询接口地址
    type: { type: String, default: () => '' }, // 页面业务类型
    wmsOclas: { type: String, default: () => '' }, // 页面业务类型
    confirmText: { type: String, default: () => '过账' }, // 底部按钮显示文本
    enterFrontEvent: { type: Function, default: () => false }, // 条码回车事件前执行事件
    enterAfterEvent: { type: Function, default: undefined }, // 条码回车事件后执行事件，用于重新组合数据
    isPass: { type: Boolean, default: () => true },
    // 1.扫码匹配字段一标识key，此key是用来实现业务的，必须传入；2.追加数据判断是否重复扫码的唯一识别符
    scanlKey: { type: String, default: 'matnr' },
    // 当前模式，all：加载接口后全选；one：扫码匹配或手动勾选，需传值scanlKey匹配字段；handler：只能手动勾选；addTo：追加数据
    mode: { type: String, default: 'one' }
  },
  data() {
    return {
      detailsTableColumn,
      form: {}, // 表单对象，初始化过账日期
      show: false, // 点击左侧箭头是否展开
      list: [], // 列表数据
      loading: false, // 过账按钮loading
      scanLoading: false, // 扫条码时进行loading
      dialogShow: false, // 明细弹窗
      detailsList: [], // 明细列表数据
      curDetailsList: [], // 当前明细列表数据
      materialInputRef: null, // 物料ref
      projectInputRef: null, // 项目号ref
      stationInputRef: null // 工位号ref
    }
  },
  computed: {},
  created() {},
  mounted() {
    this.initConfig()
    this.materialInputRef?.focus()
  },
  methods: {
    /** 回车带出明细 */
    getDetailEnter() {
      let { materialNo, projectBatch, stationNo } = this.form
      if ((materialNo ?? '') === '' && (projectBatch ?? '') === '' && (stationNo ?? '') === '') {
        _showFailToast('请输入至少一个查询条件!')
        return
      }
      let splitArr = (projectBatch ?? '') === '' ? [] : projectBatch.split('-')
      if (splitArr.length !== 2 && splitArr.length !== 0) {
        _showFailToast('请正确输入项目号-批次号!')
        return
      }
      let data = { materialNo, stationNo, projectNo: splitArr[0], batch: splitArr[1], type: 1 }
      this.scanLoading = true
      WMSAPI.get(this.getDetailAPIName, data)
        .then((res) => {
          if (res && res.success) {
            let _data = res.locationList ?? []
            if (_data.length === 0) {
              _showFailToast(`暂无明细`)
            }
            // 增加uuid为唯一识别符
            _data.forEach((item, index) => {
              item.index = index + 1
              item.uuid = uuidv4()
            })
            // 赋值表格数据
            this.list = _data
            this.detailsList = res.barcodeList
          } else {
            _showFailToast(res.message)
          }
        })
        .finally(() => {
          this.scanLoading = false
        })
    },

    // 行右键点击方法-查看明细
    clickHandler(key, data) {
      this.dialogShow = true
      this.curDetailsList = this.detailsList.filter((item) => item.locationNo === data.locationNo)
      this.curDetailsList.forEach((item, index) => {
        item.index = index + 1
        item.uuid = uuidv4()
      })
    },

    // 初始化配置项
    initConfig() {
      let _this = this
      _this.formList.forEach((item) => {
        // 箱子号-获取箱子明细
        if (item.prop === 'materialNo') {
          item.enter = function () {
            _this.materialInputRef = _this.getVueComponentByProp(item.prop)
            _this.projectInputRef?.focus()
          }
        }
        if (item.prop === 'projectBatch') {
          _this.projectInputRef = _this.getVueComponentByProp(item.prop)
          _this.stationInputRef?.focus()
        }
        if (item.prop === 'stationNo') {
          _this.stationInputRef = _this.getVueComponentByProp(item.prop)
          item.enter = this.getDetailEnter
        }
      })
    },
    /** 根据prop的值获取该输入框 */
    getVueComponentByProp(prop) {
      return this.$refs.refFormGroup.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    // 清空
    handleClear() {
      // table数据
      this.list = []
      // 表单
      this.form = {}
    }
  }
}
</script>

<style lang="scss" scoped>
.loading_wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.dlg-table {
  margin: 0 10px 10px;
  :deep(.tableCellGroup) {
    border: 1px solid #ddd;
  }
}
</style>
