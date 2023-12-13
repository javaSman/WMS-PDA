<template>
  <div>
    <!-- 表单布局 -->
    <van-cell-group>
      <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
        <template v-if="showFormList.length > 0" #title>
          <van-icon :name="show ? 'arrow-down' : 'arrow'" @click="show = !show" />
        </template>
        <FormVue ref="formComponent" :form-data.sync="form" :form-list="formList" class="form-group" />
      </van-cell>
    </van-cell-group>
    <!-- 隐藏字段布局 -->
    <van-cell-group v-show="show" :style="showFormList.length > 0 ? 'padding-left: 20px' : ''">
      <FormVue ref="showFormComponent" :form-data.sync="form" :form-list="showFormList" class="form-group" />
    </van-cell-group>
    <van-sticky :offset-top="46">
      <van-grid direction="horizontal" :column-num="4" :border="false" style="border-top: 1px solid #ccc; border-bottom: 1px solid #ccc">
        <van-grid-item>总数：{{ list.length }}</van-grid-item>
        <van-grid-item>已确认：{{ selectedList.length }}</van-grid-item>
        <van-grid-item>剩余数：{{ list.length - selectedList.length }}</van-grid-item>
        <van-grid-item>
          <van-checkbox v-model="selectAll" shape="square" @click="handleSelectAll">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>
    <!-- 列表 -->
    <TableVue
      ref="table"
      :is-virtually="true"
      :table-data.sync="list"
      :table-column="tableColumn"
      :selection.sync="selectedList"
      @inputNumHandler="inputNumHandler"
    />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" @clear="handleClear" @confirm="handleConfirm" />
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading" :duration="0">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
  </div>
</template>

<script>
import { formList, showFormList, tableColumn } from './config'
import FormVue from '@/components/Form/index.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { WMSAPI, WMSAPI_WCF } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { GetUserWarehouse, GetBoxInfoByBoxId, GetLocationInfo } from '@/api/common'
import { _showFailToast } from '@/utils/message'
import { customerDialog } from '@/components/CustomerDialog'
import { computedTotal, validateOriginQtyLimit } from '@/utils/validateOperateForQty'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
const passAPIName = 'business/webapi/PostIn'
// const listAPIName = 'business/webapi/GetMaterialBarcodeList'
const listAPIName = '9037Wcf/WarehouseService.svc/rest/GetMaterialBarcodeByBarcode'
const imOclas = '库存绑定'
// 库存绑定-WMS
const cachedName = 'WMSFunction.InventoryBind-WMS'
// 存储源数组用来校验数量的
let staticData = []
export default {
  name: cachedName,
  components: {
    FormVue,
    TableVue,
    ActionBarVue
  },
  data() {
    return {
      listAPIName,
      formList,
      showFormList,
      tableColumn,
      passAPIName,
      form: {
        postDate: today
      }, // 表单对象，初始化过账日期
      show: false, // 点击左侧箭头是否展开
      selectAll: false, // 是否全选
      selectedList: [], // 选中项集合
      list: [], // 列表数据
      loading: false, // 过账按钮loading
      scanLoading: false, // 扫条码时进行loading
      boxInputRef: null, // 箱子号ref
      targetBoxInputRef: null, // 目标箱子号ref
      areaInputRef: null, // 区域ref
      numBlurParams: { key: 'newQuantity', index: 0 }
    }
  },
  computed: {
    multiList() {
      let { selectedList, list } = this
      return { selectedList, list }
    }
  },
  watch: {
    multiList: {
      handler: function (val) {
        const { selectedList, list } = val
        this.selectAll = selectedList.length === list.length && selectedList.length !== 0
      }
    }
  },
  mounted() {
    this.getUserWarehouse()
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
      this.tableColumn.forEach((item) => {
        if (item.type === 'Table/NumberInput') {
          let _erfmgRules = [
            { required: true, message: '请输入数量', trigger: 'onBlur' },
            { validator: this.validateErfmg, message: '数量不能大于标签数量且不能小于等于0' }
          ]
          item.rules = _erfmgRules
        }
      })
      this.formList.forEach((item) => {
        // 仓库-获取下拉列表
        if (item.prop === 'warehouseNo') {
          item.change = this.wareHouseChange
        }

        // 箱子号/接收箱子号-获取区域
        if (item.prop === 'wmsTools') {
          item.enter = this.boxNoEnter
          this.boxInputRef = this.getVueComponentByProp(item.prop)
        }
        // 区域回车事件
        if (item.prop === 'locationID') {
          item.enter = this.areaEnter
          this.areaInputRef = this.getVueComponentByProp(item.prop)
        }
        // 条码
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
          this.barcodeInputRef = this.getVueComponentByProp(item.prop)
        }
      })
    },
    /** 根据用户工号获取仓库列表 */
    async getUserWarehouse() {
      try {
        let res = await GetUserWarehouse()
        if (res.success) {
          this.formList[0].options = res.datas
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
    wareHouseChange(val) {
      if (!val) return
      this.boxInputRef?.focus()
    },
    /** 箱子号回车
     *  1、查询箱子是否存在-
     *  2、查询箱子是否有绑定货位-（1）未绑定货位-光标跳转到【货位】；（2）已绑定货位-给货位赋值、光标跳转到【下一输入框】
     */
    async boxNoEnter(val) {
      if (!val) return
      // 调用接口带出区域，如果区域有值，光标跳转到条码，没有跳转到区域
      let res = await GetBoxInfoByBoxId(val)
      // 判断箱子号是否存在
      if (res.success) {
        // 判断箱子号是否可以带出货位
        if (res.locationNo) {
          this.$set(this.form, 'locationID', res.locationNo) // locationID 字段根据需求
          this.barcodeInputRef?.focus()
        } else {
          this.areaInputRef?.focus()
        }
      } else {
        _showFailToast(res.message)
        if (res.message.includes('没有绑定货位')) {
          this.areaInputRef?.focus()
        } else {
          this.boxInputRef?.focus() // boxInputRef 字段根据需求
          this.$set(this.form, 'boxID', '')
        }
        this.$set(this.form, 'locationID', '')
      }
    },
    async areaEnter(val) {
      let res = await GetLocationInfo(val)
      if (!res.success) {
        _showFailToast(res.message)
      } else {
        this.barcodeInputRef.focus()
      }
    },
    /** 条码回车 */
    async barcodeEnter(val) {
      if (val.length > 18) {
        _showFailToast('当前所扫条码超过最大长度，可能是扫太快导致的，请适当增加扫码间隔时间')
        this.form.imBarcode = ''
        // 查询结果之后重新聚焦
        this.barcodeInputRef?.focus()
        return false
      }
      if (!val) {
        _showFailToast('请输入条码')
        return
      }
      if (!this.form.wmsTools) {
        _showFailToast('请先扫箱子')
      }
      // 1.判断是否重复扫码
      if (this.list.length > 0) {
        let target = this.list.filter((item) => item['barcode'] === val)
        if (target.length > 0) {
          _showFailToast('请勿重复扫码')
          this.$nextTick(() => {
            this.$set(this.form, 'imBarcode', '')
            this.barcodeInputRef?.focus()
          })
          return
        }
      }
      // 2.不重复则调用接口追加数据
      try {
        this.scanLoading = true
        let res = await WMSAPI_WCF.get(this.listAPIName, { barcodes: val, boxNo: this.form.wmsTools })
        if (res && res.success) {
          let _data = res.barcodeList
          // 清空输入框
          this.form.imBarcode = ''
          if (_data === null || _data.length === 0) {
            _showFailToast('暂无数据')
            return
          }
          // 增加uuid为唯一识别符
          // tips:默认让输入数量是在库数量
          _data.forEach((item) => {
            item.uuid = uuidv4()
            item.menge = item.quantity
            // item.menge = mengeNum
            // this.list.push(item)
          })
          this.list = [..._data.map((item) => ({ ...item, newQuantity: item.quantity })), ...this.list]
          // 存储原始数据
          staticData = JSON.parse(JSON.stringify(this.list))
          staticData.forEach((item) => {
            item.newQuantity = item.quantity
          })
          let arrs = this.list.map((item) => item.uuid)
          this.selectedList = arrs
          // 默认勾选数据
          // this.$refs.table?.handleSelect(arrs)
        } else {
          _showFailToast(res.message)
        }
      } finally {
        this.scanLoading = false
        this.form.imBarcode = ''
        // 查询结果之后重新聚焦
        this.barcodeInputRef?.focus()
      }
    },
    /** 过账 */
    async handleConfirm() {
      let _selection = this.list.filter((item) => this.selectedList.includes(item.uuid))
      let { account, name } = this.$store.getters
      try {
        // 表单验证
        await this.$refs.formComponent.$refs.refForm.validate()
        if (this.selectedList.length === 0) {
          _showFailToast('请勾选数据')
          return
        }
        if (!_selection.every((item) => Number(item['newQuantity']) > 0)) {
          _showFailToast('所提交项中存在数量小于或等于0的项目，请检查')
          return
        }
        // 物料编号长度不等于12时，进行提示
        //  if (!_selection.every((item) => item['materialNo'].length === 12)) {
        //   _showFailToast('所提交项中存在物料编号不正确，请检查')
        //   return
        // }
        await validateOriginQtyLimit(staticData, _selection, 'newQuantity', 'menge')
        await customerDialog({
          count: this.selectedList.length,
          total: computedTotal(_selection, 'newQuantity'),
          countPrefix: '本次过账共',
          countSuffix: '条数据,',
          totalPrefix: '累计数量是',
          totalSuffix: '确定过账吗?'
        })
        // 开始过账
        this.loading = true
        // 处理接口参数
        let _list = JSON.parse(JSON.stringify(_selection))
        _list.forEach((item) => delete item.uuid)
        // tips:混入接收箱子，目标箱子数据
        _list = _list.map((item) => ({
          ...item,
          wmsTools: this.form.wmsTools,
          locationId: this.form.locationID,
          quantity: item.newQuantity
        }))
        // 处理接口参数
        let _form = Object.assign({}, this.form)
        let postDate = _form.postDate
        delete _form.postDate
        let _data = fomrmatShipmentSubmitParams(
          imOclas,
          account,
          name,
          this.form.warehouseNo,
          _list,
          'in',
          null,
          null,
          null,
          'materialDesc',
          postDate
        )
        // tips:移除不需要的属性
        delete _data.zxstXmbeStruList
        // 表单验证完后，若有自定义方法，则执行
        let res = await WMSAPI.post(this.passAPIName, _data)
        if (res && res.success) {
          this.$toast.success(res.message || '过账成功')
          // 清空表单和列表
          this.submitClear()
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        if (e !== 'cancel') {
          _showFailToast('请检查表单项是否填写正确')
        }
      } finally {
        this.loading = false
      }
    },
    validateErfmg() {
      let { key, index } = this.numBlurParams
      // 改变后的值
      let x = Number(this.list[index][key])
      if (/^\+?[1-9][0-9]*$/.test(this.list[index][key])) {
        // 原始值
        let y = staticData[index]['menge']
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

    /** 根据prop的值获取该输入框 */
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    /** 手动清空 */
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
      staticData = []
      this.fousOfFirst()
    },
    /** 过账清除 */
    submitClear() {
      // table数据
      this.list = []
      // 选中项集合
      this.selectedList = []
      staticData = []
      // 表单
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo,
        wmsTools: this.form.wmsTools,
        locationID: this.form.locationID
      }
      this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
    },
    /** 全选和反选 */
    handleSelectAll() {
      if (this.selectedList.length === this.list.length) {
        this.selectedList = []
      } else {
        this.selectedList = this.list.map((item) => item.uuid)
      }
      // this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
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
.form-vue {
  :v-deep .van-cell__title {
    width: 60px !important;
  }
}
</style>
