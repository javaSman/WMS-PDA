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
          <van-checkbox v-model="selectAll" :disabled="isDisAllCheck" shape="square">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>

    <!-- 列表 -->
    <NativeTable
      ref="table"
      :table-data.sync="list"
      :table-column="tableColumn"
      :selection.sync="selectedList"
      :disable-chck="isDisAllCheck"
      @clickHandlerEvent="clickHandlerEvent"
      @inputTextHandler="inputTextHandler"
    />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" @clear="clearHandler" @confirm="handleConfirm" />
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
  </div>
</template>

<script>
// 161跨月采购退货-WMS
const cachedName = 'receive.161PurchaseReturnGoodsExtendMonth-WMS'
import { formList, showFormList, tableColumn } from './config'
const listAPIName = 'business/webapi/Get161List'
const passAPIName = 'business/webapi/OutStock'
const imOclas = 'XWMS161'
import FormVue from '@/components/Form/index.vue'
// import TableVue from '@/components/Table/index.vue'
import NativeTable from '@/components/NativeTable/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import Dates from '@/utils/datetime'
// import deepClone from '@/utils/deepClone'
import { mapGetters } from 'vuex'
import { WMSAPI } from '@/api/generalAPI'
import { GetUserWarehouse, GetBoxInfoByBoxId, GetLocationInfo } from '@/api/common'
// import { validateTableSelected } from '@/utils/business'
import { v4 as uuidv4 } from 'uuid'
import { computedTotal } from '@/utils/validateOperateForQty'
import { _showFailToast } from '@/utils/message'
import { customerDialog } from '@/components/CustomerDialog'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
// 存储原始数据
// let originTableData = []
export default {
  name: cachedName,
  components: {
    FormVue,
    // TableVue,
    ActionBarVue,
    NativeTable
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      listAPIName,
      passAPIName,
      form: {
        postDate: today
      }, // 表单对象，初始化过账日期
      show: false, // 点击左侧箭头是否展开
      selectAll: false, // 是否全选
      selectedList: [], // 选中项集合
      list: [], // 列表数据
      loading: false, // 过账按钮loading
      scanLoading: false, // 扫条码时进行loading
      isDisAllCheck: true,
      numBlurParams: {
        key: 'erfmg',
        index: 0
      }
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
    this.fousOfFirst()
    this.getUserWarehouse()
  },
  methods: {
    // tips：让第一个可以输入的输入源获取光标
    fousOfFirst() {
      let result = this.formList.filter((item) => item.type === 'Input')
      if (result.length > 0) {
        // tips:获取第一行的输入key
        let prop = result[0].prop
        this.$refs.formComponent.$refs[prop][0].$refs.inputRef.focus()
      }
    },
    // 初始化配置项
    initConfig() {
      this.formList.forEach((item) => {
        if (item.prop === 'warehouseNo') {
          item.change = this.wareHouseChange
        }
        if (item.prop === 'wmsTools') {
          item.enter = this.boxNoEnter
        }
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
        }
      })
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

    /** 仓库change */
    wareHouseChange(val) {
      this.form.warehouseNo = val
      if (!val) return
    },

    /**
     * @description: 条码回车事件，需判断匹配明细的方式
     * @param {*} val 条码值
     */
    async barcodeEnter(val) {
      if (!val) {
        _showFailToast('请输入条码')
        return
      }
      try {
        // 否则加载接口数据然后全选
        this.scanLoading = true
        let res = await WMSAPI.get(this.listAPIName, { imBarcode: val, imOclas: imOclas })
        if (res && res.success) {
          let _data = res.data
          if (_data.length === 0) {
            _showFailToast('暂无数据')
            return
          }
          // 给表头的隐藏区域添加信息
          this.$set(this.form, 'reqno', _data[0].reqno)
          this.$set(this.form, 'lifnr', _data[0].lifnr)
          this.$set(this.form, 'ebeln', _data[0].ebeln)
          this.show = true
          let arr = []
          // 增加uuid为唯一识别符
          _data.forEach((item) => {
            item.uuid = uuidv4()
            arr.push(item)
          })
          // // 处理snrc确认数组 增加uuid为唯一识别符，目前只有【Z31转移到结算仓/样机仓-WMS】使用到了
          // let snrc = []
          // let _snrc = res.snrc || []
          // _snrc.forEach((item) => {
          //   item.uuid = uuidv4()
          //   snrc.push(item)
          // })
          // 赋值表格数据,把推荐的内容赋值上
          this.list = arr.map((item) => ({
            ...item,
            wmsTools: item.wmS_TOOLS,
            locationId: item.wmS_LGORT
          }))

          // 测试数据填充100条
          // this.list = arr.map((item) => ({
          //   ...item
          //   // wmsTools: item.wmS_TOOLS,
          //   // locationId: item.wmS_LGORT
          // }))
          // this.list = new Array(100).fill(this.list[0]).map((item) => ({
          //   ...item,
          //   uuid: uuidv4()
          // }))
          // 默认勾选数据
          this.selectedList = this.list.map((item) => item.uuid)
          // this.$refs.table?.handleSelect(this.list.map((item) => item.uuid))
          // 保留一份原始值
          // originTableData = deepClone(this.list)
          this.$nextTick(() => {
            this.jumpToNextOne(this.list)
          })
          // console.log(this.$refs.table)
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },
    /**
     * 表格内输入框回车
     * @param key 输入框的key值
     * @param index 表格数据行索引
     */
    inputTextHandler(key, index) {
      if (key === 'wmsTools') {
        this.wmsToolsEnter(this.list[index].wmsTools, index)
      }
      if (key === 'locationId') {
        this.locationIDEnter(this.list[index].locationId, index)
      }
    },
    /** 表格内的箱子号回车 */
    async wmsToolsEnter(val, index) {
      if (!val) return
      let locationIDRef = this.getVueComponentByTableProp('locationId', index)
      this.scanLoading = true
      try {
        let res = await GetBoxInfoByBoxId(val)
        if (res.success) {
          let obj = this.list[index]
          obj.locationId = res.locationNo
          this.$set(this.list, index, obj)
          // 此时，让光标自动跳转到下一下的箱子号中,这里还要判断是否是表格的最后一项，如果是，那么不需要动
          this.jumpToNextOne(this.list)
        } else {
          _showFailToast(res.message)
          locationIDRef.focus()
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },
    // 表格内的区域回车，校验是否有绑定箱子即可
    async locationIDEnter(val, index) {
      if (!val) return
      // 调用接口带出区域，如果区域有值，光标跳转到条码，没有跳转到区域
      let res = await GetLocationInfo(val)
      if (res.success) {
        let obj = this.list[index]
        obj.locationId = res.locationInfo.locationNo
        this.$set(this.list, index, obj)
      } else {
        _showFailToast(res.message)
      }
    },

    // 过账
    async handleConfirm() {
      let _selection = this.list.filter((item) => this.selectedList.includes(item.uuid))
      await this.validateWmsToolsAndLocationId(_selection)
      // const key = getEditableKey(this.tableColumn)
      // 确认是否可以过账
      if (this.selectedList.length === 0) {
        _showFailToast('请勾选数据')
        return
      }
      // try {
      try {
        // 表单验证
        await this.$refs.formComponent.$refs.refForm.validate()
        // let _selection = this.list.filter((item) => this.selectedList.includes(item.uuid))
        // 表格必填项验证
        // let flag = validateTableSelected(this.tableColumn, this.selectedList)
        // if (!flag.isPass) {
        //   _showFailToast(flag.message)
        //   return
        // }
        // await validateQtyForItem(_selection, key)
        // await validateOriginQtyLimit(originTableData, _selection, key)
        // 过账前确认
        // await this.$dialog.confirm({
        //   title: '提示',
        //   message: `本次过账共 ${this.selectedList.length} 条数据,累计数量是: ${computedTotal(this.selectedList, this.computedKey)},是否确认过账？`
        // })
        await customerDialog({
          count: this.selectedList.length,
          total: computedTotal(_selection, this.computedKey),
          countPrefix: '本次过账共',
          countSuffix: '条数据,',
          totalPrefix: '累计拣货数量是',
          totalSuffix: '确定过账吗?'
        })
        let _form = Object.assign({}, this.form)
        let postDate = _form.postDate
        delete _form.postDate
        // 开始过账
        this.loading = true
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(_selection))
        _list.forEach((item) => delete item.uuid)
        _list = _list.map((item) => ({
          ...item,
          locationId: item.locationID
        }))
        let _data = fomrmatShipmentSubmitParams(
          imOclas,
          this.account,
          this.name,
          this.form.warehouseNo,
          _list,
          'out',
          null,
          null,
          'objnr',
          'txZ01',
          postDate
        )
        // tips:需要额外处理一下这个领料人信息
        _data.zxstXmbeStruList = _data.zxstXmbeStruList.map((item) => ({
          ...item,
          cardmame: this.name,
          cardmo: this.account
        }))
        let res = await WMSAPI.post(this.passAPIName, _data)
        if (res && res.success) {
          await this.$dialog.alert({ message: res.message })
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

    validateWmsToolsAndLocationId(selection) {
      return new Promise((resolve, reject) => {
        for (let index = 0; index < selection.length; index++) {
          const item = selection[index]
          if (!item.wmsTools || !item.locationId) {
            _showFailToast(`请填写第${index + 1}项的箱子号和区域`)
            reject(false)
            break
          }
        }
        resolve(true)
      })
    },
    /** 自动跳转到表格的下一项 */
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

    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    // 根据prop和index获取表格中表单组件
    getVueComponentByTableProp(prop, index) {
      return this.$refs.table.$refs[`${prop}_${index}`][0]
    },

    // 清空
    clearHandler() {
      // 额外参数
      this.exParams = {}
      // table数据
      this.list = []
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
      // 额外参数
      this.exParams = {}
      // table数据
      this.list = []
      // 选中项集合
      this.selectedList = []
      // 表单
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo,
        boxID: this.form.boxID,
        locationID: this.form.locationID
      }
      this.fousOfFirst()
    },
    // 行右键点击方法
    clickHandlerEvent(key, data, index) {
      this.$emit('clickHandler', key, data, index)
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
