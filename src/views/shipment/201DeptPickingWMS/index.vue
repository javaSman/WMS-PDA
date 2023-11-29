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
    <NativeTable
      ref="table"
      :table-data.sync="tableData"
      :table-column="tableColumn"
      :selection.sync="selection"
      @inputTextHandler="inputTextHandler"
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
// 201部门领料WMS
const cachedName = 'shipment.201DeptPickingWMS'
import FormVue from '@/components/Form/index.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
// import TableVue from '@/components/Table/index.vue'
import NativeTable from '@/components/NativeTable/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { WMSAPI } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { GetBoxInfoByBoxId, GetLocationInfo } from '@/api/common'
import { computedTotal, validateAuthAndSelected } from '@/utils/validateOperateForQty'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { _showFailToast } from '@/utils/message'
import { mapGetters } from 'vuex'
import { customerDialog } from '@/components/CustomerDialog'
// 查询表体数据的接口
const listAPIName = 'business/webapi/GetRecommendWarehouseLocationList'
const passAPIName = 'business/webapi/OutStock'
const imOclas = 'XWMS201'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
export default {
  name: cachedName,
  components: {
    UserAuth,
    FormVue,
    NativeTable,
    ActionBarVue
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      listAPIName,
      passAPIName,
      userAuthVisible: true,
      extraParams: {},
      tableData: [],
      form: {
        postDate: today
      },
      show: false,
      loading: false,
      selection: [],
      selectAll: false,
      scanLoading: false
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
    // 授权回调
    authComfir() {
      this.fousOfFirst()
    },
    initConfig() {
      this.formList.forEach((item) => {
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
        }
      })
    },
    async barcodeEnter(val) {
      if (!this.form.imBarcode) {
        _showFailToast('请扫条码')
        return
      }
      this.scanLoading = true
      try {
        let res = await WMSAPI.get(listAPIName, {
          imOclas: imOclas,
          imBarcode: val
        })
        if (res.success) {
          // TODO 这里是手工勾选了
          let _data = res.data
          // 混入唯一值，用于勾选数据
          // TODO 这里额外混入boxID和locationID,因为目前不知道这两个字段从何处来
          this.tableData = _data.map((item) => ({
            ...item,
            uuid: uuidv4(),
            wmsTools: item.wmS_TOOLS,
            locationId: item.wmS_LGORT,
            operator: this.extraParams.cardname
          }))
          // this.tableData = new Array(50).fill(_data[0]).map((item) => ({ ...item, uuid: uuidv4() }))
          // 深拷贝保留一份副本
          // originTableData = deepClone(tableData)
          this.$nextTick(() => {
            // 默认勾选数据
            let selectArr = this.tableData.map((item) => item.uuid)
            this.selection = selectArr
            this.$nextTick(() => {
              this.jumpToNextOne(this.tableData)
            })
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
    async handleConfirm() {
      let _selection = this.tableData.filter((item) => this.selection.includes(item.uuid))
      if (this.selection.length !== this.tableData.length) {
        _showFailToast('必须全部勾选才能过账')
        return
      }
      try {
        await validateAuthAndSelected(this.extraParams, _selection)
        await this.validateWmsToolsAndLocation(_selection)
        // await this.$dialog.confirm({
        //   title: '提示',
        //   message: `本次过账共 ${this.selection.length} 条数据,累计数量是: ${computedTotal(c)},是否确认过账？`
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
        let _data = fomrmatShipmentSubmitParams(
          imOclas,
          this.account,
          this.name,
          this.form.warehouseNo,
          _list,
          'out',
          this.extraParams,
          '',
          undefined,
          'maktx',
          postDate
        )
        let res = await WMSAPI.post(passAPIName, _data)
        if (res && res.success) {
          this.$dialog({ message: res.message })
          // _showSuccessToast(res.message || '过账成功')
          // 清空表单和列表
          this.handleClear()
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
      this.fousOfFirst()
    },
    handleSelectAll() {
      if (this.selection.length === this.tableData.length) {
        this.selection = []
      } else {
        this.selection = this.tableData.map((item) => item.uuid)
      }
      // this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
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
    // inputNumHandler(key, index) {
    //   console.log(key, index)
    // },
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
        this.jumpToNextOne(this.tableData)
      } else {
        _showFailToast(res.message)
        locationIDRef.focus()
      }
    },
    // 表格内的区域回车，校验是否有绑定箱子即可
    async locationIDEnter(data, val, index) {
      if (!val) return
      // 调用接口带出区域，如果区域有值，光标跳转到条码，没有跳转到区域
      let res = await GetLocationInfo(val)
      if (res.success && res.locationInfo) {
        let obj = this.tableData[index]
        obj.locationId = res.locationInfo.areaNo
        obj.wmsTools = res.locationInfo.boxNo
        this.$set(this.tableData, index, obj)
      } else {
        _showFailToast(res.message)
      }
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
      let ref = this.$refs.table.$refs[`${prop}_${index}`]
      if (ref) {
        return ref[0]
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
