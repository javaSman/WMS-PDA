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
    <van-sticky :offset-top="46">
      <van-grid direction="horizontal" :column-num="4" :border="false" style="border-top: 1px solid #ccc; border-bottom: 1px solid #ccc">
        <van-grid-item>总数：{{ list.length }}</van-grid-item>
        <van-grid-item>已确认：{{ selectedList.length }}</van-grid-item>
        <van-grid-item>剩余数：{{ list.length - selectedList.length }}</van-grid-item>
        <van-grid-item>
          <van-checkbox v-model="selectAll" shape="square" @click="handleSelectAll">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>
    <!-- 列表 -->
    <TableVue ref="table" :table-data.sync="list" :table-column="tableColumn" :selection.sync="selectedList" />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" @clear="handleClear" @confirm="handleConfirm" />
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
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { WMSAPI } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { GetBoxInfoByBoxId } from '@/api/common'
import { _showFailToast } from '@/utils/message'
import { customerDialog } from '@/components/CustomerDialog'
import { computedTotal } from '@/utils/validateOperateForQty'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
const passAPIName = 'business/webapi/MaterialBindBox'
const listAPIName = 'business/webapi/GetMaterialBarcodeList'
// 物料类型分拣-WMS
const cachedName = 'WMSFunction.MaterialTypeSorting-WMS'
let staticData = []
const imOclas = '物料类型分拣'
export default {
  name: cachedName,
  components: {
    FormVue,
    TableVue,
    ActionBarVue
  },
  data() {
    return {
      passAPIName,
      listAPIName,
      formList,
      showFormList,
      tableColumn,
      form: {
        postDate: today
      }, // 表单对象，初始化过账日期
      show: false, // 点击左侧箭头是否展开
      selectAll: false, // 是否全选
      selectedList: [], // 选中项集合
      list: [], // 列表数据
      loading: false, // 过账按钮loading
      scanLoading: false, // 扫条码时进行loading
      staticData: [], // 用于存储列表原始数据
      boxInputRef: null, // 箱子号ref
      barcodeInputRef: null // 条码ref
    }
  },
  computed: {
    multiList() {
      let { selectedList, list } = this
      return { selectedList, list }
    }
  },
  watch: {
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
    // 初始化配置项
    async initConfig() {
      this.formList.forEach((item) => {
        // 箱子号/接收箱子号-获取区域
        if (item.prop === 'boxNo') {
          this.boxInputRef = this.getVueComponentByProp(item.prop)
          item.enter = this.boxNoEnter
        }
        // 条码
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
          this.barcodeInputRef = this.getVueComponentByProp(item.prop)
        }
      })
    },
    /** 全选和反选 */
    handleSelectAll() {
      this.$refs.table?.$refs.checkboxGroup.toggleAll(this.selectAll)
    },

    /** 箱子号回车
     *  1、查询箱子是否存在-（1）存在：光标跳转到【下一输入框】
     */
    async boxNoEnter(val) {
      if (!val) return
      // 调用接口带出区域，如果区域有值，光标跳转到条码，没有跳转到区域
      let res = await GetBoxInfoByBoxId(val)
      if (!res.success && !res.message.includes('没有绑定货位')) {
        _showFailToast(res.message)
        this.boxInputRef?.focus() // boxInputRef 字段根据需求
      } else {
        this.barcodeInputRef?.focus() // boxInputRef 字段根据需求
      }
    },
    /** 当前操作模式为addTo时回车事件-条码 */
    async barcodeEnter(val) {
      if (!val) {
        _showFailToast('请输入条码')
        return
      }
      // 1.判断是否重复扫码
      if (this.list.length > 0) {
        let target = this.list.filter((item) => item['barcode'] === val)
        if (target.length > 0) {
          _showFailToast('请勿重复扫码')
          return
        }
      }
      try {
        this.scanLoading = true
        let res = await WMSAPI.get(this.listAPIName, {
          Barcodes: val
        })
        if (res && res.success) {
          let _data = res.barcodeList // 清空输入框
          this.$set(this.form, 'imBarcode', '')
          if (_data === null || _data.length === 0) {
            _showFailToast('暂无数据')
            return
          }
          // 增加uuid为唯一识别符
          _data.forEach((item) => {
            item.uuid = uuidv4()
            this.list.push(item)
          })
          // 存储原始数据
          staticData = JSON.parse(JSON.stringify(this.list))
          staticData.forEach((item) => {
            item.newQuantity = item.quantity
          })
          let arrs = this.list.map((item) => item.uuid)
          // 默认勾选数据
          this.$refs.table?.handleSelect(arrs)
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },

    // 过账
    async handleConfirm() {
      try {
        // 表单验证
        await this.$refs.formComponent.$refs.refForm.validate()
        if (this.selectedList.length === 0) {
          _showFailToast('请勾选数据')
          return
        }
        await customerDialog({
          count: this.selectedList.length,
          total: computedTotal(this.selectedList, 'quantity'),
          countPrefix: '本次过账共',
          countSuffix: '条数据,',
          totalPrefix: '累计数量是',
          totalSuffix: '确定过账吗?'
        })
        // 开始过账
        this.loading = true
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(this.selectedList))
        _list.forEach((item) => delete item.uuid)
        let _data = {}
        _data = this.getPassParams(_list)
        // 表单验证完后，若有自定义方法，则执行
        let res = await WMSAPI.post(this.passAPIName, _data)
        if (res && res.success) {
          this.$toast.success(res.message || '过账成功')
          // 清空表单和列表
          this.handleClear()
        } else {
          _showFailToast(res.message)
        }
      } finally {
        this.loading = false
      }
    },

    // 获取过账（物料类型分拣）的参数
    getPassParams(_list) {
      let { boxNo } = this.form
      let barcodes = _list.map((item) => {
        return item.barcode
      })
      let _data = {
        boxNo: boxNo,
        barcodes: barcodes, // 条码数组
        oclas: imOclas, // 移到类型-无数据
        remark: '', // 备注-无数据
        addResume: true // 后端说传-默认值-true
      }
      return _data
    },

    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    // 清空
    handleClear() {
      // table数据
      this.list = []
      // 选中项集合
      this.selectedList = []
      // 表单
      this.form = {
        postDate: today
      }
      this.fousOfFirst()
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
</style>
