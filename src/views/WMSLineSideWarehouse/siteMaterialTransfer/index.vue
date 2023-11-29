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
          <van-checkbox v-model="selectAll" :disabled="disableCheck" shape="square" @click="handleSelectAll">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>
    <!-- 列表 -->
    <TableVue
      ref="table"
      :is-virtually="true"
      :table-data.sync="tableData"
      :table-column="tableColumn"
      :selection.sync="selection"
      :disabled-chk="disableCheck"
    />
    <!-- <VirtualTable
      ref="viTable"
      :wrapp-top="190"
      :table-data="tableData"
      :table-column="tableColumn"
      :selection.sync="selection"
      :disable-chck="disableCheck"
    /> -->

    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" confirm-text="过账" @clear="handleClear" @confirm="handleConfirm" />
    <UserAuth tips-msg="请输入接收人登录账号" :visible.sync="userAuthVisible" :extra.sync="extraParams" @comfir="authComfir" />
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
// import VirtualTable from '@/components/VirtualTable/index.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { GetUserWarehouse } from '@/api/common'
import { WMSAPI_WCF } from '@/api/generalAPI'
import { _showFailToast } from '@/utils/message'
import { mapGetters } from 'vuex'
// import { checkItemToTop } from '@/utils/business'
const cachedName = 'WMSLineSideWarehouse.SiteMaterialTransfer'
import { v4 as uuidv4 } from 'uuid'
export default {
  name: cachedName,
  components: {
    FormVue,
    UserAuth,
    TableVue,
    // VirtualTable,
    ActionBarVue
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      show: false, // 控制隐藏区域
      form: {}, // 表单数据
      loading: false, // 底部过账按钮loaidng
      tableData: [], // 列表数据
      selectAll: false, // 是否全选
      selection: [], // 选中的数据
      userAuthVisible: true, // 控制是否鉴权
      extraParams: {}, // 鉴权 的额外参数
      scanLoading: false,
      disableCheck: false,
      ReceiverName: '', // 接收人姓名
      ReceiverID: '', // 接收人ID
      receivingInfo: {} // 接收箱子信息
    }
  },
  /* 用于全选复选框的反选 */
  computed: {
    ...mapGetters(['account', 'name']),
    multiList() {
      let { selection, tableData } = this
      return { selection, tableData }
    }
  },
  watch: {
    multiList: {
      handler: function (val) {
        const { selection, tableData } = val
        this.selectAll = selection.length === tableData.length && selection.length !== 0
      }
    }
  },
  mounted() {
    this.initConfig()
  },
  created() {
    this.getUserWarehouse()
  },
  methods: {
    // 授权确认方法回调
    authComfir(combineParams) {
      this.ReceiverName = combineParams.cardname
      this.ReceiverID = combineParams.cardno
      this.fousOfFirst()
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
    // tips：让第一个可以输入的输入源获取光标
    fousOfFirst() {
      let result = this.formList.filter((item) => item.type === 'Input')
      if (result.length > 0) {
        let prop = result[0].prop
        this.$refs.formComponent.$refs[prop][0].$refs.inputRef.focus()
      }
    },
    initConfig() {
      this.formList[1].enter = this.outBoxNoEnter
      this.formList[2].enter = this.ReceivingBoxIdEnter
      this.formList[5].enter = this.barcodeEnter
    },
    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    // 箱子号回车事件
    async outBoxNoEnter(val) {
      let barcodeRef = this.getVueComponentByProp('outBoxNo')
      if (this.form.outBoxNo === '' || !this.form.outBoxNo) {
        _showFailToast('请输入或扫描转出箱子号')
        return
      }
      let _params = {
        BoxId: val
      }
      let res = await WMSAPI_WCF.post('9037Wcf/WarehouseService.svc/rest/GetBoxDetail', _params)
      // 接口错误进行提示
      if (!res.IsError) {
        _showFailToast(res.ErrMsg)
        barcodeRef.focus()
        return
      }
      // 返回数据不存在
      if (!res.materialBarcodeList) {
        _showFailToast('箱子号有误')
        barcodeRef.focus()
        return
      }
      if (res.materialBarcodeList.length === 0) {
        _showFailToast('当前箱子号中的物料信息为空')
        barcodeRef.focus()
        return
      }
      this.tableData = res.materialBarcodeList.map((item) => ({ ...item, uuid: uuidv4() }))
      this.$refs.formComponent.$refs['receivingBoxId'][0].$refs.inputRef.focus()
    },

    // 扫码接收箱子获取接收区域与接收仓库
    async ReceivingBoxIdEnter(val) {
      let barcodeRef = this.getVueComponentByProp('receivingBoxId')
      if (this.form.receivingBoxId === '' || !this.form.receivingBoxId) {
        _showFailToast('请输入或扫描接收箱子号')
        return
      }
      let _params = {
        BoxId: this.form.receivingBoxId
      }
      let res = await WMSAPI_WCF.get('9037Wcf/WarehouseService.svc/rest/GetBoxDetail', _params)
      // 接口错误进行提示
      if (!res.IsError) {
        _showFailToast(res.ErrMsg)
        barcodeRef.focus()
        return
      }
      console.log(res)
      // // 返回数据不存在
      if (!res.box) {
        _showFailToast(`箱子号[${val}]没有绑定货位号`)
        barcodeRef.focus()
        return
      }
      this.receivingInfo = res.box
      this.$set(this.form, 'receivingAreaNo', res.box.locationNo) // 接收区域
      this.$set(this.form, 'receivingWarehouseNo', res.WHID) // 接收区域
      this.$refs.formComponent.$refs['Barcode'][0].$refs.inputRef.focus()
    },

    // 扫码条码验证
    async barcodeEnter(val) {
      let boxNoRef = this.getVueComponentByProp('Barcode')
      if (this.form.Barcode === '' || !this.form.Barcode) {
        _showFailToast('请输入条码')
        return
      }
      /* 存在列表数据才进行勾选匹配 */
      if (this.tableData.length <= 0) {
        _showFailToast('物料信息不存在，请先进行箱子号扫描')
        return
      }
      // 根据输入的条码与表格数据进行匹配
      let target = this.tableData.find((item) => item.barcode === val)
      if (!target) {
        _showFailToast('没有找到结果，请检查重试或清除结果后重新扫码')
        this.form.Barcode = ''
        boxNoRef.focus()
        return
      }
      /* 如果当前选中的列表中与输入的条码相同，则提示重复扫码*/
      if (this.selection.length > 0 && this.selection.includes(target.barcode)) {
        _showFailToast('请勿重复扫码')
        this.form.Barcode = ''
        boxNoRef.focus()
        return
      }
      // 进行勾选
      this.$nextTick(() => {
        let arrRef = this.$refs.table.$refs.checkbox
        let newArr = arrRef.filter((item) => item.name === target.uuid)
        newArr[0].toggle()
        this.form.Barcode = ''
        boxNoRef.focus()
      })
    },
    // 确定过账
    async handleConfirm() {
      if (this.form.receivingAreaNo === '' || !this.form.receivingAreaNo) {
        _showFailToast('接收箱子没有接收区域，无法过账')
        return false
      }
      if (this.tableData.length <= 0) {
        _showFailToast('物料信息为空')
        return false
      }
      if (this.selection.length <= 0) {
        _showFailToast('请选择需要进行过账的物料信息')
        return false
      }
      try {
        await this.$dialog.confirm({
        title: '提示',
        message: `确定过账吗？`
      })
        this.loading = true
        /* 处理过账接口参数 */
        let _selection = this.tableData.filter((item) => this.selection.includes(item.uuid))
        let result = _selection.map((item) => {
          for (var i in item) {
            item[i.substring(0, 1).toUpperCase() + i.substring(1)] = item[i]
            delete item[i]
          }
          return item
        })
        let _params = {
          WHID: this.form.warehouseNo, // 仓库编码
          TargetWHID: this.form.receivingWarehouseNo, // 目标仓库编码
          TargetBoxNo: this.receivingInfo.boxNo, // 目标箱子
          TargetLocationNo: this.form.receivingAreaNo, // 目标货位
          Data: result, // 选中的物料信息
          ReceiverName: this.ReceiverName, // 接收人姓名
          ReceiverID: this.ReceiverID, // 接收人ID
          SenderID: this.account, // 发送人ID
          SenderName: this.name // 发送人ID
        }
        let res = await WMSAPI_WCF.post('9037Wcf/WarehouseService.svc/rest/TransferMaterialBarcode', _params)
        /* 通过IsError为false判断成功 */
        if (!res.IsError) {
          this.$toast.success({ message: '过账成功' })
          this.handleClear()
        } else {
          _showFailToast({ message: res.ErrMsg || '过账失败', duration: 5 * 1000 })
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.loading = false
      }
    },
    // 清除按钮
    handleClear() {
      this.tableData = []
      this.selectAll = false
      this.selection = []
      this.form = {}
      this.show = false
      this.fousOfFirst()
      this.getUserWarehouse()
    },
    // 全选
    handleSelectAll() {
      if (this.selection.length === this.tableData.length) {
        this.selection = []
      } else {
        this.selection = this.tableData.map((item) => item.uuid)
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
