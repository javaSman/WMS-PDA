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
      <van-grid direction="horizontal" :column-num="3" :border="false" style="border-top: 1px solid #ccc; border-bottom: 1px solid #ccc">
        <van-grid-item>总数：{{ tableData.length }}</van-grid-item>
        <van-grid-item>已确认：{{ selection.length }}</van-grid-item>
        <van-grid-item>剩余数：{{ tableData.length - selection.length }}</van-grid-item>
        <!-- <van-grid-item>
          <van-checkbox v-model="selectAll" :disabled="disableCheck" shape="square" @click="handleSelectAll">全选</van-checkbox>
        </van-grid-item> -->
      </van-grid>
    </van-sticky>
    <!-- 列表 -->
    <!-- <TableVue
      ref="table"
      :is-virtually="true"
      :table-data.sync="tableData"
      :table-column="tableColumn"
      :selection.sync="selection"
      :disabled-chk="disableCheck"
    /> -->
    <VirtualTable
      ref="viTable"
      :wrapp-top="show ? 140 : 40"
      :table-data="tableData"
      :table-column="tableColumn"
      :selection.sync="selection"
      :disable-chck="disableCheck"
    />

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
import VirtualTable from '@/components/VirtualTable/index.vue'
// import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { WMSAPI_WCF } from '@/api/generalAPI'
import { WMSAPI } from '@/api/generalAPI'
import { _showFailToast } from '@/utils/message'
import { mapGetters } from 'vuex'
const cachedName = 'WMSLineSideWarehouse.VehicleReception'
// import { v4 as uuidv4 } from 'uuid'
export default {
  name: cachedName,
  components: {
    FormVue,
    UserAuth,
    // TableVue,
    VirtualTable,
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
      // selectAll: false, // 是否全选
      selection: [], // 选中的数据
      userAuthVisible: true, // 控制是否鉴权
      extraParams: {}, // 鉴权 的额外参数
      scanLoading: false,
      disableCheck: false,
      ReceiverName: '', // 接收人姓名
      ReceiverID: '', // 接收人ID
      boxInfo: {}, // 箱子信息
      locationsInfo: {} // 区域信息
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
  created() {},
  methods: {
    // 授权确认方法回调
    authComfir(combineParams) {
      this.ReceiverName = combineParams.cardname
      this.ReceiverID = combineParams.cardno
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
      this.formList[0].enter = this.BoxEnter
      this.formList[1].enter = this.locationEnter
    },
    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    // 箱子号回车事件
    async BoxEnter(val) {
      let boxRef = this.getVueComponentByProp('BoxId')
      if (this.form.BoxId === '' || !this.form.BoxId) {
        _showFailToast('请输入或扫描箱子号')
        return
      }
      let _params = {
        BoxId: val
      }
      let res = await WMSAPI_WCF.post('9037Wcf/WarehouseService.svc/rest/GetBoxDetail', _params)
      // 接口错误进行提示
      if (!res.IsError) {
        _showFailToast(res.ErrMsg)
        boxRef.focus()
        return
      }
      // 返回数据不存在
      if (!res.box) {
        _showFailToast('箱子号有误')
        boxRef.focus()
        return
      }
      this.boxInfo = res.box
      this.tableData = res.materialBarcodeList?.map((item, index) => ({ ...item, index: index + 1 }))
      this.$refs.formComponent.$refs['locations'][0].$refs.inputRef.focus()
    },
    /* 扫描区域 */
    async locationEnter(val) {
      let locationRef = this.getVueComponentByProp('locations')
      if (this.form.locations === '' || !this.form.locations) {
        _showFailToast('请输入或扫描区域')
        return
      }
      let res = await WMSAPI.get('business/webapi/GetLocationInfoByLocationNo', { locationNo: val })
      if (res.IsError) {
        _showFailToast(res.ErrMsg)
        locationRef.focus()
        return
      }
      if (!res.locationInfo) {
        _showFailToast(`所扫区域不存在`)
        locationRef.focus()
        return
      }
      _showFailToast('扫描成功')
      this.locationsInfo = res.locationInfo
    },

    // 确定过账
    async handleConfirm() {
      if (!this.form.BoxId || this.form.BoxId === '') {
        _showFailToast('请输入或扫描箱子号')
        return
      }
      if (!this.form.locations || this.form.locations === '') {
        _showFailToast('请输入或扫描区域')
        return
      }
      if (!this.form.BoxId || this.form.BoxId === '') {
        _showFailToast('请扫描箱子')
        return
      }
      if (!this.boxInfo || Object.keys(this.boxInfo).length === 0) {
        _showFailToast('当前箱子不存在,请重新扫描')
        return
      }
      if (!this.locationsInfo) {
        _showFailToast(`所扫区域不存在，请重新扫描`)
        return
      }
      await this.$dialog.confirm({
        title: '提示',
        message: `确定过账吗？`
      })
      try {
        this.loading = true
        /* 处理过账接口参数 */
        let _params = {
          LocationNo: this.locationsInfo.locationNo, // 货位号
          BoxNo: this.boxInfo.boxNo, // 箱子号
          UserID: this.account, // 操作人工号
          UserName: this.name, // 操作人名字
          ReceiverID: this.ReceiverID, // 操作人工号
          ReceiverName: this.ReceiverName // 操作人名字
        }
        let res = await WMSAPI_WCF.post('9037Wcf/WarehouseService.svc/rest/BindLocation', _params)
        /* 通过IsError为false判断成功 */
        if (res.IsError) {
          _showFailToast({ message: res.ErrMsg || '过账失败', duration: 5 * 1000 })
          return
        }
        this.$toast.success({ message: '过账成功' })
        this.handleClear()
      } catch (e) {
        console.log(e)
      } finally {
        this.loading = false
      }
    },
    // 清除按钮
    handleClear() {
      this.tableData = []
      this.form = {}
      this.show = false
      this.fousOfFirst()
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
