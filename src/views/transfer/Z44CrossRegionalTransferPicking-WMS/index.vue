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
    <TableVue
      ref="table"
      :is-virtually="true"
      :table-data.sync="list"
      :table-column="tableColumn"
      :selection.sync="selectedList"
      @clickHandlerEvent="handlePartList"
    />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" confirm-text="过账" @clear="handleClear" @confirm="handleConfirm" />
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
// Z44跨区域调拨拣货-WMS
import TableDialogVue from '@/views/businessComponents/TableDialog.vue'
import { formList, showFormList, tableColumn } from './config'
import FormVue from '@/components/Form/index.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { WMSAPI } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { GetUserWarehouse, GetBoxInfoByBoxId, GetLocationInfo } from '@/api/common'
import { validateTableSelected } from '@/utils/business'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { computedTotal } from '@/utils/validateOperateForQty'
import mixinPartList from '@/views/mixins/PartList'
import { _showFailToast } from '@/utils/message'
import { mapGetters } from 'vuex'
import { customerDialog } from '@/components/CustomerDialog'
const passAPIName = 'business/webapi/OutStock'
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
const imOclas = 'XWMSZ44P'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
export default {
  name: 'TransferZ44CrossRegionalTransferPickingWMS',
  components: {
    TableDialogVue,
    TableVue,
    FormVue,
    ActionBarVue
  },
  mixins: [mixinPartList],
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      form: {
        postDate: today
      },
      show: false, // 点击左侧箭头是否展开
      selectedList: [], // 选中项集合
      list: [], // 列表数据
      outBoxIDList: [], // 箱子号物料集合
      loading: false, // 过账按钮loading
      chkDisabled: false, // 是否禁用复选框
      scanLoading: false,
      partList: [],
      visible: false,
      tableBtnParams: {},
      targetBoxIDInputRef: null,
      targetLocationInputRef: null,
      outBoxIDInputRef: null,
      outLocationInputRef: null,
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
    initConfig() {
      this.formList.forEach((item) => {
        if (item.prop === 'warehouseNo') {
          item.change = this.wareHouseChange
        }
        if (item.prop === 'targetBoxID') {
          item.enter = (val) => this.targetBoxIDEnter(val)
          this.targetBoxIDInputRef = this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'targetLocationID') {
          item.enter = this.targetLocation
          this.targetLocationInputRef = this.getVueComponentByProp(item.prop)
        }

        if (item.prop === 'outBoxID') {
          item.enter = this.outBoxIDEnter
          this.outBoxIDInputRef = this.getVueComponentByProp(item.prop)
        }

        if (item.prop === 'outLocationID') {
          item.enter = (val) => this.outLocationIDEnter(val)
          this.outLocationInputRef = this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
          this.barcodeInputRef = this.getVueComponentByProp(item.prop)
        }
      })
    },
    handleSelectAll() {
      if (this.selectedList.length === this.list.length) {
        this.selectedList = []
      } else {
        this.selectedList = this.list.map((item) => item.uuid)
      }
      // this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
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
    async targetBoxIDEnter(val) {
      if (!val) return
      // 调用接口带出区域，如果区域有值，光标跳转到条码，没有跳转到区域
      let res = await GetBoxInfoByBoxId(val)
      if (res.success) {
        this.$set(this.form, 'targetLocationID', res.locationNo)
        // 跳转到转出箱子
        this.outBoxIDInputRef?.focus()
      } else {
        _showFailToast(res.message)
        if (res.message.includes('绑定货位')) {
          this.targetLocationInputRef.focus()
        } else {
          this.targetBoxIDInputRef?.focus()
        }
      }
    },
    // 转入区域回车
    async targetLocation(val) {
      if (!val) return
      let res = await GetLocationInfo(val)
      if (!res.success) {
        _showFailToast(res.message)
      } else {
        this.outBoxIDInputRef?.focus()
      }
    },
    // 转出箱子回车
    async outBoxIDEnter(val, index) {
      if (!val) return
      // 调用接口带出区域，如果区域有值，光标跳转到条码，没有跳转到区域
      let res = await GetBoxInfoByBoxId(val)
      // console.log(res)
      if (res.success) {
        this.$set(this.form, 'outLocationID', res.locationNo)
        // 跳转到转出箱子
        this.barcodeInputRef?.focus()
      } else {
        _showFailToast(res.message)
        if (res.message.includes('绑定货位')) {
          this.outLocationInputRef.focus()
        } else {
          this.outBoxIDInputRef?.focus()
        }
      }
    },
    // 转出区域回车
    async outLocationIDEnter(val) {
      if (!val) return
      let res = await GetLocationInfo(val)
      if (!res.success) {
        _showFailToast(res.message)
      } else {
        this.barcodeInputRef?.focus()
      }
    },
    /** 条码回车 */
    async barcodeEnter(val) {
      if (!val) {
        _showFailToast('请输入条码')
        return
      }
      // 以list的长度作为判断条件，大于0，表面如果页面明细没有被清除，等于0表明页面无信息
      if (this.list.length > 0) {
        // 从结果集中寻找
        let target = this.list.find((item) => item.reqno === val)
        if (target) {
          _showFailToast('请勿重复扫码')
          return
        }
      }
      try {
        this.scanLoading = true
        let res = await WMSAPI.get(listAPIName, { imBarcode: val, imOclas })
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
          this.list = _data.map((item) => ({ ...item, uuid: uuidv4(), boxID: this.form.outBoxID, locationId: this.form.outLocationID }))
          // 全选
          this.selectedList = this.list.map((item) => item.uuid)
          // this.$refs.table?.handleSelect(this.list.map((item) => item.uuid))
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },
    async handleConfirm() {
      let _selection = this.list.filter((item) => this.selectedList.includes(item.uuid))
      try {
        // 表单验证
        await this.$refs.formComponent.$refs.refForm.validate()
        // 是否有勾选数据
        if (this.selectedList.length === 0) {
          _showFailToast('请勾选数据')
          return
        }
        // 表格必填项验证
        let flag = validateTableSelected(this.tableColumn, _selection)
        if (!flag.isPass) {
          _showFailToast(flag.message)
          return
        }
        // tips:增加一个限制，必须得是全选才能过账
        if (this.selectedList.length !== this.list.length) {
          _showFailToast('存在未确认项，请确认数据。')
          await Promise.reject()
        }
        // 过账前确认
        // await this.$dialog.confirm({
        //   title: '提示',
        //   message: `本次过账共 ${this.selectedList.length} 条数据,累计数量是: ${this.computedTotal(this.selectedList)},是否确认过账？`
        // })
        await customerDialog({
          count: this.selectedList.length,
          total: computedTotal(_selection),
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
        // tips: 处理一下条码的值，需将字段“reqno”拼接“rspos”作为WMS的barcode,同时将箱子信息混入
        _list = _list.map((item) => ({
          ...item,
          // barcode: item.reqno + '-' + item.rspos,
          targetBoxID: this.form.targetBoxID,
          targetLocationID: this.form.targetLocationID,
          TargetBarcode: item.reqno + '-' + item.rspos
          // reqno: ''
        }))
        // 处理接口参数
        let _form = Object.assign({}, this.form)
        let postDate = _form.postDate
        delete _form.postDate
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

        // 调用接口
        let res = await WMSAPI.post(passAPIName, _data)

        if (res && res.success) {
          await this.$dialog.alert({ message: res.message || '过账成功' })
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
    handleClear() {
      // table数据
      this.list = []
      // 转出箱子列表
      this.outBoxIDList = []
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
      // 转出箱子列表
      this.outBoxIDList = []
      // 选中项集合
      this.selectedList = []
      // 表单
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo,
        targetBoxID: this.form.targetBoxID,
        targetLocationID: this.form.targetLocationID
      }
      // 光标停留到传出箱子处
      this.$refs.formComponent.$refs['outBoxID'][0].$refs.inputRef.focus()
    },

    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    handlePartList(key, data, index) {
      this.tableBtnParams = this.tableColumn[4].tableBtnParams
      this.getPartList(key, data, index)
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
