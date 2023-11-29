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
    >
      <template #targetBarcode="scope">
        <van-field
          v-model="scope.row.targetBarcode"
          :rules="targetBarcodeRules"
          placeholder="请输入转入条码"
          :border="false"
          @keyup.enter="() => targetBarcodeEnter(scope)"
        />
      </template>
    </TableVue>
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" @clear="handleClear" @confirm="handleConfirm" />
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading">
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
import { WMSAPI } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { GetUserWarehouse, GetBoxInfoByBoxId, GetBoxDetail, GetLocationInfo } from '@/api/common'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { customerDialog } from '@/components/CustomerDialog'
import { computedTotal, validateOriginQtyLimit } from '@/utils/validateOperateForQty'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
const passAPIName = 'business/webapi/OutStock'
const listAPIName = 'business/webapi/GetMaterialBarcodeList'
// 物料箱号调拨-WMS
const cachedName = 'WMSFunction.MaterialTransfer-WMS'
const imOclas = '物料箱号调拨'
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
      numBlurParams: { key: 'targetBarcodeQuantity', index: 0 },
      targetBarcodeRules: [{ required: true, message: '请输入转入条码', trigger: 'onBlur' }]
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
            { validator: this.validateErfmg, message: '数量不能大于拣货数量且不能小于等于0' }
          ]
          item.rules = _erfmgRules
        }
      })
      this.formList.forEach((item) => {
        // 仓库-获取下拉列表
        if (item.prop === 'warehouseNo') {
          item.change = this.wareHouseChange
        }
        // 转出箱子号-获取箱子明细
        if (item.prop === 'wmsTools') {
          item.enter = this.getBoxDetails
          this.boxInputRef = this.getVueComponentByProp(item.prop)
        }
        // 转入箱子号-获取区域和条码列表，然后输入的转入条码要判断是不是在这个条码列表里面
        if (item.prop === 'targetBoxID') {
          item.enter = this.targetBoxNoEnter
          this.targetBoxInputRef = this.getVueComponentByProp(item.prop)
        }
        // 区域/货位/接收货位-验证货位值
        if (item.prop === 'targetLocationID') {
          item.enter = this.areaEnter
          this.areaInputRef = this.getVueComponentByProp(item.prop)
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
    /**
     * 箱子号回车带出明细
     * 判断是否有明细
     */
    async getBoxDetails(val) {
      if (!val) return
      try {
        this.scanLoading = true
        let res = await GetBoxDetail(val)
        if (res && res.success) {
          let _data = res.materialBarcodeList
          this.selectedList = []
          if (_data.length === 0) {
            _showFailToast(`箱子号[${val}]下没有明细物料，请重新扫码`)
            this.boxInputRef?.focus()
            this.list = []
            return
          }
          // 增加uuid为唯一识别符
          _data.forEach((item) => {
            item.uuid = uuidv4()
          })
          // 赋值表格数据
          this.list = _data
          // 存储原始数据
          staticData = JSON.parse(JSON.stringify(_data))
          staticData.forEach((item) => {
            item.targetBarcodeQuantity = item.quantity // targetBarcodeQuantity 字段根据需求
          })
          this.targetBoxInputRef?.focus() // 当前功能需求-跳转至接收箱子号
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },
    /** 转入箱子号回车 ，获取区域、获取转入箱子里面的条码列表*/
    async targetBoxNoEnter(val) {
      if (!val) return
      // 调用接口带出区域，如果区域有值，光标跳转到条码，没有跳转到区域
      let res = await GetBoxInfoByBoxId(val)
      if (res.success) {
        // 判断箱子号是否可以带出货位
        if (res.locationNo) {
          this.$set(this.form, 'targetLocationID', res.locationNo) // targetLocationID 字段根据需求
        } else {
          this.areaInputRef?.focus()
        }
      } else {
        _showFailToast(res.message)
        if (res.message.includes('没有绑定货位')) {
          this.areaInputRef?.focus()
        } else {
          this.targetBoxInputRef?.focus() // targetBoxInputRef 字段根据需求
          this.$set(this.form, 'boxID', '')
        }
        this.$set(this.form, 'locationID', '')
      }
    },
    /**
     * 区域回车
     * 查询区域是否存在-（1）存在-光标跳转到【下一输入框】（2）不存在-错误提示
     */
    async areaEnter(val) {
      if (!val) return
      let res = await GetLocationInfo(val)
      if (!res.success) {
        _showFailToast(res.message)
        this.areaInputRef?.focus()
      }
    },
    /** 转入条码回车事件 */
    async targetBarcodeEnter(scope) {
      if (!scope.row.targetBarcode) return
      await this.validBarcode(scope)
    },
    /** 表格选择项的完整性校验函数 */
    validateTable(arr) {
      return new Promise((resolve, reject) => {
        if (arr.some((item) => !item.targetBarcode || !item.targetBarcodeQuantity)) {
          _showSuccessToast('请将勾选项的转入条码和转入数量填写完整')
          reject(false)
        }
        resolve(true)
      })
    },
    /** 过账 */
    async handleConfirm() {
      let _selection = this.list.filter((item) => this.selectedList.includes(item.uuid))
      try {
        // 表单验证
        await this.$refs.formComponent.$refs.refForm.validate()
        if (this.selectedList.length === 0) {
          _showFailToast('请勾选数据')
          return
        }
        // 校验勾选必填项的完整性
        await this.validateTable(_selection)
        if (!_selection.every((item) => Number(item['targetBarcodeQuantity']) > 0)) {
          _showFailToast('所提交项中存在数量小于或等于0的项目，请检查')
          return
        }
        await validateOriginQtyLimit(staticData, _selection, 'targetBarcodeQuantity', 'quantity')
        await customerDialog({
          count: this.selectedList.length,
          total: computedTotal(_selection, 'targetBarcodeQuantity'),
          countPrefix: '本次过账共',
          countSuffix: '条数据,',
          totalPrefix: '累计数量是',
          totalSuffix: '确定过账吗?'
        })
        // 开始过账
        this.loading = true
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(_selection))
        _list.forEach((item) => delete item.uuid)
        // tips:混入接收箱子，目标箱子数据
        _list = _list.map((item) => ({
          ...item,
          wmsTools: this.form.wmsTools,
          targetBoxID: this.form.targetBoxID,
          targetLocationID: this.form.targetLocationID,
          TargetBarcode: item.targetBarcode,
          TargetBarcodeQuantity: item.targetBarcodeQuantity
        }))
        let { account, name } = this.$store.getters
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
          'out',
          null,
          null,
          null,
          'materialDesc',
          postDate
        )
        let res = await WMSAPI.post(this.passAPIName, _data)
        if (res && res.success) {
          this.$toast.success(res.message || '过账成功')
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
    /** 校验数量 */
    validateErfmg() {
      let { key, index } = this.numBlurParams
      // 改变后的值
      let x = Number(this.list[index][key])
      // 原始值
      let y = staticData[index]['quantity']
      // if (!x || x < 0) return '数量不能小于等于0'
      // if (x > y) return '数量不能大于' + y
      if (!x || x < 0 || x > y) return false
      else return true
    },

    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
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
      this.fousOfFirst()
    },
    // submitClear() {
    //   // table数据
    //   this.list = []
    //   // 选中项集合
    //   this.selectedList = []
    //   // 表单
    //   this.form = {
    //     postDate: today,
    //     warehouseNo: this.form.warehouseNo,
    //     wmsTools: this.form.wmsTools,
    //     targetBoxID: this.form.targetBoxID,
    //     targetLocationID: this.form.targetLocationID
    //   }
    //   // this.fousOfFirst()
    //   // this.$refs.formComponent.$refs[""][0].$refs.inputRef.focus()
    // },
    /** 全选和反选 */
    handleSelectAll() {
      if (this.selectedList.length === this.list.length) {
        this.selectedList = []
      } else {
        this.selectedList = this.list.map((item) => item.uuid)
      }
    },
    inputNumHandler(key, index) {
      this.numBlurParams = { key, index }
    },
    // 校验条码是否有误
    validBarcode(scope) {
      const { row, index } = scope
      return new Promise((resolve, reject) => {
        let data = { V_OBJNR: row.targetBarcode }
        WMSAPI.post('business/webapi/ZftdXmbe001', data).then((res) => {
          if (res.success && res.data && res.data.length > 0) {
            // 这里获取的物料还需要和当前行的物料号判断是否是一致的
            let target = res.data[0]
            if (target.idnrk && target.idnrk.replace(/^0+/gi, '') === row.materialNo.replace(/^0+/gi, '')) {
              resolve(true)
            } else {
              _showFailToast('转入的条码的物料编号和当前行的物料编码不一致')
              row.targetBarcode = ''
              this.$set(this.list, index, row)
              reject(false)
            }
          } else {
            // return res.message
            _showFailToast(res.message)
            reject(false)
          }
        })
      })
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
