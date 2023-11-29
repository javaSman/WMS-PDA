<template>
  <div>
    <!-- 表单布局 -->
    <van-cell-group>
      <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
        <template v-if="showFormList.length > 0" #title>
          <van-icon :name="show ? 'arrow-down' : 'arrow'" @click="show = !show" />
        </template>
        <FormVue ref="formComponent" :form-data.sync="form" :form-list="formList" />
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
    <TableVue ref="table" :table-data.sync="tableData" :selection.sync="selection" :table-column="tableColumn" @input-num-handler="inputNumHandler" />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" confirm-text="过账" @clear="handleClear" @confirm="handleConfirm" />
    <UserAuth :visible.sync="userAuthVisible" :extra.sync="extraParams" @comfir="authComfir" />
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <!-- <van-overlay :show="scanLoading">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay> -->
  </div>
</template>

<script>
import FormVue from '@/components/Form/index.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { WMSAPI } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { deepClone } from '@/utils'
import { mapGetters } from 'vuex'
import { checkItemToTop, validateTableSelected } from '@/utils/business'
import { GetBoxInfoByBoxId, GetUserWarehouse } from '@/api/common'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { computedTotal } from '@/utils/validateOperateForQty'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
import { customerDialog } from '@/components/CustomerDialog'
const passAPIName = 'business/webapi/OutStock'
// 查询表体数据的接口
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
const imOclas = 'XWMS261W'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
// 261供应商领料-WMS
const cachedName = 'shipment.261SupplierPickingWMS'
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
        key: 'erfmg',
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
      showFormList,
      tableColumn,
      tableData: [],
      userAuthVisible: true,
      extraParams: {},
      barcodeInputRef: null,
      boxInputRef: null,
      passAPIName
    }
  },
  computed: {
    ...mapGetters(['account', 'name']),
    selectAll() {
      return this.selection.length === this.tableData.length && this.selection.length !== 0
    }
  },
  created() {
    this.getWareHouseListAndUpdate()
  },
  mounted() {
    this.initConfig()
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
      tableColumn.forEach((item) => {
        if (item.type === 'Table/NumberInput') {
          let _erfmgRules = [{ required: true, message: '请输入数量', trigger: 'onBlur' }, { validator: _this.validateFunc }]
          item.rules = _erfmgRules
        }
      })
      _this.formList.forEach((item) => {
        if (item.prop === 'warehouseNo') {
          item.change = _this.wareHouseChange
        }
        if (item.prop === 'boxID') {
          item.enter = (val) => _this.boxIDEnter(val)
          _this.boxInputRef = _this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'imBarcode') {
          item.enter = _this.barcodeEnter
          _this.barcodeInputRef = _this.getVueComponentByProp(item.prop)
        }
      })
    },
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
    barcodeEnter(val) {
      if (!this.form.imBarcode) {
        _showFailToast('请扫条码')
        return
      }

      // 扫码匹配
      if (this.tableData.length > 0) {
        let target = this.tableData.find((item) => item.objnr === val)
        // 不存在列表中时
        if (!target) {
          _showFailToast('没有找到结果，请检查重试或清除结果后重新扫码')
          this.$nextTick(() => {
            this.form.imBarcode = ''
          })
          return
        }
        // 判断是否已经勾选
        let _target = this.selection.find((item) => item.objnr === val)
        if (_target) {
          _showFailToast(`条码${val}已勾选，请勿重复扫码`)
          this.$nextTick(() => {
            this.form.imBarcode = ''
          })
          return
        }
        // 都通过则选中
        let arrs = [...this.selection.map((item) => item.uuid), target.uuid]
        this.$refs.table?.handleSelect(arrs)
        // tips: 这里需要更改这个被选中的项在数组中的位置，把它置顶
        this.tableData = checkItemToTop(this.tableData, target)
        this.$nextTick(() => {
          this.form.imBarcode = ''
        })
        return
      }
      // 没有明细则调用接口
      this.scanLoading = true
      WMSAPI.get(listAPIName, { imOclas: imOclas, imBarcode: val })
        .then((res) => {
          if (res.success) {
            let _data = res.data
            // let _data = testData.data as any[]
            // 混入唯一值，用于勾选数据
            _data.forEach((item) => (item.uuid = uuidv4()))
            this.tableData = _data.map((item) => ({ ...item, operator: this.extraParams.cardname }))
            // 深拷贝保留一份副本
            this.originTableData = deepClone(this.tableData)
          } else {
            _showFailToast(res.message)
          }
        })
        .finally(() => {
          this.scanLoading = false
          this.$nextTick(() => {
            this.form.imBarcode = ''
          })
        })
    },
    getEditableKey() {
      let tarItem = tableColumn.find((item) => item.type === 'Table/Number')
      let key = tarItem ? tarItem.prop : 'erfmg'
      return key
    },
    async handleConfirm() {
      try {
        // 表单验证
        await this.$refs.formComponent.$refs.refForm.validate()
        // 表格必填项验证
        let flag = validateTableSelected(this.tableColumn, this.selection)
        if (!flag.isPass) {
          _showFailToast(flag.message)
          return
        }
        if (this.selection.length === 0) {
          _showFailToast('请勾选数据')
          return
        }

        let key = this.getEditableKey()
        if (key && !this.selection.every((item) => Number(item[key]) > 0)) {
          _showFailToast('所提交项中存在数量小于或等于0的项目，请检查')
          return
        }
        // 过账前确认
        // await this.$dialog.confirm({
        //   title: '提示',
        //   message: `本次过账共 ${this.selection.length} 条数据,累计拣货数量是: ${computedTotal(this.selection)},是否确认过账？`
        // })
        await customerDialog({
          count: this.selection.length,
          total: computedTotal(this.selection),
          countPrefix: '本次过账共',
          countSuffix: '条数据,',
          totalPrefix: '累计数量是',
          totalSuffix: '确定过账吗?'
        })
        // 处理接口参数
        let _form = Object.assign({}, this.form)
        let postDate = _form.postDate
        delete _form.postDate
        // 开始过账
        this.loading = true
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(this.selection))
        _list.forEach((item) => delete item.uuid)
        // tips:混入箱子信息，这里这个单位信息需要重新处理,如果erfme没有值那么需要将meins的值赋值给erfme
        _list = _list.map((item) => ({ ...item, wmsTools: this.form.boxID, erfme: item.erfme ? item.erfme : item.meins }))
        let _data = fomrmatShipmentSubmitParams(
          imOclas,
          this.account,
          this.name,
          this.form.warehouseNo,
          _list,
          'out',
          this.extraParams,
          null,
          'objnr',
          'maktx',
          postDate
        )
        // 表单验证完后，若有自定义方法，则执行
        let res = await WMSAPI.post(passAPIName, _data)
        if (res && res.success) {
          _showSuccessToast({
            message: res.message,
            duration: 10 * 1000
          })
          // this.$toast.success(res.message || '过账成功')
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

    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    // 根据prop和index获取表格中表单组件
    getVueComponentByTableProp(prop, index) {
      return this.$refs.table.$refs[`${prop}_${index}`][0].$refs.input
    },
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
        boxID: this.form.boxID
      }
      this.show = false
      this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
    },

    handleSelectAll() {
      this.$refs.table?.checkboxGroup.toggleAll(this.selectAll)
    },
    inputNumHandler(key, index) {
      console.log(key, index)
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
    },
    /** 仓库change */
    wareHouseChange(val) {
      this.form.warehouseNo = val
      if (!val) return
      this.boxInputRef.focus()
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
