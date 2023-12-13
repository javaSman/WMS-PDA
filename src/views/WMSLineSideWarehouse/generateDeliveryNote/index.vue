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
      :table-data.sync="tableData"
      :table-column="tableColumn"
      :selection.sync="selection"
      :disabled-chk="disableCheck"
      unique-key="Barcode"
    />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" @clear="handleClear" @confirm="handleConfirm" />
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
import { formList, showFormList, tableColumn } from './config'
import FormVue from '@/components/Form/index.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { WMSAPI_WCF } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { GetUserWarehouse } from '@/api/common'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { mapGetters } from 'vuex'
import { nextTick } from 'vue'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
// 物料箱号调拨-WMS
const cachedName = 'WMSFunction.GenerateDeliveryNote'
export default {
  name: cachedName,
  components: {
    FormVue,
    TableVue,
    ActionBarVue,
    UserAuth
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      form: {
        postDate: today
      }, // 表单对象，初始化过账日期
      show: false, // 点击左侧箭头是否展开
      loading: false, // 过账按钮loading
      scanLoading: false, // 扫条码时进行loading
      boxInputRef: null, // 箱子号ref
      userAuthVisible: true, // 控制是否鉴权
      extraParams: {}, // 鉴权 的额外参数
      ReceiverInfo: {}, // 接收人信息
      disableCheck: false,
      tableData: [], // 列表数据
      selection: [], // 选择的行uuid数据，用于双向绑定
      selectAll: false // 是否全选
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
    // 对比选中项长度与数据数组总长度，是否可以勾选全选复选框
    multiList: {
      handler: function (val) {
        const { selection, tableData } = val
        this.selectAll = selection.length === tableData.length && selection.length !== 0
      }
    }
  },
  mounted() {
    this.getUserWarehouse()
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
    // 表单联动
    initConfig() {
      this.formList.forEach((item) => {
        // 仓库-获取下拉列表
        if (item.prop === 'warehouseNo') {
          item.change = this.wareHouseChange
        }
        // 箱子号-获取送货单明细
        if (item.prop === 'BoxID') {
          item.enter = this.getBoxDetails
          this.boxInputRef = this.getVueComponentByProp(item.prop)
        }
      })
    },
    // 授权确认方法回调
    authComfir(combineParams) {
      this.fousOfFirst()
      this.ReceiverInfo = combineParams
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
      if (!val) {
        _showFailToast('请输入或扫描箱子号')
        return
      }
      try {
        let res = await WMSAPI_WCF.get('9037Wcf/WarehouseService.svc/rest/GetPostCardPlateMaterialList', { BoxNo: val })
        if (res.IsError) {
          _showFailToast(res.ErrMsg)
          return
        }
        this.tableData = res.cardPlateMaterialList
        // 默认全部选中
        nextTick(() => {
          this.$refs.table?.handleSelect(this.tableData.map((item) => item.Barcode))
        })
      } catch (e) {
        console.log(e)
      }
    },
    /** 过账 */
    async handleConfirm() {
      try {
        if (!this.form.BoxID) {
          _showFailToast('请先输入或扫描箱子号')
          return
        }
        if (this.selection.length <= 0) {
          _showFailToast('请选择需要进行过账的送货单明细')
          return false
        }
        let _selection = this.selection.filter((item) => this.tableData.includes(item))
        const { cardname, cardno } = this.ReceiverInfo
        let params = {
          ReceiverID: cardno,
          ReceiverName: cardname,
          UserID: this.account,
          UserName: this.name,
          BoxNo: this.form.BoxID,
          WHID: this.form.warehouseNo,
          Data: _selection
        }
        let res = await WMSAPI_WCF.post('9037Wcf/WarehouseService.svc/rest/GenerateDeliveryOrder', params)
        if (res.IsError) {
          _showFailToast(res.ErrMsg)
          return
        }
        _showSuccessToast(res.pcpmResult.Message || '过账成功')
        this.handleClear()
      } catch (e) {
        console.log(e)
      }
    },

    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    handleClear() {
      // table数据
      this.tableData = []
      this.selectAll = false
      this.selection = []
      // 表单
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo
      }
      this.fousOfFirst()
    },
    // 全选
    handleSelectAll() {
      this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
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
