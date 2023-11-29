<template>
  <div>
    <!-- 表单布局 -->
    <van-cell-group>
      <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
        <template v-if="showFormList.length > 0" #title>
          <van-icon :name="show ? 'arrow-down' : 'arrow'" @click="show = !show" />
        </template>
        <FormVue ref="formComponent" :form-data.sync="form" :form-list="formList" @onDropdown="dropdowHandler" />
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
      :table-column="formateTableColumn"
      :selection.sync="selection"
      @input-num-handler="inputNumHandler"
    />

    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" confirm-text="过账" @clear="handleClear" @confirm="handleConfirm" />
    <UserAuth :visible.sync="userAuthVisible" :extra.sync="extraParams" @comfir="authComfir" />
  </div>
</template>

<script>
// 261螺丝发料WMS
const cachedName = 'shipment.261ScrewIssuanceWMS'
import FormVue from '@/components/Form/index.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { MISWMSAPI, WMSAPI } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { deepClone } from '@/utils'
import { GetBoxInfoByBoxId, GetUserWarehouse } from '@/api/common'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { getEditableKey, computedTotal } from '@/utils/validateOperateForQty'
import { mapGetters } from 'vuex'
import { customerDialog } from '@/components/CustomerDialog'
const passAPIName = 'business/webapi/OutStock'
// 查询表体数据的借口
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
const imOclas = 'XWMS261F'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
// 保留一份原始对象,用于校验数量的变更
let originTableData = []
export default {
  name: cachedName,
  components: {
    FormVue,
    UserAuth,
    ActionBarVue,
    TableVue
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      userAuthVisible: true,
      extraParams: {},
      tableData: [],
      show: false,
      form: {
        postDate: today
      },
      numBlurParams: {
        key: 'erfmg',
        index: 0
      },
      loading: false,
      selection: [],
      selectAll: false
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
        if (item.prop === 'erfmg' || item.type === 'Table/Number') {
          return {
            ...item,
            rules: [
              { required: true, message: '请输入数量', trigger: 'onBlur' },
              { validator: this.validateFunc, message: '数量不能小于0或大于库存数', trigger: 'onBlur' }
            ]
          }
        } else {
          return item
        }
      })
    }
  },
  watch: {
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
    this.getFactoryArea()
  },
  methods: {
    // tips：让第一个可以输入的输入源获取光标,螺丝发料要特殊处理，光标应该在箱子号上面
    fousOfWmsTools() {
      this.$refs.formComponent.$refs['wmsTools'][0].$refs.inputRef.focus()
    },
    authComfir() {
      this.fousOfWmsTools()
    },
    initConfig() {
      this.formList.forEach((item) => {
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
        }
        if (item.prop === 'wmsTools') {
          item.enter = this.boxEnter
        }
      })
    },
    // 具体校验函数
    validateFunc() {
      let { key, index } = this.numBlurParams
      // 改变后的值
      let x = Number(this.tableData[index][key])
      // 原始值
      let y = originTableData[index]['menge']
      console.log('x', x)
      console.log('y', y)
      if (!x || x < 0) return false
      if (x > y) return false
      else return true
    },
    /**
     * @description: 条码确认事件,加载列表数据
     * @param {*} val
     */
    async barcodeEnter(val) {
      let inputRef = this.$refs.formComponent.$refs.imBarcode[0].$refs.inputRef
      if (!this.form.imBarcode) {
        _showFailToast('请扫条码')
        return
      }
      if (this.tableData.findIndex((item) => item.objnr === val) !== -1) {
        _showFailToast('当前条码已在列表中，请重新扫码')
        this.$set(this.form, 'imBarcode', '')
        inputRef.focus()
        return
      }
      let res = await WMSAPI.get(listAPIName, {
        imOclas: imOclas,
        imBarcode: val,
        IM_REQNO: this.form.lgort,
        IM_CARNUMBER: this.form.imBarcode
      })
      if (res.success) {
        let _data = res.data
        if (
          _data.some((item) => {
            if (item.matnr.replace(/^0+/gi, '').startsWith('40402')) {
              return true
            } else {
              return false
            }
          })
        ) {
          // 混入唯一值，用于勾选数据
          this.tableData.push(
            ..._data.map((item) => ({
              ...item,
              uuid: uuidv4(),
              objnr: val,
              erfmg: Number(item.erfmg) > 0 ? item.erfmg : '',
              operator: this.extraParams.cardname
            }))
          )
          originTableData = deepClone(this.tableData)
          this.$set(this.form, 'imBarcode', '')
          inputRef.focus()
          this.$nextTick(() => {
            // 默认勾选数据
            let selectArr = this.tableData.map((item) => item.uuid)
            this.$refs.table?.handleSelect(selectArr)
          })
        } else {
          _showFailToast('不允许添加不是以40402开头的物料')
        }
      } else {
        _showFailToast(res.message)
      }
    },
    async boxEnter(val) {
      let res = await GetBoxInfoByBoxId(val)
      if (res.success) {
        // TODO 这里获取箱子数据
        // this.$set(this.form, 'locationId', res.locationNo)
        this.$refs.formComponent.$refs.imBarcode[0].$refs.inputRef.focus()
        // console.log(this.$refs.formComponent)
      } else {
        this.form.wmsTools = ''
        this.$refs.formComponent.$refs.wmsTools[0].$refs.inputRef.focus()
        _showFailToast(res.message)
      }
    },
    // dropdown选择回调
    async dropdowHandler(val, prop) {
      if (prop === 'areaId') {
        let res = await MISWMSAPI.post('/divertBusiness/findWerksByFactory', {
          factory: val
        })
        if (res.success) {
          if (res.data.length > 0) {
            this.$set(this.form, 'werks', res.data[0].werks)
            this.$set(this.form, 'lgort', res.data[0].lgort)
          }
        }
      }
    },
    // 确定过账
    async handleConfirm() {
      // if (!this.form.imBarcode) {
      //   _showFailToast({ message: '请输入条码号' })
      //   return
      // }
      if (this.selection.length <= 0) {
        _showFailToast('请勾选要过账的数据')
        return
      }
      try {
        await this.$refs.formComponent.$refs.refForm.validate()
        await this.$refs.table.$refs.refForm.validate()
        let key = getEditableKey()
        if (this.selection.every((item) => Number(item[key]) > 0)) {
          // await this.$dialog.confirm({
          //   title: '提示',
          //   message: `本次过账共 ${this.selection.length} 条数据,累计数量是: ${computedTotal(this.selection, 'erfmg')},是否确认过账？`
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
          // tips:覆盖原本的厂区下拉框，因为要显示名字
          console.log(this.formList[1].options)
          // let areaNo = this.formList[1].options.find((item) => item.areaName === this.form.areaName)[0].areaNo
          // tips:覆盖_form里面的areaNo的值
          // _form = { ..._form, areaNo }
          // 删除uuid,遍历实现,同时把箱子和区域信息混入
          let result = []
          this.selection.forEach((item) => {
            result.push({
              ...item,
              warehouseNo: this.form.warehouseNo,
              areaId: this.form.areaId,
              werks: this.form.werks,
              lgort: this.form.lgort,
              wmsTools: this.form.wmsTools,
              objnr: ''
            })
          })
          let _list = JSON.parse(JSON.stringify(result))
          _list.forEach((item) => delete item.uuid)
          let _data = fomrmatShipmentSubmitParams(
            imOclas,
            this.account,
            this.name,
            this.form.warehouseNo,
            _list,
            'out',
            this.extraParams,
            undefined,
            undefined,
            'maktx',
            postDate
          )
          let res = await WMSAPI.post(passAPIName, _data)
          if (res && res.success) {
            _showSuccessToast({
              message: res.message || '过账成功',
              duration: 10 * 1000
            })
            // 清空表单和列表
            this.submitClear()
          } else {
            _showFailToast(res.message)
          }
        } else {
          _showFailToast('所提交项中存在数量小于或等于0的项目，请检查')
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.loading = false
      }
    },
    // 清除按钮
    handleClear() {
      // table数据
      this.tableData = []
      // 选中项集合
      this.selection = []
      this.selectAll = false
      // 表单
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo
      }
      this.fousOfWmsTools()
    },
    submitClear() {
      // table数据
      this.tableData = []
      // 选中项集合
      this.selection = []
      this.selectAll = false
      // 表单
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo,
        areaId: this.form.areaId,
        werks: this.form.werks,
        lgort: this.form.lgort
      }
      this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
    },
    // 全选
    handleSelectAll() {
      this.$refs.table?.checkboxGroup.toggleAll(this.selectAll)
    },
    // 数量输入框的回调事件
    inputNumHandler(key, index) {
      this.numBlurParams = { key, index }
    },
    // 得到仓库数据，更新仓库列表
    // TODO 这部分先写死一个工号获取仓库数据
    async getWareHouseListAndUpdate() {
      let res = await GetUserWarehouse()
      if (res.success) {
        this.formList[0].options = res.datas
        // tips:这里也要默认选择一个仓库
        if (res.datas.length > 0) {
          this.$set(this.form, 'warehouseNo', res.datas[0].warehouseNo)
          // 如有值就自动加载厂区数据
          // this.getAreaData(res.datas[0].warehouseNo)
        }
      }
    },
    // 获取厂数据
    async getFactoryArea() {
      let res = await MISWMSAPI.post('/divertBusiness/listFactory', {})
      if (res.success) {
        // tips: 返回内容是这样的13:26{"code":"0000","msg":"操作成功","data":[{"werks":"2288","factory":"星腾F栋","lgort":"4603"}],"zipFlag":false,"success":true}
        this.formList[1].options = res.data.map((item) => ({ text: item, value: item }))
        // tips:默认选中第一个项的内容
        if (res.data.length > 0) {
          this.$set(this.form, 'areaId', res.data[0])
          // tips:根据第一个厂区默认取获取仓位和工厂数据
          let res2 = await MISWMSAPI.post('/divertBusiness/findWerksByFactory', {
            factory: res.data[0]
          })
          if (res2.success) {
            if (res2.data.length > 0) {
              this.$set(this.form, 'werks', res2.data[0].werks)
              this.$set(this.form, 'lgort', res2.data[0].lgort)
            }
          }
        }
      }
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
