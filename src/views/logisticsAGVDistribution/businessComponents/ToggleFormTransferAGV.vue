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
    <van-sticky v-show="generalCatalogue" :offset-top="46">
      <van-grid
        direction="horizontal"
        :column-num="4"
        :border="false"
        style="border-top: 1px solid #ccc; border-bottom: 1px solid #ccc"
      >
        <van-grid-item>总数：{{ list.length }}</van-grid-item>
        <van-grid-item>已确认：{{ selectedList.length }}</van-grid-item>
        <van-grid-item>剩余数：{{ list.length - selectedList.length }}</van-grid-item>
        <van-grid-item>
          <van-checkbox
            v-model="selectAll"
            :disabled="chkDisabled"
            shape="square"
            @click="handleSelectAll"
          >全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>

    <!-- 列表 -->
    <TableVue ref="table" :table-data.sync="list" :table-column="tableColumn" :selection.sync="selectedList">
      <!-- 针对箱子号一行个性化设计，使其可以调用接口校验并动态赋值修改区域 -->
      <template #wmsTools="inputProps">
        <!-- <van-field v-model="list[inputProps.index][inputProps.item.prop]" clearable clear-trigger="always" ref="inputs"  autofocus="true"  @focus="inputFocus" @keyup.enter="wmsToolsEnter(inputProps)" > -->
        <!-- <template #default> -->
        <van-field
          :ref="'getFocus' + inputProps.index"
          v-model="list[inputProps.index][inputProps.item.prop]"
          type="text"
          class="set-amount-input"
          clearable
          clear-trigger="always"
          @keyup.enter="wmsToolsEnter(inputProps)"
        />
        <!-- <span>{{ inputProps.index }}</span> -->
        <!-- </template> -->
        <!-- </van-field> -->
      </template>
      <template #locationId="inputProps">
        <van-field
          :ref="'getFocusTwo' + inputProps.index"
          v-model="list[inputProps.index][inputProps.item.prop]"
          clearable
          clear-trigger="always"
          @keyup.enter="locationIdEnter(inputProps)"
        />
      </template>
    </TableVue>
    <!-- 底部按钮 -->
    <ActionBarVue
      ref="actionBarVue"
      :loading.sync="loading"
      :confirm-text="confirmText"
      @clear="handleClear"
      @confirm="handleConfirm"
    />
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
import Dates from '@/utils/datetime'
import { mapGetters } from 'vuex'
import { v4 as uuidv4 } from 'uuid'
import { WMSAPI } from '@/api/generalAPI'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { getEditableKey, computedTotal } from '@/utils/validateOperateForQty'
import { GetBoxInfoByBoxId } from '@/api/common'
import { AGVAPI } from '@/api/generalAGV'

const today = new Dates(new Date()).strftime('YYYY-MM-DD')
// 用于存储列表原始数据
let staticData = []
// 物料编号 物料描述 字段不统一的情况
let _materialNo = ''
let _materialDesc = ''
let boxInputRef = null
let areaInputRef = null
let barcodeInputRef = null
let targetBoxIDInputRef = null
let drawerInputRef = null

export default {
  name: 'ToggleFormTransferAGV',
  components: { FormVue, TableVue, ActionBarVue },
  props: {
    formList: { type: Array, default: () => [] }, // 表单项数组
    showFormList: { type: Array, default: () => [] }, // 需要展开显示的数据字段参数
    viewData: { type: Object, default: () => ({}) }, // 列表信息总览数据
    tableColumn: { type: Array, default: () => [] }, // 列表字段参数
    chkDisabled: { type: Boolean, default: () => false },
    submit: {
      type: Function,
      default: undefined
    }, // 过账按钮前执行事件
    passAPIName: { type: String, default: () => '' }, // 过账接口地址
    listAPIName: { type: String, default: () => '' }, // 扫码查询接口地址
    type: { type: String, default: () => '' }, // 页面业务类型
    location: { type: String, default: () => '' }, // 页面区域地点
    codeType: { type: String, default: () => '' }, // 单号字段名
    generalCatalogue: { type: Boolean, default: true }, // 是否展示列表信息总览
    confirmTips: { type: String, default: () => '' }, // 确认提示文字
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
    // 当前模式，all：加载接口后全选；one：扫码匹配或手动勾选，需传值scanlKey匹配字段；handler：只能手动勾选；addTo：追加数据
    mode: { type: String, default: 'one' }
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
      wareHouseList: [], // 用于存储仓库列表
      loading: false, // 过账按钮loading
      scanLoading: false, // 扫条码时进行loading
      numBlurParams: {
        key: 'erfmg',
        index: 0
      } // 用于存储当前正在编辑的行的索引
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
    handler: function (val) {
      const { selectedList, list } = val
      this.selectAll = selectedList.length === list.length && selectedList.length !== 0
    }
  },
  mounted() {
    this.initConfig()
  },
  methods: {
    /** 全选和反选 */
    handleSelectAll() {
      this.$nextTick(() => {
        this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
      })
    },
    // TODO: 目前没有权限，先写死用户工号
    /** 根据用户工号获取仓库列表 */
    async getUserWarehouse() {
      try {
        let res = await WMSAPI.get('business/userwarehouse/GetUserWarehouse', { userID: '03351' })
        if (res.success) {
          this.wareHouseList = res.datas
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      }
    },

    /** 仓库change */
    wareHouseChange(val) {
      if (!val) return
      targetBoxIDInputRef?.focus()
    },

    /** 箱子号回车 */
    boxNoEnter(val, target) {
      if (!val) return
      // 调用接口带出区域，如果区域有值，光标跳转到条码，没有跳转到区域
      GetBoxInfoByBoxId(val)
        .then((res) => {
          // 如果当前是转出箱子，则跳转到条码
          if (target === 'boxID') this.boxIDEnter(res)
          // 如果当前时转入箱子（目标载具），则看区域值来定
          else this.targetBoxIDEnter(res)
        })
        .catch(() => {
          if (target === 'boxID') boxInputRef?.focus()
          else targetBoxIDInputRef?.focus()
        })
    },
    // 箱子号跳转判断
    boxIDEnter(res) {
      if (res.success) {
        barcodeInputRef?.focus()
      } else {
        _showFailToast(res.message)
        boxInputRef?.focus()
      }
    },

    // 目标箱子号回车
    targetBoxIDEnter(res) {
      if (res.success) {
        this.$set(this.form, 'locationID', res.locationNo)
        // this.form.locationID = res.locationNo
        // boxInputRef?.focus()
        barcodeInputRef.focus()
      } else {
        _showFailToast(res.message)
        areaInputRef?.focus()
      }
    },
    // 储物格回车
    drawerEnter(val) {
      if (!val) return
      // 调用接口带出区域，如果储物格有值，光标跳转到条码，没有跳转到储物格
      this.$set(this.form, 'agvNo', val.split('-')[0])
      // this.form.agvNo = val.split('-')[0]
      AGVAPI.post('agv/webapi/AGVOpenDrawer', {
        agvNo: this.form.agvNo,
        drawer: val
      })
        .then((res) => {
          if (res.success) {
            barcodeInputRef?.focus()
          } else {
            _showFailToast(res.message)
            drawerInputRef?.focus()
          }
        })
        .catch(() => {
          drawerInputRef?.focus()
        })
    },
    /** 区域回车 */
    areaEnter(val) {
      if (!val) return
      WMSAPI.get('business/webapi/GetLocationInfoByLocationNo', { locationNo: val })
        .then((res) => {
          if (res.success) {
            boxInputRef?.focus()
          } else {
            _showFailToast(res.message)
            areaInputRef?.focus()
          }
        })
        .catch(() => {
          areaInputRef?.focus()
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
          let target = this.list.filter((item) => item[this.scanlKey] === val)
          if (target.length > 0) {
            // 每次都是追加，不是覆盖，因为存在连续扫码的情况
            let arrs = [...this.selectedList.map((item) => item.uuid), ...target.map((item) => item.uuid)]
            // 进行勾选
            this.$refs.table?.handleSelect(arrs)
            this.$nextTick(() => {
              // 清空输入框
              this.form.imBarcode = ''
              // 光标重新聚焦
              // barcodeInputRef?.focus()
              this.$nextTick(() => {
                this.$refs['getFocus' + 0].focus()
              })
            })
          } else {
            _showFailToast('没有找到结果，请检查重试或清除结果后重新扫码')
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
        return
      }

      try {
        // 否则加载接口数据然后全选
        this.scanLoading = true
        // 如果有前置事件，则执行
        let enterFront = await this.enterFrontEvent(val, this.form.postDate)
        if (enterFront) {
          this.scanLoading = true
          return
        }
        let res = await AGVAPI.get(this.listAPIName, { imBarcode: val, imOclas: this.type })
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
            item.location = this.location
            arr.push(item)
          })
          // 赋值表格数据
          this.list = arr
          // 存储原始数据
          staticData = JSON.parse(JSON.stringify(arr))
          // 重新组合数据
          this.enterAfterEvent && this.enterAfterEvent(this.list, staticData)
          // 默认将数据全选
          if (this.mode === 'all') {
            this.$nextTick(() => {
              // 默认勾选数据
              // let selectArr = this.tableData.map((item) => item.uuid)
              // this.$refs.table?.handleSelect(selectArr)
              this.selectAll = true
              this.handleSelectAll()
            })
          }
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
        this.form.imBarcode = ''
        // 查询结果之后重新聚焦
        // barcodeInputRef?.focus()

        this.$nextTick(() => {
          this.$refs['getFocus' + 0].focus()
        })
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
      // 2.不重复则调用接口追加数据
      try {
        // 否则加载接口数据然后全选
        this.scanLoading = true
        // 如果有前置事件，则执行
        let enterFront = await this.enterFrontEvent(val, this.form.postDate)
        if (enterFront) {
          this.scanLoading = true
          return
        }
        let params = {}
        if (this.type) {
          params.imOclas = this.type
        }
        if (this.codeType) {
          params[this.codeType] = val
        } else {
          params.imBarcode = val
        }
        let res = await AGVAPI.get(this.listAPIName, params)
        if (res && res.success) {
          if (!res.data) {
            res.drawer = this.form.drawer
            res.agvNo = this.form.agvNo
            res.imBarcode = this.form.imBarcode
            res.operatorName = this.name
            res.operatorNo = this.account
            res.operator = this.account + ' - ' + this.name
            res.data = [JSON.parse(JSON.stringify(res))]
          }
          let _data = res.data
          if (_data.length === 0) {
            _showFailToast('暂无数据')
            return
          }
          if (_data.length > 0) {
            this.form = Object.assign({}, this.form, _data[0])
          }

          // 增加uuid为唯一识别符
          _data.forEach((item) => {
            item.uuid = uuidv4()
            this.list.push(item)
          })
          this.selectedList = JSON.parse(JSON.stringify(this.list))
          // 存储原始数据
          staticData = JSON.parse(JSON.stringify(this.list))
          // 重新组合数据
          this.enterAfterEvent && this.enterAfterEvent(this.list, staticData)
          let arrs = this.list.map((item) => item.uuid)
          // 默认将数据全选
          if (this.mode === 'all') {
            this.table?.handleSelect(arrs)
          }
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        // console.log(e)
      } finally {
        this.scanLoading = false
        this.form.imBarcode = ''
        // 查询结果之后重新聚焦
        // barcodeInputRef?.focus()
        this.$nextTick(() => {
          this.$refs['getFocus' + 0].focus()
        })
      }
    },

    // 过账
    async handleConfirm() {
      try {
        // 表单验证
        await this.$refs.formComponent?.$refs?.refForm.validate()
        // 表格必填项验证
        await this.$refs.table?.$refs?.refForm.validate()
        // 确认是否可以过账
        if (!this.isPass) {
          _showFailToast('序列号未扫描完。')
          return
        }
        if (this.selectedList.length === 0) {
          _showFailToast('请勾选数据')
          return
        }
        let key = getEditableKey()
        if (!this.confirmTips && key && !this.selectedList.every((item) => Number(item[key]) > 0)) {
          _showFailToast('所提交项中存在数量小于或等于0的项目，请检查')
          return
        }
        // 过账前确认
        await this.$dialog.confirm({
          title: '提示',
          message:
            this.confirmTips || `本次过账共 ${this.selectedList.length}  条数据,累计数量是:  ${computedTotal(this.selectedList, key)},是否确认过账？`
        })
        // 开始过账
        this.loading = true
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(this.selectedList))
        _list.forEach((item) => delete item.uuid)

        let _data = this.getOutStockParams(_list)
        if (this.mode === 'addTo') {
          _data = _list
        }
        // 表单验证完后，若有自定义方法，则执行
        if (this.submit) {
          this.submit(_data, this.loading)
        } else {
          let res = await AGVAPI.post(this.passAPIName, _data)

          if (res && res.success) {
            _showSuccessToast(res.message || '过账成功')
            // 清空表单和列表
            this.handleClear()
          } else {
            _showFailToast(res.message)
          }
          this.loading = false
        }
      } catch (e) {
        console.log(e)
        this.loading = false
      }
    },

    // 获取过账（退货、出货）的参数
    getOutStockParams(_list) {
      let { reqno, locationID, targetBoxID } = this.form
      let pickingDetails = []
      _list.forEach((item) => {
        let obj = {
          boxNo: item.wmsTools,
          materialID: Number(item[_materialNo]) + '',
          materialDesc: item[_materialDesc],
          oclas: this.type, // 与查询明细的imOclas参数保持一致
          warehouseNo: item.lgort,
          quantity: item.erfmg
        }
        pickingDetails.push(obj)
      })
      // 删除明细中需要扫码/输入的箱子号和区域
      _list.forEach((item) => {
        delete item.boxID
        delete item.areaID
      })
      let _data = {
        pickingNo: reqno,
        preparationBox: targetBoxID,
        preparationLocation: locationID,
        operator: this.name,
        operatorName: this.name,
        operatorNo: this.account,
        pickingDetails
      }
      return _data
    },

    // 校验规则
    validateErfmg() {
      let { key, index } = this.numBlurParams
      // 改变后的值
      let x = Number(this.list[index][key])
      // 原始值
      let y = staticData[index][key]
      if (!x || x < 0) return '数量不能小于等于0'
      if (x > y) return '数量不能大于' + y
      else return true
    },

    // 初始化配置项
    async initConfig() {
      await this.getUserWarehouse()
      this.tableColumn.forEach((item, index) => {
        if (item.type === 'Table/NumberInput') {
          let _erfmgRules = [{ required: true, message: '请输入数量', trigger: 'onBlur' }, { validator: this.validateErfmg }]

          item.rules = _erfmgRules
        }
        if (item.label === '物料编号') _materialNo = item.prop
        if (item.label === '物料描述') _materialDesc = item.prop
      })
      this._formList.forEach((item) => {
        if (item.prop === 'warehouseNo') {
          item.change = this.wareHouseChange
          item.options = this.wareHouseList
        }
        if (item.prop === 'boxID') {
          item.enter = (val) => this.boxNoEnter(val, 'boxID')
          boxInputRef = this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'locationID') {
          item.enter = this.areaEnter
          areaInputRef = this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'imBarcode') {
          if (this.mode === 'addTo') {
            item.enter = this.barcodeEnterByAddTo
          } else {
            item.enter = this.barcodeEnter
          }
          barcodeInputRef = this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'targetBoxID') {
          item.enter = (val) => this.boxNoEnter(val, 'targetBoxID')
          targetBoxIDInputRef = this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'drawer') {
          item.enter = (val) => this.drawerEnter(val)
          drawerInputRef = this.getVueComponentByProp(item.prop)
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
    // 输入箱子号的事件，自动填写区域
    async wmsToolsEnter(props) {
      const { row } = props
      let res = await GetBoxInfoByBoxId(row.wmsTools)
      if (res.success) {
        // TODO 这里获取箱子数据
        this.$set(row, 'locationId', res.locationNo)
        const next = props.index + 1
        this.$nextTick(() => {
          this.$refs['getFocus' + next].focus()
        })
        // row.locationId = res.locationNo
      } else {
        _showFailToast(res.message)
        const pre = props.index
        this.$nextTick(() => {
          this.$refs['getFocusTwo' + pre].focus()
        })
      }
    },
    // 输入区域回车事件
    async locationIdEnter(props) {
      const next = props.index + 1
      this.$nextTick(() => {
          this.$refs['getFocus' + next].focus()
        })
    },
    // 清空
    handleClear() {
      // table数据
      this.list = []
      // 选中项集合
      this.selectedList = []
      // 表单
      this.form = {
        postDate: today
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
