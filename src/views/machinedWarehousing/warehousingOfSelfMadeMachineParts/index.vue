<template>
  <div>
    <!-- 表单布局 -->
    <van-cell-group>
      <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
        <FormVue ref="formComponent" :form-data.sync="form" :form-list="formList" />
      </van-cell>
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
      :is-virtually="true"
      :table-data.sync="tableData"
      :table-column="tableColumn"
      :selection.sync="selection"
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
    <ActionBarVue ref="actionBarVue" :loading="loading" confirm-text="过账" @clear="handleClear" @confirm="handleConfirm" />
    <!-- <UserAuth :visible.sync="userAuthVisible" :extra.sync="extraParams" @comfir="authComfir" /> -->
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
  </div>
</template>

<script>
// 自制机加件入库-WMS
const cachedName = 'machinedWarehousing.warehousingOfSelfMadeMachineParts'
import FormVue from '@/components/Form/index.vue'
// import UserAuth from '@/views/businessComponents/UserAuth.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, tableColumn } from './config'
import { WMSAPI } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { computedTotal } from '@/utils/validateOperateForQty'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { _showFailToast } from '@/utils/message'
import { mapGetters } from 'vuex'
// 查询表体数据的接口
const listAPIName = 'business/webapi/ZxwmsXmbePartRkList'
const passAPIName = 'business/webapi/PostIn'
const imOclas = 'XWMSZZ1'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
import { GetBoxInfoByBoxId, GetLocationInfo } from '@/api/common'
import { customerDialog } from '@/components/CustomerDialog'
import { deepClone } from '@/utils'
let staticData = []
export default {
  name: cachedName,
  components: {
    // UserAuth,
    FormVue,
    TableVue,
    ActionBarVue
  },
  data() {
    return {
      formList,
      tableColumn,
      listAPIName,
      passAPIName,
      // userAuthVisible: true,
      // extraParams: {},
      tableData: [],
      boxMaterialList: [],
      form: {
        postDate: today
      },
      loading: false,
      selection: [], // 选择的行uuid数据，用于双向绑定
      selectAll: false,
      scanLoading: false,
      numBlurParams: { key: 'erfmg', index: 0 }
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
      this.tableColumn.forEach((item) => {
        if (item.type === 'Table/NumberInput') {
          let _erfmgRules = [
            { required: true, message: '请输入数量', trigger: 'onBlur' },
            { validator: this.validateErfmg, message: '数量不能小于0或者大于已拣；数量' }
          ]
          item.rules = _erfmgRules
        }
      })
      this.formList.forEach((item) => {
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
        }
        if (item.prop === 'wmsTools') {
          item.enter = this.boxIDEnter
        }
        if (item.prop === 'locationNo') {
          item.enter = this.locationNoEnter
        }
      })
    },
    authComfir() {
      this.$refs.formComponent.$refs['wmsTools'][0].$refs.inputRef.focus()
    },
    async boxIDEnter(val) {
      if (!val) return
      this.scanLoading = true
      try {
        let res = await GetBoxInfoByBoxId(val)
        if (res.success) {
          if (res.locationNo) {
            this.$set(this.form, 'locationNo', res.locationNo)
          }

          // tips:将箱子里面的条码列表保留起来
          this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
          // this.tableData = _data.map((item) => ({ ...item, uuid: uuidv4() }))
        } else {
          _showFailToast(res.message)
          console.log('这里执行')
          if (res.message.includes('绑定货位')) {
            this.$refs.formComponent.$refs['locationNo'][0].$refs.inputRef.focus()
          }
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },
    async locationNoEnter(val) {
      let res = await GetLocationInfo(val)
      if (res.success) {
        this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
      } else {
        this.$set(this.form, 'locationNo', res.locationInfo.locationNo)
        _showFailToast(res.message)
      }
    },
    /** 扫条码时 */
    async barcodeEnter(val) {
      if (!val) {
        _showFailToast('请扫条码')
        return
      }
      if (this.tableData.length > 0) {
        _showFailToast('请先清除或者过账此单')
        return
      } else {
        try {
          this.scanLoading = true
          let res = await WMSAPI.get(listAPIName, {
            IM_BARCODE: val
          })
          if (res.success) {
            if (res.sapCode !== 'S') {
              _showFailToast(res.message)
            }
            // tips：判断spa的条码是否和箱子重的条码列表匹配
            // 合并之后的列表，过账要用的数据
            this.tableData = res.data.map((item) => ({
              ...item,
              uuid: uuidv4(),
              batch: item.harg || item.prodbatch || item.charg,
              materialCode: item.sjpno || item.idnrk || item.sjpno,
              wmS_TOOLS: this.form.wmsTools
            }))
            staticData = deepClone(this.tableData)
            this.$nextTick(() => {
              // 默认勾选数据
              this.selection = this.tableData.map((item) => item.uuid)
              // 将扫描内容置顶
              // this.tableData = checkItemToTop(this.tableData, resultArr[0])
              this.$set(this.form, 'imBarcode', '')
              this.$refs.formComponent.$refs.imBarcode[0].$refs.inputRef.focus()
            })
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
    /** 过账 */
    async handleConfirm() {
      // console.log(this.$refs.table.$refs.refForm)
      await this.$refs.table.$refs.refForm.validate()
      // let _selection = this.tableData.filter((item) => this.selection.includes(item.uuid))
      if (this.tableData.length <= 0) {
        _showFailToast('请先扫码勾选数据再过账')
        return
      }
      try {
        // await validateAuthAndSelected(this.extraParams, _selection)
        await customerDialog({
          count: this.selection.length,
          total: computedTotal(this.tableData, 'erfmg'),
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
        // 删除uuid,遍历实现,混入箱子信息
        let _list = JSON.parse(JSON.stringify(this.tableData))
        _list.forEach((item) => {
          item.boxID = this.form.boxID
          delete item.uuid
        })
        // 混入参数
        _list = _list.map((item) => ({
          ...item,
          wmsTools: this.form.wmsTools,
          locationId: this.form.locationNo
        }))
        let _data = fomrmatShipmentSubmitParams(
          imOclas,
          this.account,
          this.name,
          this.form.warehouseNo,
          _list,
          'in',
          undefined,
          '',
          undefined,
          'namE1',
          postDate
        )
        // console.log(_data)
        let res = await WMSAPI.post(passAPIName, _data)
        if (res && res.success) {
          await this.$dialog.alert({ message: res.message || '过账成功' })
          // _showSuccessToast(res.message || '过账成功')
          // 清空表单和列表
          // this.handleClear()
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
    /** 清除 */
    handleClear() {
      this.tableData = []
      this.selectAll = false
      this.selection = []
      this.selectRows = []
      this.form = {
        postDate: today
      }
      let inputRef = this.$refs.formComponent.$refs.wmsTools[0].$refs.inputRef
      inputRef.focus()
    },
    submitClear() {
      this.tableData = []
      this.selectAll = false
      this.selection = []
      this.selectRows = []
      this.form = {
        postDate: today,
        wmsTools: this.form.wmsTools,
        locationNo: this.form.locationNo
      }
      let inputRef = this.$refs.formComponent.$refs.imBarcode[0].$refs.inputRef
      inputRef.focus()
    },
    handleSelectAll() {
      if (this.selection.length > 0) {
        this.selection = []
      } else {
        this.selection = this.tableData.map((item) => item.uuid)
      }
    },
    inputNumHandler(key, index) {
      this.numBlurParams = { key, index }
    },
    /** 表格内的箱子号回车 */
    async wmsToolsEnter(props) {
      const { row, index } = props
      let res = await GetBoxInfoByBoxId(row.wmsTools)
      if (res.success) {
        // TODO 这里获取箱子数据
        let result = { ...row, locationId: res.locationNo }
        this.$set(this.tableData, index, result)
      } else {
        _showFailToast(res.message)
      }
    },
    // 校验规则
    validateErfmg() {
      let { key, index } = this.numBlurParams
      // 改变后的值
      let x = Number(this.tableData[index][key])
      // 原始值
      let y = staticData[index]['checkqty']
      if (!x || x < 0) return false
      if (x > y) return false
      else return true
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
