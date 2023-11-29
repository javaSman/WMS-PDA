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
      :table-data.sync="tableData"
      :table-column="tableColumn"
      :selection.sync="selection"
      unique-key="id"
      :disabled-chk="disableCheck"
      @inputNumHandler="inputNumHandler"
    />

    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" confirm-text="过账" @clear="handleClear" @confirm="handleConfirm" />
    <UserAuth tips-msg="请输入调度员登录账号" :visible.sync="userAuthVisible" :extra.sync="extraParams" @comfir="authComfir" />
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
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { WMSAPI_WCF } from '@/api/generalAPI'
import { _showFailToast } from '@/utils/message'
import { getItem } from '@/utils/auth'
import { mapGetters } from 'vuex'
const cachedName = 'WMSLineSideWarehouse.WarehouseTransfer'
export default {
  name: cachedName,
  components: {
    FormVue,
    UserAuth,
    TableVue,
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
      token: '', // token
      userAuthVisible: true, // 控制是否鉴权
      extraParams: {}, // 鉴权 的额外参数
      scanLoading: false,
      disableCheck: false,
      dispatchCode: '' // 调度员账号
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
  methods: {
    // tips：让第一个可以输入的输入源获取光标
    fousOfFirst() {
      let result = this.formList.filter((item) => item.type === 'Input')
      if (result.length > 0) {
        let prop = result[0].prop
        this.$refs.formComponent.$refs[prop][0].$refs.inputRef.focus()
      }
    },
    // 授权确认方法回调
    authComfir(combineParams) {
      this.fousOfFirst()
      this.dispatchCode = combineParams.cardno
    },
    initConfig() {
      this.formList[0].enter = this.transferCardEnter
      this.formList[1].enter = this.awaitCodeEnter
      this.formList[2].enter = this.wmsToolsEnter
    },

    // 转运卡回车事件
    transferCardEnter() {
      // 光标跳转至待待转运区编号即可
      this.$refs.formComponent.$refs['sourceArea'][0].$refs.inputRef.focus()
    },
    // 待转运区编号回车事件
    awaitCodeEnter() {
      // 光标跳转至卡板编号即可
      this.$refs.formComponent.$refs['boxNo'][0].$refs.inputRef.focus()
    },

    // 卡板编号回车事件
    wmsToolsEnter(val) {
      if (this.form.boxNo === '' || !this.form.boxNo) {
        _showFailToast('此项不能为空')
        return
      }
      if (this.tableData.findIndex((item) => item.locationId === val) !== -1) {
        _showFailToast('请勿重复扫码')
        this.$set(this.form, 'boxNo', '')
        this.$refs.formComponent.$refs['boxNo'][0].$refs.inputRef.focus()
        return false
      }

      let obj = {
        locationId: this.form.boxNo,
        id: this.tableData.length === 0 ? 0 : this.tableData.length,
        checked: '1'
      }
      this.tableData.push(obj)
      // 勾选数据
      // this.selection = this.tableData.map((item) => item.id)
      this.$refs.table.handleSelect([...this.tableData.map((item) => item.id)])
      this.form.boxNo = ''
    },

    // 确定过账
    async handleConfirm() {
      if (this.tableData.length <= 0) {
        _showFailToast('卡板不能为空')
        return false
      }
      if (this.selection.length <= 0) {
        _showFailToast('请选择需要进行过账的卡板')
        return false
      }
      await this.$refs.formComponent.$refs.refForm.validate()
      await this.$dialog.confirm({
        title: '提示',
        message: `确定过账吗？`
      })
      try {
        this.loading = true
        // let _selection = this.tableData.filter((item) => this.selection.includes(item.id))
        /* 处理过账接口参数 */
        let keyId = getItem('WMS-PDA')
        let data = this.form.transferCard.split(',') // 扫码转运卡所获取的信息
        let _params = {
          receiptUserCode: data[1], // 接收人工号
          dispatchCode: this.dispatchCode, // 调度员 （当前页面调度登录的用户）
          targetArea: data[0], // 目的厂区编号
          warehouseCode: this.account, // 仓管员（当前登录账号）,
          sourceArea: this.form.sourceArea, // 转运厂区编码,
          KeyId: keyId,
          list: this.selection.map((item) => {
            return {
              locationId: item.locationId,
              Checked: item.checked
            }
          })
        }
        // console.log(_params, '接口返回参数')
        let res = await WMSAPI_WCF.post('9037Wcf/WarehouseService.svc/Rest/CreateOrder', _params)
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
      setTimeout(() => {
        this.$refs.formComponent.$refs.refForm.resetValidation()
      }, 0)
    },
    // 全选
    handleSelectAll() {
      // if (this.selection.length === this.tableData.length) {
      //   this.selection = []
      // } else {
      //   this.selection = this.tableData.map((item) => item.id)
      // }
      this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
    },

    // 数量输入框的回调事件
    inputNumHandler(key, index) {
      console.log(key, index)
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
