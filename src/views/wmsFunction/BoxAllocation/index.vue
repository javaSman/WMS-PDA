<template>
  <div>
    <!-- 表单布局 -->
    <van-cell-group>
      <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
        <template v-if="showFormList.length > 0" #title>
          <van-icon :name="show ? 'arrow-down' : 'arrow'" @click="show = !show" />
        </template>
        <FormVue ref="formComponent" :form-data.sync="formQuery" :form-list="formListQuery" />
        <FormVue :form-data.sync="form" :form-list="formList" />
      </van-cell>
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
      unique-key="BoxNo"
      :disabled-chk="disableCheck"
    />

    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" confirm-text="过账" @clear="handleClear" @confirm="handleConfirm" />
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
import { formList, showFormList, tableColumn, formListQuery } from './config'
import { WMSAPI_WCF } from '@/api/generalAPI'
import { _showFailToast } from '@/utils/message'
const cachedName = 'WMSLineSideWarehouse.WarehouseTransfer'
export default {
  name: cachedName,
  components: {
    FormVue,
    TableVue,
    ActionBarVue
  },
  data() {
    return {
      formList,
      showFormList,
      formListQuery,
      tableColumn,
      show: false, // 控制隐藏区域
      form: {}, // 表单数据
      formQuery: {}, // 表单数据
      loading: false, // 底部过账按钮loaidng
      tableData: [], // 列表数据
      selectAll: false, // 是否全选
      selection: [], // 选中的数据
      token: '', // token
      scanLoading: false,
      disableCheck: false
    }
  },
  /* 用于全选复选框的反选 */
  computed: {
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
    this.fousOfFirst()
  },
  methods: {
    // tips：让第一个可以输入的输入源获取光标
    fousOfFirst() {
      let result = this.formListQuery.filter((item) => item.type === 'Input')
      if (result.length > 0) {
        let prop = result[0].prop
        this.$refs.formComponent.$refs[prop][0].$refs.inputRef.focus()
      }
    },
    initConfig() {
      this.formListQuery[0].enter = this.barcodeEnter
      this.formListQuery[1].enter = this.boxNoEnter
    },
    // 条码回车事件
    async barcodeEnter(val) {
      let barcodeRef = this.getVueComponentByProp('Barcode')
      if (!val) {
        _showFailToast('请输入条码')
        return
      }
      let _params = {
        Barcode: val
      }
      let res = await WMSAPI_WCF.post('9037Wcf/WarehouseService.svc/rest/GetKittingBoxDetail', _params)
      if (!res.IsError) {
        if (res.KittingBoxDetailData.KBDetails && res.KittingBoxDetailData.KBDetails) {
          // 表格赋值
          this.tableData = res.KittingBoxDetailData.KBDetails
          // 展示内容赋值
          let { Barcode, BoxNo, MaterialNo, PickingQuantity, Quantity } = res.KittingBoxDetailData.KBHead
          this.form = {
            Barcode,
            BoxNo,
            MaterialNo,
            PickingQuantity,
            Quantity
          }
          this.$refs.formComponent.$refs['BoxNoQuery'][0].$refs.inputRef.focus()
        } else {
          _showFailToast('条码有误')
          barcodeRef.focus()
        }
        this.formQuery.Barcode = ''
      } else {
        _showFailToast(res.ErrMsg)
        this.formQuery.Barcode = ''
        barcodeRef.focus()
      }
    },
    boxNoEnter(val) {
      let boxNoRef = this.getVueComponentByProp('BoxNoQuery')
      /* 存在列表数据才进行勾选匹配 */
      if (this.tableData.length > 0) {
        let target = this.tableData.filter((item) => item['BoxNo'] === val)
        if (target.length > 0) {
          /* 如果当前选中的列表中与输入的条码相同，则提示重复扫码*/
          if (this.selection.length > 0 && this.selection.some((item) => item.BoxNo === target[0].BoxNo)) {
            _showFailToast('请勿重复扫码')
            this.formQuery.BoxNoQuery = ''
            return
          } else {
            // 每次都是追加，不是覆盖，因为存在连续扫码的情况
            this.selection = [...this.selection, ...target.map((item) => item.BoxNo)]
            // 进行勾选
            this.$nextTick(() => {
              let arrRef = this.$refs.table.$refs.checkbox
              let newArr = arrRef.filter((item) => item.name === val)
              newArr[0].toggle()
              this.formQuery.BoxNoQuery = ''
              boxNoRef.focus()
            })
          }
        } else {
          _showFailToast('没有找到结果，请检查重试或清除结果后重新扫码')
        }
      } else {
        _showFailToast('箱子信息不存在，请先进行条码扫描')
      }
      this.formQuery.BoxNoQuery = ''
      boxNoRef.focus()
    },
    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    // 确定过账
    handleConfirm() {
      if (this.tableData.length > 0) {
        if (this.selection.length > 0) {
          this.$dialog
            .confirm({
              title: '提示',
              message: `确定过账吗？`
            })
            .then(async () => {
              this.loading = true
              /* 处理过账接口参数 */
              let _params = {
                TargetBarcode: this.form.Barcode,
                MaterialNo: this.form.MaterialNo,
                BoxNoList: this.selection.map((item) => item.BoxNo)
              }
              console.log(_params, '接口返回参数')
              let res = await WMSAPI_WCF.post('9037Wcf/WarehouseService.svc/rest/TransferKittingBoxDetail', _params)
              /* 通过IsError为false判断成功 */
              if (!res.IsError) {
                this.$toast.success({ message: '过账成功' })
                this.handleClear()
              } else {
                _showFailToast('过账失败')
              }
            })
            .catch(() => {
              // on cancel
            })
            .finally(() => {
              this.loading = false
            })
        } else {
          _showFailToast('请选择需要进行过账的箱子号')
        }
      } else {
        _showFailToast('备料条码信息为空，不能过账')
      }
    },
    // 清除按钮
    handleClear() {
      this.tableData = []
      this.selectAll = false
      this.selection = []
      this.form = {}
      this.formQuery = {}
      this.show = false
      this.fousOfFirst()
    },
    // 全选
    handleSelectAll() {
      this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
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
