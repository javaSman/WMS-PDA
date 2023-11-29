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
          <van-checkbox v-model="selectAll" :disabled="isDisAllCheck" shape="square" @click="handleSelectAll">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>

    <!-- 列表 -->
    <TableVue
      ref="table"
      :table-data.sync="list"
      :table-column="tableColumn"
      :selection.sync="selectedList"
      :disabled-chk="isDisCheck"
      @clickHandlerEvent="clickHandlerEvent"
      @inputNumHandler="inputNumHandler"
      @inputTextHandler="inputTextHandler"
    />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" :confirm-text="confirmText" @clear="clearHandler" @confirm="handleConfirm" />
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
// import dayjs from 'dayjs'
import Dates from '@/utils/datetime'
import { mapGetters } from 'vuex'
import { WMSAPI } from '@/api/generalAPI'
import { WMSAPI_WCF } from '@/api/generalAPI'

import { GetUserWarehouse, GetBoxInfoByBoxId, GetLocationInfo } from '@/api/common'
import { checkItemToTop, validateTableSelected } from '@/utils/business'
import { v4 as uuidv4 } from 'uuid'
import { computedTotal, getEditableKey, validateOriginQtyLimit, validateQtyForItem } from '@/utils/validateOperateForQty'
import { _showFailToast } from '@/utils/message'
import { customerDialog } from '@/components/CustomerDialog'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
// 物料描述 字段不统一的情况
let _materialDesc = ''
// 有的页面有条码有的没有，应对过账时传参不统一的情况
let _barcode = ''
// 用于存储列表原始数据
let staticData = []
let boxInputRef = null
let areaInputRef = null
let barcodeInputRef = null

export default {
  name: 'ToggleFormWMS',
  components: {
    FormVue,
    TableVue,
    ActionBarVue
  },
  props: {
    formList: { type: Array, default: () => [] }, // 表单项数组
    showFormList: { type: Array, default: () => [] }, // 需要展开显示的数据字段参数
    viewData: { type: Object, default: () => ({}) }, // 列表信息总览数据
    tableColumn: { type: Array, default: () => [] }, // 列表字段参数
    chkDisabled: { type: Boolean, default: () => false }, // 全选按钮的禁用选项
    submit: {
      type: Function,
      default: () => {
        return false
      }
    }, // 过账按钮前执行事件
    passAPIName: { type: String, default: () => '' }, // 过账接口地址
    listAPIName: { type: String, default: () => '' }, // 扫码查询接口地址
    type: { type: String, default: () => '' }, // 页面业务类型
    confirmText: { type: String, default: () => '过账' }, // 底部按钮显示文本
    enterFrontEvent: {
      type: Function,
      default: () => false
    }, // 条码回车事件前执行事件
    enterAfterEvent: {
      type: Function,
      default: undefined
    }, // 条码回车事件后执行事件，用于重新组合数据
    snrc: { type: Array, default: () => [] }, // 确认信息数组
    isPass: { type: Boolean, default: () => true },
    // 1.扫码匹配字段一标识key，此key是用来实现业务的，必须传入；2.追加数据判断是否重复扫码的唯一识别符
    scanlKey: { type: String, default: 'matnr' },
    // 当前模式，all：加载接口后全选；one：扫码匹配或手动勾选，需传值scanlKey匹配字段；handler：只能手动勾选；addTo：追加数据,allAntDisable: 全选然后不能再选择了
    mode: { type: String, default: 'one' },
    autoSubmit: { type: Boolean, default: () => false }, // tips: 是否触发自动过账行为,当全选时自动触发过账动作
    computedKey: { type: String, default: () => null }, // 指定一个计数逻辑key，用于处理那些特殊的数量，例如不良数之类的
    isDisableChecked: { type: Boolean, default: () => false }, // 是否禁止选择
    isCheckAndToTop: { type: Boolean, default: () => false }, // 是否选择后置顶操作
    isAllSelectAndSubmit: { type: Boolean, default: () => false }, // 是否全选才能过账
    onlyShowDoNotFillLocation: { type: Boolean, default: () => false }, // 箱子回车时只需要提示，不需要填充区域
    focusKey: { type: String, default: 'imBarcode' }, // 要自动获取焦点的输入源key
    isAlterMessage: { type: Boolean, default: false }, // 是否是弹窗式的提醒功能
    isWcfInterface: { type: Boolean, default: false } // 是否走WCF接口
  },
  data() {
    return {
      form: {
        postDate: today
      }, // 表单对象，初始化过账日期
      show: false, // 点击左侧箭头是否展开
      selectAll: false, // 是否全选
      selectedList: [], // 选中项集合
      list: [], // 列表数据
      loading: false, // 过账按钮loading
      scanLoading: false, // 扫条码时进行loading
      isDisCheck: false, // 是否能够选择
      exParams: {}, // 存储额外的参数对象
      numBlurParams: {
        key: 'erfmg',
        index: 0
      } // 用于存储当前正在编辑的行的索引
    }
  },
  computed: {
    ...mapGetters(['account', 'name']),
    // 如果过账的时PostIn，表示入库，OutStock 表示退货，两边接口参数不一致
    isPostIn() {
      return this.passAPIName.endsWith('/PostIn')
    },
    // 表单项数组
    isDisAllCheck: {
      get() {
        return this.chkDisabled
      },
      set(val) {
        this.$emit('update:chkDisabled', val)
      }
    },
    multiList() {
      let { selectedList, list } = this
      return { selectedList, list }
    }
  },
  watch: {
    isDisableChecked: {
      handler: function (n) {
        if (n) {
          this.isDisCheck = true
        }
      },
      deep: true,
      immediate: true
    },
    // 对比选中项长度与数据数组总长度，是否可以勾选全选复选框
    multiList: {
      handler: function (val) {
        const { selectedList, list } = val
        this.selectAll = selectedList.length === list.length && selectedList.length !== 0
        // tips: 这里要判断一下是否是那种自动触发过账的
        if (this.autoSubmit && selectedList.length > 0 && list.length > 0 && selectedList.length === list.length) {
          this.handleConfirm()
        }
      }
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
      boxInputRef?.focus()
    },

    /** 箱子号回车 */
    boxNoEnter(val) {
      if (!val) {
        _showFailToast('此项不能为空')
        return
      }
      let _this = this
      // 调用接口带出区域，如果区域有值，光标跳转到条码，没有跳转到区域
      GetBoxInfoByBoxId(val)
        .then((res) => {
          // 判断箱子号是否存在
          if (res.success) {
            // tips: 这里增强行为，针对105良品入库WMS时只需要提示，不需要填充区域的
            if (_this.onlyShowDoNotFillLocation && res.locationNo) {
              _this.$toast.success({ message: `箱子已绑定${res.locationNo}货位` })
              areaInputRef?.focus()
            } else {
              // this.form.locationID = res.locationNo
              _this.$set(_this.form, 'locationID', res.locationNo)
              barcodeInputRef?.focus()
            }
          } else {
            _showFailToast(res.message)
            areaInputRef?.focus()
          }
        })
        .catch(() => {
          boxInputRef?.focus()
        })
    },

    /** 区域回车 */
    areaEnter(val) {
      if (!val) return
      GetLocationInfo(val)
        .then((res) => {
          if (!res.success) {
            _showFailToast(res.message)
          }
        })
        .finally(() => {
          barcodeInputRef?.focus()
        })
    },

    /**
     * @description: 条码回车事件，需判断匹配明细的方式
     * @param {*} val 条码值
     */
    async barcodeEnter(val) {
      if (!val) {
        _showFailToast('请输入条码')
        return
      }
      // 以list的长度作为判断条件，大于0，表面如果页面明细没有被清除，等于0表明页面无信息
      if (this.list.length > 0) {
        // 1.当模式是扫码匹配
        if (this.mode === 'one') {
          // 从结果集中寻找
          // tips: 如果这个scanKey是mantnr要拼接前面的0,但是这个拼接的前提是如果是0开头的就不拼接，如果不是就拼接
          if (this.scanlKey === 'matnr' && !/^0/gi.test(val)) {
            val = '000000' + val
          }
          let target = this.list.filter((item) => item[this.scanlKey] === val)
          if (target.length > 0) {
            // 每次都是追加，不是覆盖，因为存在连续扫码的情况
            let arrs = [...this.selectedList.map((item) => item.uuid), ...target.map((item) => item.uuid)]
            // 进行勾选
            this.$refs.table?.handleSelect(arrs)
            // tips: 这里有个特殊行为，就是针对这些一条一条扫码匹配的，有些要进行匹配后置顶操作的
            if (this.isCheckAndToTop) {
              this.list = checkItemToTop(this.list, target[0])
            }
            this.$nextTick(() => {
              this.form.imBarcode = ''
              // 光标重新聚焦
              barcodeInputRef?.focus()
            })
          } else {
            _showFailToast('没有找到结果，请检查重试或清除结果后重新扫码')
            this.$nextTick(() => {
              this.form.imBarcode = ''
              // 光标重新聚焦
              barcodeInputRef?.focus()
            })
          }
        }
        // 2.当模式是手动勾选
        if (this.mode === 'handler') {
          _showFailToast('请手动勾选数据过账或清除信息后再扫码！')
        }
        // 3.当前模式是默认全选
        if (this.mode === 'all') {
          _showFailToast('请清除信息后再扫码！')
        }
        // 2.如果是allDisabled那就是全选然后不能勾选的情况
        if (this.mode === 'allAntDisable') {
          _showFailToast('请清除信息后再扫码！')
        }
      } else {
        // 否则加载接口数据然后全选
        this.scanLoading = true
        // 如果有前置事件，则执行
        if (await this.enterFrontEvent(val, this.form.postDate)) {
          this.scanLoading = true
          return
        } else {
          WMSAPI.get(this.listAPIName, { imBarcode: val, imOclas: this.type })
            .then((res) => {
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
                // 处理snrc确认数组 增加uuid为唯一识别符，目前只有【Z31转移到结算仓/样机仓-WMS】使用到了
                let snrc = []
                let _snrc = res.snrc || []
                _snrc.forEach((item) => {
                  item.uuid = uuidv4()
                  snrc.push(item)
                })
                this.$emit('update:snrc', snrc)
                this.$emit('update:barcode', val)

                // 赋值表格数据
                this.list = arr
                // 存储原始数据
                staticData = JSON.parse(JSON.stringify(arr))
                // 重新组合数据
                this.enterAfterEvent && this.enterAfterEvent(this.list, staticData)

                // 默认将数据全选
                if (this.mode === 'all') {
                  let arrs = this.list.map((item) => item.uuid)
                  this.$refs.table?.handleSelect(arrs)
                }
                // 2.如果是allDisabled那就是全选然后不能勾选的情况
                if (this.mode === 'allAntDisable') {
                  let arrs = this.list.map((item) => item.uuid)
                  this.$refs.table?.handleSelect(arrs)
                  this.isDisCheck = true
                  this.$emit('update:chkDisabled', true)
                }
              } else {
                _showFailToast(res.message)
              }
            })
            .catch(() => {
              // 在返回错误后清空页面
              // this.clearHandler()
            })
            .finally(() => {
              this.scanLoading = false
              this.form.imBarcode = ''
              // 查询结果之后重新聚焦
              barcodeInputRef?.focus()
            })
        }
      }
    },

    /**
     * @description: 当前操作模式为addTo时条码回车事件
     * @param {*} val 条码值
     */
    async barcodeEnterByAddTo(val) {
      if (!val) {
        _showFailToast('请输入条码')
        return
      }
      // 1.判断是否重复扫码
      if (this.list.length > 0) {
        let target = this.list.filter((item) => item[this.scanlKey] === val)
        if (target.length > 0) {
          _showFailToast('请勿重复扫码')
          return
        }
      }
      try {
        // 2.不重复则调用接口追加数据
        let res = await WMSAPI.get(this.listAPIName, { imBarcode: val, imOclas: this.type })
        if (res && res.success) {
          let _data = res.data
          this.form = Object.assign({}, this.form, _data.title)
          // 清空输入框
          this.form.imBarcode = ''
          // 增加uuid为唯一识别符
          _data.forEach((item) => {
            item.uuid = uuidv4()
            this.list.push(item)
          })
          // this.list = _data
          // 存储原始数据
          staticData = JSON.parse(JSON.stringify(this.list))
          let arrs = this.list.map((item) => item.uuid)
          // 默认勾选数据
          this.$refs.table?.handleSelect(arrs)
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
        this.form.imBarcode = ''
        // 查询结果之后重新聚焦
        barcodeInputRef?.focus()
      }
    },

    /** 表格内转出箱子号回车，带出转出区域 */
    boxIDEnter(val, index) {
      if (!val) return
      let _this = this
      let locationIDRef = this.getVueComponentByTableProp('locationID', index)
      // 调用接口带出区域，如果区域有值，光标跳转到条码，没有跳转到区域
      GetBoxInfoByBoxId(val)
        .then((res) => {
          if (res.success) {
            let obj = _this.list[index]
            obj.locationID = res.locationNo
            _this.$set(_this.list, index, obj)
          } else {
            _showFailToast(res.message)
            locationIDRef.focus()
          }
        })
        .catch(() => {
          locationIDRef.focus()
        })
    },
    /**
     * 表格内输入框回车
     * @param key 输入框的key值
     * @param index 表格数据行索引
     */
    inputTextHandler(key, index) {
      if (key === 'boxID') {
        this.boxIDEnter(this.list[index].boxID, index)
      }
    },

    // 过账
    async handleConfirm() {
      const key = getEditableKey(this.tableColumn)
      // 确认是否可以过账
      if (!this.isPass) {
        _showFailToast('序列号未扫描完。')
        return
      }
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
        // 表单验证
        await this.$refs.formComponent.$refs.refForm.validate()
        // 表格必填项验证
        let flag = validateTableSelected(this.tableColumn, this.selectedList)
        if (!flag.isPass) {
          _showFailToast(flag.message)
          return
        }
        await validateQtyForItem(this.selectedList, key)
        await validateOriginQtyLimit(staticData, this.selectedList, key, key)
        // 过账前确认
        // await this.$dialog.confirm({
        //   title: '提示',
        //   message: `本次过账共 ${this.selectedList.length} 条数据,累计数量是: ${computedTotal(this.selectedList, this.computedKey)},是否确认过账？`
        // })
        await customerDialog({
          count: this.selectedList.length,
          total: computedTotal(this.selectedList, this.computedKey),
          countPrefix: '本次过账共',
          countSuffix: '条数据,',
          totalPrefix: '累计拣货数量是',
          totalSuffix: '确定过账吗?'
        })
        // 开始过账
        this.loading = true
        // 处理接口参数
        let _form = Object.assign({}, this.form)
        // 混入时间参数
        let postDate = _form.postDate
        delete _form.postDate
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(this.selectedList))
        _list.forEach((item) => delete item.uuid)
        let { boxID, locationID } = this.form
        _list = _list.map((item) => ({ ...item, boxID: item.boxID ? item.boxID : boxID, locationID: item.locationID ? item.locationID : locationID }))
        let _data = {}
        if (this.isPostIn) {
          _data = fomrmatShipmentSubmitParams(
            this.type,
            this.account,
            this.name,
            this.form.warehouseNo,
            _list,
            'in',
            this.extraParams,
            '',
            _barcode,
            _materialDesc,
            this.form.postDate
          )
        } else {
          _data = fomrmatShipmentSubmitParams(
            this.type,
            this.account,
            this.name,
            this.form.warehouseNo,
            _list,
            'out',
            this.extraParams,
            '',
            _barcode,
            _materialDesc,
            this.form.postDate
          )
        }
        _data.zxstXmbeStruList = _data.zxstXmbeStruList.map((item) => ({
          ...item,
          cardmame: this.name,
          cardmo: this.account
        }))
        // 表单验证完后，若有自定义方法，则执行
        if (await this.submit(_data)) {
          this.loading = false
          return
        }
        let res = null
        // tips:如果外部需要走WCF接口，那么这里传入新的接口地址即可
        if (this.isWcfInterface) {
          res = await WMSAPI_WCF.post(this.passAPIName, {
            ImOclas: this.type,
            ImCardno: this.account,
            ImCardname: this.name,
            Data: _list,
            postDate
          })
        } else {
          res = await WMSAPI.post(this.passAPIName, _data)
        }
        // console.log(_data)
        if (res && res.success) {
          if (this.isAlterMessage) {
            await this.$dialog.alert({ message: res.message })
          } else {
            this.$toast.success(res.message || '过账成功')
          }
          // 清空表单和列表
          this.submitClear()
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        _showFailToast(e)
        console.log(e)
      } finally {
        this.loading = false
      }
    },

    // 校验规则
    validateErfmg() {
      let { key, index } = this.numBlurParams
      // 改变后的值
      let x = Number(this.list[index][key])
      // 原始值
      let y = staticData[index][key]
      if (!x || x < 0) return false
      if (x > y) return false
      else return true
    },

    // 判断数量，不能大于原数量， 不能小于等于0
    inputNumHandler(key, index) {
      console.log(key, index)
      this.numBlurParams = { key, index }
    },

    // 初始化配置项
    initConfig() {
      let _this = this
      _this.tableColumn.forEach((item) => {
        if (item.type === 'Table/NumberInput') {
          let _erfmgRules = [
            { required: true, message: '请输入数量', trigger: 'onBlur' },
            { validator: _this.validateErfmg, message: '数量不能小0或者大于原本数量', trigger: 'onBlur' }
          ]
          item.rules = _erfmgRules
        }
        if (item.label === '物料描述') _materialDesc = item.prop
        if (item.label === '条码') _barcode = item.prop
      })
      this.formList.forEach((item) => {
        if (item.prop === 'warehouseNo') {
          item.change = _this.wareHouseChange
        }
        if (item.prop === 'boxID') {
          item.enter = _this.boxNoEnter
          boxInputRef = _this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'locationID') {
          item.enter = _this.areaEnter
          areaInputRef = _this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'imBarcode') {
          // 追加模式
          if (_this.mode === 'addTo') {
            item.enter = _this.barcodeEnterByAddTo
          } else {
            item.enter = _this.barcodeEnter
          }

          barcodeInputRef = _this.getVueComponentByProp(item.prop)
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
      // 额外参数
      this.exParams = {}
      // table数据
      this.list = []
      // 选中项集合
      this.selectedList = []
      // 表单
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo,
        boxID: this.form.boxID,
        locationID: this.form.locationID
      }
      this.fousOfFirst()
    },
    // 行右键点击方法
    clickHandlerEvent(key, data, index) {
      this.$emit('clickHandler', key, data, index)
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
