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
    <TableForSelect
      ref="table"
      :table-data.sync="tableData"
      :table-column="formateTableColumn"
      :selection.sync="selection"
      @inputNumHandler="inputNumHandler"
      @inputTextHandler="inputTextHandler"
    >
      <template #batch="scope">
        <van-field v-model="scope.row.batch" readonly is-link placeholder="请选择" :border="false" @click="() => batchEnterHandler(scope)" />
      </template>
      <template #stationNo="scope">
        <van-field v-model="scope.row.stationNo" readonly is-link placeholder="请选择" :border="false" @click="() => stationEnterHandler(scope)" />
      </template>
    </TableForSelect>

    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" confirm-text="过账" @clear="handleClear" @confirm="handleConfirm" />
    <UserAuth :visible.sync="userAuthVisible" :extra.sync="extraParams" @comfir="authComfir" />
    <van-popup v-model="showPickerOfBatch" :close-on-click-overlay="false" round position="bottom">
      <van-picker
        show-toolbar
        :columns="batchPopColumn"
        @confirm="(val) => confirHandler(val, 'batch')"
        @cancel="(val) => cancelHandler(val, 'batch')"
      />
    </van-popup>
    <!-- 工位弹出框 -->
    <van-popup v-model="showPickerOfStation" :close-on-click-overlay="false" round position="bottom">
      <van-search v-model="searchVal" placeholder="请输入搜索关键词" @search="searchHandler" />
      <van-picker
        show-toolbar
        :columns="stationPopColumn"
        @confirm="(val) => confirHandler(val, 'station')"
        @cancel="(val) => cancelHandler(val, 'station')"
      />
    </van-popup>
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
  </div>
</template>

<script>
import FormVue from '@/components/Form/index.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
import TableForSelect from '@/components/TableForSelect/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { WMSAPI } from '@/api/generalAPI'
import { v4 as uuidv4 } from 'uuid'
import Dates from '@/utils/datetime'
import { GetUserWarehouse, getmaterialBarcodeInfo } from '@/api/common'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { computedTotal } from '@/utils/validateOperateForQty'
import { _showFailToast } from '@/utils/message'
import { customerDialog } from '@/components/CustomerDialog'
import { deepClone } from '@/utils'
// 过账接口
const passAPIName = 'business/webapi/OutStock'
const imOclas = '模装现场物料出库'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')

const cachedName = 'WMSLineSideWarehouse.moldInstallationForMaterialOutBound'
export default {
  name: cachedName,
  components: {
    FormVue,
    UserAuth,
    TableForSelect,
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
      numBlurParams: { key: 'erfmg', index: 0 },
      userAuthVisible: true, // 控制是否鉴权
      extraParams: {}, // 鉴权 的额外参数
      selectAll: false, // 是否全选
      exParams: {}, // 存储额外的参数对象
      hiddenFormList: [], // 隐藏区域的数据,这个图号也可以扫多份,因此是一个数组来的
      scanLoading: false,
      originTableData: [],
      // 控制选择器是否显示
      index: 0,
      showPickerOfBatch: false,
      showPickerOfStation: false,
      // 生产批弹出层数据源
      batchPopColumn: [],
      // 项目工位弹出层数据源
      stationPopColumn: [],
      searchVal: ''
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
              { validator: this.validateFunc, message: '数量不能小于等于0' }
              // 数量不能大于在库数量且不能小于等于0
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
    authComfir() {
      this.fousOfFirst()
    },
    // tips：让第一个可以输入的输入源获取光标
    fousOfFirst() {
      let result = this.formList.filter((item) => item.type === 'Input')
      if (result.length > 0) {
        let prop = result[0].prop
        this.$refs.formComponent.$refs[prop][0].$refs.inputRef.focus()
      }
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
      let y = this.originTableData[index][key]
      console.log('x', x)
      console.log('y', y)
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
      if (this.tableData.length > 0) {
        let target = this.tableData.find((item) => item.barcode === val)
        if (this.selection.includes(target.uuid)) {
          _showFailToast('条码已勾选，请勿重复扫码')
          return
        }
        if (target) {
          this.selection = [...this.selection, target.uuid]
        } else {
          _showFailToast('当前没有匹配结果,请重新扫码')
          this.$set(this.form, 'imBarcode', '')
          this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
          return
        }
      } else {
        this.scanLoading = true
        try {
          let res = await getmaterialBarcodeInfo(val)
          if (res.success) {
            // Tips 这里额外混入俩个数组用来存放表格每项中产生的生产批和工位选择数据,过账时要剔除这部分数据
            let _data = res.barcodeList.map((item, index) => ({
              ...item,
              index: index + 1,
              erfmg: item.quantity,
              batchPopColumn: [],
              stationPopColumn: [],
              uuid: uuidv4()
            }))
            this.originTableData = deepClone(_data)
            // 如果第一次加载时已经有项目号了，
            if (_data.length > 0) {
              this.tableData = _data
              // tips:还需要判断是否有项目号
              _data[0].projectNo && this.projectEnterHandler(_data[0].projectNo, 0, this.tableData)
            }
            this.$set(this.form, 'imBarcode', '')
            this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
          } else {
            _showFailToast(res.message)
            this.$set(this.form, 'imBarcode', '')
            this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
          }
        } finally {
          this.scanLoading = false
        }
      }
    },
    // 确定过账
    async handleConfirm() {
      // if (!this.form.imBarcode) {
      //   _showFailToast({ message: '请输入条码号' })
      //   return
      // }
      await this.$refs.table.$refs.refForm.validate()
      await this.$refs.formComponent.$refs.refForm.validate()
      if (this.selection.length <= 0) {
        _showFailToast('请勾选要过账的数据')
        return
      }
      // 根据selection去映射一份被选中的数据
      let _selection = this.tableData.filter((item) => this.selection.includes(item.uuid))
      if (_selection.some((item) => Number(item['erfmg']) <= 0)) {
        _showFailToast('所提交项中存在数量小于或等于0的项目，请检查')
        return
      }
      try {
        await customerDialog({
          count: this.selection.length,
          total: computedTotal(_selection, 'erfmg'),
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
        // tips 遍历删除index和每项额外混入的数据源
        let result = []
        _selection.forEach((item) => {
          result.push({ ...item })
        })
        let _list = JSON.parse(JSON.stringify(result))
        _list.forEach((item) => {
          delete item.index
          delete item.batchPopColumn
          delete item.stationPopColumn
        })
        // 组合参数
        let { account, name } = this.$store.getters

        let _data = fomrmatShipmentSubmitParams(
          imOclas,
          account,
          name,
          this.form.warehouseNo,
          _list,
          'out',
          this.extraParams,
          undefined,
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
      // this.selection = this.tableData.map((item) => item.index)
    },

    // 数量输入框的回调事件
    inputNumHandler(key, index) {
      this.numBlurParams = { key, index }
    },
    // 文本输入框回调事件
    inputTextHandler(key, index) {
      if (key === 'projectNo') {
        this.projectEnterHandler(this.tableData[index].projectNo, index, this.tableData)
      }
    },

    // 弹出层选择事件
    confirHandler(val, key) {
      if (val) {
        if (key === 'batch') {
          this.onConfirmOfBatch(val.value, this.tableData)
        } else {
          this.onComfirmOfStation(val.value, this.tableData)
        }
      } else {
        _showFailToast('当前没有数据')
      }
    },
    // 弹出层取消事件
    cancelHandler(val, key) {
      if (key === 'batch') {
        this.onCancelOfBatch()
      } else {
        this.onCancelOfStation()
      }
    },
    /** 项目号回车事件 */
    async projectEnterHandler(val, index, tableData) {
      let res = await getmaterialBarcodeInfo(null, val)
      if (res.success) {
        if (res.barcodeList.length > 0) {
          tableData[index].batchPopColumn = res.barcodeList
            .map((item) => ({
              text: item.batch,
              value: item.batch
            }))
            .filter((item) => item.value)
          tableData[index].stationPopColumn = res.barcodeList
            .map((item) => ({
              text: item.stationNo,
              value: item.stationNo
            }))
            .filter((item) => item.value)
          if (tableData[index].batchPopColumn.length > 0) {
            let row = tableData[index]
            console.log(tableData[index])
            row.batch = row.batch ?? (tableData[index].batchPopColumn.length > 0 ? tableData[index].batchPopColumn[0].value : '')
            row.stationNo = row.stationNo ?? (tableData[index].stationPopColumn.length > 0 ? tableData[index].stationPopColumn[0].value : '')
            // tips：默认取第一个赋值
            this.$set(this.tableData, index, row)
          }
        }
      } else {
       _showFailToast(res.message)
      }
    },

    /** 生产批回车事件 */
    async batchEnterHandler(val) {
      if (val.row.projectNo) {
        // 调用接口获取数据，过滤筛选所有的生产批
        // tips 打开之前将当前行的弹出数据源赋值过去给用户选择
        this.batchPopColumn = val.row.batchPopColumn
        this.showPickerOfBatch = true
        this.index = val.index
      } else {
        _showFailToast('请先输入项目号')
      }
    },
    /** 项目工位回车事件 */
    stationEnterHandler(val) {
      if (val.row.projectNo) {
        // TODO 这里原型要进行模糊搜索，但是后台现在只给了一个接口,所有的内容都在前端进行模糊搜索
        // TODO 用弹出层，好像没必要模糊搜索了
        this.stationPopColumn = val.row.stationPopColumn
        this.showPickerOfStation = true
        // 保留当前编辑的索引
        this.index = val.index
      } else {
        _showFailToast('请先输入项目号')
      }
    },
    /** 生产批弹出层选择器确认方法 */
    onConfirmOfBatch(val, tableData) {
      tableData[this.index].batch = val
      this.showPickerOfBatch = false
    },
    /** 项目工位弹出层选择器确认方法 */
    onComfirmOfStation(val, tableData) {
      tableData[this.index].stationNo = val
      this.showPickerOfStation = false
    },
    /** 生产批弹出层取消方法 */
    onCancelOfBatch() {
      // tableData[this.index].batch = val
      this.showPickerOfBatch = false
    },
    /** 项目工位弹出层取消方法 */
    onCancelOfStation() {
      this.showPickerOfStation = false
    },

    // 得到仓库数据，更新仓库列表
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
    // 项目工位模糊搜索
    searchHandler(val) {
      let result = this.tableData[this.index].stationPopColumn.filter((item) => item.value.indexOf(val) !== -1)
      this.stationPopColumn = result
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
