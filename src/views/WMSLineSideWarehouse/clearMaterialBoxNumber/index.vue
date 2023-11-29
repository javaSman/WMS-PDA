<template>
  <div>
    <!-- 表单布局 -->
    <van-cell-group>
      <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
        <template v-if="showFormList.length > 0" #title>
          <van-icon :name="show ? 'arrow-down' : 'arrow'" @click="show = !show" />
        </template>
        <FormVue ref="formComponent" :form-data.sync="form" :form-list.sync="formList" />
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
        <van-grid-item>已确认：{{ selection.length }}</van-grid-item>
        <van-grid-item>剩余数：{{ list.length - selection.length }}</van-grid-item>
        <van-grid-item>
          <van-checkbox v-model="selectAll" shape="square" @click="handleSelectAll">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>
    <!-- 列表 -->
    <VirtualTable ref="viTable" :table-data.sync="list" :table-column="tableColumn" :selection.sync="selection" :wrapp-top="show ? 120 : 80" />
    <!-- <TableVue
      ref="table"
      :is-virtually="true"
      :table-data.sync="list"
      :table-column="tableColumn"
      :selection.sync="selection"
      @input-num-handler="inputNumHandler"
    /> -->

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
// import TableVue from '@/components/Table/index.vue'
import VirtualTable from '@/components/VirtualTable/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'

import Dates from '@/utils/datetime'
// import Loading from '@/components/Loading/index'
import { v4 as uuidv4 } from 'uuid'
import { WMSAPI } from '@/api/generalAPI'
import { _showFailToast } from '@/utils/message'
import { formList, showFormList, tableColumn } from './config'
import { GetUserWarehouse, GetBoxDetail } from '@/api/common'
import { customerDialog } from '@/components/CustomerDialog'
import { checkItemToTop } from '@/utils/business'
const passAPIName = 'business/webapi/MaterialUnBindBox'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
let boxInputRef = null
let barcodeInputRef = null

export default {
  name: 'ClearMaterialBoxNumber',
  components: { FormVue, ActionBarVue, VirtualTable },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      isShowFormVue: false,
      form: {
        postDate: today
      }, // 表单对象，初始化过账日期
      show: false, // 点击左侧箭头是否展开
      selectAll: false, // 是否全选
      list: [], // 列表数据
      selection: [], // 选中的数据
      // wareHouseList: [], // 仓库列表
      loading: false, // 过账按钮loading
      scanLoading: false // 扫条码时进行loading
    }
  },
  computed: {
    multiList() {
      return { val1: this.selection.length, val2: this.list.length }
    }
  },
  watch: {
    // 监听选择长度和表长度判断勾选情况
    multiList: {
      handler: function ({ val1, val2 }) {
        this.selectAll = val1 === val2 && val1 !== 0

        // 全选时触发过账
        if (this.selectAll) this.handleConfirm()
      }
    }
  },
  created() {
    this.getWareHouseListAndUpdate()
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
    /** 全选和反选 */
    handleSelectAll() {
      if (this.selection.length === this.list.length) {
        this.selection = []
      } else {
        this.selection = this.list.map((item) => item.uuid)
      }
    },

    // 箱子号回车，带出明细
    async boxIDEnter(val) {
      if (!val) return
      this.scanLoading = true
      try {
        let res = await GetBoxDetail(val)
        if (res.success) {
          // 储存目标向子号物料
          let _data = res.materialBarcodeList.sort((a, b) => Number(a.materialNo) - Number(b.materialNo))
          // let _data = testData2.data as any[]
          if (_data.length === 0) {
            _showFailToast(`箱子${val}暂无明细`)
            boxInputRef?.focus()
            return
          }
          _data.forEach((item) => {
            item.uuid = uuidv4()
          })
          this.list = _data
          // 跳转到接收区域
          barcodeInputRef?.focus()
        } else {
          _showFailToast(res.message)
          boxInputRef?.focus()
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },

    /**
     * @description: 条码扫码勾选
     * @param {*} val
     */
    barcodeEnter(val) {
      if (!val) return
      let target = this.list.find((item) => item.barcode === val)
      // 如果值不存在
      if (!target) {
        _showFailToast(`箱子${this.form.wmsTools}中不存在条码${val}`)
        this.$nextTick(() => {
          this.form.imBarcode = ''
        })
        return
      }
      // 如果值已勾选
      if (this.selection.includes(target.uuid)) {
        _showFailToast(`条码${val}已勾选，请勿重复扫码`)
        this.$nextTick(() => {
          this.form.imBarcode = ''
        })
        return
      }
      // 新码，勾选
      // let selected = [...this.selection.map((item) => item.uuid), target.uuid]
      this.selection = [...this.selection, target.uuid]
      // this.$nextTick(() => {
      //   this.form.imBarcode = ''
      // })
      // tips: 这里有个特殊行为，就是针对这些一条一条扫码匹配的，有些要进行匹配后置顶操作的
      this.list = checkItemToTop(this.list, target)
      this.$nextTick(() => {
        this.form.imBarcode = ''
        this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
        // 将列表视图滚动回顶层
        this.$refs.viTable.$refs.virtual_table_wrapper.scrollTop = 0
      })
    },

    // 确定过账
    async handleConfirm() {
      let _selection = this.list.filter((item) => this.selection.includes(item.uuid))
      try {
        // 表单验证
        await this.$refs.formComponent.$refs.refForm.validate()
        // 是否有勾选数据
        if (this.selection.length === 0) {
          _showFailToast('请勾选数据')
          return
        }
        // 过账前确认
        // await this.$dialog.confirm({
        //   title: '提示',
        //   message: `本次过账共 ${this.selection.length} 条数据,累计数量是: ${this.computedTotal(this.selection)},是否确认过账？`
        // })
        await customerDialog({
          count: this.selection.length,
          total: this.computedTotal(_selection),
          countPrefix: '本次过账共',
          countSuffix: '条数据,',
          totalPrefix: '累计数量是',
          totalSuffix: '确定过账吗?'
        })
        // 开始过账
        this.scanLoading = true
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(_selection))
        _list.forEach((item) => delete item.uuid)
        // // tips:混入箱子信息
        // _list = _list.map((item) => ({ ...item, wmsTools: this.form.wmsTools }))
        // 组合参数
        let _data = {
          barcodes: _list.map((item) => item.barcode),
          boxNo: this.form.wmsTools,
          oclas: '物料清除',
          remark: '',
          addResume: true
        }
        // 调用接口
        let res = await WMSAPI.post(passAPIName, _data)

        if (res && res.success) {
          this.$toast.success(res.message || '过账成功')
          // 清空表单和列表
          this.handleClear()
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        //
      } finally {
        this.scanLoading = false
      }
    },

    // 计算勾选的累计数量
    computedTotal(arr) {
      let key = 'quantity'
      return arr.reduce((pre, next) => {
        // eslint-disable-next-line no-prototype-builtins
        if (pre.hasOwnProperty(key)) {
          return Number(pre[key]) + Number(next[key])
        } else {
          return Number(pre) + Number(next[key])
        }
      }, 0)
    },

    // 数量输入框的回调事件
    // inputNumHandler(key, index) {
    //   console.log(key, index)
    // },

    // 得到仓库数据，更新仓库列表
    async getWareHouseListAndUpdate() {
      let res = await GetUserWarehouse()
      if (res.success) {
        // this.wareHouseList = res.datas
        this.formList[0].options = res.datas
        // tips:默认选中第一个
        if (res.datas.length > 0) {
          this.$set(this.form, 'warehouseNo', res.datas[0].warehouseNo)
        }
      }
    },

    /** 仓库change */
    wareHouseChange(val) {
      if (!val) return
      boxInputRef?.focus()
    },

    // 初始化配置项
    initConfig() {
      let _this = this
      this.formList.forEach((item) => {
        if (item.prop === 'warehouseNo') {
          item.change = _this.wareHouseChange
          // item.options = this.wareHouseList
        }
        if (item.prop === 'wmsTools') {
          item.enter = (val) => _this.boxIDEnter(val)
          boxInputRef = _this.getVueComponentByProp('wmsTools')
        }
        if (item.prop === 'imBarcode') {
          item.enter = (val) => _this.barcodeEnter(val)
          barcodeInputRef = _this.getVueComponentByProp('imBarcode')
        }
      })
    },

    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },

    // 清除按钮
    handleClear() {
      this.list = []
      this.selectAll = false
      this.selection = []
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo
      }
      this.show = false
      this.fousOfFirst()
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
