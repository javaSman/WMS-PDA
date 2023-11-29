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
          <van-checkbox v-model="selectAll" :disabled="true" shape="square" @click="handleSelectAll">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>

    <!-- 列表 -->
    <TableVue ref="table" :table-data.sync="list" :table-column="tableColumn" :selection.sync="selectedList" :disabled-chk="true" />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" @clear="clearHandler" @confirm="handleConfirm" />
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
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import Dates from '@/utils/datetime'
import { mapGetters } from 'vuex'
import { WMSAPI } from '@/api/generalAPI'
import { GetUserWarehouse, GetBoxInfoByBoxId, GetLocationInfo } from '@/api/common'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { postTransferPramamsForWmsInOutStock } from '@/utils/postTransferPramsForWms'
import { v4 as uuidv4 } from 'uuid'
import { computedTotal } from '@/utils/validateOperateForQty'
import { _showFailToast } from '@/utils/message'
import { customerDialog } from '@/components/CustomerDialog'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
// 124不良品退货-WMS
const cachedName = 'receive.124RejectsReturnGoods-WMS'
import { formList, showFormList, tableColumn } from './config'
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
const passAPIName = 'business/webapi/OutStock'
const imOclas = 'XWMS124'
export default {
  name: cachedName,
  components: {
    FormVue,
    TableVue,
    ActionBarVue
  },
  data() {
    return {
      chkDisabled: false,
      listAPIName,
      passAPIName,
      imOclas,
      formList,
      showFormList,
      tableColumn,
      form: {
        postDate: today
      }, // 表单对象，初始化过账日期
      show: false, // 点击左侧箭头是否展开
      selectAll: false, // 是否全选
      selectedList: [], // 选中项集合
      list: [], // 列表数据
      loading: false, // 过账按钮loading
      scanLoading: false, // 扫条码时进行loading
      exParams: {}, // 存储额外的参数对象
      numBlurParams: {
        key: 'erfmg',
        index: 0
      } // 用于存储当前正在编辑的行的索引
    }
  },
  computed: {
    ...mapGetters(['account', 'name']),
    multiList() {
      let { selectedList, list } = this
      return { selectedList, list }
    }
  },
  watch: {
    // 对比选中项长度与数据数组总长度，是否可以勾选全选复选框
    multiList: {
      handler: function (val) {
        const { selectedList, list } = val
        this.selectAll = selectedList.length === list.length && selectedList.length !== 0
        // tips: 这里要判断一下是否是那种自动触发过账的
        if (selectedList.length > 0 && list.length > 0 && selectedList.length === list.length) {
          this.handleConfirm()
        }
      }
    }
  },
  created() {
    this.getUserWarehouse()
  },
  mounted() {
    this.fousOfFirst()
    this.initConfig()
  },
  methods: {
    // 初始化配置项
    initConfig() {
      this.formList.forEach((item) => {
        if (item.prop === 'warehouseNo') {
          item.change = this.wareHouseChange
        }
        if (item.prop === 'wmsTools') {
          item.enter = this.wmsToolsEnter
        }
        if (item.prop === 'locationID') {
          item.enter = this.areaEnter
        }
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
        }
      })
    },
    // tips：让第一个可以输入的输入源获取光标
    fousOfFirst() {
      let result = this.formList.filter((item) => item.type === 'Input')
      if (result.length > 0) {
        // tips:获取第一行的输入key
        let prop = result[0].prop
        this.$refs.formComponent.$refs[prop][0].$refs.inputRef.focus()
      }
    },
    /** 全选和反选 */
    handleSelectAll() {
      this.$nextTick(() => {
        this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
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

    /** 仓库change */
    wareHouseChange(val) {
      if (!val) return
      this.form.warehouseNo = val
      this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
    },
    /** 箱子号回车 */
    async wmsToolsEnter(val) {
      if (!val) return
      // 调用接口带出区域，如果区域有值，光标跳转到条码，没有跳转到区域
      let res = await GetBoxInfoByBoxId(val)
      if (res.success) {
        // this.form.locationID = res.locationNo
        this.$set(this.form, 'locationId', res.locationNo)
        this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
      } else {
        _showFailToast(res.message)
        this.$refs.formComponent.$refs['locationId'][0].$refs.inputRef.focus()
      }
    },

    /** 区域回车 */
    async areaEnter(val) {
      if (!val) return
      let res = await GetLocationInfo(val)
      if (!res.success) {
        _showFailToast(res.message)
      } else {
        this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
      }
    },

    /**
     * @description: 条码回车事件，需判断匹配明细的方式
     * @param {*} val 条码值
     */
    async barcodeEnter(val) {
      if (!val) {
        _showFailToast('请输入条码')
        return
      }
      try {
        // 否则加载接口数据然后全选
        this.scanLoading = true
        let res = await WMSAPI.get(this.listAPIName, { imBarcode: val, imOclas: imOclas })
        if (res && res.success) {
          let _data = res.data
          if (_data.length === 0) {
            _showFailToast('暂无数据')
            return
          }
          if (_data.length > 0) {
            this.form = Object.assign({}, this.form, _data[0])
          }
          let arr = []
          // 增加uuid为唯一识别符
          _data.forEach((item) => {
            item.uuid = uuidv4()
            arr.push(item)
          })
          // 特殊处理物料号，谁有值就取谁
          this.list = arr.map((item) => ({
            ...item
            // matnr: item.idnrk || item.matnr
          }))
          // 全选
          this.$refs.table.handleSelect(arr.map((item) => item.uuid))
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },

    // 过账
    async handleConfirm() {
      if (this.selectedList.length === 0) {
        _showFailToast('请勾选数据')
        return
      }
      try {
        // 表单验证
        await this.$refs.formComponent.$refs.refForm.validate()
        await customerDialog({
          count: this.selectedList.length,
          total: computedTotal(this.selectedList, 'scrqty'),
          countPrefix: '本次过账共',
          countSuffix: '条数据,',
          totalPrefix: '累计拣货数量是',
          totalSuffix: '确定过账吗?'
        })
        // 开始过账
        this.loading = true
        // 处理接口参数
        let _form = Object.assign({}, this.form)
        let postDate = _form.postDate
        delete _form.postDate
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(this.selectedList))
        _list.forEach((item) => delete item.uuid)
        // 重新处理一下列表数据，如果机加件的那个条码需要特殊处理
        // tips：针对sap的objnr字段需要特殊处理，如果objnr本身没有值的情况，那么需要将kdauf拼接posnv，用-拼接
        _list = _list.map((item) => ({
          ...item,
          wmsTools: this.form.wmsTools,
          locationId: this.form.locationId,
          objnr: item.objnr ? item.objnr : `${item.kdauf}-${item.posnv}`
          // barcode: this.computedType(item.matnr.replace(/^0+/giposnv, '')) ? `${item.kdauf}-000001` : item.objnr
        }))

        // 组合数据
        let _data = fomrmatShipmentSubmitParams(
          imOclas,
          this.account,
          this.name,
          this.form.warehouseNo,
          _list,
          'out',
          this.extraParams,
          '',
          undefined,
          'txz01',
          postDate
        )

        // tips:针对wms的部分特殊处理,条码的取值需要根据是否是机加件动态传入参数,同时数量的取值需要取scrqty这个值，而非erfmg
        _list = _list.map((item) => ({
          ...item,
          wmsTools: this.form.wmsTools,
          locationId: this.form.locationId,
          quantity: item.scrqty,
          barcode: this.computedType(item.matnr ? item.matnr.replace(/^0+/gi, '') : item.idnrk) ? `${item.kdauf}-000001` : item.objnr
        }))
        _data.wmsOutStockList = postTransferPramamsForWmsInOutStock(_list, imOclas, 'barcode', 'txz01', 'scrqty')
        let res = await WMSAPI.post(this.passAPIName, _data)
        if (res && res.success) {
          await this.$dialog.alert({ message: res.message })
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

    // tips:判断物料的开头是不是2或者字母，因为这个代表这是机加件的意思
    computedType(matnr) {
      if (/^[a-zA-Z]|^2/.test(matnr)) {
        return true
      } else {
        return false
      }
    },

    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    // 清空
    clearHandler() {
      // 额外参数
      this.exParams = {}
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
      // 额外参数
      this.exParams = {}
      // table数据
      this.list = []
      // 选中项集合
      this.selectedList = []
      // 表单
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo,
        boxID: this.form.boxID,
        locationID: this.form.locationID
      }
      this.fousOfFirst()
    }
  }
}
</script>
