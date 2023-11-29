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
    <!-- <TableVue
      ref="table"
      :is-virtually="true"
      :table-data.sync="list"
      :table-column="formateTableColumn"
      :selection.sync="selection"
      @inputNumHandler="inputNumHandler"
    /> -->
    <VirtualTable ref="viTable" :wrapp-top="show ? 150 : 110" :table-data="list" :table-column="tableColumn" :selection.sync="selection" />

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
import VirtualTable from '@/components/VirtualTable/index.vue'
// import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { WMSAPI } from '@/api/generalAPI'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { formList, showFormList, tableColumn } from './config'
import { GetUserWarehouse, GetBoxDetail, GetBoxInfoByBoxId } from '@/api/common'
import { computedTotal } from '@/utils/validateOperateForQty'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
// const passAPIName = 'business/webapi/MaterialUnBindBox'
import { customerDialog } from '@/components/CustomerDialog'
import { checkItemToTop } from '@/utils/business'
import { mapGetters } from 'vuex'
const passAPIName = 'business/webapi/OutStock'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
let boxInputRefOut = null
let boxInputRefIn = null
let barcodeInputRef = null
export default {
  name: 'MaterialTransfer',
  components: { FormVue, VirtualTable, ActionBarVue },
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
      scanLoading: false, // 扫条码时进行loading
      numBlurParams: {
        key: 'erfmg',
        index: 0
      }
    }
  },
  computed: {
    ...mapGetters(['account', 'name']),
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

    // 转出箱子号,带出明细
    async boxIDEnterOut(val) {
      if (!val) return
      try {
        this.scanLoading = true
        let res = await GetBoxDetail(val)
        if (res.success) {
          // 储存目标向子号物料
          let _data = res.materialBarcodeList.map((item) => ({ ...item, erfmg: '' }))
          if (_data.length === 0) {
            _showFailToast(`箱子${val}暂无明细`)
            boxInputRefOut?.focus()
            return
          }
          _data.forEach((item) => {
            item.uuid = uuidv4()
            // 默认赋值数量
            item.erfmg = item.quantity
          })
          this.list = _data
          // 跳转到接收区域
          boxInputRefIn?.focus()
        } else {
          _showFailToast(res.message)
          boxInputRefOut?.focus()
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },
    // 接收箱子
    async boxIDEnterIn(val) {
      if (!val) return
      // let _this = this
      let res = await GetBoxInfoByBoxId(val)
      if (res.success) {
        // TODO 这里获取箱子数据
        this.$set(this.form, 'targetLocationID', res.locationNo)
        barcodeInputRef.focus()
      } else {
       _showFailToast(res.message)
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
        _showFailToast(`箱子中不存在该条码${val}`)
        this.$nextTick(() => {
          this.$set(this.form, 'imBarcode', '')
          this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
        })
        return
      }
      if (this.selection.includes(target.uuid)) {
        _showFailToast(`条码${val}已勾选，请勿重复扫码`)
        this.$nextTick(() => {
          this.$set(this.form, 'imBarcode', '')
          this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
        })
        return
      }
      // 新码，勾选
      this.selection = [...this.selection, target.uuid]
      this.list = checkItemToTop(this.list, target)
      this.$nextTick(() => {
        this.$refs.viTable.$refs.virtual_table_wrapper.scrollTop = 0
        this.$set(this.form, 'imBarcode', '')
        this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
      })
    },

    async handleConfirm() {
      try {
        let _selection = this.list.filter((item) => this.selection.includes(item.uuid))
        await customerDialog({
          count: this.selection.length,
          total: computedTotal(_selection, 'erfmg'),
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
        // 混入转出箱子、接收箱子等信息
        _list = _list.map((item) => ({
          ...item,
          wmsTools: this.form.wmsToolsOut,
          targetBoxID: this.form.wmsToolsIn,
          targetLocationID: this.form.targetLocationID
        }))
        _list.forEach((item) => delete item.uuid)
        let _data = fomrmatShipmentSubmitParams(
          '物料调拨',
          this.account,
          this.name,
          this.form.warehouseNo,
          _list,
          'out',
          this.extraParams,
          '',
          undefined,
          'materialDesc',
          postDate
        )
        console.log(_data)
        let res = await WMSAPI.post(passAPIName, _data)
        if (res && res.success) {
          _showSuccessToast(res.message || '过账成功')
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

    // 初始化配置项
    initConfig() {
      let _this = this
      this.formList.forEach((item) => {
        if (item.prop === 'warehouseNo') {
          item.change = _this.wareHouseChange
          // item.options = this.wareHouseList
        }
        if (item.prop === 'wmsToolsOut') {
          item.enter = (val) => _this.boxIDEnterOut(val)
          boxInputRefOut = _this.getVueComponentByProp('wmsToolsOut')
        }
        if (item.prop === 'wmsToolsIn') {
          item.enter = (val) => _this.boxIDEnterIn(val)
          boxInputRefIn = _this.getVueComponentByProp('wmsToolsIn')
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
    },
    /** 过账清除 */
    submitClear() {
      this.list = []
      this.selectAll = false
      this.selection = []
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo,
        wmsToolsOut: this.form.wmsToolsOut,
        wmsToolsIn: this.form.wmsToolsIn
      }
      this.show = false
      this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
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
