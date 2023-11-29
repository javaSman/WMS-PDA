<template>
  <div>
    <!-- <ToggleFormWMSVue
      ref="toggleFormWMSVue"
      :form-list.sync="formList"
      :show-form-list="showFormList"
      :table-column="tableColumn"
      :pass-a-p-i-name="passAPIName"
      :list-a-p-i-name="listAPIName"
      :type="imOclas"
      mode="one"
      scanl-key="reqno"
      :submit="customSumbmit"
      :is-all-select-and-submit="true"
      :is-check-and-to-top="true"
      :is-alter-message="true"
      @clickHandler="handlePartList"
    /> -->
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
      @clickHandlerEvent="clickHandlerEvent"
    />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" @clear="clearHandler" @confirm="handleConfirm" />
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
    <!-- 配件清单对话框 -->
    <TableDialogVue :visible.sync="visible" :table-data="partList" :table-column="partListTableColumn" />
  </div>
</template>

<script>
// Z43跨区域调拨入库-WMS
import FormVue from '@/components/Form/index.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import Dates from '@/utils/datetime'
import mixinPartList from '@/views/mixins/PartList'
import TableDialogVue from '@/views/businessComponents/TableDialog.vue'
import { mapGetters } from 'vuex'
import { WMSAPI } from '@/api/generalAPI'
import { GetUserWarehouse, GetBoxInfoByBoxId, GetLocationInfo } from '@/api/common'
import { checkItemToTop } from '@/utils/business'
import { v4 as uuidv4 } from 'uuid'
import { computedTotal } from '@/utils/validateOperateForQty'
import { _showFailToast } from '@/utils/message'
import { customerDialog } from '@/components/CustomerDialog'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
const passAPIName = 'business/webapi/PostIn'
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
const imOclas = 'XWMSZ43'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
export default {
  name: 'TransferZ43CrossRegionalTransferReceiptWM',
  components: {
    FormVue,
    TableVue,
    ActionBarVue,
    TableDialogVue
  },
  mixins: [mixinPartList],
  data() {
    return {
      passAPIName,
      listAPIName,
      imOclas,
      formList,
      showFormList,
      tableColumn,
      partList: [],
      visible: false,
      tableBtnParams: {},
      form: {
        postDate: today
      }, // 表单对象，初始化过账日期
      show: false, // 点击左侧箭头是否展开
      selectAll: false, // 是否全选
      selectedList: [], // 选中项集合
      list: [], // 列表数据
      loading: false, // 过账按钮loading
      scanLoading: false, // 扫条码时进行loading
      isDisCheck: false, // 是否能够选择
      barcodeInputRef: null,
      wmsToolsInputRef: null,
      locationIdInputRef: null
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
  mounted() {
    this.getUserWarehouse()
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
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
          this.barcodeInputRef = this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'wmsTools') {
          item.enter = this.wmsToolsEnter
          this.wmsToolsInputRef = this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'locationId') {
          item.enter = this.locationIdEnter
          this.locationIdInputRef = this.getVueComponentByProp(item.prop)
        }
      })
    },
    // tips：让第一个可以输入的输入源获取光标
    fousOfFirst() {
      let result = this.formList.filter((item) => item.type === 'Input')
      if (result.length > 0) {
        // tips:获取第一行的输入key
        let prop = result[0].prop
        // tips:如果form中有箱子号或者区域之类的数据，那么光标就去focusKey指定的，否则就是第一个
        if ((this.focusKey && this.form.boxID) || this.form.locationID) prop = this.focusKey
        this.$refs.formComponent.$refs[prop][0].$refs.inputRef.focus()
      }
    },
    /** 全选和反选 */
    handleSelectAll() {
      this.$nextTick(() => {
        if (this.selectedList.length === this.list.length) {
          this.selectedList = []
        } else {
          this.selectedList = this.list.map((item) => item.uuid)
        }
        // this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
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
      this.form.warehouseNo = val
      if (!val) return
      this.barcodeInputRef?.focus()
    },

    /** 箱子号回车 */
    async wmsToolsEnter(val) {
      if (!val) {
        _showFailToast('此项不能为空')
        return
      }
      // 调用接口带出区域，如果区域有值，光标跳转到条码，没有跳转到区域
      let res = await GetBoxInfoByBoxId(val)
      // 判断箱子号是否存在
      if (res.success) {
        // this.form.locationID = res.locationNo
        this.$set(this.form, 'locationId', res.locationNo)
        this.barcodeInputRef?.focus()
      } else {
        _showFailToast(res.message)
        if (res.message.includes('绑定货位')) {
          this.locationIdInputRef.focus()
        }
        this.wmsToolsInputRef?.focus()
      }
    },

    /** 区域回车 */
    async locationIdEnter(val) {
      if (!val) return
      let res = await GetLocationInfo(val)
      if (!res.success) {
        _showFailToast(res.message)
      } else {
        this.barcodeInputRef?.focus()
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
      // 以list的长度作为判断条件，大于0，表面如果页面明细没有被清除，等于0表明页面无信息
      if (this.list.length > 0) {
        let target = this.list.filter((item) => item['reqno'] === val)
        if (target.length > 0) {
          // 每次都是追加，不是覆盖，因为存在连续扫码的情况
          let arrs = [...this.selectedList, ...target.map((item) => item.uuid)]
          // 进行勾选
          this.selectedList = arrs
          this.list = checkItemToTop(this.list, target[0])
          this.$nextTick(() => {
            this.$set(this.form, 'imBarcode', '')
            // 光标重新聚焦
            this.barcodeInputRef?.focus()
          })
        } else {
          _showFailToast('没有找到结果，请检查重试或清除结果后重新扫码')
        }
      } else {
        // 否则加载接口数据然后全选
        try {
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
            // 赋值表格数据
            this.list = _data.map((item) => ({
              ...item,
              uuid: uuidv4(),
              boxID: this.form.wmsTools,
              locationID: this.form.locationId,
              objnr: item.barcode ? item.barcode : item.reqno + '-' + item.rspos
            }))
          } else {
            _showFailToast(res.message)
          }
        } catch (e) {
          console.log(e)
        } finally {
          this.scanLoading = false
          this.$nextTick(() => {
            this.$set(this.form, 'imBarcode', '')
            // 光标重新聚焦
            this.barcodeInputRef?.focus()
          })
        }
      }
    },

    // 过账
    async handleConfirm() {
      let _selection = this.list.filter((item) => this.selectedList.includes(item.uuid))
      if (this.selectedList.length === 0) {
        _showFailToast('请勾选数据')
        return
      }
      if (this.list.length !== this.selectedList.length) {
        _showFailToast('存在未确认项，请确认数据。')
        return
      }
      try {
        // 表单验证
        await this.$refs.formComponent.$refs.refForm.validate()
        await customerDialog({
          count: this.selectedList.length,
          total: computedTotal(_selection, 'erfmg'),
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
        let _list = JSON.parse(JSON.stringify(_selection))
        _list.forEach((item) => delete item.uuid)
        let _data = fomrmatShipmentSubmitParams(
          imOclas,
          this.account,
          this.name,
          this.form.warehouseNo,
          _list,
          'in',
          this.extraParams,
          '',
          undefined,
          'maktx',
          postDate
        )
        _data.zxstXmbeStruList = _data.zxstXmbeStruList.map((item) => ({
          ...item,
          cardmame: this.name,
          cardmo: this.account
        }))
        // tips:前端将字段“reqno”拼接符号“-”“rspos”作为WMS的barcode
        _data.wmsPostInList = _data.wmsPostInList.map((item, index) => ({
          ...item,
          barcode: _data.zxstXmbeStruList[index].reqno + '-' + _data.zxstXmbeStruList[index].rspos
        }))
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
        wmsTools: this.form.wmsTools,
        locationId: this.form.locationId
      }
      // this.fousOfFirst()
      this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
    },
    // 行右键点击方法
    clickHandlerEvent(key, data, index) {
      console.log(index)
      this.tableBtnParams = this.tableColumn[3].tableBtnParams
      this.getPartList(key, data, index)
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
