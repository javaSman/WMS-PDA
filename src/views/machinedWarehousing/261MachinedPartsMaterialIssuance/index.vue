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
      unique-key="barcode"
      :disabled-chk="disableCheck"
    />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" confirm-text="过账" @clear="handleClear" @confirm="handleConfirm" />
    <UserAuth :visible.sync="userAuthVisible" :extra.sync="extraParams" @comfir="authComfir" />
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
  </div>
</template>

<script>
// 261机加件发料
const cachedName = 'machinedWarehousing.261MachinedPartsMaterialIssuance'
import FormVue from '@/components/Form/index.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { WMSAPI_WCF } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { get261ImBarcode } from '@/api/common'
import { mapGetters } from 'vuex'
// import { v4 as uuidv4 } from 'uuid'

const passAPIName = '9037Wcf/WarehouseService.svc/rest/ZxwmsXmbeCommonPostGr'
const imOclas = 'XWMS261K'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
// import { checkItemToTop } from '@/utils/business'
import { customerDialog } from '@/components/CustomerDialog'
export default {
  name: cachedName,
  components: {
    UserAuth,
    FormVue,
    TableVue,
    ActionBarVue
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      passAPIName,
      userAuthVisible: true,
      extraParams: {},
      tableData: [],
      form: {
        postDate: today
      },
      show: false,
      loading: false,
      selection: [], // 选择的行uuid数据，用于双向绑定
      selectAll: false,
      scanLoading: false,
      disableCheck: false // 是否可以手动勾选
    }
  },
  computed: {
    ...mapGetters(['account', 'name', 'authUserInfo']),
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
    /** 全选和反选 */
    handleSelectAll() {
      this.$nextTick(() => {
        this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
      })
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
      this.formList.forEach((item) => {
        if (item.prop === 'ImBarcode') {
          item.enter = this.barcodeEnter
        }
      })
    },
    authComfir() {
      this.fousOfFirst()
    },
    /** 扫条码时 */
    async barcodeEnter(val) {
      if (!val) {
        _showFailToast('请扫条码')
        return
      }
      try {
        let target = this.tableData.find((item) => item.barcode === val)
        if (target) {
          _showFailToast('当前条码已经扫描，请勿重复扫码')
          this.$set(this.form, 'ImBarcode', '')
          this.$refs.formComponent.$refs.ImBarcode[0].$refs.inputRef.focus()
          return
        }
        let res = await get261ImBarcode({ ImOclas: imOclas, ImBarcode: val })
        if (!res.IsError) {
          this.tableData.unshift(...res.ZxstXmbeStruList)
          this.$set(this.form, 'ImBarcode', '')
          this.$refs.formComponent.$refs.ImBarcode[0].$refs.inputRef.focus()
        } else {
          _showFailToast(res.ErrMsg)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },
    /** 过账 */
    async handleConfirm() {
      let _that = this
      if (this.selection.length <= 0) {
        _showFailToast('请勾选数据后过账')
        return
      }
      let _selection = this.tableData.filter((item) => this.selection.includes(item))
      _handler(_that)
      console.log(_that)
      async function _handler(_that) {
        try {
          await customerDialog({
            count: _selection.length,
            total: _that.tableData.length,
            countPrefix: '本次过账共',
            countSuffix: '条数据,',
            totalPrefix: '累计数量是',
            totalSuffix: '确定过账吗?'
          })
          this.loading = true
          // 处理接口参数
          let _data = {
            Data: _selection,
            ImOclas: imOclas,
            ImCardno: _that.account,
            ImCardname: _that.name
          }
          let res = await WMSAPI_WCF.post(passAPIName, _data)
          if (res && res.success) {
            _showSuccessToast({
              message: res.message || '过账成功',
              duration: 10 * 1000
            })
            // 清空表单和列表
            _that.handleClear()
          } else {
            _showFailToast(res.message)
          }
        } catch (e) {
          console.log(e)
        } finally {
          _that.loading = false
        }
      }
    },
    /** 清除 */
    handleClear() {
      this.tableData = []
      this.selectAll = false
      this.selection = []
      this.selectRows = []
      this.sapList = []
      this.form = {
        postDate: today
      }
      this.show = false
      let inputRef = this.$refs.formComponent.$refs.ImBarcode[0].$refs.inputRef
      inputRef.focus()
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
