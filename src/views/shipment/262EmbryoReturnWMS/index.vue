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
    <TableVue ref="table" :table-data.sync="tableData" :selection.sync="selection" :table-column="formateTableColumn" />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" confirm-text="过账" @clear="handleClear" @confirm="handleConfirm" />
    <UserAuth :visible.sync="userAuthVisible" :extra.sync="extraParams" @comfir="authComfir" />
  </div>
</template>

<script>
// 262胚料退料
import FormVue from '@/components/Form/index.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { MISWMSAPI } from '@/api/generalAPI'
import { mapGetters } from 'vuex'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import deepClone from '@/utils/deepClone'
import { GetBoxInfoByBoxId, GetUserWarehouse } from '@/api/common'
// 查询表头数据的接口
const listAPINameForHeader = '/exportGoodsBusiness/findList261A'
// 查询表体数据的接口
const listAPINameForBody = '/divertBusiness/getValidBarcode'
const passAPIName = 'business/webapi/PostIn'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
const cachedName = 'shipment.262EmbryoReturn'
import { WMSAPI } from '@/api/generalAPI'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { customerDialog } from '@/components/CustomerDialog'
import { computedTotal } from '@/utils/validateOperateForQty'
const imOclas = 'XWMS261P'
// 原始数据
let originTableData = []
export default {
  name: cachedName,
  components: {
    FormVue,
    TableVue,
    ActionBarVue,
    UserAuth
  },
  data() {
    return {
      numBlurParams: {
        key: 'gamng',
        index: 0
      },
      show: false,
      form: {
        postDate: today
      },
      loading: false,
      scanLoading: false, // 扫条码时进行loading
      originTableData: [],
      selection: [],
      formList,
      selectAll: false, // 是否全选
      showFormList,
      tableColumn,
      tableData: [],
      userAuthVisible: true,
      extraParams: {},
      barcodeInputRef: null,
      boxInputRef: null,
      passAPIName,
      exParams: {}
    }
  },
  computed: {
    ...mapGetters(['account', 'name']),
    multiList() {
      let { selection, tableData } = this
      return { selection, tableData }
    },
    formateTableColumn() {
      return this.tableColumn.map((item) => {
        if (item.prop === 'erfmg') {
          return {
            ...item,
            rules: [
              { required: true, message: '请输入数量', trigger: 'onBlur' },
              { validator: this.validateQty, message: '不能小于0或者不能大于原数量', trigger: 'onBlur' }
            ]
          }
        } else {
          return item
        }
      })
    }
  },
  watch: {
    // 对比选中项长度与数据数组总长度，是否可以勾选全选复选框
    multiList: {
      handler: function (val) {
        const { selection, tableData } = val
        this.selectAll = selection.length === tableData.length && selection.length !== 0
      }
    }
  },
  mounted() {
    this.initConfig()
    this.getWareHouseListAndUpdate()
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
    authComfir() {
      this.fousOfFirst()
    },
    initConfig() {
      let _this = this
      _this.tableColumn.forEach((item) => {
        if (item.type === 'Table/Number') {
          let _erfmgRules = [{ required: true, message: '请输入数量', trigger: 'onBlur' }, { validator: _this.validateErfmg }]
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
    // 具体校验函数
    validateQty() {
      let { key, index } = this.numBlurParams
      // 改变后的值
      let x = Number(this.tableData[index]['erfmg'])
      // 原始值
      let y = originTableData[index][key]
      if (!x || x <= 0) return false
      if (x > y) {
        return false
        // return '数量不能大于' + y
      } else return true
    },
    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    // 箱子输入确认事件
    async boxIDEnter(val) {
      let _this = this
      let res = await GetBoxInfoByBoxId(val)
      if (res.success) {
        // TODO 这里获取箱子数据
        _this.$set(_this.form, 'locationId', res.locationNo)
        this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
      } else {
        _showFailToast(res.message)
      }
    },
    /**
     * @description: 条码确认方法，第一步是先加载表头数据，第二次扫码是加载表体数据，同时勾选全部内容
     * @description: 判断加载头部数据还是表体数据，判断机加件是否有值,没有值就加载表头、有就加载表体
     * @param {*} val
     */
    async barcodeEnter(val) {
      if (!this.form.imBarcode) {
        _showFailToast('请扫条码')
        return
      }
      this.scanLoading = true
      let res = await MISWMSAPI.post(
        !this.computedFormValue() ? listAPINameForHeader : listAPINameForBody,
        !this.computedFormValue()
          ? { imBarcode: val }
          : {
              imBarcode: val,
              imOclas: 'XWMS261P',
              cardNo: this.extraParams?.cardno,
              psnName: this.extraParams?.cardname
            }
      )
      if (res.success) {
        let _data = res.data
        // 如果表头没数据那么久赋值
        if (!this.computedFormValue()) {
          this.form = { ...this.form, ..._data.title, bwart: '261', wmsTools: this.form.wmsTools }
          // 直接将表头内容混入，因为后面加载表体数据还需要用到里面的几个参数，同时要修改bwart的值是261，这个是固定值
          this.$nextTick(() => {
            // tips:上面的赋值并不会响应式更改数据，下面三个是要显示的，所以需要响应式触发一下
            this.$set(this.form, 'sjpno', _data.title.sjpno)
            this.$set(this.form, 'barcode', _data.title.barcode)
            this.$set(this.form, 'zzdoex', _data.title.zzdoex)
          })

          // 同时展开隐藏部分内容
          this.show = true
          // 清空输入项并聚焦
          this.form.imBarcode = ''
          let inputRef = this.getVueComponentByProp('imBarcode')
          inputRef.focus()
        } else {
          if (this.tableData.map((item) => item.objnr).includes(val)) {
            _showFailToast('条码已在列表中，请勿重复扫码')
            return
          }
          // 这里的返回值是一个对象，并且要混入上一次加载表头的的数据
          let result = Object.assign(_data, {
            aufnr: this.form.aufnr,
            barcode: this.form.barcode,
            workp: this.form.workp,
            ngeln: this.form.ngeln,
            bwart: '261'
          })
          // 这里还需要判断物料编码的开头情况，如果不是以407或者40301开头的不允许添加并提示报错
          if (result.matnr.startsWith('407') || result.matnr.startsWith('40301')) {
            // 混入一个uuid标识用来勾选数据
            // tips:这里要混入表头的三个信息
            let resultArr = [result].map((item) => ({
              ...item,
              uuid: uuidv4(),
              aufnr: this.form.aufnr,
              workp: this.form.workp,
              ngeln: this.form.ngeln,
              erfmg: item.erfmg ? item.erfmg : '',
              operator: this.extraParams.cardname
            }))
            // 放入表体
            this.tableData = [...this.tableData, ...resultArr]
            // 保留原始数据
            originTableData = deepClone(this.tableData)
            let selectArr = this.tableData.map((item) => item.uuid)
            // 将数据默认勾选上
            this.$refs.table?.handleSelect(selectArr)
            this.form.imBarcode = ''
            let inputRef = this.getVueComponentByProp('imBarcode')
            inputRef.focus()
          } else {
            _showFailToast('不是407或者40301开头的物料不允许添加')
          }
        }
      } else {
        _showFailToast(res.msg)
      }
    },
    // 确定过账
    async handleConfirm() {
      if (this.selection.length <= 0) {
        _showFailToast('请勾选要过账的数据')
        return
      }
      if (this.selection.every((item) => Number(item['erfmg']) <= 0)) {
        _showFailToast('所提交项中存在数量小于或等于0的项目，请检查')
        return
      }
      try {
        await this.$refs.formComponent.$refs.refForm.validate()
        // await this.$dialog.confirm({
        //   title: '提示',
        //   message: `本次过账共 ${this.selection.length} 条数据,累计数量是: ${this.computedTotal(this.selection)},是否确认过账？`
        // })
        await customerDialog({
          count: this.selection.length,
          total: computedTotal(this.selection),
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
        console.log('selection', this.selection)
        let _list = JSON.parse(JSON.stringify(result))
        _list.forEach((item) => delete item.uuid)
        let { account, name } = this.$store.getters
        let _data = fomrmatShipmentSubmitParams(
          imOclas,
          account,
          name,
          this.form.warehouseNo,
          _list,
          'in',
          this.extraParams,
          undefined,
          'objnr',
          'maktx',
          postDate
        )
        // console.log(_data)
        let res = await WMSAPI.post(passAPIName, _data)
        if (res && res.success) {
          _showSuccessToast(res.message || '过账成功')
          // 清空表单和列表
          this.submitClear()
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      } finally {
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
        wmsTools: this.form.wmsTools,
        locationId: this.form.locationId
      }
      this.show = false
      this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
    },
    // 判断表单中是否存在一项是有值的，如果有代表是要加载表体的，否则是要加载表头数据的
    computedFormValue() {
      if (this.form.sjpno || this.form.barcode || this.form.zzdoex) {
        return true
      } else {
        return false
      }
    },
    // 全选
    handleSelectAll() {
      this.$nextTick(() => {
        this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
      })
    },
    async getWareHouseListAndUpdate() {
      let res = await GetUserWarehouse()
      if (res.success) {
        this.formList[0].options = res.datas
        // tips:默认选中第一个
        if (res.datas.length > 0) {
          this.$set(this.form, 'warehouseNo', res.datas[0].warehouseNo)
        }
      }
    }
  }
}
</script>
