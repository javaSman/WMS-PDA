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
        <van-grid-item>总数：{{ list.length }}</van-grid-item>
        <van-grid-item>已确认：{{ selectedList.length }}</van-grid-item>
        <van-grid-item>剩余数：{{ list.length - selectedList.length }}</van-grid-item>
        <van-grid-item>
          <van-checkbox v-model="selectAll" :disabled="chkDisabled" shape="square" @click="handleSelectAll">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>

    <!-- 列表 -->
    <VirtualTable
      :table-data.sync="list"
      :table-column="tableColumn"
      :selection.sync="selection"
      :disable-chck="chkDisabled"
      :wrapp-top="show ? 200 : 160"
    />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" confirm-text="过账" @clear="handleClear" @confirm="handleConfirm" />
    <!-- <div id="customer_loading" class="custome_loading">
      <span>加载中...</span>
    </div> -->
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading" :duration="0">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
  </div>
</template>

<script>
// 315备料转移-WMS
import FormVue from '@/components/Form/index.vue'
// import TableVue from '@/components/Table/index.vue'
import VirtualTable from '@/components/VirtualTable/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { WMSAPI, WMSAPI_WCF } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
// import { validateTableSelected } from '@/utils/business'
import { v4 as uuidv4 } from 'uuid'
import { GetUserWarehouse, GetLocationInfo } from '@/api/common'
import { computedTotal } from '@/utils/validateOperateForQty'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { _showFailToast } from '@/utils/message'
import { customerDialog } from '@/components/CustomerDialog'
import { formList, showFormList, tableColumn } from './config'
import { checkItemToTop } from '@/utils/business'
import { mapGetters } from 'vuex'
// const passAPIName = 'business/webapi/OutStock'
const passAPIName = '9037Wcf/WarehouseService.svc/rest/OutStock'
// const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
const listAPIName = '9037Wcf/WarehouseService.svc/rest/ZxwmsXmbeCommonListMrp'
const imOclas = 'XWMS315'
const listAPIBoxID = 'business/webapi/GetLocationNoByBoxId'
const listAPITargetBoxID = 'business/webapi/GetBoxDetail'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
import dayjs from 'dayjs'
export default {
  name: 'Transfer315MaterialPreparationTransferWMS',
  components: {
    FormVue,
    ActionBarVue,
    VirtualTable
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      form: {
        postDate: today
      },
      show: false, // 点击左侧箭头是否展开
      selection: [], // 选中项的uuid集合
      selectedList: [], // 选中项集合
      list: [], // 列表数据
      outBoxIDList: [], // 箱子号物料集合
      sapList: [], // 备料单列表
      loading: false, // 过账按钮loading
      chkDisabled: true, // 是否禁用复选框
      scanLoading: false,
      boxInputRef: null,
      targetBoxIDInputRef: null,
      areaInputRef: null,
      barcodeInputRef: null
    }
  },
  computed: {
    ...mapGetters(['account', 'name']),
    selectAll() {
      return this.selectedList.length === this.list.length && this.selectedList.length !== 0
    }
  },
  created() {
    this.getUserWarehouse()
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
    handleSelectAll() {
      if (this.$refs.table) {
        this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
      }
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
      this.targetBoxIDInputRef?.focus()
    },
    // 转入箱子回车
    async inBoxNoEnter(val) {
      if (!val) return
      // 调用接口带出区域，如果区域有值，光标跳转到条码，没有跳转到区域
      let res = await WMSAPI.get(listAPIBoxID, { boxId: val })
      if (res.success) {
        this.$set(this.form, 'targetLocationID', res.locationNo)
        // 跳转到转出箱子
        this.boxInputRef?.focus()
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
    // 扫描转出箱子，带出条码列表，存入缓存中
    async outBoxIDEnter(val) {
      if (!val) return
      let res1 = await WMSAPI.get(listAPIBoxID, { boxId: val })
      if (res1.success) {
        let res2 = await WMSAPI.get(listAPITargetBoxID, { boxId: val })
        if (res2.success) {
          // 储存目标箱子号物料
          this.outBoxIDList = res2.materialBarcodeList
          if (this.outBoxIDList.length === 0) {
            _showFailToast('转出箱子暂无明细')
            // this.$set(this.form, 'boxID', '')
            this.boxInputRef.focus()
          }
          // } else {
          this.barcodeInputRef?.focus()
          // }
        } else {
          _showFailToast(res2.message)
          this.$set(this.form, 'boxID', '')
          this.boxInputRef.focus()
        }
      } else {
        _showFailToast(res1.message)
        this.$set(this.form, 'boxID', '')
        this.boxInputRef.focus()
      }
    },
    /** 区域回车 */
    async areaEnter(val) {
      if (!val) return
      let res = await GetLocationInfo(val)
      if (res.success) {
        this.boxInputRef?.focus()
      } else {
        _showFailToast(res.message)
        this.$set(this.form, 'targetLocationID', '')
        this.areaInputRef.focus()
      }
    },
    /** 条码回车 */
    async barcodeEnter(val) {
      if (!val) {
        _showFailToast('请输入条码')
        return
      }
      val = val.trim()
      try {
        // 以list的长度作为判断条件，大于0，表面如果页面明细没有被清除，等于0表明页面无信息
        if (this.sapList.length > 0) {
          // tips：再次扫条码时从spa列表中获取结果，然后从结果中获取对应的物料编码，然后用这个物料编码和条码列表匹配，如果匹配上就勾选
          let target = this.sapList.find((item) => item.objnr === val)
          // tips:还要校验一下是否重复扫码，找出那项，判断是否在勾选里面，如果是报错，如果不是进行勾选
          if (this.selectedList.findIndex((item) => item.objnr === val) !== -1) {
            _showFailToast('请勿重复扫码')
            this.$set(this.form, 'imBarcode', '')
            return
          }
          if (target) {
            // tips:然后用这个找到的项去匹配条码列表，如果匹配上就显示并勾选
            if (this.outBoxIDList.map((item) => item.materialNo).includes(target.matnr ? target.matnr.replace(/^0+/gi, '') : target.idnrk)) {
              // tips:累加条码列表的数量，必须要大于备料单的数量才能备料
              let materialTotal = this.outBoxIDList.map((item) => item.quantity).reduce((pre, next) => pre + next)
              if (materialTotal < target.erfmg) {
                _showFailToast('库存不足，无法备料')
                return
              }
              let arrs = [...this.selection, target.uuid]
              // tips:填充uuid集合，进行勾选
              this.selection = arrs
              // tips:从列表中映射出这部分选择的内容，用于判断是否重复勾选和用于过账
              this.selectedList = this.list.filter((item) => this.selection.includes(item.uuid))
              // 置顶操作
              this.list = checkItemToTop(this.list, target)
              this.$nextTick(() => {
                // 光标重新聚焦
                this.$set(this.form, 'imBarcode', '')
                this.barcodeInputRef?.focus()
              })
            } else {
              _showFailToast('所扫条码的物料号与箱子中的物料不匹配')
              return
            }
          } else {
            _showFailToast(`当前所扫条码【${val}】不存在该单据中，请检查`)
            return
          }
          return
        }
        // tips:获取spa列表数据
        this.scanLoading = true
        // let res = await getListComments({ imBarcode: val, imOclas })
        let res = await WMSAPI_WCF.post(listAPIName, { imBarcode: val, imOclas })
        this.scanLoading = false
        if (res && res.success) {
          // _showSuccessToast(res.message)
          let _data = res.data
          if (_data.length <= 0) {
            _showFailToast(res.message)
          }
          let arr = []
          // 增加uuid为唯一识别符
          _data.forEach((item) => {
            item.uuid = uuidv4()
            // tips:性能测试
            // for (let index = 0; index < 80; index++) {
            //   arr.push({ ...item, uuid: uuidv4() })
            // }
            arr.push(item)
          })
          // tips：保留spa列表，后续用来匹配
          this.sapList = arr
          this.list = arr
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
        this.form.imBarcode = ''
        // 查询结果之后重新聚焦
        this.barcodeInputRef?.focus()
      }
    },
    /** 过账 */
    async handleConfirm() {
      try {
        // 表单验证
        await this.$refs.formComponent.$refs.refForm.validate()
        // 是否有勾选数据
        if (this.selectedList.length === 0) {
          _showFailToast('请勾选数据')
          return
        }
        await customerDialog({
          count: this.selectedList.length,
          total: computedTotal(this.selectedList),
          countPrefix: '本次过账共',
          countSuffix: '条数据,',
          totalPrefix: '累计数量是',
          totalSuffix: '确定过账吗?'
        })
        // 开始过账
        this.loading = true
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(this.selectedList))
        _list.forEach((item) => delete item.uuid)
        // tips:混入转入/转出箱子和区域信息
        _list = _list.map((item) => ({
          ...item,
          boxID: this.form.boxID,
          targetBoxID: this.form.targetBoxID,
          targetLocationID: this.form.targetLocationID,
          TargetBarcode: item.objnr
        }))
        // 处理接口参数
        let _form = Object.assign({}, this.form)
        let postDate = _form.postDate
        delete _form.postDate
        // TODO: 这里记得传入用户信息
        // 组合参数
        let _data = fomrmatShipmentSubmitParams(
          imOclas,
          this.account,
          this.name,
          this.form.warehouseNo,
          _list,
          'out',
          null,
          null,
          undefined,
          'maktx',
          postDate
        )
        // 特殊处理一下wms过账参数，现在条码不要
        _data.wmsOutStockList = _data.wmsOutStockList.map((item) => ({ ...item, barcode: '' }))
        // 特殊处理一下sap的过账参数，这里不需要修改任何数据
        let _list2 = JSON.parse(JSON.stringify(this.selectedList))
        _data.zxstXmbeStruList = _list2.map((item) => ({
          ...item,
          IM_CARDNO: this.account,
          IM_CARDNAME: this.name,
          cpudt: dayjs(postDate).format('YYYY-MM-DD'),
          cputm: dayjs(postDate).format('HH:mm:ss')
        }))
        // 调用接口
        let res = await WMSAPI_WCF.post(passAPIName, _data)
        if (res && res.success) {
          this.$toast.success(res.message || '过账成功')
          // 清空表单和列表
          this.submitClear()
        } else {
          _showFailToast(res.message)
        }
      } finally {
        this.loading = false
      }
    },
    handleClear() {
      // table数据
      this.list = []
      // 转出箱子列表
      this.outBoxIDList = []
      // spa列表
      this.sapList = []
      // 选中项集合
      this.selectedList = []
      this.selection = []
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
      // 转出箱子列表
      this.outBoxIDList = []
      // spa列表
      this.sapList = []
      // 选中项集合
      this.selectedList = []
      this.selection = []
      // 表单
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo,
        targetBoxID: this.form.targetBoxID,
        targetLocationID: this.form.targetLocationID
      }
      this.$refs.formComponent.$refs['boxID'][0].$refs.inputRef.focus()
    },
    initConfig() {
      this.formList.forEach((item) => {
        if (item.prop === 'warehouseNo') {
          item.change = this.wareHouseChange
        }
        // 转入箱子回车
        if (item.prop === 'targetBoxID') {
          item.enter = (val) => this.inBoxNoEnter(val)
          this.targetBoxIDInputRef = this.getVueComponentByProp(item.prop)
        }
        // 转出箱子回车
        if (item.prop === 'boxID') {
          item.enter = (val) => this.outBoxIDEnter(val)
          this.boxInputRef = this.getVueComponentByProp(item.prop)
        }
        // 区域回车
        if (item.prop === 'targetLocationID') {
          item.enter = this.areaEnter
          this.areaInputRef = this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
          this.barcodeInputRef = this.getVueComponentByProp(item.prop)
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
.custome_loading {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: red;
  display: none;
}
</style>
