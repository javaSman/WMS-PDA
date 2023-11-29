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
        <van-grid-item>总数：{{ list.length }}</van-grid-item>
        <van-grid-item>已确认：{{ selectedList.length }}</van-grid-item>
        <van-grid-item>剩余数：{{ list.length - selectedList.length }}</van-grid-item>
        <van-grid-item>
          <van-checkbox v-model="selectAll" :disabled="isDisCheck" shape="square" @click="handleSelectAll">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>
    <!-- 列表 -->
    <VirtualTable
      ref="viTable"
      :wrapp-top="show ? 310 : 65"
      :table-data.sync="list"
      :table-column="tableColumn"
      :selection.sync="selectedList"
      :disable-chck="isDisCheck"
    />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" @clear="clearHandler" @confirm="handleConfirm" />
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
  </div>
  <!-- <ToggleFormWMSVue
    ref="toggleFormWMSVue"
    :form-list="formList"
    :show-form-list="showFormList"
    :table-column="tableColumn"
    :pass-a-p-i-name="passAPIName"
    :list-a-p-i-name="listAPIName"
    :type="imOclas"
    :submit="handleSubmit"
    mode="one"
    scanl-key="objnr"
    :auto-submit="true"
    :is-disable-checked="true"
    :chk-disabled="true"
    :is-check-and-to-top="true"
    :is-alter-message="true"
  /> -->
</template>

<script>
// import ToggleFormWMSVue from '@/views/businessComponents/ToggleFormWMS.vue'
import { formList, showFormList, tableColumn } from './config'
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
const passAPIName = 'business/webapi/PostIn'
const imOclas = 'XWMS105'
import VirtualTable from '@/components/VirtualTable/index.vue'
import FormVue from '@/components/Form/index.vue'
// import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import Dates from '@/utils/datetime'
import { mapGetters } from 'vuex'
import { WMSAPI } from '@/api/generalAPI'
import { GetUserWarehouse, GetBoxInfoByBoxId, GetLocationInfo } from '@/api/common'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { checkItemToTop } from '@/utils/business'
import { v4 as uuidv4 } from 'uuid'
import { computedTotal, getEditableKey } from '@/utils/validateOperateForQty'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { customerDialog } from '@/components/CustomerDialog'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
export default {
  name: 'Receive105GoodToWarehouseWMS',
  components: {
    // ToggleFormWMSVue
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
      isDisCheck: true // 是否能够选择
    }
  },
  computed: {
    ...mapGetters(['account', 'name']),
    multiList() {
      let { selectedList, list } = this
      return { selectedList, list }
    }
  },
  watch: {
    // 对比选中项长度与数据数组总长度，是否可以勾选全选复选框
    multiList: {
      handler: function (val) {
        const { selectedList, list } = val
        this.selectAll = selectedList.length === list.length && selectedList.length !== 0
        // tips: 这里要判断一下是否是那种自动触发过账的
        if (selectedList.length > 0 && list.length > 0 && selectedList.length === list.length) {
          this.handleConfirm()
        }
      }
    }
  },
  mounted() {
    this.getUserWarehouse()
    this.initConfig()
    this.fousOfFirst()
  },
  methods: {
    // 初始化配置项
    initConfig() {
      this.formList.forEach((item) => {
        if (item.prop === 'warehouseNo') {
          item.change = this.wareHouseChange
        }
        if (item.prop === 'wmsTools') {
          item.enter = this.wmsToolsEnter
        }
        if (item.prop === 'locationId') {
          item.enter = this.locationIdEnter
        }
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
        }
      })
    },
    // tips：让第一个可以输入的输入源获取光标
    fousOfFirst() {
      let result = this.formList.filter((item) => item.type === 'Input')
      if (result.length > 0) {
        // tips:获取第一行的输入key
        let prop = result[0].prop
        // tips:如果form中有箱子号或者区域之类的数据，那么光标就去focusKey指定的，否则就是第一个
        if ((this.focusKey && this.form.boxID) || this.form.locationID) prop = this.focusKey
        this.$refs.formComponent.$refs[prop][0].$refs.inputRef.focus()
      }
    },
    /** 全选和反选 */
    handleSelectAll() {
      this.$nextTick(() => {
        this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
      })
    },

    /** 根据用户工号获取仓库列表 */
    async getUserWarehouse() {
      try {
        let res = await GetUserWarehouse()
        if (res.success) {
          this.formList[0].options = res.datas
          // tips:默认选中第一个
          if (res.datas.length > 0) {
            this.$set(this.form, 'warehouseNo', res.datas[0].warehouseNo)
          }
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      }
    },

    /** 仓库change */
    wareHouseChange(val) {
      this.form.warehouseNo = val
      if (!val) return
    },

    /** 箱子号回车 */
    async wmsToolsEnter(val) {
      let barcodeRef = this.getVueComponentByProp('imBarcode')
      let areaRef = this.getVueComponentByProp('locationId')
      if (!val) {
        _showFailToast('此项不能为空')
        return
      }
      // 调用接口带出区域，如果区域有值，光标跳转到条码，没有跳转到区域
      let res = await GetBoxInfoByBoxId(val)
      // 判断箱子号是否存在
      if (res.success) {
        // this.form.locationID = res.locationNo
        this.$set(this.form, 'locationId', res.locationNo)
        barcodeRef.focus()
      } else {
        _showFailToast(res.message)
        if (res.message.includes('绑定货位')) {
          areaRef.focus()
        }
      }
    },

    /** 区域回车 */
    async locationIdEnter(val) {
      if (!val) return
      let res = await GetLocationInfo(val)
      if (!res.success) {
        _showFailToast(res.message)
      } else {
        let barcodeRef = this.getVueComponentByProp('imBarcode')
        barcodeRef.focus()
      }
    },

    /**
     * @description: 条码回车事件，需判断匹配明细的方式
     * @param {*} val 条码值
     */
    async barcodeEnter(val) {
      let barcodeRef = this.getVueComponentByProp('imBarcode')
      if (val.length > 18) {
        _showFailToast('当前所扫条码超过最大长度，可能是扫太快导致的，请适当增加扫码间隔时间')
        this.form.imBarcode = ''
        barcodeRef.focus()
        return false
      }
      if (!val) {
        _showFailToast('请输入条码')
        return
      }
      // 以list的长度作为判断条件，大于0，表面如果页面明细没有被清除，等于0表明页面无信息
      if (this.list.length > 0) {
        let target = this.list.filter((item) => item['objnr'] === val || item['kdauf'] === val || item['kdauf'] + '-000001' === val)
        if (target.length > 0) {
          if (this.selectedList.length > 0 && this.selectedList.includes(target[0].uuid)) {
            _showFailToast('请勿重复扫码')
            this.form.imBarcode = ''
            barcodeRef.focus()
            return
          }
          // 每次都是追加，不是覆盖，因为存在连续扫码的情况
          this.selectedList = [...this.selectedList, ...target.map((item) => item.uuid)]
          // 进行勾选
          // tips: 这里有个特殊行为，就是针对这些一条一条扫码匹配的，有些要进行匹配后置顶操作的
          this.list = checkItemToTop(this.list, target[0])
          this.$nextTick(() => {
            this.form.imBarcode = ''
            barcodeRef.focus()
            // 将列表视图滚动回顶层
            this.$refs.viTable.$refs.virtual_table_wrapper.scrollTop = 0
          })
        } else {
          _showFailToast('没有找到结果，请检查重试或清除结果后重新扫码')
          this.form.imBarcode = ''
          barcodeRef.focus()
        }
      } else {
        try {
          // 否则加载接口数据然后全选
          this.scanLoading = true
          let res = await WMSAPI.get(this.listAPIName, { imBarcode: val, imOclas: imOclas })
          if (res && res.success) {
            let _data = res.data
            if (_data.length === 0) {
              _showFailToast('暂无数据')
              return
            }
            // TODO: 使用静态测试数据
            // let _data: any[] = testData.data
            if (_data.length > 0) {
              this.form = Object.assign({}, this.form, _data[0])
            }
            // let arr = []
            // 增加uuid为唯一识别符
            // 这里条码扫的是什么，如果能有返回值，那么条码就用扫码的值赋值
            if (_data.length === 1 && _data[0].ktext !== '良品') {
              _data = _data.map((item) => ({ ...item, objnr: val, uuid: uuidv4() }))
            } else {
              _data = _data.map((item) => ({ ...item, uuid: uuidv4() }))
            }
            // _data.forEach((item) => {
            //   item.uuid = uuidv4()
            //   arr.push({ ...item, objnr: val })
            // })
            // 赋值表格数据
            this.list = _data
            this.$nextTick(() => {
              this.form.imBarcode = ''
              barcodeRef.focus()
              // 光标重新聚焦
            })
          } else {
            _showFailToast(res.message)
          }
        } catch (e) {
          console.log(e)
        } finally {
          this.scanLoading = false
          this.form.imBarcode = ''
          barcodeRef.focus()
        }
      }
    },

    // 过账
    async handleConfirm() {
      const key = getEditableKey(this.tableColumn)
      if (this.selectedList.length === 0) {
        _showFailToast('请勾选数据')
        return
      }
      if (this.isAllSelectAndSubmit && this.list.length !== this.selectedList.length) {
        _showFailToast('存在未确认项，请确认数据。')
        return
      }
      // try {
      try {
        let _selection = this.list.filter((item) => this.selectedList.includes(item.uuid))
        // 表单验证
        await this.$refs.formComponent.$refs.refForm.validate()
        // 过账前确认
        // await this.$dialog.confirm({
        //   title: '提示',
        //   message: `本次过账共 ${this.selectedList.length} 条数据,累计数量是: ${computedTotal(this.selectedList, this.computedKey)},是否确认过账？`
        // })
        await customerDialog({
          count: this.selectedList.length,
          total: computedTotal(_selection, key),
          countPrefix: '本次过账共',
          countSuffix: '条数据,',
          totalPrefix: '累计拣货数量是',
          totalSuffix: '确定过账吗?'
        })
        // 开始过账
        this.loading = true
        // 处理接口参数
        let _form = Object.assign({}, this.form)
        let postDate = _form.postDate
        delete _form.postDate
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(_selection))
        _list.forEach((item) => delete item.uuid)
        // 混入载具和区域信息
        _list = _list.map((item) => ({
          ...item,
          wmsTools: this.form.wmsTools,
          locationId: this.form.locationId
          // matnr: item.matnr ? item.matnr : item.idnrk
        }))
        let _data = fomrmatShipmentSubmitParams(
          imOclas,
          this.account,
          this.name,
          this.form.warehouseNo,
          _list,
          'in',
          undefined,
          undefined,
          'objnr',
          'txz01',
          postDate
        )
        // tips:重新根据sap的良品数或者特采数赋值wms的数量
        _data.wmsPostInList = _data.wmsPostInList.map((item, index) => ({
          ...item,
          quantity: Number(_data.zxstXmbeStruList[index].qcqty) > 0 ? _data.zxstXmbeStruList[index].qcqty : _data.zxstXmbeStruList[index].tcqty
        }))
        // tips:如果良品数量有值，此时需要修改sap的erfmg数量
        _data.zxstXmbeStruList = _data.zxstXmbeStruList.map((item) => ({
          ...item,
          erfmg: Number(item.qcqty) > 0 ? item.qcqty : item.erfmg
        }))
        console.log(_data)
        // console.log(_data)
        let res = await WMSAPI.post(this.passAPIName, _data)
        if (res && res.success) {
          _showSuccessToast(res.message)
          // await this.$dialog.alert({ message: res.message })
          // 清空表单和列表
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

    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    // 清空
    clearHandler() {
      // 额外参数
      this.exParams = {}
      // table数据
      this.list = []
      // 选中项集合
      this.selectedList = []
      // 表单
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo
      }
      this.fousOfFirst()
    },
    submitClear() {
      // table数据
      this.list = []
      // 选中项集合
      this.selectedList = []
      // 表单
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo,
        wmsTools: this.form.wmsTools,
        locationId: this.form.locationId
      }
      this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
      // this.fousOfFirst()
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
