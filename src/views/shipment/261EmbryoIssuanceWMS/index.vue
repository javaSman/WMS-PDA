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
    <TableVue ref="table" :table-data.sync="tableData" :table-column="formateTableColumn" :selection.sync="selection" />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" confirm-text="过账" @clear="handleClear" @confirm="handleConfirm" />
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
    <UserAuth :visible.sync="userAuthVisible" :extra.sync="extraParams" @comfir="authComfir" />
  </div>
</template>

<script>
// 261发料-胚料发料WMS
const cachedName = 'shipment.261EmbryoIssuanceWMS'
import FormVue from '@/components/Form/index.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { WMSAPI } from '@/api/generalAPI'
import { MISWMSAPI } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { GetBoxInfoByBoxId } from '@/api/common'
import deepClone from '@/utils/deepClone'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { mapGetters } from 'vuex'
import { computedTotal } from '@/utils/validateOperateForQty'
import { customerDialog } from '@/components/CustomerDialog'
const passAPIName = 'business/webapi/OutStock'
const imOclas = 'XWMS261P'
// 查询表头数据的接口
const listAPINameForHeader = '/exportGoodsBusiness/findList261'
// 查询表体数据的接口
const listAPINameForBody = '/divertBusiness/getValidBarcode'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
// 保留一份原始对象,用于校验数量的变更
let originTableData = []
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
      userAuthVisible: true,
      extraParams: {},
      show: false,
      form: {
        postDate: today
      },
      hideenForm: { postDate: today },
      numBlurParams: { key: 'gamng', index: 0 },
      scanLoading: false,
      loading: false,
      tableData: [],
      selection: [],
      selectAll: false,
      formList,
      showFormList
    }
  },
  computed: {
    ...mapGetters(['account', 'name']),
    multiList() {
      let { selection, tableData } = this
      return { selection, tableData }
    },
    formateTableColumn() {
      return tableColumn.map((item) => {
        if (item.prop === 'erfmg' || item.type === 'Table/Number') {
          return {
            ...item,
            rules: [
              { required: true, message: '请输入数量', trigger: 'onBlur' },
              { validator: this.validateQty, message: '不能小于0或者不能大于原数量', trigger: 'onBlur' }
            ]
          }
        } else {
          return item
        }
      })
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
    // 进来让箱子号获取焦点
    // console.log(this.$refs.formComponent)
    // this.$refs.formComponent.$refs.wmsTools[0].$refs.inputRef.focus()
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
        if (item.prop === 'wmsTools') {
          item.enter = this.boxEnter
        }
      })
    },
    // 具体校验函数
    validateQty() {
      let { key, index } = this.numBlurParams
      // 改变后的值
      let x = Number(this.tableData[index]['erfmg'])
      // 原始值
      let y = originTableData[index][key]
      if (!x || x <= 0) return false
      if (x > y) {
        return false
        // return '数量不能大于' + y
      } else return true
    },
    /** 箱子回车 */
    async boxEnter(val) {
      let res = await GetBoxInfoByBoxId(val)
      if (res.success) {
        // TODO 这里获取箱子数据
        this.$refs.formComponent.$refs.imBarcode[0].$refs.inputRef.focus()
      } else {
        this.form.wmsTools = ''
        this.$refs.formComponent.$refs.wmsTools.$refs.inputRef.focus()
        _showFailToast(res.message)
      }
    },
    /**
     * @description: 条码确认方法，第一步是先加载表头数据，第二次扫码是加载表体数据，同时勾选全部内容
     * @description: 判断加载头部数据还是表体数据，判断机加件是否有值,没有值就加载表头、有就加载表体
     * @param {*} val
     */
    async barcodeEnter(val) {
      if (!this.form.imBarcode) {
        _showFailToast('请扫条码')
        return
      }
      let res = await MISWMSAPI.post(
        !this.computedFormValue() ? listAPINameForHeader : listAPINameForBody,
        !this.computedFormValue()
          ? { imBarcode: val }
          : {
              imBarcode: val,
              imOclas: 'XWMS261P'
            }
      )
      if (res.success) {
        let _data = res.data

        // 如果表头没数据那么久赋值
        if (!this.computedFormValue()) {
          if (res.data.title.sapStatus === 'I') {
            this.$dialog({ message: res.data.title.sapMsg })
          }
          // form.sjpno = _data.title.sjpno
          // form.barcode = _data.title.barcode
          // form.zzdoex = _data.title.zzdoex
          // 直接将表头内容混入，因为后面加载表体数据还需要用到里面的几个参数，同时要修改bwart的值是261，这个是固定值
          this.form = { ...this.form, ..._data.title, bwart: '261', wmsTools: this.form.wmsTools }
          this.$nextTick(() => {
            this.$set(this.form, 'sjpno', _data.title.sjpno)
            this.$set(this.form, 'barcode', _data.title.barcode)
            this.$set(this.form, 'zzdoex', _data.title.zzdoex)
          })

          // 同时展开隐藏部分内容
          this.show = true
          // 清空输入项并聚焦
          this.form.imBarcode = ''
          let inputRef = this.$refs.formComponent.$refs.imBarcode[0].$refs.inputRef
          inputRef.focus()
        } else {
          if (this.tableData.map((item) => item.objnr).includes(val)) {
            _showFailToast('条码已在列表中，请勿重复扫码')
            return
          }
          // 这里的返回值是一个对象，并且要混入上一次加载表头的的数据
          let result = Object.assign(_data, {
            aufnr: this.form.aufnr,
            barcode: this.form.barcode,
            workp: this.form.workp,
            ngeln: this.form.ngeln,
            bwart: '261'
          })
          // 这里还需要判断物料编码的开头情况，如果不是以407或者40301开头的不允许添加并提示报错
          if (result.matnr.startsWith('407') || result.matnr.startsWith('40301')) {
            // 混入一个uuid标识用来勾选数据
            let resultArr = [result].map((item) => ({
              ...item,
              uuid: uuidv4(),
              aufnr: this.form.aufnr,
              workp: this.form.workp,
              ngeln: this.form.ngeln,
              erfmg: Number(item.erfmg) > 0 ? item.erfmg : '',
              operator: this.extraParams.cardname
            }))
            // 放入表体
            this.tableData = [...this.tableData, ...resultArr]
            originTableData = deepClone(this.tableData)
            let selectArr = this.tableData.map((item) => item.uuid)
            // 将数据默认勾选上
            this.$refs.table?.handleSelect(selectArr)
            // 清空输入项并聚焦
            this.form.imBarcode = ''
            let inputRef = this.$refs.formComponent.$refs.imBarcode[0].$refs.inputRef
            inputRef.focus()
          } else {
            _showFailToast('不是407或者40301开头的物料不允许添加')
          }
        }
      }
      // 第二步根据单号去获取sap数据
    },

    // 确定过账
    async handleConfirm() {
      try {
        if (this.selection.length <= 0) {
          _showFailToast('请勾选要过账的数据')
          return
        }
        if (this.selection.every((item) => Number(item['erfmg']) <= 0)) {
          _showFailToast('所提交项中存在数量小于或等于0的项目，请检查')
          return
        }
        if (!this.form.wmsTools) {
          _showFailToast('箱子号不能为空')
          return
        }
        // 校验表单
        // await this.$refs.formComponent.$refs.refForm.validate()
        // 校验表格
        await this.$refs.table.$refs.refForm.validate()
        // await this.$dialog.confirm({
        //   title: '提示',
        //   message: `本次过账共 ${this.selection.length} 条数据,累计数量是: ${computedTotal(this.selection)},是否确认过账？`
        // })
        await customerDialog({
          count: this.selection.length,
          total: computedTotal(this.selection),
          countPrefix: '本次过账共',
          countSuffix: '条数据,',
          totalPrefix: '累计数量是',
          totalSuffix: '确定过账吗?'
        })

        // 处理接口参数
        let _form = Object.assign({}, this.form)
        let postDate = _form.postDate
        delete _form.postDate
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(this.selection))
        _list.forEach((item) => delete item.uuid)
        // tips:混入箱子信息
        _list = _list.map((item) => ({ ...item, wmsTools: this.form.wmsTools, barcode: item.objnr }))
        let _data = fomrmatShipmentSubmitParams(
          imOclas,
          this.account,
          this.name,
          this.form.warehouseNo,
          _list,
          'out',
          this.extraParams,
          undefined,
          undefined,
          'maktx',
          postDate
        )
        this.loading = true

        let res = await WMSAPI.post(passAPIName, _data)
        if (res && res.success) {
          _showSuccessToast({
            message: res.message,
            duration: 10 * 1000
          })
          // _showSuccessToast(res.message || '过账成功')
          // 清空表单和列表
          this.submitClear()
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        _showFailToast('表单项或表格项填写有误，请检查')
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
    submitClear() {
      this.tableData = []
      this.selectAll = false
      this.selection = []
      this.form = {
        postDate: today,
        wmsTools: this.form.wmsTools
      }
      this.show = false
      this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
    },
    // 判断表单中是否存在一项是有值的，如果有代表是要加载表体的，否则是要加载表头数据的
    computedFormValue() {
      if (this.form.sjpno || this.form.barcode || this.form.zzdoex) {
        return true
      } else {
        return false
      }
    },
    // 全选
    handleSelectAll() {
      this.$refs.table?.checkboxGroup.toggleAll(this.selectAll)
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
