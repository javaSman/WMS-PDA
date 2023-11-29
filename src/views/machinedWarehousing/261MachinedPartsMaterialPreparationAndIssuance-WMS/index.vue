<template>
  <div>
    <!-- 表单布局 -->
    <van-cell-group>
      <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
        <template v-if="showFormList.length > 0" #title>
          <van-icon :name="show ? 'arrow-down' : 'arrow'" @click="show = !show" />
        </template>
        <template>
          <FormVue ref="formComponent" :form-data.sync="form" :form-list="_formList" />
        </template>
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
        <van-grid-item>已确认：{{ selectedList.length }}</van-grid-item>
        <van-grid-item>剩余数：{{ list.length - selectedList.length }}</van-grid-item>
        <van-grid-item>
          <van-checkbox v-model="selectAll" :disabled="disabledCheck" shape="square" @click="handleSelectAll">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>

    <!-- 列表 -->
    <TableVue
      ref="table"
      :is-virtually="true"
      :table-data.sync="list"
      :disabled-chk="disabledCheck"
      :table-column="tableColumn"
      :selection.sync="selectedList"
    />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" @clear="handleClear" @confirm="handleConfirm" />
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
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
import Dates from '@/utils/datetime'
import { mapGetters } from 'vuex'
import { v4 as uuidv4 } from 'uuid'
import { WMSAPI } from '@/api/generalAPI'
import { GetBoxDetail, GetBoxInfoByBoxId, GetLocationInfo } from '@/api/common'
import { _showFailToast } from '@/utils/message'
let boxInputRef = null
let barcodeInputRef = null
let targetBoxIDRef = null
let targetLocationRef = null
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
import { checkItemToTop } from '@/utils/business'
import { computedTotal } from '@/utils/validateOperateForQty'
import { customerDialog } from '@/components/CustomerDialog'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
// 261机加件备料发料-WMS
import { formList, showFormList, tableColumn } from './config'
const cachedName = 'machinedWarehousing.261MachinedPartsMaterialPreparationAndIssuance-WMS'
const passAPIName = 'business/webapi/OutStock'
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
// const listAPIName = '9037Wcf/WarehouseService.svc/rest/ZxwmsXmbeCommonListMrp'

const imOclas = 'XWMS261'

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
      userAuthVisible: true,
      extraParams: {},
      formList,
      showFormList,
      tableColumn,
      passAPIName,
      listAPIName,
      imOclas,
      form: {
        postDate: today
      }, // 表单对象，初始化过账日期
      show: false, // 点击左侧箭头是否展开
      selectAll: false, // 是否全选
      selectedList: [], // 选中项集合
      list: [], // 列表数据
      loading: false, // 过账按钮loading
      scanLoading: false, // 扫条码时进行loading
      sapList: [], // 保存sap列表用于过账
      disabledCheck: true
    }
  },
  computed: {
    ...mapGetters(['account', 'name']),
    _formList() {
      return JSON.parse(JSON.stringify(this.formList))
    },
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
        // tips: 这里要判断一下是否是那种自动触发过账的
        if (selectedList.length > 0 && list.length > 0 && selectedList.length === list.length && this.autoSubmit) {
          this.handleConfirm()
        }
      }
    }
  },
  mounted() {
    this.initConfig()
    this.fousOfFirst()
  },
  methods: {
    // 初始化配置项
    initConfig() {
      this._formList.forEach((item) => {
        if (item.prop === 'wmsTools') {
          item.enter = this.wmsToolsEnter
          boxInputRef = this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'targetBoxID') {
          item.enter = this.targetBoxIDEnter
          targetBoxIDRef = this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'targetLocation') {
          item.enter = this.targetLocationEnter
          targetLocationRef = this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
          barcodeInputRef = this.getVueComponentByProp(item.prop)
        }
      })
    },
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
    /** 全选和反选 */
    handleSelectAll() {
      this.$nextTick(() => {
        this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
      })
    },
    /** 箱子号回车带出明细 */
    async wmsToolsEnter(val) {
      if (!val) return
      if (this.list.length > 0) {
        _showFailToast('表格中已有数据了，请手动清除或者过账这些数据')
        return
      }
      try {
        this.scanLoading = true
        let res = await GetBoxDetail(val)
        if (res.success) {
          let _data = res.materialBarcodeList
          if (_data.length === 0) {
            _showFailToast(`箱子号[${val}]下没有明细物料，请重新扫码`)
            this.form.wmsTools = ''
            boxInputRef?.focus()
            return
          }
          this.list = _data.map((item) => ({ ...item, uuid: uuidv4(), operator: this.extraParams.cardname }))
          // 光标跳转
          targetBoxIDRef?.focus()
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },
    // 目标载具回车
    async targetBoxIDEnter(val) {
      if (!val) {
        _showFailToast('此项不能为空')
        return
      }
      // 调用接口带出区域，如果区域有值，光标跳转到条码，没有跳转到区域
      let res = await GetBoxInfoByBoxId(val)
      // 判断箱子号是否存在
      if (res.success) {
        // this.form.locationID = res.locationNo
        this.$set(this.form, 'targetLocation', res.locationNo)
        barcodeInputRef.focus()
      } else {
        _showFailToast(res.message)
        if (res.message.includes('绑定货位')) {
          targetLocationRef.focus()
        }
        targetBoxIDRef.focus()
      }
    },
    // 目标区域回车
    async targetLocationEnter(val) {
      if (!val) return
      let res = await GetLocationInfo(val)
      if (!res.success) {
        _showFailToast(res.message)
      } else {
        barcodeInputRef.focus()
      }
    },

    /** 条码回车勾选明细 */
    async barcodeEnter(val) {
      if (!val) return
      if (this.list.length === 0) {
        _showFailToast('请先输入/扫码箱子号')
        return
      }

      try {
        let res = await WMSAPI.get(listAPIName, {
          imOclas: imOclas,
          imBarcode: val
        })
        // 业务报错
        if (!res.success) {
          _showFailToast(res.message)
          return
        }
        // 无数据
        let _data = res.data
        if (!_data) {
          _showFailToast(`当前所扫条码没有返回没有结果`)
          return
        }
        if (_data.length === 0) {
          _showFailToast(`查无此[${val}]条码`)
          return
        }
        // 根据sap返回的数据和条码列表的objnr字段进行匹配
        let target = this.list.filter((item) => _data.map((item) => item.objnr).includes(item.barcode))
        if (target.length > 0) {
          // 重复校验
          if (this.selectedList.length > 0) {
            if (this.selectedList.filter((item) => target.map((item) => item.uuid).includes(item)).length > 0) {
              _showFailToast('已经扫码，请勿重复扫码')
              return
            }
          }
          // 每次都是追加，不是覆盖，因为存在连续扫码的情况
          let arrs = [...this.selectedList, ...target.map((item) => item.uuid)]
          // 进行勾选
          // this.$refs.table?.handleSelect(arrs)
          this.selectedList = arrs
          // tips: 这里有个特殊行为，就是针对这些一条一条扫码匹配的，有些要进行匹配后置顶操作的
          this.list = checkItemToTop(this.list, target)

          // 滚动视图至顶点
          this.$nextTick(() => {
            this.$refs.table.$refs.wrapperRef.scrollTop = 0
          })
          // tips:记录这次符合条件的sap列表，等下要用它过账
          this.sapList.push(..._data)
        } else {
          _showFailToast(`箱子[${this.form.wmsTools}]中无此[${val}]条码`)
        }
      } catch (e) {
        // console.log(e)
      } finally {
        barcodeInputRef?.focus()
        this.form.imBarcode = ''
      }
    },

    // 过账
    async handleConfirm() {
      try {
        // 表单验证
        await this.$refs.formComponent?.$refs?.refForm.validate()
        // 确认是否可以过账
        if (this.selectedList.length === 0) {
          _showFailToast('请勾选数据')
          return
        }
        // await this.materialJudge()
        await customerDialog({
          count: this.selectedList.length,
          total: computedTotal(this.sapList, 'erfmg'),
          countPrefix: '本次过账共',
          countSuffix: '条数据,',
          totalPrefix: '累计数量是',
          totalSuffix: '确定过账吗?'
        })
        // 开始过账
        this.loading = true
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(this.sapList))
        _list.forEach((item) => delete item.uuid)
        _list = _list.map((item) => ({
          ...item,
          wmsTools: this.form.wmsTools,
          targetBoxID: this.form.targetBoxID,
          targetLocationID: this.form.targetLocation
        }))
        // 处理接口参数
        let _form = Object.assign({}, this.form)
        let postDate = _form.postDate
        delete _form.postDate
        // tips:如果有授权的内容，那就加上
        if (this.extraParams) _list.map((item) => ({ ...item, ...this.extraParams }))
        // 组合数据
        let _data = fomrmatShipmentSubmitParams(
          'XWMS261',
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
        // tips:重新构造领料人和发料人的信息，因为sap这部分弄的非常混乱
        _data.iM_CARDNO = this.name
        _data.iM_CARDNAME = this.extraParams.cardname
        _data.zxstXmbeStruList = _data.zxstXmbeStruList.map((item) => ({
          ...item,
          IM_CARDNO: this.account,
          IM_CARDNAME: this.name,
          cardname: this.extraParams.cardno,
          cardno: this.account,
          cardmo: this.name,
          cardmame: this.extraParams.cardname
        }))
        // tips:重新构造WMS的参数，项目号取批次前面截取的内容
        _data.wmsOutStockList = _data.wmsOutStockList.map((item) => ({
          ...item,
          projectID: item.batchID ? item.batchID.split('-')[0] : ''
        }))
        // 过账
        let res = await WMSAPI.post(this.passAPIName, _data)
        if (res && res.success) {
          this.$toast.success({
            message: res.message || '过账成功',
            duration: 10 * 1000
          })
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
    // 清空
    handleClear() {
      // table数据
      this.list = []
      // 选中项集合
      this.selectedList = []
      this.sapList = []
      // 表单
      this.form = {
        postDate: today
      }
      boxInputRef?.focus()
    },

    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    // tips:判断物料的开头是不是2或者字母，是的话才能被过账，因为这个代表这是机加件的意思
    computedType(matnr) {
      if (/^[a-zA-Z]|^2/.test(matnr)) {
        return true
      } else {
        return false
      }
    },
    // 物料号判断
    materialJudge() {
      let _this = this
      let _selection = this.list.filter((item) => this.selectedList.includes(item.uuid))
      return new Promise((resolve, reject) => {
        if (
          _selection.every((item) => {
            if (_this.computedType(item['materialNo'].replace(/^0+/gi, ''))) {
              return true
            } else {
              return false
            }
          })
        ) {
          resolve(true)
        } else {
          _showFailToast('当前所选项不是机加件（不是以2开头或字母开头）,不允许过账')
          reject(false)
        }
      })
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
