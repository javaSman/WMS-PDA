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
    <TableVue
      ref="table"
      :table-data.sync="tableData"
      :table-column="formateTableColumn"
      :selection.sync="selection"
      @inputNumHandler="inputNumHandler"
    />

    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" confirm-text="过账" @clear="handleClear" @confirm="handleConfirm" />
    <UserAuth :visible.sync="userAuthVisible" :extra.sync="extraParams" @comfir="authComfir" />
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading" :duration="0">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
  </div>
</template>

<script>
import FormVue from '@/components/Form/index.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { WMSAPI, WMSAPI_WCF } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { GetUserWarehouse } from '@/api/common'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { computedTotal, validateOriginQtyLimit, validateQtyForItem } from '@/utils/validateOperateForQty'
import { _showFailToast } from '@/utils/message'
const passAPIName = 'business/webapi/OutStock'
const imOclas = '现场物料出库'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
// 现场物料出库
const cachedName = 'WMSLineSideWarehouse.onSiteMaterialOutBound'
export default {
  name: cachedName,
  components: {
    FormVue,
    UserAuth,
    TableVue,
    ActionBarVue
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      show: false, // 控制隐藏区域
      form: {
        postDate: today
      }, // 表单数据
      loading: false, // 底部过账按钮loaidng
      tableData: [], // 列表数据
      selection: [], // 选中的数据
      numBlurParams: { key: 'quantity', index: 0 },
      userAuthVisible: true, // 控制是否鉴权
      extraParams: {}, // 鉴权 的额外参数
      selectAll: false, // 是否全选
      exParams: {}, // 存储额外的参数对象
      hiddenFormList: [], // 隐藏区域的数据,这个图号也可以扫多份,因此是一个数组来的
      scanLoading: false,
      originTableData: []
    }
  },
  computed: {
    // 特殊处理一下数据适配数量编辑的校验
    formateTableColumn() {
      return this.tableColumn.map((item) => {
        if (item.prop === 'erfmg' || item.type === 'Table/Number') {
          return {
            ...item,
            rules: [
              { required: true, message: '请输入数量', trigger: 'onBlur' },
              { validator: this.validateFunc, message: '数量不能大于标签数量且不能小于等于0' }
            ]
          }
        } else {
          return item
        }
      })
    },
    multiList() {
      let { selection, tableData } = this
      return { selection, tableData }
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
      this.formList[1].enter = this.barcodeEnter
    },
    // 具体校验函数
    validateFunc() {
      let { key, index } = this.numBlurParams
      // 改变后的值
      let x = Number(this.tableData[index][key])
      // 原始值
      let y = this.originTableData[index]['menge'] // menge指定
      // if (!x || x < 0) return '数量不能小于等于0'
      // if (x > y) return '数量不能大于' + y
      if (!x || x < 0 || x > y) return false
      else return true
    },

    /**
     * @description: 条码确认事件,加载列表数据
     * @param {*} val
     */
    async barcodeEnter(val) {
      if (!this.form.imBarcode) {
        _showFailToast('请扫条码')
        return
      }
      this.scanLoading = true
      try {
        let _params = {
          Barcodes: val
        }
        let res = await WMSAPI_WCF.get('9037Wcf/WarehouseService.svc/rest/GetMaterialBarcodeByBarcode', _params)
        if (res.success) {
          let _data = res.barcodeList.map((item, index) => ({
            ...item,
            index: index + 1,
            uuid: uuidv4()
          }))
          if (this.tableData.length > 0 && this.tableData.findIndex((item) => item.barcode === val) !== -1) {
            _showFailToast('条码已在列表中，请勿重复扫码')
            this.$set(this.form, 'imBarcode', '')
            this.fousOfFirst()
            return
          }
          if (_data.length > 0) {
            // 获取标签数量
            let resMenge = await WMSAPI.post('business/webapi/ZftdXmbe001', { V_OBJNR: val })
            let mengeNum = 0
            if (resMenge.success && resMenge.data.length > 0) {
              mengeNum = Number(resMenge.data[0].menge) ?? 0
              // tips:混入列表中，其实只有一项，虽然接口支持传入多个条码，但是这里肯定扫描一个条码的
              _data.forEach((item) => {
                item.menge = mengeNum
              })
              // 是追加模式
              this.tableData = [...this.tableData, ..._data]
              this.originTableData = _data
              this.$refs.table.handleSelect(this.tableData.map((item) => item.uuid))
              this.$set(this.form, 'imBarcode', '')
              this.fousOfFirst()
            } else {
              _showFailToast(resMenge.message)
              return
            }
          }
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },
    // 确定过账
    async handleConfirm() {
      await this.$refs.formComponent.$refs.refForm.validate()
      await validateQtyForItem(this.selection, 'quantity')
      await validateOriginQtyLimit(this.originTableData, this.selection, 'quantity', 'menge')
      if (this.selection.length <= 0) {
        _showFailToast('请勾选要过账的数据')
        return
      }
      await this.$dialog.confirm({
        title: '提示',
        message: `本次过账共 ${this.selection.length} 条数据,累计数量是: ${computedTotal(this.selection, 'quantity')},是否确认过账？`
      })
      try {
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
        // 组合参数
        let { account, name } = this.$store.getters
        let _data = fomrmatShipmentSubmitParams(
          imOclas,
          account,
          name,
          this.form.warehouseNo,
          this.selection,
          'out',
          this.extraParams,
          null,
          undefined,
          'materialDesc',
          postDate
        )
        let res = await WMSAPI.post(passAPIName, _data)
        if (res && res.success) {
          this.$toast.success(res.message)
          // 清空表单和列表
          this.handleClear()
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.loading = false
      }
    },
    /** 根据prop的值获取该输入框 */
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
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
    // 全选
    handleSelectAll() {
      this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
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
