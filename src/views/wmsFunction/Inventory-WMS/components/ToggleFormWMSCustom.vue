<template>
  <div>
    <!-- 表单布局-隐藏字段布局 -->
    <FormGroup ref="refFormGroup" :show-form-list="showFormList" :form-list="formList" :form.sync="form" :show.sync="show" />
    <!-- 列表信息总览 -->
    <SummaryCheck
      :chk-disabled="chkDisabled"
      :select-all.sync="selectAll"
      :selected-list="selectedList"
      :list="list"
      @handleSelectAll="handleSelectAll"
    />
    <!-- 列表 -->
    <TableVue ref="table" :table-data.sync="list" :table-column="tableColumn" :selection.sync="selectedList" />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" :confirm-text="confirmText" @clear="handleClear" @confirm="handleConfirm" />
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
  </div>
</template>

<script>
import FormGroup from '../../components/FormGroup.vue'
import SummaryCheck from '../../components/SummaryCheck.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { WMSAPI } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
// import { GetBoxInfoByBoxId } from '@/api/common'
import { computedTotal } from '@/utils/wmsFunction'
import { _showFailToast } from '@/utils/message'
import { customerDialog } from '@/components/CustomerDialog'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
export default {
  name: 'ToggleFormWMSVue',
  components: {
    FormGroup,
    SummaryCheck,
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
    type: { type: String, default: () => '' }, // 页面业务类型
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
      form: {
        postDate: today
      }, // 表单对象，初始化过账日期
      show: false, // 点击左侧箭头是否展开
      selectAll: false, // 是否全选
      selectedList: [], // 选中项集合
      list: [], // 列表数据
      loading: false, // 过账按钮loading
      scanLoading: false, // 扫条码时进行loading
      staticData: [], // 用于存储列表原始数据
      boxInputRef: null, // 箱子号ref
      barcodeInputRef: null, // 条码ref
      numBlurParams: { key: 'newQuantity', index: 0 }
    }
  },
  computed: {},
  created() {},
  mounted() {
    this.initConfig()
    this.boxInputRef?.focus()
  },
  methods: {
    // tips：让第一个可以输入的输入源获取光标
    fousOfFirst() {
      let result = this.formList.filter((item) => item.type === 'Input')
      if (result.length > 0) {
        let prop = result[0].prop
        this.$refs.refFormGroup.$refs.formComponent.$refs[prop][0].$refs.inputRef.focus()
      }
    },
    /** 全选和反选 */
    handleSelectAll() {
      this.$refs.table?.$refs.checkboxGroup.toggleAll(this.selectAll)
    },
    /**
     * @description: 当前操作模式为addTo时回车事件
     * @param {*} val 值
     */
    enterByAddTo(val, paramsProp, listProp, inputProp) {
      let _this = this
      // 1.判断是否重复扫码
      if (this.list.length > 0) {
        let target = this.list.filter((item) => item[this.scanlKey] === val)
        if (target.length > 0) {
          _showFailToast('请勿重复扫码')
          return
        }
      }
      let params = {}
      _this.$set(params, paramsProp, val)
      // 2.不重复则调用接口追加数据
      this.scanLoading = true
      WMSAPI.get(this.listAPIName, params)
        .then((res) => {
          if (res && res.success) {
            let _data = res[listProp]
            // 清空输入框
            _this.$set(this.form, inputProp, '')
            if (_data === null || _data.length === 0) {
              _showFailToast('暂无数据')
              return
            }
            // 增加uuid为唯一识别符
            _data.forEach((item) => {
              item.uuid = uuidv4()
              this.list.push(item)
            })
            // 存储原始数据
            this.staticData = JSON.parse(JSON.stringify(this.list))
            this.staticData.forEach((item) => {
              item.newQuantity = item.quantity
            })
            let arrs = this.list.map((item) => item.uuid)
            // 默认勾选数据
            this.$refs.table?.handleSelect(arrs)
          } else {
            _showFailToast(res.message)
          }
        })
        .catch(() => {
          // 在返回错误后清空页面
          // handleClear()
        })
        .finally(() => {
          this.scanLoading = false
          _this.$set(this.form, inputProp, '')
          // 查询结果之后重新聚焦
          this.barcodeInputRef?.focus()
        })
    },

    /** 当前操作模式为addTo时回车事件-条码 */
    boxEnterByAddTo(val) {
      if (!val) {
        _showFailToast('请输入箱子号')
        return
      }
      this.enterByAddTo(val, 'boxId', 'materialBarcodeList', 'boxNo')
    },

    // 过账
    async handleConfirm() {
      try {
        // 表单验证
        await this.$refs.refFormGroup.$refs.formComponent.$refs.refForm.validate()

        // 确认是否可以过账
        if (!this.isPass) {
          _showFailToast('序列号未扫描完。')
          return
        }
        if (this.selectedList.length === 0) {
          _showFailToast('请勾选数据')
          return
        }

        // 过账前确认
        // await this.$dialog.confirm({
        //   title: '提示',
        //   message: `本次过账共 ${this.selectedList.length} 条数据,累计数量是: ${computedTotal(this.selectedList, this.tableColumn)},是否确认过账？`
        // })
        await customerDialog({
          count: this.selectedList.length,
          total: computedTotal(this.selectedList, this.tableColumn),
          countPrefix: '本次过账共',
          countSuffix: '条数据,',
          totalPrefix: '累计数量是',
          totalSuffix: '确定过账吗?'
        })
        // 开始过账
        this.loading = true

        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(this.selectedList))
        _list.forEach((item) => delete item.uuid)

        let _data = {}
        _data = this.getPassParams(_list)

        // 表单验证完后，若有自定义方法，则执行
        if (this.submit) {
          this.submit(_data, this.loading)
        } else {
          console.log(_data)
          let res = await WMSAPI.post(this.passAPIName, _data)
          if (res && res.success) {
            this.$toast.success(res.message || '过账成功')
            // 清空表单和列表
            this.handleClear()
          } else {
            _showFailToast(res.message)
          }
          this.loading = false
        }
      } finally {
        this.loading = false
      }
    },

    // 获取过账（物料类型分拣）的参数
    getPassParams(_list) {
      let { boxNo } = this.form
      let barcodes = _list.map((item) => {
        return item.barcode
      })
      let _data = {
        boxNo: boxNo,
        barcodes: barcodes, // 条码数组
        oclas: '', // 移到类型-无数据
        remark: '', // 备注-无数据
        addResume: true // 后端说传-默认值-true
      }
      return _data
    },
    validateErfmg() {
      let { key, index } = this.numBlurParams
      // 改变后的值
      let x = Number(this.list[index][key])
      if (/^\+?[1-9][0-9]*$/.test(this.list[index][key])) {
        // 原始值
        let y = this.staticData[index]['menge']
        // if (!x || x < 0) return '数量不能小于等于0'
        // if (x > y) return '数量不能大于' + y
        if (!x || x < 0 || x > y) return false
        else return true
      } else {
        return false
        // return '请输入一个大于0的正整数'
      }
    },
    inputNumHandler(key, index) {
      this.numBlurParams = { key, index }
    },
    // 初始化配置项
    async initConfig() {
      let _this = this
      _this.tableColumn.forEach((item) => {
        if (item.type === 'Table/NumberInput') {
          let _erfmgRules = [
            { required: true, message: '请输入数量', trigger: 'onBlur' },
            { validator: _this.validateErfmg, message: '数量不能大于标签数量且不能小于等于0' }
          ]
          item.rules = _erfmgRules
        }
      })
      _this.formList.forEach((item) => {
        // 箱子号
        if (item.prop === 'boxNo') {
          // 追加模式
          item.enter = _this.boxEnterByAddTo
          _this.barcodeInputRef = _this.getVueComponentByProp(item.prop)
        }
      })
    },
    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.refFormGroup.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    // 清空
    handleClear() {
      // table数据
      this.list = []
      // 选中项集合
      this.selectedList = []
      // 表单
      this.form = {
        postDate: today
      }
      this.boxInputRef?.focus()
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
</style>
