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
          <van-checkbox v-model="selectAll" shape="square" @click="handleSelectAll">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>
    <!-- 列表 -->
    <VirtualTable ref="table" :wrapp-top="show ? 70 : 70" :table-data.sync="tableData" :table-column="tableColumn" :selection.sync="selection" />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" confirm-text="过账" @clear="handleClear" @confirm="handleConfirm" />
    <!-- <UserAuth :visible.sync="userAuthVisible" :extra.sync="extraParams" @comfir="authComfir" /> -->
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
  </div>
</template>

<script>
// 库存箱下架
const cachedName = 'CubicWarehouseManagement.VehicleRemoval'
import FormVue from '@/components/Form/index.vue'
// import UserAuth from '@/views/businessComponents/UserAuth.vue'
// import TableVue from '@/components/Table/index.vue'
import VirtualTable from '@/components/VirtualTable/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { WMSAPI } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { GetWharfByWarehouse, GetWarehouseForVehicleRemoval } from '@/api/common'
import { _showFailToast } from '@/utils/message'
import { mapGetters } from 'vuex'
import { Dialog } from 'vant'
// 查询表体数据的接口
const listAPIName = 'business/webapi/GetDetailByBarcode'
const passAPIName = 'business/webapi/RepairPDA'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
export default {
  name: cachedName,
  components: {
    // UserAuth,
    FormVue,
    VirtualTable,
    ActionBarVue
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      listAPIName,
      passAPIName,
      // userAuthVisible: true,
      // extraParams: {},
      tableData: [],
      form: {
        postDate: today
      },
      show: false,
      loading: false,
      selection: [],
      selectAll: false,
      scanLoading: false,
      currWarehouseNo: '', // 当前仓库编码
      currWharfNo: '' // 当前码头编码
    }
  },
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
    this.getWareHouseListAndUpdate()
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
    // 授权回调
    authComfir() {
      this.fousOfFirst()
    },
    initConfig() {
      this.formList.forEach((item) => {
        if (item.prop === 'warehouseNo') {
          item.change = this.wareHouseChange
        }
        if (item.prop === 'wharfNo') {
          item.change = this.wharfNoChange
        }
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
        }
      })
    },
    // 扫条码
    async barcodeEnter(val) {
      if (!this.form.imBarcode) {
        _showFailToast('请扫条码')
        return
      }
      // 先清空选择的内容
      this.selection = []
      this.scanLoading = true
      try {
        let _params = {
          Barcode: val,
          WarehouseNo: this.form.warehouseNo
        }
        let res = await WMSAPI.get(listAPIName, _params)
        if (!res.IsError) {
          this.tableData = res.detail.map((item) => ({ ...item, uuid: uuidv4() }))
          this.$set(this.form, 'imBarcode', '')
          this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
        } else {
          _showFailToast(res.message)
          this.$set(this.form, 'imBarcode', '')
          this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },
    async handleConfirm() {
      let _selection = this.tableData.filter((item) => this.selection.includes(item.uuid))
      if (this.selection.length <= 0) {
        _showFailToast('请勾选数据')
        return
      }
      try {
        await Dialog.confirm({
          title: '标题',
          message: `已选中${_selection.map((item) => item.boxNo).join('、')}箱子下架，确定提交?`
        })
        // 拼接数据
        let _data = {
          warehouseNo: this.form.warehouseNo,
          wharfNo: this.form.wharfNo,
          details: {
            boxNo: _selection.map((item) => item.boxNo),
            warehouseNo: _selection.map((item) => item.warehouseNo),
            locationNo: _selection.map((item) => item.locationNo)
          }
        }
        let res = await WMSAPI.post(passAPIName, _data)
        if (res && res.success) {
          await this.$dialog({ message: res.message })
          // _showSuccessToast(res.message || '过账成功')
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
      this.tableData = []
      this.selectAll = false
      this.selection = []
      this.form = {
        postDate: today
      }
      this.show = false
      this.form.imBarcode = ''
      this.fousOfFirst()
    },
    submitClear() {
      this.tableData = []
      this.selectAll = false
      this.selection = []
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo,
        wharfNo: this.form.wharfNo
      }
      this.show = false
      this.form.imBarcode = ''
      this.fousOfFirst()
    },
    handleSelectAll() {
      if (this.selection.length === this.tableData.length) {
        this.selection = []
      } else {
        this.selection = this.tableData.map((item) => item.uuid)
      }
    },
    /**
     * 仓库选择
     */
    async wareHouseChange(val) {
      // 每次仓库选择先清空码头内容
      this.$set(this.form, 'wharfNo', '')
      let res = await GetWharfByWarehouse(val)
      if (!res.IsError) {
        this.formList[1].options = res.wharf
        // 默认选择第一个
        if (res.wharf.length > 0) {
          this.$set(this.form, 'wharfNo', res.wharf[0].WharfID)
        }
      }
    },
    // 码头选择，跳转条码
    wharfNoChange(val) {
      this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
    },
    async getWareHouseListAndUpdate() {
      let res = await GetWarehouseForVehicleRemoval()
      this.formList[0].options = res.items
      // 同时根据默认的仓库去获取对应的码头信息
      let res2 = await GetWharfByWarehouse(res.items[0].warehouseNo)
      if (res2.success) {
        this.formList[1].options = res2.wharf
        // 默认选择第一个
        if (res2.wharf.length > 0) {
          this.$set(this.form, 'wharfNo', res2.wharf[0].wharfID)
        }
      }
      // tips:默认选中第一个
      if (res.items.length > 0) {
        this.$set(this.form, 'warehouseNo', res.items[0].warehouseNo)
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
