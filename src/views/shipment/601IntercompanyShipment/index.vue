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
          <van-checkbox v-model="selectAll" shape="square" @click="handleSelectAll">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>
    <!-- 列表 -->
    <TableVue
      ref="table"
      :table-data.sync="tableData"
      :selection.sync="selection"
      :table-column.sync="tableColumn"
      @input-num-handler="inputNumHandler"
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
// 643公司间发货-WMS
import FormVue from '@/components/Form/index.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { WMSAPI } from '@/api/generalAPI'
import { mapGetters } from 'vuex'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
// import { deepClone } from '@/utils'
import { GetBoxInfoByBoxId } from '@/api/common'
import { customerDialog } from '@/components/CustomerDialog'
// TODO 两个接口地址变更一次
const passAPIName = 'business/webapi/ZxwmsXxmbeCommonPostDl'
// 查询表体数据的接口
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
const imOclas = 'XWMS601'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
const cachedName = 'shipment.601IntercompanyShipment'
import { computedTotal } from '@/utils/validateOperateForQty'
import { checkItemToTop } from '@/utils/business'
// let originTableData = []
export default {
  name: cachedName,
  components: {
    FormVue,
    TableVue,
    ActionBarVue,
    UserAuth
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
      exParams: {}
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
      let _this = this
      // _this.tableColumn.forEach((item) => {
      //   if (item.type === 'Table/Number') {
      //     let _erfmgRules = [{ required: true, message: '请输入数量', trigger: 'onBlur' }, { validator: _this.validateFunc }]
      //     item.rules = _erfmgRules
      //   }
      // })
      _this.formList.forEach((item) => {
        if (item.prop === 'warehouseNo') {
          item.change = _this.wareHouseChange
        }
        if (item.prop === 'wmsTools') {
          item.enter = (val) => _this.boxIDEnter(val)
          _this.boxInputRef = _this.getVueComponentByProp(item.prop)
        }
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
    // 具体校验函数
    // validateFunc() {
    //   let { key, index } = this.numBlurParams
    //   // 改变后的值
    //   let x = Number(this.tableData[index][key])
    //   // 原始值
    //   let y = originTableData[index][key]
    //   if (!x || x < 0) return false
    //   if (x > y) return false
    //   else return true
    // },
    /**
     * @description: 条码确认事件,加载列表数据
     * @param {*} val
     */
    async barcodeEnter(val) {
      if (!this.form.imBarcode) {
        _showFailToast('请扫条码')
        return
      }
      if (this.selection.length > 0) {
        if (this.selection.map((item) => item.objnr).includes(val)) {
          _showFailToast('已经勾选，请勿重复扫描')
          return
        }
      }
      if (this.tableData.length > 0) {
        let target = this.tableData.filter((item) => item['objnr'] === val)
        if (target.length > 0) {
          // 每次都是追加，不是覆盖，因为存在连续扫码的情况
          let arrs = [...this.selection.map((item) => item.uuid), ...target.map((item) => item.uuid)]
          // 进行勾选
          this.$refs.table?.handleSelect(arrs)
          this.tableData = checkItemToTop(this.tableData, target[0])
          this.$nextTick(() => {
            this.form.imBarcode = ''
            // 光标重新聚焦
            this.barcodeInputRef.focus()
          })
        } else {
          _showFailToast('没有找到结果，请检查重试或清除结果后重新扫码')
        }
      } else {
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
            this.form.imBarcode = ''
            // 深拷贝保留一份副本
            // originTableData = deepClone(this.tableData)
            // this.$nextTick(() => {
            //   // 默认勾选数据
            //   // let selectArr = this.tableData.map((item) => item.uuid)
            //   // this.table?.handleSelect(selectArr)
            //   this.$set(this.form, 'imBarcode', '')
            //   this.selectAll = true
            //   this.handleSelectAll()
            // })
          } else {
            _showFailToast(res.message)
          }
        } catch (e) {
          console.log(e)
        } finally {
          this.scanLoading = false
        }
      }
    },
    // 获取可编辑项的prop
    // 取出tableColumn中类型是Table/Number的项目的prop，因为这个才是可以编辑的项
    getEditableKey() {
      let tarItem = this.tableColumn.find((item) => item.type === 'Table/Number')
      let key = tarItem ? tarItem.prop : 'erfmg'
      return key
    },
    // 确定过账
    async handleConfirm() {
      try {
        await this.$refs.table?.$refs.refForm.validate()
        if (this.selection.length <= 0) {
          _showFailToast('请勾选要过账的数据')
          return
        }
        if (this.selection.length !== this.tableData.length) {
          _showFailToast({
            message: '必须全部勾选才能过账'
          })
          return
        }
        // if (this.selection.every((item) => Number(item[key]) <= 0)) {
        //   _showFailToast({
        //     message: '所提交项中存在数量小于或等于0的项目，请检查'
        //   })
        //   return
        // }
        // if (this.selection.some((item) => !item.wmsTools && !item.locationId)) {
        //   _showFailToast({
        //     message: '所选项的箱子号和区域不能为空，请检查'
        //   })
        //   return
        // }
        // await this.$dialog.confirm({
        //   title: '提示',
        //   message: `本次过账共 ${this.selection.length} 条数据,累计数量是: ${this.computedTotal(this.selection)},是否确认过账？`
        // })
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
        // let _data = fomrmatShipmentSubmitParams(
        //   imOclas,
        //   account,
        //   name,
        //   this.form.warehouseNo,
        //   _list,
        //   'out',
        //   this.extraParams,
        //   undefined,
        //   undefined,
        //   'maktx',
        //   postDate
        // )
        let _data = {
          ImOclas: imOclas,
          ImCardno: account,
          ImCardname: name,
          Data: _list.map((item) => ({
            ...item,
            cpudt: dayjs(postDate).format('YYYY-MM-DD'),
            cputm: dayjs(postDate).format('HH:mm:ss'),
            oclas: imOclas,
            bwart: '601'
          }))
        }
        // if (this.selection.length === this.tableData.length) {
        let res = await WMSAPI.post(passAPIName, _data)
        if (res && res.success) {
          _showSuccessToast(res.message || '过账成功')
          // 清空表单和列表
          this.handleClear()
        } else {
         _showFailToast(res.message)
        }
        // } else {
        //   this.loading = false
        //   _showFailToast({
        //     message: '必须全部勾选才能过账'
        //   })
        // }
      } catch (e) {
        console.log(e)
      } finally {
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
    // 全选
    handleSelectAll() {
      this.$refs.table?.$refs.checkboxGroup.toggleAll(this.selectAll)
    },
    // 计算勾选的累计数量
    computedTotal(arr) {
      let key = this.getEditableKey()
      return arr.reduce((pre, next) => {
        // eslint-disable-next-line no-prototype-builtins
        if (pre.hasOwnProperty(key)) {
          return Number(pre[key]) + Number(next[key])
        } else {
          return Number(next[key])
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
