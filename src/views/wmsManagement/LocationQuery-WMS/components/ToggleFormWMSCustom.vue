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
    <TableVue ref="table" :table-data.sync="list" :table-column="tableColumn" :selection.sync="selectedList">
      <template #checkbox="{ item, index }">
        <van-switch v-model="list[index][item.prop]" size="18px" />
        是
      </template>
    </TableVue>
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
import FormGroup from '@/views/wmsFunction/components/FormGroup.vue'
import SummaryCheck from '@/views//wmsFunction/components/SummaryCheck.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { WMSAPI } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { GetUserWarehouse } from '@/api/common'
import { _showFailToast } from '@/utils/message'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
export default {
  name: 'ToggleFormWMSVue',
  components: {
    FormGroup,
    TableVue,
    SummaryCheck,
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
      wareHouseList: [], // 用于存储仓库列表
      nextInputRef: null // 第一个输入框-仓库选择后聚焦
    }
  },
  computed: {},
  created() {},
  mounted() {
    this.initConfig()
  },
  methods: {
    // TODO: 目前没有权限，先写死用户工号
    /** 根据用户工号获取仓库列表 */
    async getUserWarehouse() {
      try {
        let res = await GetUserWarehouse()
        if (res.success) {
          this.wareHouseList = res.datas
          // tips:默认选中第一个
          if (res.datas.length > 0) {
            this.$set(this.form, 'warehouseNo', res.datas[0].warehouseNo)
          }
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      }
    },

    /** 仓库change */
    wareHouseChange(val) {
      if (!val) return
      this.nextInputRef?.focus()
    },

    /** 回车带出明细 */
    getDetailEnter(val) {
      if (!val) return
      let _this = this
      this.scanLoading = true
      WMSAPI.get(this.getDetailAPIName, { locationNo: val })
        .then((res) => {
          if (res && res.success) {
            let _data = res.boxList
            this.selectedList = []
            if (_data.length === 0) {
              _showFailToast(`区域[${val}]下没有明细箱子，请重新扫码`)
              _this.$set(_this.form, 'locationID', '') // locationID 字段根据需求
              this.nextInputRef?.focus()
              this.list = _data
              return
            }
            // 增加uuid为唯一识别符
            _data.forEach((item) => {
              item.uuid = uuidv4()
            })
            // 赋值表格数据
            this.list = _data
            // 存储原始数据
            this.staticData = JSON.parse(JSON.stringify(_data))
            this.staticData.forEach((item) => {
              item.newQuantity = item.quantity
            })
            // 光标跳转
            this.nextInputRef?.focus()
          } else {
            _showFailToast(res.message)
          }
        })
        .finally(() => {
          this.scanLoading = false
        })
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
        await this.$dialog.confirm({
          title: '提示',
          message: `本次过账共 ${this.selectedList.length} 条数据`
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
          let res = await WMSAPI.post(this.passAPIName, _data)
          if (res && res.success) {
            this.$toast.success(res.message ?? '操作成功')
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

    // 获取过账的参数
    getPassParams(_list) {
      let { locationNo } = this.form
      let boxNos = _list.map((item) => {
        return item.boxNo
      })
      let { account, name } = this.$store.getters
      let _data = {
        locationNo: locationNo, // 区域
        boxNos: boxNos, // 箱子数组
        cardNo: account, // 工号
        cardName: name, // 姓名
        oclas: '', // 移到类型-无数据
        remark: '', // 备注-无数据
        addResume: true // 后端说传-默认值-true
      }
      return _data
    },

    // 初始化配置项
    async initConfig() {
      let _this = this
      await this.getUserWarehouse()
      _this.formList.forEach((item) => {
        // 仓库-获取下拉列表
        if (item.prop === 'warehouseNo') {
          item.change = this.wareHouseChange
          item.options = this.wareHouseList
        }
        // 箱子号-获取箱子明细
        if (item.prop === 'locationNo') {
          item.enter = this.getDetailEnter
          _this.nextInputRef = _this.getVueComponentByProp(item.prop)
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
      // 选中项集合
      this.selectedList = []
      // 表单
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo
      }
    },

    /** 全选和反选 */
    handleSelectAll() {
      this.$refs.table?.$refs.checkboxGroup.toggleAll(this.selectAll)
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
