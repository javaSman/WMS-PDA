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
        <van-grid-item>总数：{{ boxMaterialList.length }}</van-grid-item>
        <van-grid-item>已确认：{{ selection.length }}</van-grid-item>
        <van-grid-item>剩余数：{{ boxMaterialList.length - selection.length }}</van-grid-item>
        <van-grid-item>
          <van-checkbox v-model="selectAll" :disabled="true" shape="square">全选</van-checkbox>
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
      :disabled-chk="true"
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
// 261机加件发料
const cachedName = 'machinedWarehousing.261MachinedPartsMaterialIssuance'
import FormVue from '@/components/Form/index.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { WMSAPI } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { computedTotal, validateAuthAndSelected } from '@/utils/validateOperateForQty'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { GetBoxInfoByBoxId, GetUserWarehouse } from '@/api/common'
import { mapGetters } from 'vuex'
// 查询表体数据的接口
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
const passAPIName = 'business/webapi/OutStock'
const imOclas = 'XWMS261K'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
import { checkItemToTop } from '@/utils/business'
import { customerDialog } from '@/components/CustomerDialog'
// import { deepClone } from '@/utils'
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
      boxMaterialList: [],
      form: {
        postDate: today
      },
      numBlurParams: {
        key: 'erfmg',
        index: 0
      },
      show: false,
      loading: false,
      selection: [], // 选择的行uuid数据，用于双向绑定
      selectAll: false,
      scanLoading: false
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
    this.getWareHouseListAndUpdate()
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
    initConfig() {
      this.formList.forEach((item) => {
        if (item.prop === 'ImBarcode') {
          item.enter = this.barcodeEnter
        }
      })
    },
    inputNumHandler(key, index) {
      this.numBlurParams = { key, index }
    },

    authComfir() {
      this.fousOfFirst()
    },
    /** 扫条码时 */
    async barcodeEnter(val) {
      if (!val) {
        _showFailToast('条码不能为空')
        return
      }
      if (this.tableData.length > 0 && this.tableData.map((item) => item.barcode).includes(val)) {
        _showFailToast('所扫条码已在列表中，请勿重复扫描')
        this.$set(this.form, 'ImBarcode', '')
        return
      }
      try {
        this.scanLoading = true
        let res = await WMSAPI.get(listAPIName, {
          imOclas: imOclas,
          ImBarcode: val
        })
        if (res.success) {
          // 暂存sap返回的列表
          let sapList = res.data
          // 和列表进行对比，对比通过之后就勾选
          if (sapList && sapList.length > 0) {
            // 这里只会返回一条结果的，因为扫的是条码
            let sapResult = sapList[0]
            // tips：判断spa的条码是否和箱子重的条码列表匹配
            if (this.boxMaterialList.map((item) => item.barcode).includes(val)) {
              // tips:取出匹配内容
              let resultArr = this.boxMaterialList.filter((item) => item.barcode === val)
              if (resultArr.length > 0) {
                // 如果和箱子中的内容匹配上了，那么根据匹配上的信息区修改sap返回的信息以适配业务
                // 其中条码要取箱子中的，因为可能存在特殊情况，数量物料信息也是,同时保留原始barcode
                sapResult = {
                  ...sapResult,
                  // matnr: resultArr[0].materialNo,
                  uuid: uuidv4(),
                  // erfmg: resultArr[0].quantity,
                  originBarcode: sapResult.barcode,
                  barcode: resultArr[0].barcode
                }
                // 将符合的放入显示列表中
                this.tableData = [...this.tableData, sapResult]
                this.$nextTick(() => {
                  let _result = this.tableData.find((item) => item.barcode === val)
                  // 将扫描内容置顶
                  this.tableData = checkItemToTop(this.tableData, _result)
                  // 进行勾选
                  this.selection = [...this.selection, sapResult.uuid]
                  this.$set(this.form, 'ImBarcode', '')
                  this.$refs.formComponent.$refs.ImBarcode[0].$refs.inputRef.focus()
                })
              }
            } else {
              _showFailToast('当前条码不在该箱子中，请重新扫码')
            }
          }
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },
    /** 过账 */
    async handleConfirm() {
      try {
        await validateAuthAndSelected(this.extraParams, this.tableData)
        await customerDialog({
          count: this.tableData.length,
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
        // tips: 混入箱子和区域信息
        _list = _list.map((item) => ({
          ...item,
          boxID: this.form.boxID,
          targetBoxID: this.form.targetBoxID,
          targetLocationID: this.form.targetLocationID
        }))
        let _data = fomrmatShipmentSubmitParams(
          imOclas,
          this.account,
          this.name,
          this.form.warehouseNo,
          _list,
          'out',
          this.extraParams,
          '',
          undefined,
          'maktx',
          postDate
        )
        // tips:针对sap的领料人字段调换一下位置，后端说这里换一下就行了
        // 备份一份缓存
        // let _zxstXmbeStruList = deepClone(_data.zxstXmbeStruList)
        _data.zxstXmbeStruList = _data.zxstXmbeStruList.map((item, index) => ({
          ...item,
          IM_CARDNO: this.extraParams.cardno,
          IM_CARDNAME: this.extraParams.cardname,
          cardmame: this.extraParams.cardname,
          cardmo: this.extraParams.cardmame,
          cardname: this.extraParams.cardno,
          cardno: this.extraParams.cardmo,
          barcode: item.originBarcode
        }))
        // // tips:这里修改成领料人的姓名
        // 外层把这个换成领料人的工号
        _data.iM_CARDNO = this.extraParams.cardmame
        _data.iM_CARDNAME = this.extraParams.cardname
        // console.log(_data)
        let res = await WMSAPI.post(passAPIName, _data)
        if (res && res.success) {
          _showSuccessToast(res.message || '过账成功')
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
    /** 清除 */
    handleClear() {
      this.tableData = []
      this.selectAll = false
      this.selection = []
      this.boxMaterialList = []
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo
      }
      this.show = false
      let inputRef = this.$refs.formComponent.$refs.ImBarcode[0].$refs.inputRef
      inputRef.focus()
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
    async getWareHouseListAndUpdate() {
      let res = await GetUserWarehouse()
      if (res.success) {
        this.formList[0].options = res.datas
        // tips:默认选中第一个
        if (res.datas.length > 0) {
          this.$set(this.form, 'warehouseNo', res.datas[0].warehouseNo)
        }
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
