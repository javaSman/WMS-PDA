<template>
  <div>
    <!-- 表单布局 -->
    <van-cell-group>
      <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
        <template v-if="showFormList.length > 0" #title>
          <van-icon :name="show ? 'arrow-down' : 'arrow'" @click="show = !show" />
        </template>
        <FormVue ref="formComponent" :form-data="form" :form-list="formList" />
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
    <TableVue
      ref="table"
      :table-data.sync="tableData"
      :table-column="formateTableColumn"
      :selection.sync="selection"
      @inputNumHandler="inputNumHandler"
    >
      <!-- 针对箱子号一行个性化设计，使其可以调用接口校验并动态赋值修改区域 -->
      <template #wmsTools="inputProps">
        <van-field
          v-model="tableData[inputProps.index][inputProps.item.prop]"
          clearable
          clear-trigger="always"
          @keyup.enter="wmsToolsEnter(inputProps)"
        />
      </template>
      <template #locationId="inputProps">
        <van-field v-model="tableData[inputProps.index][inputProps.item.prop]" clearable clear-trigger="always" />
      </template>
    </TableVue>
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
import FormVue from '@/components/Form/index.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { WMSAPI } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { deepClone } from '@/utils'
import { GetBoxInfoByBoxId } from '@/api/common'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { _showFailToast } from '@/utils/message'
const passAPIName = 'business/webapi/OutStock' // TODO 两个接口地址变更一次
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp' // 查询表体数据的接口
const imOclas = 'XWMS541'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
const cachedName = 'shipment.541SubcontractingIssuanceWMS'
import { customerDialog } from '@/components/CustomerDialog'
import { computedTotal, validateOriginQtyLimit } from '@/utils/validateOperateForQty'
let originTableData = []
// 541委外发料-WMS
export default {
  name: cachedName,
  components: {
    FormVue,
    UserAuth,
    TableVue,
    ActionBarVue
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      show: false, // 控制隐藏区域
      form: {
        postDate: today
      }, // 表单数据
      loading: false, // 底部过账按钮loaidng
      tableData: [], // 列表数据
      selection: [], // 选中的数据
      numBlurParams: { key: 'erfmg', index: 0 },
      userAuthVisible: true, // 控制是否鉴权
      extraParams: {}, // 鉴权 的额外参数
      selectAll: false, // 是否全选
      exParams: {}, // 存储额外的参数对象
      hiddenFormList: [], // 隐藏区域的数据,这个图号也可以扫多份,因此是一个数组来的
      scanLoading: false
    }
  },
  computed: {
    // 特殊处理一下数据适配数量编辑的校验
    formateTableColumn() {
      return this.tableColumn.map((item) => {
        if (item.prop === 'erfmg' || item.type === 'Table/Number') {
          return {
            ...item,
            rules: [
              { required: true, message: '请输入数量', trigger: 'onBlur' },
              { validator: this.validateFunc, message: '数量不能大于原数量且不能小于等于0' } // 原数量
            ]
          }
        } else {
          return item
        }
      })
    },
    multiList() {
      let { selection, tableData } = this
      return { selection, tableData }
    }
  },
  watch: {
    // 对比选中项长度与数据数组总长度，是否可以勾选全选复选框
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
    authComfir() {
      this.fousOfFirst()
    },
    initConfig() {
      this.formList.forEach((item) => {
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
        }
      })
      this.formList[0].enter = this.barcodeEnter
    },
    // 具体校验函数
    validateFunc() {
      let { key, index } = this.numBlurParams
      // 改变后的值
      let x = Number(this.tableData[index][key])
      // 原始值
      let y = originTableData[index][key]
      // if (!x || x < 0) return '数量不能小于等于0'
      // if (x > y) return '数量不能大于' + y
      if (!x || x < 0 || x > y) return false
      else return true
    },

    /**
     * @description: 条码确认事件,加载列表数据
     * @param {*} val
     */
    async barcodeEnter(val) {
      if (!val) {
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
          // TODO 这里额外混入boxID和locationID,因为目前不知道这两个字段从何处来
          this.tableData = _data.map((item) => ({ ...item, uuid: uuidv4(), boxID: '', locationID: '', operator: this.extraParams.cardname }))
          // 深拷贝保留一份副本
          originTableData = deepClone(this.tableData)
          this.$nextTick(() => {
            // 默认勾选数据
            let selectArr = this.tableData.map((item) => item.uuid)
            this.$refs.table?.handleSelect(selectArr)
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
      if (this.selection.length <= 0) {
        _showFailToast('请勾选要过账的数据')
        return
      }
      if (this.selection.every((item) => Number(item['erfmg']) <= 0)) {
        _showFailToast('所提交项中存在数量小于或等于0的项目，请检查')
        return
      }
      if (this.selection.length !== this.tableData.length) {
        _showFailToast('必须全部勾选才能过账')
        return
      }
      await validateOriginQtyLimit(originTableData, this.selection, 'erfmg', 'erfmg')
      try {
        await customerDialog({
          count: this.selection.length,
          total: computedTotal(this.selection),
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
        let _list = JSON.parse(JSON.stringify(this.selection))
        let { account, name } = this.$store.getters
        _list.forEach((item) => delete item.uuid)
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
        // console.log(_data)
        let res = await WMSAPI.post(passAPIName, _data)
        if (res && res.success) {
          this.$toast.success(res.message || '过账成功')
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
    /** 根据prop的值获取该输入框 */
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
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
    // 全选
    handleSelectAll() {
      this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
    },
    // 计算勾选的累计数量
    computedTotal(arr) {
      let key = this.getEditableKey()
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
    inputNumHandler(key, index) {
      this.numBlurParams = { key, index }
    },

    // 输入箱子号的事件，自动填写区域
    async wmsToolsEnter(props) {
      const { row, index } = props
      let res = await GetBoxInfoByBoxId(row.wmsTools)
      if (res.success) {
        // TODO 这里获取箱子数据
        row.locationId = res.locationNo
        this.$set(this.tableData, index, row)
      } else {
       _showFailToast(res.message)
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
