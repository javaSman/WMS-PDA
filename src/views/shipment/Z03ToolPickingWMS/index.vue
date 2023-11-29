<template>
  <div>
    <!-- 表单布局 -->
    <van-cell-group>
      <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
        <template v-if="showFormList.length > 0" #title>
          <van-icon :name="show ? 'arrow-down' : 'arrow'" @click="show = !show" />
        </template>
        <template>
          <FormVue ref="formComponent" :form-data.sync="form" :form-list.sync="formList" />
        </template>
      </van-cell>
    </van-cell-group>
    <!-- 隐藏字段布局 -->
    <van-cell-group v-show="show" :style="showFormList.length > 0 ? 'padding-left: 20px' : ''">
      <FormVue ref="showFormComponent" :form-data.sync="form" :form-list.sync="showFormList" />
    </van-cell-group>
    <!-- 列表信息总览 -->
    <van-sticky :offset-top="46">
      <van-grid direction="horizontal" :column-num="4" :border="false" style="border-top: 1px solid #ccc; border-bottom: 1px solid #ccc">
        <van-grid-item>总数：{{ tableData.length }}</van-grid-item>
        <van-grid-item>已确认：{{ selection.length }}</van-grid-item>
        <van-grid-item>剩余数：{{ tableData.length - selection.length }}</van-grid-item>
        <van-grid-item>
          <van-checkbox v-model="selectAll" :disabled="disableCheck" shape="square">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>
    <!-- 列表 -->
    <NativeTable
      ref="table"
      :table-data.sync="tableData"
      :selection.sync="selection"
      :table-column.sync="tableColumn"
      :disable-chck="disableCheck"
      @inputTextHandler="inputTextHandler"
    />

    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading.sync="loading" confirm-text="过账" @clear="handleClear" @confirm="handleConfirm" />
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
// Z03工具领料-WMS
import FormVue from '@/components/Form/index.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
// import TableVue from '@/components/Table/index.vue'
import NativeTable from '@/components/NativeTable/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { WMSAPI } from '@/api/generalAPI'
import { _showFailToast } from '@/utils/message'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
// import { deepClone } from '@/utils'
import { mapGetters } from 'vuex'
import { GetBoxInfoByBoxId, GetLocationInfo } from '@/api/common'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { validateAuthAndSelected, computedTotal } from '@/utils/validateOperateForQty'
import { customerDialog } from '@/components/CustomerDialog'
// TODO 两个接口地址变更一次
const passAPIName = 'business/webapi/OutStock'
// 查询表体数据的接口
const listAPIName = 'business/webapi/GetRecommendWarehouseLocationList'
const imOclas = 'XWMSZ03'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
const cachedName = 'shipment.Z03ToolPickingWMS'
export default {
  name: cachedName,
  components: {
    FormVue,
    ActionBarVue,
    UserAuth,
    NativeTable
  },
  data() {
    return {
      numBlurParams: {
        key: 'erfmg',
        index: 0
      },
      show: false,
      form: {
        postDate: today
      },
      loading: false,
      scanLoading: false, // 扫条码时进行loading
      originTableData: [],
      selection: [],
      formList,
      selectAll: false, // 是否全选
      showFormList,
      tableColumn,
      tableData: [],
      userAuthVisible: true,
      extraParams: {},
      barcodeInputRef: null,
      boxInputRef: null,
      passAPIName,
      disableCheck: false,
      exParams: {}
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
    authComfir() {
      this.fousOfFirst()
    },
    initConfig() {
      let _this = this
      _this.formList.forEach((item) => {
        if (item.prop === 'imBarcode') {
          item.enter = _this.barcodeEnter
          _this.barcodeInputRef = _this.getVueComponentByProp(item.prop)
        }
      })
    },
    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    /**
     * 表格内输入框回车
     * @param key 输入框的key值
     * @param index 表格数据行索引
     */
    inputTextHandler(key, index) {
      if (key === 'wmsTools') {
        this.wmsToolsEnter(this.tableData[index].wmsTools, index)
      }
      if (key === 'locationId') {
        this.locationIDEnter(this.tableData[index].locationId, index)
      }
    },
    /** 表格内的箱子号回车 */
    async wmsToolsEnter(val, index) {
      if (!val) return
      let locationIDRef = this.getVueComponentByTableProp('locationId', index)
      let res = await GetBoxInfoByBoxId(val)
      if (res.success) {
        let obj = this.tableData[index]
        obj.locationId = res.locationNo
        this.$set(this.tableData, index, obj)
        // 此时，让光标自动跳转到下一下的箱子号中,这里还要判断是否是表格的最后一项，如果是，那么不需要动
        this.$nextTick(() => {
          this.jumpToNextOne(this.tableData)
        })
      } else {
       _showFailToast(res.message)
        locationIDRef.focus()
      }
    },
    // 表格内的区域回车，校验是否有绑定箱子即可
    async locationIDEnter(val, index) {
      if (!val) return
      // 调用接口带出区域，如果区域有值，光标跳转到条码，没有跳转到区域
      let res = await GetLocationInfo(val)
      if (res.success) {
        let obj = this.tableData[index]
        obj.locationId = res.locationInfo.locationNo
        this.$set(this.tableData, index, obj)
      } else {
        _showFailToast(res.message)
      }
    },
    /**
     * @description: 条码确认事件,加载列表数据
     * @param {*} val
     */
    async barcodeEnter(val) {
      if (!this.form.imBarcode) {
        _showFailToast('请扫条码')
        return
      }
      try {
        this.scanLoading = true
        let res = await WMSAPI.get(listAPIName, {
          imOclas: imOclas,
          imBarcode: val
        })
        if (res.success) {
          // TODO 这里是手工勾选了
          let _data = res.data
          // 混入唯一值，用于勾选数据
          this.tableData = _data.map((item) => ({
            ...item,
            uuid: uuidv4(),
            wmsTools: item.wmS_TOOLS,
            locationId: item.wmS_LGORT,
            operator: this.extraParams.cardname
            // barcode: item.reqno + item.rspos
          }))
          // 深拷贝保留一份副本
          // originTableData = deepClone(tableData)
          this.$nextTick(() => {
            // 默认勾选数据
            let selectArr = this.tableData.map((item) => item.uuid)
            this.selection = selectArr
            // this.$ref.table?.handleSelect(selectArr)
            this.selectAll = true
            // this.handleSelectAll()
            // tips: 然后禁用勾选
            this.disableCheck = true
            this.jumpToNextOne(this.tableData)
          })
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },
    // 确定过账
    async handleConfirm() {
      let _selection = this.tableData.filter((item) => this.selection.includes(item.uuid))
      // let key = getEditableKey()
      try {
        await this.validateWmsToolsAndLocation(_selection)
        await validateAuthAndSelected(this.extraParams, _selection)
        // await validateQtyForItem(this.selection, key)
        // 过账前确认
        // await this.$dialog.confirm({
        //   title: '提示',
        //   message: `本次过账共 ${this.selection.length} 条数据,累计数量是: ${this.computedTotal(this.selection)},是否确认过账？`
        // })
        await customerDialog({
          count: this.selection.length,
          total: computedTotal(_selection),
          countPrefix: '本次过账共',
          countSuffix: '条数据,',
          totalPrefix: '累计数量是',
          totalSuffix: '确定过账吗?'
        })
        this.loading = true
        // 处理接口参数
        let _form = Object.assign({}, this.form)
        let postDate = _form.postDate
        delete _form.postDate
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(_selection))
        _list.forEach((item) => delete item.uuid)
        let { account, name } = this.$store.getters
        let _data = fomrmatShipmentSubmitParams(
          imOclas,
          account,
          name,
          this.form.warehouseNo,
          _list,
          'out',
          this.extraParams,
          undefined,
          undefined,
          'maktx',
          postDate
        )
        if (this.selection.length === this.tableData.length) {
          WMSAPI.post(passAPIName, _data)
            .then((res) => {
              if (res && res.success) {
                this.$dialog.alert({ message: res.message })
                // _showSuccessToast(res.message || '过账成功')
                // 清空表单和列表
                this.handleClear()
              } else {
               _showFailToast(res.message)
              }
            })
            .finally(() => {
              this.loading = false
            })
        } else {
          this.loading = false
          _showFailToast('必须全部勾选才能过账')
        }
      } catch (e) {
        console.log(e)
        this.loading = false
      }
    },
    // 清除按钮
    handleClear() {
      this.tableData = []
      this.selectAll = false
      this.selection = []
      this.form = {
        postDate: today
      }
      this.show = false
      this.fousOfFirst()
    },
    /** 自动跳转到表格的下一项,同时判断这一项的的箱子号是否为空如果是直接跳过*/
    jumpToNextOne(list) {
      // 跳转时判断那一项是否有推荐，如果已经有了跳过，没有才获取光标
      for (let k = 0; k < list.length; k++) {
        const item = list[k]
        if (!item.wmsTools && !item.locationId) {
          let boxIDRef = this.getVueComponentByTableProp('wmsTools', k)
          boxIDRef.focus()
          break
        }
      }
    },
    // 根据prop和index获取表格中表单组件
    getVueComponentByTableProp(prop, index) {
      return this.$refs.table.$refs[`${prop}_${index}`][0]
    },
    validateWmsToolsAndLocation(arr) {
      return new Promise((resovle, reject) => {
        if (arr.some((item) => !item.wmsTools || !item.locationId)) {
          _showFailToast('箱子号和区域不能为空')
          reject(false)
        } else {
          resovle(true)
        }
      })
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
