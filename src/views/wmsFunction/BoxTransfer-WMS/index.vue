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

    <VirtualTable ref="table" :wrapp-top="show ? 190 : 150" :table-data.sync="list" :table-column="tableColumn" :selection.sync="selectedList" />
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
import VirtualTable from '@/components/VirtualTable/index.vue'
import { formList, showFormList, tableColumn } from './config'
import FormVue from '@/components/Form/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { WMSAPI } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { GetUserWarehouse, GetBoxDetail, GetBoxInfoByBoxId, GetLocationInfo } from '@/api/common'
import { _showFailToast } from '@/utils/message'
import { customerDialog } from '@/components/CustomerDialog'
import { getEditableKey, computedTotal } from '@/utils/validateOperateForQty'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { checkItemToTop } from '@/utils/business'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
// 整箱物料调拨-WMS
const cachedName = 'WMSFunction.BoxTransfer-WMS'
const passAPIName = 'business/webapi/OutStock'
const boxIDAPIName = 'business/webapi/GetBoxDetail'
const imOclas = '整箱物料调拨'
export default {
  name: cachedName,
  components: {
    ActionBarVue,
    FormVue,
    VirtualTable
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      passAPIName,
      boxIDAPIName,
      imOclas,
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
      targetBoxInputRef: null, // 目标箱子号ref
      areaInputRef: null // 区域ref
    }
  },
  computed: {
    multiList() {
      let { selectedList, list } = this
      return { selectedList, list }
    }
  },
  watch: {
    // 监听选择长度和表长度判断勾选情况
    multiList: {
      handler: function (val) {
        const { selectedList, list } = val
        this.selectAll = selectedList.length === list.length && selectedList.length !== 0
        // 全选时触发过账
        // if (this.selectAll) this.handleConfirm()
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
    /** 初始化配置项 */
    initConfig() {
      this.formList.forEach((item) => {
        // 仓库-获取下拉列表
        if (item.prop === 'warehouseNo') {
          item.change = this.wareHouseChange
        }
        // 箱子号-获取箱子明细
        if (item.prop === 'wmsTools') {
          item.enter = this.getBoxDetails
          this.boxInputRef = this.getVueComponentByProp(item.prop)
        }
        // 箱子号/接收箱子号-获取区域
        if (item.prop === 'targetBoxID') {
          item.enter = this.boxNoEnter
          this.targetBoxInputRef = this.getVueComponentByProp(item.prop)
        }
        // 区域/货位/接收货位-验证货位值
        if (item.prop === 'targetLocationID') {
          item.enter = this.areaEnter
          this.areaInputRef = this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
        }
      })
    },
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
    // 确认条码
    barcodeEnter(val) {
      if (this.list.length > 0 && this.selectedList.length > 0) {
        let targetUuid = this.list.find((item) => item.barcode === val)
        if (this.selectedList.includes(targetUuid.uuid)) {
          _showFailToast('条码已扫描，请勿重复扫码')
          return
        }
      }

      let target = this.list.filter((item) => item.barcode === val)
      if (target.length > 0) {
        // let selectUUID = this.selectedList.map((item) => item.uuid)
        let arrs = [...this.selectedList, ...target.map((item) => item.uuid)]
        this.selectedList = arrs
        // this.$refs.table?.handleSelect(arrs)
        // tips:扫码置顶
        this.$nextTick(() => {
          this.list = checkItemToTop(this.list, target[0])
        })
        this.$set(this.form, 'imBarcode', '')
        this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
        this.$refs.table.$refs.virtual_table_wrapper.scrollTop = 0
      }
    },
    /** 箱子号回车带出明细
     *  判断是否有明细
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
            this.$set(this.form, 'boxNo', '') // boxNo 字段根据需求
            this.boxInputRef?.focus()
            this.list = []
            return
          }
          // 增加uuid为唯一识别符
          _data.forEach((item) => {
            item.uuid = uuidv4()
          })
          // 赋值表格数据并按照物料号升序排序
          this.list = _data.sort((a, b) => Number(a.materialNo) - Number(b.materialNo))
          // 存储原始数据
          this.staticData = JSON.parse(JSON.stringify(_data))
          this.staticData.forEach((item) => {
            item.newQuantity = item.quantity
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
          this.$set(this.form, 'targetLocationID', res.locationNo) // targetLocationID 字段根据需求
          this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
        }
      } else {
        // tips:这里的报错信息会存在三种情况，一是箱子不存在，二是没有绑定区域，三是其他报错，当是没有绑定区域时，不清除箱子号
        if (res.message.indexOf('没有绑定货位') !== -1) {
          _showFailToast(res.message)
          // 光标跳转到区域位置
          this.areaInputRef?.focus()
        } else {
          _showFailToast(res.message)
          this.targetBoxIDInputRef?.focus()
          this.$set(this.form, 'targetBoxID', '')
        }
      }
    },
    // /** 区域回车
    //  *  查询区域是否存在-（1）存在-光标跳转到【下一输入框】（2）不存在-错误提示
    //  */
    async areaEnter(val) {
      if (!val) return
      let res = await GetLocationInfo(val)
      if (!res.success) {
        _showFailToast(res.message)
        this.areaInputRef?.focus()
        this.$set(this.form, 'targetLocationID', '')
      } else {
        this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
      }
    },
    /** 过账 */
    async handleConfirm() {
      let key = getEditableKey(this.tableColumn)
      try {
        // 表单验证
        await this.$refs.formComponent.$refs.refForm.validate()
        let _selection = this.list.filter((item) => this.selectedList.includes(item.uuid))
        if (this.selectedList.length === 0) {
          _showFailToast('请勾选数据')
          return
        }
        if (key && !_selection.every((item) => Number(item[key]) > 0)) {
          _showFailToast('所提交项中存在数量小于或等于0的项目，请检查')
          return
        }
        await customerDialog({
          count: this.selectedList.length,
          total: computedTotal(_selection, 'quantity'),
          countPrefix: '本次过账共',
          countSuffix: '条数据,',
          totalPrefix: '累计数量是',
          totalSuffix: '确定过账吗?'
        })
        // 开始过账
        this.loading = true
        // 处理接口参数
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(_selection))
        _list.forEach((item) => delete item.uuid)
        let { account, name } = this.$store.getters
        // tips:混入接收箱子，目标箱子数据
        _list = _list.map((item) => ({
          ...item,
          wmsTools: this.form.wmsTools,
          targetBoxID: this.form.targetBoxID,
          targetLocationID: this.form.targetLocationID
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

    /** 根据prop的值获取该输入框 */
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    /** 清空 */
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
    submitClear() {
      // table数据
      this.list = []
      // 选中项集合
      this.selectedList = []
      // 表单
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo,
        wmsTools: this.form.wmsTools,
        targetBoxID: this.form.targetBoxID,
        targetLocationID: this.form.targetLocationID
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
</style>
