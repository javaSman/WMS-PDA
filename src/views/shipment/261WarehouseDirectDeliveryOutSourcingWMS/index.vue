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
        <van-grid-item @click="showMaterilaBoarcodeModal">总数：{{ materialBarcodeList.length }}</van-grid-item>
        <van-grid-item>已确认：{{ selection.length }}</van-grid-item>
        <van-grid-item>剩余数：{{ materialBarcodeList.length - selection.length }}</van-grid-item>
        <van-grid-item>
          <van-checkbox v-model="selectAll" :disabled="isDisableChecked" shape="square">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>
    <!-- 列表 -->
    <!-- <Table
      ref="table"
      :is-virtually="true"
      :table-data.sync="tableData"
      :selection.sync="selection"
      :table-column="tableColumn"
      :disabled-chk="isDisableChecked"
    /> -->
    <!-- 要传入顶部列表的高度，一项是40,有隐藏项要加上隐藏项 -->
    <VirtualTable
      ref="viTable"
      :wrapp-top="show ? 200 : 160"
      :table-data="tableData"
      :table-column="tableColumn"
      :selection.sync="selection"
      :disable-chck="isDisableChecked"
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
    <div v-if="isShowMaterilaBarcodeList" class="customer_modal" @click="() => (isShowMaterilaBarcodeList = false)">
      <div class="materila_barcode_wrap">
        <div class="content_wrap" @click.stop>
          <div class="top_info">
            <span>当前没有勾选的数量是:</span>
            <span>{{ materialBarcodeList_dynamic.length }}</span>
          </div>
          <div class="scroll_wrap">
            <div v-for="(i, index) in materialBarcodeList_dynamic" :key="index" class="item">
              <div>
                <span>条码:&nbsp;</span>
                <span>{{ i.barcode }}</span>
              </div>
              <div>
                <span>物料编号:&nbsp;</span>
                <span>{{ i.materialNo }}</span>
              </div>
              <div>
                <span>物料描述:&nbsp;</span>
                <span>{{ i.materialDesc }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FormVue from '@/components/Form/index.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
// import Table from '@/components/Table/index.vue'
import VirtualTable from '@/components/VirtualTable/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
// import { WMSAPI } from '@/api/generalAPI'
import { WMSAPI_WCF } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
// import Loading from '@/components/Loading'
import { checkItemToTop } from '@/utils/business'
import { GetBoxDetail, GetBoxInfoByBoxId, GetLocationInfo, GetUserWarehouse, get261DListForBarcode } from '@/api/common'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { computedTotal } from '@/utils/validateOperateForQty'
import { _showFailToast } from '@/utils/message'
import { mapGetters } from 'vuex'
import { customerDialog } from '@/components/CustomerDialog'
// const passAPIName = 'business/webapi/OutStock'
const passAPIName = '9037Wcf/WarehouseService.svc/rest/OutStock'
const listName = '9037Wcf/WarehouseService.svc/rest/GetXwms261D'
const imOclas = 'XWMS261D'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
import { deepClone } from '@/utils'
// 261发料-仓库直发-外购件WMS
const cachedName = 'shipment.261WarehouseDirectDeliveryOutSourcingWMS'
// 原始数据
let staticData = []
export default {
  name: cachedName,
  components: {
    FormVue,
    UserAuth,
    // Table,
    ActionBarVue,
    VirtualTable
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      tableData: [],
      numBlurParams: {
        key: 'erfmg',
        index: 0
      },
      show: false,
      form: {
        postDate: today
      },
      loading: false,
      scanLoading: false,
      // 选中的数据
      selection: [], // 箱子号带出的明细的勾选项
      isDisableChecked: true,
      boxInputRef: null,
      targetBoxIDInputRef: null,
      targetLocationIDInputRef: null,
      barcodeInputRef: null,
      passAPIName,
      userAuthVisible: true,
      extraParams: {},
      materialBarcodeList: [], // 条码列表
      isShowMaterilaBarcodeList: false, // 是否显示物料条码列表
      materialBarcodeList_dynamic: [] // 动态的条码列表，用于弹窗显示
    }
  },
  computed: {
    ...mapGetters(['account', 'name']),
    selectAll() {
      return this.selection.length === this.tableData.length && this.selection.length !== 0
    }
  },
  watch: {
    // 监听选择的长度动态更新动态条码列表数据
    selection: function (n) {
      if (n.length > 0) {
        let _selection = this.tableData.filter((item) => n.includes(item.uuid))
        this.materialBarcodeList_dynamic = this.materialBarcodeList_dynamic.filter(
          (item) => !_selection.map((item) => item.objnr).includes(item.barcode)
        )
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
    initConfig() {
      let _this = this
      _this.tableColumn.forEach((item) => {
        if (item.type === 'Table/Number') {
          let _erfmgRules = [
            { required: true, message: '请输入数量', trigger: 'onBlur' },
            { validator: _this.validateErfmg, message: '数量不能小于0或大于原数量', trigger: 'onBlur' }
          ]

          item.rules = _erfmgRules
        }
      })
      _this.formList.forEach((item) => {
        if (item.prop === 'warehouseNo') {
          item.change = _this.wareHouseChange
        }
        if (item.prop === 'boxID') {
          item.enter = _this.boxIDEnter
          _this.boxInputRef = _this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'targetBoxID') {
          item.enter = _this.targetBoxIDEnter
          _this.targetBoxIDInputRef = _this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'targetLocationID') {
          item.enter = _this.targetLocationIDEnter
          _this.targetLocationIDInputRef = _this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'imBarcode') {
          item.enter = _this.barcodeEnter
          _this.barcodeInputRef = _this.getVueComponentByProp(item.prop)
        }
      })
    },
    authComfir() {
      this.fousOfFirst()
    },
    /** 来源载具回车 */
    async boxIDEnter(val) {
      if (!val) return
      let res = await GetBoxDetail(val)
      if (res.success) {
        let _data = res.materialBarcodeList.map((item) => ({ ...item, uuid: uuidv4() }))
        if (_data.length === 0) {
          _showFailToast(`箱子${val}暂无明细`)
          this.boxInputRef.focus()
          this.form.boxID = ''
          return
        }
        // tips:保留这个条码列表，稍后扫码领料单号的列表比对，如果合适就显示出那项并勾选
        this.materialBarcodeList = _data
        // tips:这里也记录一份到动态条码列表里面用于弹窗显示
        this.materialBarcodeList_dynamic = _data.map((item) => ({
          materialNo: item.materialNo,
          materialDesc: item.materialDesc,
          barcode: item.barcode
        }))
        // 光标跳转到目标载具
        this.targetBoxIDInputRef.focus()
      } else {
        _showFailToast(res.message)
        this.boxInputRef.focus()
        this.form.boxID = ''
      }
    },
    /** 目标载具回车 */
    targetBoxIDEnter(val) {
      if (!val) return
      let _this = this
      GetBoxInfoByBoxId(val).then((res) => {
        // console.log(res)
        // 判断箱子号是否存在
        if (res.success) {
          _this.$set(_this.form, 'targetLocationID', res.locationNo)
          this.barcodeInputRef.focus()
        } else {
          _showFailToast(res.message)
          this.targetLocationIDInputRef.focus()
        }
      })
    },
    targetLocationIDEnter(val) {
      if (!val) return
      GetLocationInfo(val)
        .then((res) => {
          // console.log(res)
          if (res.success) {
            this.barcodeInputRef.focus()
          } else {
            _showFailToast(res.message)
            this.targetLocationIDInputRef.focus()
          }
        })
        .catch(() => {
          this.targetLocationIDInputRef.focus()
        })
    },
    showMaterilaBoarcodeModal() {
      this.isShowMaterilaBarcodeList = true
    },
    /** 条码回车 */
    async barcodeEnter(val) {
      if (!val) return
      // 判断是否已经扫码箱子号
      if (this.materialBarcodeList.length === 0 || !this.form.boxID) {
        _showFailToast(`请先扫码来源载具`)
        this.barcodeInputRef.focus()
        this.$nextTick(() => {
          this.form.imBarcode = ''
        })
        return
      }
      // 首先判断所扫条码是否在条码列表中
      if (!this.materialBarcodeList.map((item) => item.barcode).includes(val)) {
        _showFailToast('所扫条码不在来源载具中')
        this.$set(this.form, 'imBarcode', '')
        this.barcodeInputRef.focus()
        return
      }
      // tips:如果已经扫描了领料单带出了信息，那么就直接根据条码去匹配tableata和materialBarcodeList即可
      if (this.tableData.length > 0) {
        // tips:如果所扫条码不在当前的领料单中，但是在条码列表中，那么就再次调用接口获取数据并追加进去
        if (!this.tableData.map((item) => item.objnr).includes(val)) {
          try {
            this.scanLoading = true
            let res = await get261DListForBarcode({ barcode: val })
            if (!res.success) {
              _showFailToast(res.message)
              return
            }
            let _data = res.data
            if (_data.length === 0) {
              _showFailToast(`当前条码所属的领料单暂无明细`)
              return
            }
            // tips:执行追加操作
            this.tableData = [...this.tableData, ..._data.map((item) => ({ ...item, uuid: uuidv4() }))]
            this.tableData = this.tableData.map((item) => ({ ...item, operator: this.extraParams.cardname }))
            this.selectAndFocus(val)
          } catch (e) {
            console.log(e)
          } finally {
            this.scanLoading = false
          }
        } else {
          // tips:勾选之前还需要判断是否是已经勾选过了
          if (this.selection.length > 0) {
            let _selection = this.tableData.filter((item) => this.selection.includes(item.uuid))
            if (_selection.map((item) => item.objnr).includes(val)) {
              _showFailToast('该条码已经扫码勾选，请勿重复扫码')
              this.$set(this.form, 'imBarcode', '')
              this.barcodeInputRef.focus()
              return
            } else {
              // 如果在这里面，那就直接勾选
              this.selectAndFocus(val)
            }
          }
        }
      } else {
        try {
          this.scanLoading = true
          let res = await WMSAPI_WCF.post(listName, { barcode: val })
          if (!res.success) {
            _showFailToast(res.message)
            return
          }
          let _data = res.data
          if (_data.length === 0) {
            _showFailToast(`当前条码所属的领料单暂无明细`)
            return
          }
          // 混入uuid和当前领料人
          this.tableData = _data.map((item) => ({ ...item, uuid: uuidv4(), operator: this.extraParams.cardname }))
          // tips:因为扫码的就是条码，所以可以在结果返回的同时勾选上这个条码
          this.selectAndFocus(val)
        } catch (e) {
          console.log(e)
        } finally {
          this.scanLoading = false
          this.$set(this.form, 'imBarcode', '')
          this.barcodeInputRef.focus()
        }
      }
    },
    /** 勾选目标并重新聚焦条码行 */
    selectAndFocus(val) {
      let target = this.tableData.find((item) => item.objnr === val)
      let arrs = [...this.selection, target.uuid]
      this.selection = arrs
      this.tableData = checkItemToTop(this.tableData, target)
      this.$set(this.form, 'imBarcode', '')
      this.barcodeInputRef.focus()
      // 将列表视图滚动回顶层
      this.$refs.viTable.$refs.virtual_table_wrapper.scrollTop = 0
    },
    /** 过账 */
    async handleConfirm() {
      await this.$refs.formComponent.$refs.refForm.validate()
      let _selection = this.tableData.filter((item) => this.selection.includes(item.uuid))
      if (this.selection.length === 0) {
        _showFailToast('请勾选数据')
        return
      }
      await customerDialog({
        count: this.selection.length,
        total: computedTotal(_selection, 'erfmg'),
        countPrefix: '本次过账共',
        countSuffix: '条数据,',
        totalPrefix: '累计数量是',
        totalSuffix: '确定过账吗?'
      })
      try {
        // 处理接口参数
        let _form = Object.assign({}, this.form)
        let postDate = _form.postDate
        delete _form.postDate
        // 开始过账
        this.loading = true
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(_selection))
        _list.forEach((item) => delete item.uuid)
        // tips: 混入箱子和区域信息
        _list = _list.map((item) => ({
          ...item,
          boxID: this.form.boxID,
          targetBoxID: this.form.targetBoxID,
          targetLocationID: this.form.targetLocationID
        }))
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
        // tips:针对sap的这些登录人和领料人信息姓名工号要对调
        // 备份一份缓存
        let _zxstXmbeStruList = deepClone(_data.zxstXmbeStruList)

        // console.log('_zxstXmbeStruList', _zxstXmbeStruList)
        _data.zxstXmbeStruList = _data.zxstXmbeStruList.map((item, index) => ({
          ...item,
          cardmo: _zxstXmbeStruList[index].cardmame,
          cardmame: _zxstXmbeStruList[index].cardmo,
          cardno: _zxstXmbeStruList[index].cardname,
          cardname: _zxstXmbeStruList[index].cardno
        }))
        // tips:这里的领料人信息的工号和姓名要对调
        let _IM_CARDNO = _data.iM_CARDNO
        _data.iM_CARDNO = _data.iM_CARDNAME
        _data.iM_CARDNAME = _IM_CARDNO

        // console.log(_data)
        let res = await WMSAPI_WCF.post(passAPIName, _data)
        if (res && res.success) {
          this.$toast.success({
            message: res.message,
            duration: 10 * 1000
          })
          // 清空表单和列表
          this.submitClear()
        } else {
          _showFailToast(res.message)
        }
        this.loading = false
      } catch (e) {
        _showFailToast('请检查必填项是否填写完整')
        this.loading = false
      }
    },
    /** 手动清除 */
    handleClear() {
      this.tableData = []
      this.selection = []
      this.materialBarcodeList = []
      this.materialBarcodeList_dynamic = []
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo
      }
      this.show = false
      this.fousOfFirst()
    },
    /** 过账清除 */
    submitClear() {
      // tips:过账成功之后删除对应条码列表中的数据从而更新总数
      let _selection = this.tableData.filter((item) => this.selection.includes(item.uuid))
      this.materialBarcodeList = this.materialBarcodeList.filter((item) => !_selection.map((item) => item.objnr).includes(item.barcode))
      // 同时更新动态条码列表
      this.materialBarcodeList_dynamic = this.materialBarcodeList
      // 处理完上面的数据之后再清空这部分数据
      this.tableData = []
      this.selection = []
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo,
        boxID: this.form.boxID,
        targetBoxID: this.form.targetBoxID,
        targetLocationID: this.form.targetLocationID
      }
      this.show = false
      this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
    },
    // handleSelectAll() {
    //   if (this.selection.length === this.tableData.length) {
    //     this.selection = []
    //   } else {
    //     this.selection = this.tableData.map((item) => item.uuid)
    //   }
    //   // this.$refs.table?.checkboxGroup.toggleAll(this.selectAll)
    // },
    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    // 根据prop和index获取表格中表单组件
    getVueComponentByTableProp(prop, index) {
      return this.$refs.table.$refs[`${prop}_${index}`][0].$refs.input
    },
    validateErfmg() {
      let { key, index } = this.numBlurParams
      // 改变后的值
      let x = Number(this.tableData[index][key])
      // 原始值
      let y = staticData[index][key]
      if (!x || x < 0) return false
      if (x > y) return false
      else return true
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
.customer_modal {
  height: 100vh;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2023;
  background-color: rgba($color: #000000, $alpha: 0.6);
  .materila_barcode_wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    height: 100vh;
    position: relative;

    .content_wrap {
      width: 90%;
      height: 330px;
      background-color: #f9efef;
      padding: 10px;
      box-sizing: border-box;
      overflow-y: auto;
      position: relative;
      font-size: 12px;
      .top_info {
        position: absolute;
        top: 0;
        left: 0;
        line-height: 20px;
        z-index: 1;
        background-color: #fff;
        width: 100%;
      }
      .scroll_wrap {
        margin-top: 20px;
        height: 280px;
        overflow-y: scroll;
        .item {
          background-color: #fff;
          width: 100%;
          border-bottom: 1px solid #ccc;
          margin-top: 10px;
          div {
            display: flex;
            justify-content: start;
            align-items: center;
            border-bottom: 1px solid #ccc;
            &:last-child {
              border-bottom: none;
            }
            span {
              text-align: left;
              font-size: 12px;
            }
          }
        }
      }
    }
  }
}
</style>
