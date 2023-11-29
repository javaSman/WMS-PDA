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
    <TableVue ref="table" :table-data.sync="tableData" :table-column="tableColumn" :selection.sync="selection" />
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
// 241工程物料发料
const cachedName = 'shipment.241EngineeringMaterialIssuance-WMS'
import FormVue from '@/components/Form/index.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { WMSAPI } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { computedTotal, validateAuthAndSelected } from '@/utils/validateOperateForQty'
import { _showFailToast } from '@/utils/message'
import { mapGetters } from 'vuex'
import { customerDialog } from '@/components/CustomerDialog'
// 查询表体数据的接口
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
const passAPIName = 'business/webapi/ZxwmsXxmbeCommonPostTr'
const imOclas = 'XWMS241'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
// let staticData = [] // 用于存储列表原始数据
export default {
  name: cachedName,
  components: {
    UserAuth,
    FormVue,
    TableVue,
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
      // numBlurParams: {
      //   key: 'erfmg',
      //   index: 0
      // } // 用于存储当前正在编辑的行的索引
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
    // 判断数量，不能大于原数量， 不能小于等于0
    // inputNumHandler(key, index) {
    //   this.numBlurParams = { key, index }
    // },
    initConfig() {
      // this.tableColumn.forEach((item) => {
      //   if (item.type === 'Table/NumberInput') {
      //     let _erfmgRules = [
      //       { required: true, message: '请输入数量', trigger: 'onBlur' },
      //       { require: true, validator: this.validateErfmg, message: '数量不能大于原数量或者小于0', trigger: 'onBlur' }
      //     ]
      //     item.rules = _erfmgRules
      //   }
      // })
      this.formList.forEach((item) => {
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
        }
      })
    },
    // 校验规则
    // validateErfmg() {
    //   let { key, index } = this.numBlurParams
    //   // 改变后的值
    //   let x = Number(this.tableData[index][key])
    //   // 原始值
    //   let y = staticData[index][key]
    //   if (!x || x < 0) return false
    //   if (x > y) return false
    //   else return true
    // },
    async barcodeEnter(val) {
      if (!this.form.imBarcode) {
        _showFailToast('请扫条码')
        return
      }
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
        this.tableData = _data.map((item) => ({ ...item, uuid: uuidv4(), operator: this.extraParams.cardname }))
        // 深拷贝保留一份副本
        // originTableData = deepClone(tableData)
        // staticData = JSON.parse(JSON.stringify(this.tableData))
        this.$nextTick(() => {
          // 默认勾选数据
          let selectArr = this.tableData.map((item) => item.uuid)
          this.$refs.table?.handleSelect(selectArr)
        })
        this.scanLoading = false
      } else {
        _showFailToast(res.message)
        this.scanLoading = false
      }
    },
    async handleConfirm() {
      let _selection = this.tableData.filter((item) => this.selection.map((item) => item.uuid).includes(item.uuid))
      if (this.selection.length !== this.tableData.length) {
        _showFailToast('必须全部勾选才能过账')
        return
      }
      try {
        await validateAuthAndSelected(this.extraParams, _selection)
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
        // let _form = Object.assign({}, this.form)
        // let postDate = _form.postDate
        // delete _form.postDate
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(_selection))
        _list.forEach((item) => delete item.uuid)
        // tips: 混入领料人的授权信息
        _list = _list.map((item) => ({
          IM_CARDNO: this.account,
          IM_CARDNAME: this.name,
          ...item,
          ...this.extraParams
        }))
        let _data = {
          ImOclas: imOclas,
          ImCardno: this.account,
          ImCardname: this.name,
          Data: _list
        }
        // console.log(_data)
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
      this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
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
