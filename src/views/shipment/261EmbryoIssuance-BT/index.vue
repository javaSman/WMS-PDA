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
          <van-checkbox v-model="selectAll" disabled shape="square" @click="handleSelectAll">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>
    <!-- 列表 -->
    <TableVue ref="table" :disabled-chk="true" :table-data.sync="tableData" :table-column="tableColumn" :selection.sync="selection" />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" confirm-text="过账" @clear="handleClear" @confirm="handleConfirm" />
    <UserAuth :visible.sync="userAuthVisible" :extra.sync="extraParams" @comfir="comfirAuthCompleted" />
  </div>
</template>

<script>
// 261发料-胚料发料-BT
const cachedName = 'shipment.261EmbryoIssuance-BT'
import FormVue from '@/components/Form/index.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { MISWMSAPI } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { mapGetters } from 'vuex'
import { customerDialog } from '@/components/CustomerDialog'
const passAPIName = '/exportGoodsBusiness/doPostSpefic261'
// 查询表头数据的接口
const listAPINameForHeader = '/exportGoodsBusiness/findList261'
// 查询表体数据的借口
const listAPINameForBody = '/divertBusiness/getValidBarcode'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
import { computedTotal, getEditableKey } from '@/utils/validateOperateForQty'
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
      show: false,
      form: {
        postDate: today
      },
      loading: false,
      tableData: [],
      selection: [],
      userAuthVisible: false,
      extraParams: {},
      selectAll: false,
      exParams: {},
      formList,
      showFormList,
      tableColumn
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
    initConfig() {
      this.formList.forEach((item) => {
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
        }
      })
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
              imOclas: 'XWMS261P',
              cardNo: this.extraParams?.cardno,
              psnName: this.extraParams?.cardname
            }
      )
      if (res.success) {
        let _data = res.data
        // 如果表头没数据那么久赋值
        if (!this.computedFormValue()) {
          if (res.data.title.sapStatus === 'I') {
            this.$dialog({ message: res.data.title.sapMsg }).then(() => {
              this.form.imBarcode = ''
              let inputRef = this.$refs.formComponent.$refs.imBarcode[0].$refs.inputRef
              inputRef.focus()
            })
          }
          // form.sjpno = _data.title.sjpno
          // form.barcode = _data.title.barcode
          // form.zzdoex = _data.title.zzdoex
          // 直接将表头内容混入，因为后面加载表体数据还需要用到里面的几个参数，同时要修改bwart的值是261，这个是固定值
          // Object.assign(this.form, _data.title)
          this.$set(this.form, 'sjpno', _data.title.sjpno)
          this.$set(this.form, 'barcode', _data.title.barcode)
          this.$set(this.form, 'zzdoex', _data.title.zzdoex)
          this.$set(this.form, 'zzdoex', _data.title.zzdoex)
          Object.assign(this.form, _data.title)
          // 同时展开隐藏部分内容
          this.show = true
          // 清空输入项并聚焦
          this.form.imBarcode = ''
          let inputRef = this.$refs.formComponent.$refs.imBarcode[0].$refs.inputRef
          inputRef.focus()
        } else {
          // 这里的返回值是一个对象，并且要混入上一次加载表头的的数据
          let result = Object.assign(_data, {
            aufnr: this.form.aufnr,
            barcode: this.form.barcode,
            workp: this.form.workp,
            ngeln: this.form.ngeln,
            bwart: '261'
          })
          // 这里还需要判断物料编码的开头情况，如果不是以407或者40301或者30304开头的不允许添加并提示报错
          if (result.matnr.startsWith('407') || result.matnr.startsWith('40301') || result.matnr.startsWith('30304')) {
            // 混入一个uuid标识用来勾选数据
            let resultArr = [result].map((item) => ({
              ...item,
              uuid: uuidv4(),
              erfmg: item.erfmg > 0 ? item.erfmg : null,
              operator: this.extraParams.cardname
            }))
            // tips:以追加形式加入表体内，因为现在是可以多扫的，同时要校验这个条码不能重复
            if (!this.tableData.map((item) => item.objnr).includes(val)) {
              this.tableData = [...this.tableData, ...resultArr]
              let selectArr = this.tableData.map((item) => item.uuid)
              // 将数据默认勾选上
              this.$refs.table?.handleSelect(selectArr)
              // tips:清空内容，重新获取焦点
              this.$set(this.form, 'imBarcode', '')
              let inputRef = this.$refs.formComponent.$refs.imBarcode[0].$refs.inputRef
              inputRef.focus()
            } else {
              _showFailToast('当前条码已经在列表中，请勿重复扫码')
            }
          } else {
            _showFailToast('不是407或者40301或者30304开头的物料不允许添加')
          }
        }
      } else {
        _showFailToast(res.msg)
      }
    },
    // 确定过账
    handleConfirm() {
      this.userAuthVisible = true
    },
    // 授权通过(val参数就是授权参数，可以使用，但是)
    async comfirAuthCompleted(val) {
      let key = getEditableKey()
      if (this.selection.length <= 0) {
        _showFailToast('请勾选要过账的数据')
        return
      }
      if (this.selection.every((item) => Number(item[key]) <= 0)) {
        _showFailToast('所提交项中存在数量小于或等于0的项目，请检查')
        return
      }
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
        _list.forEach((item) => delete item.uuid)
        // TODO在这里给每一条数据混入当前登录人和接收人的信息(如果不这么做那么授权就没有意义了，尽管它的文档没写，但是其他要授权的业务都是这么写的)
        _list = _list.map((item) => ({ ...item, ...val }))
        let _data = {
          postDate,
          title: _form,
          data: _list
        }
        // 增加额外的参数
        if (this.exParams.wmsTools) _data.wmsTools = this.exParams.wmsTools // 卡板编号
        if (this.exParams.whid) _data.whid = this.exParams.whid // 仓库ID
        if (this.exParams.boxId) _data.boxId = this.exParams.boxId // 卡板编号
        let res = await MISWMSAPI.post(passAPIName, _data)
        if (res && res.success) {
          _showSuccessToast({
            message: res.msg,
            duration: 10 * 1000
          })
          // _showSuccessToast(res.msg)
          // 清空表单和列表
          this.handleClear()
        } else {
          _showFailToast(res.data)
        }
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
      this.extraParams = null
      this.show = false
      this.fousOfFirst()
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
