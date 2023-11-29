<template>
  <div>
    <!-- 表单布局 -->
    <van-cell-group>
      <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
        <template v-if="showFormList.length > 0" #title>
          <van-icon :name="show ? 'arrow-down' : 'arrow'" @click="show = !show" />
        </template>
        <template>
          <FormVue ref="formComponent" :form-data.sync="form" :form-list="formList" />
        </template>
      </van-cell>
    </van-cell-group>
    <!-- 隐藏字段布局 -->
    <van-cell-group v-show="show" :style="showFormList.length > 0 ? 'padding-left: 20px' : ''">
      <FormVue ref="showFormComponent" :form-data.sync="form" :form-list="showFormList" />
    </van-cell-group>
    <!-- 列表信息总览 -->
    <van-sticky :offset-top="46">
      <van-grid direction="horizontal" :column-num="4" :border="false" style="border-top: 1px solid #ccc; border-bottom: 1px solid #ccc">
        <van-grid-item>总数：{{ tableData.length }}</van-grid-item>
        <van-grid-item>已确认：{{ selection.length }}</van-grid-item>
        <van-grid-item>剩余数：{{ tableData.length - selection.length }}</van-grid-item>
        <van-grid-item>
          <van-checkbox v-model="selectAll" shape="square" @click="handleSelectAll">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>
    <!-- 列表 -->
    <TableVue
      ref="table"
      :table-data.sync="tableData"
      :selection.sync="selection"
      :table-column="tableColumn"
      @input-num-handler="inputNumHandler"
      @clickHandlerEvent="handlePartList"
    />

    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" confirm-text="过账" @clear="handleClear" @confirm="handleConfirm" />
    <UserAuth :visible.sync="userAuthVisible" :extra.sync="extraParams" />
    <!-- 配件清单对话框 -->
    <TableDialogVue :visible.sync="visible" :table-data="partList" :table-column="partListTableColumn" />
  </div>
</template>

<script>
// 262辅料发料-线边仓WMS
import TableDialogVue from '@/views/businessComponents/TableDialog.vue'
import FormVue from '@/components/Form/index.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { WMSAPI } from '@/api/generalAPI'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { deepClone } from '@/utils'
import { GetBoxInfoByBoxId, GetUserWarehouse } from '@/api/common'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { mapGetters } from 'vuex'
import { validateAuthAndSelected } from '@/utils/validateOperateForQty'
import { validateTableSelected } from '@/utils/business'
import { customerDialog } from '@/components/CustomerDialog'
import mixinPartList from '@/views/mixins/PartList'
const passAPIName = 'business/webapi/PostIn'
// 查询表体数据的借口
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
const imOclas = 'XWMS261D'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
const cachedName = 'shipment.261AccessoriesIssuance-LineSideWarehouseWMS'
export default {
  name: cachedName,
  components: {
    TableDialogVue,
    FormVue,
    TableVue,
    ActionBarVue,
    UserAuth
  },
  mixins: [mixinPartList],
  data() {
    return {
      numBlurParams: {
        key: 'erfmg',
        index: 0
      },
      show: false,
      form: {
        postDate: today
      },
      loading: false,
      selectAll: false, // 是否全选
      scanLoading: false, // 扫条码时进行loading
      originTableData: [],
      selection: [],
      formList,
      showFormList,
      tableColumn,
      tableData: [],
      userAuthVisible: true,
      extraParams: {},
      barcodeInputRef: null,
      boxInputRef: null,
      passAPIName,
      partList: [],
      visible: false,
      tableBtnParams: {}
    }
  },
  computed: {
    ...mapGetters(['account', 'name']),
    multiList() {
      let { selectedList, list } = this
      return { selectedList, list }
    }
  },
  watch: {
    // 对比选中项长度与数据数组总长度，是否可以勾选全选复选框
    multiList: {
      handler: function (val) {
        const { selectedList, list } = val
        this.selectAll = selectedList.length === list.length && selectedList.length !== 0
      }
    }
  },
  created() {
    this.getWareHouseListAndUpdate()
  },
  mounted() {
    this.initConfig()
    this.fousOfFirst()
  },
  methods: {
    // tips：让第一个可以输入的输入源获取光标
    fousOfFirst() {
      let result = this.formList.filter((item) => item.type === 'Input')
      if (result.length > 0) {
        let prop = result[0].prop
        this.$refs.formComponent.$refs[prop][0].$refs.inputRef.focus()
      }
    },
    initConfig() {
      let _this = this
      _this.tableColumn.forEach((item) => {
        if (item.type === 'Table/Number') {
          let _erfmgRules = [{ required: true, message: '请输入数量', trigger: 'onBlur' }, { validator: _this.validateFunc }]
          item.rules = _erfmgRules
        }
      })
      _this.formList.forEach((item) => {
        if (item.prop === 'warehouseNo') {
          item.change = _this.wareHouseChange
        }
        if (item.prop === 'wmsTools') {
          item.enter = (val) => _this.boxIDEnter(val)
          _this.boxInputRef = _this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'imBarcode') {
          item.enter = _this.barcodeEnter
          _this.barcodeInputRef = _this.getVueComponentByProp(item.prop)
        }
      })
    },
    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    // 根据prop和index获取表格中表单组件
    getVueComponentByTableProp(prop, index) {
      return this.$refs.table.$refs[`${prop}_${index}`][0].$refs.input
    },
    // 具体校验函数
    validateFunc() {
      let { key, index } = this.numBlurParams
      // 改变后的值
      let x = Number(this.tableData[index][key])
      // 原始值
      let y = this.originTableData[index][key]
      if (!x || x < 0) return '数量不能小于等于0'
      if (x > y) return '数量不能大于' + y
      else return true
    },
    boxIDEnter(val) {
      if (!val) return
      GetBoxInfoByBoxId(val)
        .then((res) => {
          this.form.locationId = res.locationNo
          // console.log(res)
          // 判断箱子号是否存在
          if (!res.success) {
            _showFailToast(res.message)
          }
        })
        .finally(() => {
          this.barcodeInputRef.focus()
        })
    },
    /**
     * @description: 条码确认事件,加载列表数据
     * @param {*} val
     */
    barcodeEnter(val) {
      if (!this.form.imBarcode) {
        _showFailToast('请扫条码')
        return
      }
      this.scanLoading = true
      WMSAPI.get(listAPIName, {
        imOclas: imOclas,
        imBarcode: val
      })
        .then((res) => {
          if (res.success) {
            let _data = res.data
            // 混入唯一值，用于勾选数据
            this.tableData = _data.map((item) => ({ ...item, uuid: uuidv4(), operator: this.extraParams.cardname }))
            // 深拷贝保留一份副本
            this.originTableData = deepClone(this.tableData)
            this.$nextTick(() => {
              // 默认勾选数据
              // let selectArr = this.tableData.map((item) => item.uuid)
              // this.$refs.table?.handleSelect(selectArr)
              this.selectAll = true
              this.handleSelectAll()
            })
          } else {
            _showFailToast(res.message)
          }
        })
        .finally(() => {
          this.scanLoading = false
        })
    },
    // 箱子输入确认事件
    async boxEnter(val) {
      let res = await GetBoxInfoByBoxId(val)
      if (res.success) {
        // 成功就自动聚焦到条码
        this.$refs.formComponent?.refs.formInputRef?.imBarcode.inputRef.focus()
      } else {
        this.form.wmsTools = ''
        let inputRef = this.$refs.formComponent?.refs.formInputRef?.wmsTools.inputRef
        inputRef.focus()
        _showFailToast(res.message)
      }
    },
    // 获取可编辑项的prop
    // 取出tableColumn中类型是Table/Number的项目的prop，因为这个才是可以编辑的项
    getEditableKey() {
      let tarItem = this.tableColumn.find((item) => item.type === 'Table/Number')
      let key = tarItem ? tarItem.prop : 'erfmg'
      return key
    },
    // 确定过账
    async handleConfirm() {
      this.getEditableKey()
      try {
        await this.$refs.formComponent?.$refs.refForm.validate()
        await validateAuthAndSelected(this.extraParams, this.selection)
        await validateTableSelected(this.tableColumn, this.selection)
        if (this.form.imBarcode) {
          // await this.$dialog.confirm({
          //   title: '提示',
          //   message: `本次过账共 ${this.selection.length} 条数据,累计数量是: ${this.computedTotal(this.selection)},是否确认过账？`
          // })
          await customerDialog({
            count: this.selection.length,
            total: this.computedTotal(this.selection),
            countPrefix: '本次过账共',
            countSuffix: '条数据,',
            totalPrefix: '累计数量是',
            totalSuffix: '确定过账吗?'
          })

          this.loading = true
          // 处理接口参数
          let _form = Object.assign({}, this.form)
          let postDate = _form.postDate
          delete _form.postDate
          // 删除uuid,遍历实现,同时把箱子和区域信息混入
          let result = []
          this.selection.forEach((item) => {
            result.push({ ...item, wmsTools: this.form.wmsTools, locationId: this.form.locationId })
          })
          let _list = JSON.parse(JSON.stringify(result))
          _list.forEach((item) => delete item.uuid)
          let _data = fomrmatShipmentSubmitParams(
            imOclas,
            this.account,
            this.name,
            this.form.warehouseNo,
            _list,
            'in',
            undefined,
            undefined,
            undefined,
            'maktx',
            postDate
          )
          WMSAPI.post(passAPIName, _data)
            .then((res) => {
              if (res && res.success) {
                _showSuccessToast({
                  message: res.msg,
                  duration: 10 * 1000
                })
                // 清空表单和列表
                this.submitClear()
              } else {
                _showFailToast(res.message)
              }
            })
            .finally(() => {
              this.loading = false
            })
        } else {
          _showFailToast('请输入条码号')
        }
      } catch (e) {
        console.log(e)
        this.loading = false
      }
    },
    // 清除按钮
    handleClear() {
      this.tableData = []
      this.selectAll = false
      this.selection = []
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo
      }
      this.show = false
      this.fousOfFirst()
    },
    submitClear() {
      this.tableData = []
      this.selectAll = false
      this.selection = []
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo,
        wmsTools: this.form.wmsTools
      }
      this.show = false
      this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
    },
    // 全选
    handleSelectAll() {
      this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
    },
    // 计算勾选的累计数量
    computedTotal(arr) {
      let key = this.getEditableKey()
      return arr.reduce((pre, next) => {
        // eslint-disable-next-line no-prototype-builtins
        if (pre.hasOwnProperty(key)) {
          return Number(pre[key]) + Number(next[key])
        } else {
          return Number(next[key])
        }
      }, 0)
    },

    // 数量输入框的回调事件
    inputNumHandler(key, index) {
      console.log(key, index)
    },
    // 得到仓库数据，更新仓库列表
    // TODO 这部分先写死一个工号获取仓库数据
    async getWareHouseListAndUpdate() {
      let res = await GetUserWarehouse()
      if (res.success) {
        this.formList[0].options = res.datas
        // tips:默认选中第一个
        if (res.datas.length > 0) {
          this.$set(this.form, 'warehouseNo', res.datas[0].warehouseNo)
        }
        this.boxInputRef.focus()
      }
    },
    // 按钮-配件清单
    handlePartList(key, data, index) {
      console.log('配件')
      this.tableBtnParams = this.tableColumn[2].tableBtnParams
      this.getPartList(key, data, index)
    }
  }
}
</script>
<style scoped lang="scss">
.loading_wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
