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
          <van-checkbox v-model="selectAll" disabled shape="square">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>
    <!-- 列表 -->
    <VirtualTable
      ref="viTable"
      :wrapp-top="show ? 140 : 120"
      :table-data="tableData"
      :table-column="tableColumn"
      :selection.sync="selection"
      :disable-chck="true"
    />
    <!-- <TableVue ref="table" :is-virtually="true" :table-data.sync="tableData" :table-column="tableColumn" :selection.sync="selection" /> -->
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
// 261机加件发料-WMS
const cachedName = 'machinedWarehousing.261MachinedPartsMaterialIssuance-WMS'
import FormVue from '@/components/Form/index.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
import VirtualTable from '@/components/VirtualTable/index.vue'
// import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { WMSAPI_WCF } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { computedTotal } from '@/utils/validateOperateForQty'
// import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { mapGetters } from 'vuex'
// 查询表体数据的接口
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
// const passAPIName = 'business/webapi/OutStock'
const passAPIName = '9037Wcf/WarehouseService.svc/rest/FullBoxOutStock'
const imOclas = 'XWMS261K'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
import { GetBoxDetail, GetBoxInfoByBoxId, GetLocationInfo } from '@/api/common'
import { checkItemToTop } from '@/utils/business'
import { customerDialog } from '@/components/CustomerDialog'
// import { deepClone } from '@/utils'
export default {
  name: cachedName,
  components: {
    UserAuth,
    FormVue,
    VirtualTable,
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
      selection: [], // 选择的行uuid数据，用于双向绑定
      selectAll: false,
      scanLoading: false
    }
  },
  computed: {
    ...mapGetters(['account', 'name', 'authUserInfo']),
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
    // this.getWareHouseListAndUpdate()
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
    // async getWareHouseListAndUpdate() {
    //   let res = await GetUserWarehouse()
    //   if (res.success) {
    //     this.formList[0].options = res.datas
    //     // tips:默认选中第一个
    //     if (res.datas.length > 0) {
    //       this.$set(this.form, 'warehouseNo', res.datas[0].warehouseNo)
    //     }
    //   }
    // },
    initConfig() {
      this.formList.forEach((item) => {
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
        }
        if (item.prop === 'boxID') {
          item.enter = this.boxIDEnter
        }
        if (item.prop === 'targetBoxID') {
          item.enter = this.targetBoxIDEnter
        }
        if (item.prop === 'targetLocationID') {
          item.enter = this.targetLocationIDEnter
        }
      })
    },
    authComfir() {
      this.fousOfFirst()
    },
    // handleSelectAll() {
    //   if (this.selection.length === this.tableData.length) {
    //     this.selection = []
    //   } else {
    //     this.selection = this.tableData.map((item) => item.uuid)
    //   }
    // },
    /** 来源载具回车 */
    async boxIDEnter(val) {
      if (!val) return
      if (this.tableData.length > 0) {
        _showFailToast('表格中已有数据了，请手动清除或者过账这些数据')
        return
      }
      try {
        this.scanLoading = true
        let res2 = await GetBoxInfoByBoxId(val)
        if (!res2.success) {
          _showFailToast(res2.message)
          return
        }
        let res = await GetBoxDetail(val)
        if (res.success) {
          let _data = res.materialBarcodeList
          if (_data.length === 0) {
            _showFailToast(`箱子号[${val}]下没有明细物料，请重新扫码`)
            this.form.boxID = ''
            return
          }
          this.tableData = _data.map((item) => ({ ...item, uuid: uuidv4(), operator: this.authUserInfo.cardname }))
          // 光标移动到目标载具
          this.$refs.formComponent.$refs['targetBoxID'][0].$refs.inputRef.focus()
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },
    /** 目标载具回车 */
    async targetBoxIDEnter(val) {
      if (!val) return
      let res = await GetBoxInfoByBoxId(val)
      if (res.success) {
        this.$set(this.form, 'targetLocationID', res.locationNo)
        // 光标跳转到条码
        this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
      } else {
        _showFailToast(res.message)
        // 否则跳转目标载具区域
        this.$refs.formComponent.$refs['targetLocationID'][0].$refs.inputRef.focus()
      }
    },
    /** 目标区域 */
    async targetLocationIDEnter(val) {
      if (!val) return
      let res = await GetLocationInfo(val)
      if (res.success) {
        // 跳转条码
        this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
      } else {
        _showFailToast(res.message)
        // 否则跳转目标载具区域
        this.$refs.formComponent.$refs['targetLocationID'][0].$refs.inputRef.focus()
      }
    },
    /** 扫条码时 */
    async barcodeEnter(val) {
      if (!val) {
        _showFailToast('请扫条码')
        return
      }
      try {
        let target = this.tableData.find((item) => item.barcode === val)
        if (!target) {
          _showFailToast(`所扫条码${val}和列表中的条码不存在匹配项，请重新扫码`)
          this.$set(this.form, 'imBarcode', '')
          this.$refs.formComponent.$refs.imBarcode[0].$refs.inputRef.focus()
          return
        }
        console.log(target)
        if (this.selection.includes(target.uuid)) {
          _showFailToast('当前条码已经扫描，请勿重复扫码')
          this.$set(this.form, 'imBarcode', '')
          this.$refs.formComponent.$refs.imBarcode[0].$refs.inputRef.focus()
          return
        }
        if (target) {
          this.selection = [...this.selection, target.uuid]
          // 去重一下
          this.selection = [...new Set(this.selection)]
          this.$nextTick(() => {
            // 将扫描内容置顶
            this.tableData = checkItemToTop(this.tableData, target)
            this.$refs.viTable.$refs.virtual_table_wrapper.scrollTop = 0
            this.$set(this.form, 'imBarcode', '')
            this.$refs.formComponent.$refs.imBarcode[0].$refs.inputRef.focus()
          })
        } else {
          this.$set(this.form, 'imBarcode', '')
          this.$refs.formComponent.$refs.imBarcode[0].$refs.inputRef.focus()
          _showFailToast('当前条码不在该箱子中，请重新扫码')
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },
    /** 过账 */
    async handleConfirm() {
      let _that = this
      if (this.selection.length < 0) {
        _showFailToast('请勾选数据后过账')
        return
      }
      let _selection = this.tableData.filter((item) => this.selection.includes(item.uuid))
      // if (_selection.some((item) => !/^[a-zA-Z]|^2/.test(item.materialNo))) {
      //   _showFailToast('不允许过账物料号不是以【字母】或【2】开头的物料')
      //   return
      // }
      // 取第一项为基准值，所有项的项目、工位、批次必须一致才能过账
      // let _target = _selection[0]
      // if (_selection.some((item) => item.projectNo !== _target.projectNo || item.stationNo !== _target.stationNo || item.batch !== _target.batch)) {
      //   await this.$dialog
      //     .confirm({
      //       title: '重要提示',
      //       message: `所选项的【项目-${_target.projectNo}】、【工位-${_target.stationNo}】、【批次-${_target.batch}】存在不同项，是否继续过账？`
      //     })
      //     .then(() => {
      //       _handler(_that)
      //       // on confirm
      //     })
      //     .catch(() => {
      //       _showFailToast('取消过账')
      //       // on cancel
      //     })
      // } else {
      _handler(_that)
      // }
      async function _handler(_that) {
        try {
          // await validateAuthAndSelected(this.extraParams, _selection)
          await customerDialog({
            count: _selection.length,
            total: computedTotal(_selection, 'quantity'),
            countPrefix: '本次过账共',
            countSuffix: '条数据,',
            totalPrefix: '累计数量是',
            totalSuffix: '确定过账吗?'
          })
          this.loading = true
          // 处理接口参数
          let _form = Object.assign({}, _that.form)
          let postDate = _form.postDate
          delete _form.postDate
          // 删除uuid,遍历实现,混入箱子信息
          // let _list = JSON.parse(JSON.stringify(_selection))
          // _list.forEach((item) => {
          //   item.boxID = this.form.boxID
          //   delete item.uuid
          // })
          // tips:这里特殊一点，目标箱子和来源箱子都传同一个
          let _data = {
            barCodeList: _selection.map((item) => item.barcode),
            boxNo: _that.form.boxID,
            oclas: imOclas,
            cardName: _that.extraParams.cardname,
            cardNo: _that.account,
            cardNewName: _that.name,
            cardNoNew: _that.extraParams.cardno,
            targetBoxID: _that.form.targetBoxID,
            postDate
          }
          let res = await WMSAPI_WCF.post(passAPIName, _data)
          if (res && res.success) {
            _showSuccessToast({
              message: res.message || '过账成功',
              duration: 10 * 1000
            })
            // 清空表单和列表
            _that.handleClear()
          } else {
            _showFailToast(res.message)
          }
        } catch (e) {
          console.log(e)
        } finally {
          _that.loading = false
        }
      }
    },
    /** 清除 */
    handleClear() {
      this.tableData = []
      this.selectAll = false
      this.selection = []
      this.selectRows = []
      this.sapList = []
      this.form = {
        postDate: today
      }
      this.show = false
      let inputRef = this.$refs.formComponent.$refs.imBarcode[0].$refs.inputRef
      inputRef.focus()
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
