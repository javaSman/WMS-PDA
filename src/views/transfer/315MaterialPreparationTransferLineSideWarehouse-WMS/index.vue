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
          <van-checkbox v-model="selectAll" :disabled="chkDisabled" shape="square" @click="handleSelectAll">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>

    <!-- 列表 -->
    <TableVue ref="table" :table-data.sync="list" :table-column="tableColumn" :selection.sync="selectedList" :disabled-chk="chkDisabled" />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" confirm-text="过账" @clear="handleClear" @confirm="handleConfirm" />
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
  </div>
</template>

<script>
// 315备料转移-WMS
import FormVue from '@/components/Form/index.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { WMSAPI } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { checkItemToTop, validateTableSelected } from '@/utils/business'
import { v4 as uuidv4 } from 'uuid'
import { GetUserWarehouse } from '@/api/common'
import { computedTotal } from '@/utils/validateOperateForQty'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { _showFailToast } from '@/utils/message'
import { formList, showFormList, tableColumn } from './config'
import { mapGetters } from 'vuex'
import { customerDialog } from '@/components/CustomerDialog'
const passAPIName = 'business/webapi/OutStock'
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
const imOclas = 'XWMS315'
const listAPIBoxID = 'business/webapi/GetLocationNoByBoxId'
const listAPITargetBoxID = 'business/webapi/GetBoxDetail'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
export default {
  name: 'Transfer315MaterialPreparationTransferLineSideWarehouseWMS',
  components: {
    FormVue,
    TableVue,
    ActionBarVue
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      form: {
        postDate: today
      },
      show: false, // 点击左侧箭头是否展开
      selectedList: [], // 选中项集合
      list: [], // 列表数据
      outBoxIDList: [], // 箱子号物料集合
      loading: false, // 过账按钮loading
      chkDisabled: true, // 是否禁用复选框
      scanLoading: false,
      boxInputRef: null,
      targetBoxIDInputRef: null,
      areaInputRef: null,
      barcodeInputRef: null
    }
  },
  computed: {
    ...mapGetters(['account', 'name']),
    selectAll() {
      return this.selectedList.length === this.list.length && this.selectedList.length !== 0
    }
  },
  created() {
    this.getUserWarehouse()
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
    handleSelectAll() {
      if (this.$refs.table) {
        this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
      }
    },
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
    wareHouseChange(val) {
      if (!val) return
      this.targetBoxIDInputRef?.focus()
    },
    boxNoEnter(val) {
      if (!val) return
      let _this = this
      // 调用接口带出区域，如果区域有值，光标跳转到条码，没有跳转到区域
      WMSAPI.get(listAPIBoxID, { boxId: val })
        .then((res) => {
          // console.log(res)
          if (res.success) {
            _this.$set(_this.form, 'targetLocationID', res.locationNo)
            // 跳转到转出箱子
            this.boxInputRef?.focus()
          } else {
            _showFailToast(res.message)
            this.areaInputRef?.focus()
          }
        })
        .catch(() => {
          this.boxInputRef?.focus()
        })
    },
    outBoxIDEnter(val) {
      if (!val) return
      WMSAPI.get(listAPITargetBoxID, { boxId: val })
        .then((res) => {
          if (res.success) {
            // 储存目标向子号物料
            this.outBoxIDList = res.materialBarcodeList
            // outBoxIDList = testData2.data
            if (this.outBoxIDList.length === 0) {
              _showFailToast('转出箱子暂无明细')
            }
            this.barcodeInputRef?.focus()
          } else {
            _showFailToast(res.message)
          }
        })
        .catch((e) => {
          console.log(e)
        })
    },
    areaEnter(val) {
      if (!val) return
      this.boxInputRef?.focus()
    },
    validateOutBoxWithList(list) {
      let _list = list.map((item) => item.idnrk)
      let _outBoxIDList = this.outBoxIDList.map((item) => item.materialNo)
      return new Promise((resolve, reject) => {
        // tips: _list是子集，循环这个子集的长度，在箱子列表里面依次寻找，所有的都能找到才放行
        let flag = false
        for (let i = 0; i < _list.length; i++) {
          if (_outBoxIDList.includes(_list[i])) {
            flag = true
          } else {
            flag = false
          }
        }
        if (flag) {
          resolve(true)
        } else {
          _showFailToast('该物料在转出箱子中不存在，请检查数据')
          reject(false)
        }
      })
    },
    barcodeEnter(val) {
      if (!val) {
        _showFailToast('请输入条码')
        return
      }
      // 以list的长度作为判断条件，大于0，表面如果页面明细没有被清除，等于0表明页面无信息
      if (this.list.length > 0) {
        // 从结果集中寻找
        let target = this.list.find((item) => item.objnr === val)
        if (target) {
          let arrs = [...this.selectedList.map((item) => item.uuid), target.uuid]
          // 进行勾选
          this.$refs.table?.handleSelect(arrs)
          // tips:这里追加操作，扫描项要置顶
          this.list = checkItemToTop(this.list, target)
          this.$nextTick(() => {
            // 光标重新聚焦
            this.barcodeInputRef?.focus()
          })
        } else {
          _showFailToast('当前条码不是该单据数据，请检查数据')
        }
        return
      }

      this.scanLoading = true
      WMSAPI.get(listAPIName, { imBarcode: val, imOclas })
        .then(async (res) => {
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

            let arr = []
            // 增加uuid为唯一识别符
            _data.forEach((item) => {
              item.uuid = uuidv4()
              arr.push(item)
            })
            // tips: 先判断转出箱子里面的明细的materialNo是否和spa列表的里面的明细的idnrk匹配
            await this.validateOutBoxWithList(arr)
            // 赋值表格数据
            this.list = arr

            // 条码是3开头，自动全选
            if (val.startsWith('3')) {
              let uuids = this.list.map((item) => item.uuid)
              this.$refs.table?.handleSelect(uuids)
            }
          } else {
            _showFailToast(res.message)
          }
        })
        .catch(() => {
          // 在返回错误后清空页面
          this.handleClear()
        })
        .finally(() => {
          this.scanLoading = false
          this.form.imBarcode = ''
          // 查询结果之后重新聚焦
          this.barcodeInputRef?.focus()
        })
    },
    async handleConfirm() {
      try {
        // 表单验证
        await this.$refs.formComponent.$refs.refForm.validate()
        // 表格必填项验证
        let flag = validateTableSelected(this.tableColumn, this.selectedList)
        if (!flag.isPass) {
          _showFailToast(flag.message)
          return
        }
        // 是否有勾选数据
        if (this.selectedList.length === 0) {
          _showFailToast('请勾选数据')
          return
        }
        // 过账前确认
        // await this.$dialog.confirm({
        //   title: '提示',
        //   message: `本次过账共 ${this.selectedList.length} 条数据,累计数量是: ${computedTotal(this.selectedList)},是否确认过账？`
        // })
        await customerDialog({
          count: this.selectedList.length,
          total: computedTotal(this.selectedList),
          countPrefix: '本次过账共',
          countSuffix: '条数据,',
          totalPrefix: '累计数量是',
          totalSuffix: '确定过账吗?'
        })
        // 开始过账
        this.loading = true

        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(this.selectedList))
        _list.forEach((item) => delete item.uuid)

        // tips:混入转入/转出箱子和区域信息
        _list = _list.map((item) => ({
          ...item,
          boxID: this.form.boxID,
          targetBoxID: this.form.targetBoxID,
          targetLocationID: this.form.targetLocationID
        }))
        // 处理接口参数
        let _form = Object.assign({}, this.form)
        let postDate = _form.postDate
        delete _form.postDate

        // TODO: 这里记得传入用户信息
        // 组合参数
        let _data = fomrmatShipmentSubmitParams(
          imOclas,
          this.account,
          this.name,
          this.form.warehouseNo,
          _list,
          'out',
          null,
          null,
          undefined,
          'maktx',
          postDate
        )

        // 调用接口
        let res = await WMSAPI.post(passAPIName, _data)
        if (res && res.success) {
          this.$toast.success(res.message || '过账成功')
          // 清空表单和列表
          this.handleClear()
        } else {
          _showFailToast(res.message)
        }
      } finally {
        this.loading = false
      }
    },
    handleClear() {
      // table数据
      this.list = []
      // 转出箱子列表
      this.outBoxIDList = []
      // 选中项集合
      this.selectedList = []
      // 表单
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo
      }
      this.fousOfFirst()
    },
    initConfig() {
      let _this = this
      this.formList.forEach((item) => {
        if (item.prop === 'warehouseNo') {
          item.change = _this.wareHouseChange
        }
        if (item.prop === 'boxID') {
          item.enter = (val) => _this.outBoxIDEnter(val)
          _this.boxInputRef = _this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'targetLocationID') {
          item.enter = _this.areaEnter
          _this.areaInputRef = _this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
          this.barcodeInputRef = _this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'targetBoxID') {
          item.enter = (val) => _this.boxNoEnter(val)
          _this.targetBoxIDInputRef = _this.getVueComponentByProp(item.prop)
        }
      })
    },
    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    // 根据prop和index获取表格中表单组件
    getVueComponentByTableProp(prop, index) {
      return this.$refs.table.$refs[`${prop}_${index}`][0].$refs.input
    }
  }
}
</script>

<style lang="scss" scoped>
.loading_wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
