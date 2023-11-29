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
      <van-grid
        direction="horizontal"
        :column-num="4"
        :border="false"
        style="border-top: 1px solid #ccc; border-bottom: 1px solid #ccc"
      >
        <van-grid-item>总数：{{ list.length }}</van-grid-item>
        <van-grid-item>已确认：{{ selectedList.length }}</van-grid-item>
        <van-grid-item>剩余数：{{ list.length - selectedList.length }}</van-grid-item>
        <van-grid-item>
          <van-checkbox v-model="selectAll" shape="square" @click="handleSelectAll">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>
    <!-- 列表 -->
    <TableVue
      ref="table"
      :table-data.sync="list"
      :table-column="tableColumn"
      :is-virtually="true"
      :selection.sync="selectedList"
      @inputNumHandler="inputNumHandler"
    >
      <template #checkbox="{ item, index }">
        <span style="padding-right:10px;">否</span>
        <van-switch v-model="list[index][item.prop]" size="18px" />
        <span style="padding-left:10px;">是</span>
      </template>
    </TableVue>
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
import { _showFailToast } from '@/utils/message'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
const passAPIName = 'business/webapi/MasterDataModify'
const listAPIName = 'business/webapi/GetMaterialListByBarcode'
// 物料主数据信息修改-WMS
const cachedName = 'WMSFunction.MaterialInfoModify-WMS'
let staticData = []
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
      boxInputRef: null, // 箱子号ref
      targetBoxInputRef: null, // 目标箱子号ref
      areaInputRef: null, // 区域ref
      numBlurParams: { key: 'newQuantity', index: 0 }
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
    initConfig() {
      this.formList.forEach((item) => {
        // 条码
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
          this.scanInputRef = this.getVueComponentByProp(item.prop)
        }
      })
    },
    /** 全选和反选 */
    handleSelectAll() {
      if (this.selectedList.length === this.list.length) {
        this.selectedList = []
      } else {
        this.selectedList = this.list.map(item => item.uuid)
      }
    },

    /**
     * @description: 回车事件，需判断匹配明细的方式
     * @param {*} val 值
     */
    async barcodeEnter(val) {
      if (!val) {
        _showFailToast('请输入条码')
        return
      }
      if (this.list.length > 0) {
        _showFailToast('当前表格已有数据，请清除后重新扫码')
        return
      }
      let res = await WMSAPI.get(this.listAPIName, {
        barcode: val
      })
      if (res && res.success) {
        let _data = res.materialList
        if (_data.length === 0) {
          _showFailToast('暂无数据')
          return
        }
        if (_data.length > 0) {
          this.form = Object.assign({}, this.form, _data[0])
        }

        let arr = []
        // 增加uuid为唯一识别符
        _data.forEach((item) => {
          item.uuid = uuidv4()
          arr.push(item)
        })
        // 赋值表格数据
        this.list = arr.map(item => ({
          ...item, capacity: item.capacity > 0 ? item.capacity : null,
          safetyQty: item.safetyQty > 0 ? item.safetyQty : null,
          unitQty: item.unitQty > 0 ? item.unitQty : null,
          fullQty: item.fullQty > 0 ? item.fullQty : ''
        }))
        // 存储原始数据
        staticData = JSON.parse(JSON.stringify(arr))
        staticData.forEach((item) => {
          item.newQuantity = item.quantity
        })
        // 自动勾选数据
        this.selectedList = arr.map(item => item.uuid)
        this.form.imBarcode = ''
      } else {
        _showFailToast(res.message)
      }
    },
    // 过账
    async handleConfirm() {
      let _selection = this.list.filter(item => this.selectedList.includes(item.uuid))
      try {
        // 表单验证
        await this.$refs.formComponent.$refs.refForm.validate()
        if (this.selectedList.length === 0) {
          _showFailToast('请勾选数据')
          return
        }
        let show = _selection.every(item => !item.safetyQty || !item.topQty)
        if (show) {
          _showFailToast('库存预警数、峰值库存不能为空，请检查')
          return
        }
        // if (!_selection.some(item => item.fullQty)) {
        //   _showFailToast('必填项不能为空')
        //   return
        // }
        // 过账前确认
        await this.$dialog.confirm({
          title: '提示',
          message: `本次过账共 ${this.selectedList.length} 条数据,是否确认过账？`
        })
        // 开始过账
        this.loading = true
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(_selection))

        _list.forEach((item) => delete item.uuid)
        let _data = {}
        _data = this.getPassParams(_list)
        let res = await WMSAPI.post(this.passAPIName, _data)
        if (res && (res.success || !res.isError)) {
          this.$toast.success(res.message || '过账成功')
          // 清空表单和列表
          this.handleClear()
        } else {
          _showFailToast(res.message || '过账失败')
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.loading = false
      }
    },
    // 获取过账（入库）的参数,处理参数
    getPassParams(_list) {
      let new_list = _list.map(item => ({
          ...item, capacity: item.capacity > 0 ? item.capacity : null,
          safetyQty: item.safetyQty > 0 ? item.safetyQty : null,
          unitQty: item.unitQty > 0 ? item.unitQty : null,
          fullQty: item.fullQty > 0 ? item.fullQty : '',
          topQty: item.topQty > 0 ? item.topQty : null
        }))
      let _data = {
        materialList: new_list
      }
      return _data
    },

    /** 根据prop的值获取该输入框 */
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    inputNumHandler(key, index) {
      this.numBlurParams = { key, index }
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

.form-vue {
  :v-deep .van-cell__title {
    width: 60px !important;
  }
}
