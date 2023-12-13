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
        <van-grid-item>已确认：{{ selection.length }}</van-grid-item>
        <van-grid-item>剩余数：{{ list.length - selection.length }}</van-grid-item>
        <van-grid-item>
          <van-checkbox v-model="selectAll" shape="square" disabled>全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>
    <!-- 列表 -->
    <TableVue ref="table" :table-data.sync="list" :table-column="tableColumn" :selection.sync="selection" :is-virtually="true">
      <template #newQuantity="inputProps">
        <div style="width: 100%" @click="openInputModel(inputProps)">
          <span v-if="dynamicGetValue(inputProps.row.uuid, inputProps.item.prop)" style="color: red">
            {{ dynamicGetValue(inputProps.row.uuid, inputProps.item.prop) }}
          </span>
          <span v-else style="color: #ccc">点击输入数量</span>
        </div>
        <!-- <van-field
          v-model="tableData[inputProps.index][inputProps.item.prop]"
          clearable
          clear-trigger="always"
          @keyup.enter="wmsToolsEnter(inputProps)"
        /> -->
      </template>
    </TableVue>

    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" confirm-text="过账" @clear="handleClear" @confirm="handleConfirm" />
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
    <van-overlay :show="isShowInput">
      <div class="input_wrapper" @click.stop>
        <div class="content">
          <van-form :submit-on-enter="false">
            <van-field v-model="tempValue.materialNo" label="物料号" disabled />
            <van-field v-model="tempValue.quantity" label="现有库存" disabled />
            <van-field ref="newQuantity" v-model="tempValue.newQuantity" label="调整数据" />
            <div style="margin: 16px; display: flex; flex-direction: row">
              <van-button block type="default" size="small" @click="cancel">取消</van-button>
              <van-button style="margin-left: 5px" block type="info" size="small" @click="comfirmAdjustQty">确认调整内容</van-button>
            </div>
          </van-form>
        </div>
      </div>
    </van-overlay>
  </div>
</template>

<script>
// 库存差异调账
import FormVue from '@/components/Form/index.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { WMSAPI } from '@/api/generalAPI'
import { _showFailToast } from '@/utils/message'
import { formList, showFormList, tableColumn } from './config'
import { GetLocationInfo, GetUserWarehouse } from '@/api/common'
import { mapGetters } from 'vuex'
import { customerDialog } from '@/components/CustomerDialog'
// const imOclas = 'XWMS261D'
const passAPIName = 'business/webapi/AdjustInventory'
const listAPIName = 'business/webapi/GetDetailByBoxID'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')

let boxInputRef = null
let areaInputRef = null

export default {
  name: 'InventoryDifferenceAdjustment',
  components: {
    FormVue,
    TableVue,
    // VirtualTable,
    ActionBarVue
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      user: {}, // 用户信息
      form: {
        postDate: today
      }, // 表单对象，初始化过账日期
      show: false, // 点击左侧箭头是否展开
      selectAll: false, // 是否全选
      list: [], // 列表数据
      selection: [], // 选中的数据
      wareHouseList: [], // 仓库列表
      loading: false, // 过账按钮loading
      scanLoading: false,
      isShowInput: false,
      tempValue: {
        materialNo: '',
        quantity: 0,
        newQuantity: 0
      },
      curEditUUID: 0 // 当前编辑的项的uuid
    }
  },
  computed: {
    ...mapGetters(['account', 'name']),
    multiList() {
      let { selection, list } = this
      return { selection, list }
    }
  },
  watch: {
    // 监听选择长度和表长度判断勾选情况
    multiList: function (val) {
      const { selection, list } = val
      if (selection.length > 0 && selection.length === list.length) {
        this.selectAll = true
      } else {
        this.selectAll = false
      }
      // tips：监听选择长度，如果输入数量，但是又不勾选那条内容话，需要清空曾经输入的数量
      // 筛选出那些没有勾选的内容，一键清空曾今输入的值
      list.forEach((item) => {
        if (!selection.includes(item.uuid)) {
          item.newQuantity = ''
        }
      })
      // this.selectAll = selection.length !== 0 && selection.length === list.length
    }
  },
  created() {
    this.getWareHouseListAndUpdate()
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
    /** 全选和反选 */
    handleSelectAll() {
      if (this.selection.length === this.list.length) {
        this.selection = []
      } else {
        this.selection = this.list.map((item) => item.uuid)
      }
    },

    // 箱子号回车，带出明细
    async boxIDEnter(val) {
      if (!val) return
      this.scanLoading = true
      try {
        let res = await WMSAPI.get(listAPIName, { boxId: val })
        if (res.success) {
          let _data = res.detail.map((item) => ({ ...item, uuid: uuidv4(), newQuantity: '' }))
          this.list = _data
          // 同时赋值区域
          this.$set(this.form, 'locationId', res.areaNo)
          areaInputRef?.focus()
        } else {
          _showFailToast(res.message)
          boxInputRef?.focus()
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },

    // 确定过账
    async handleConfirm() {
      this.loading = true
      let _selection = this.list.filter((item) => this.selection.includes(item.uuid))
      try {
        // 表单验证
        await this.$refs.formComponent.$refs.refForm.validate()
        // 是否有勾选数据
        if (this.selection.length === 0) {
          _showFailToast('请勾选数据')
          return
        }
        await this.computedListValidate(_selection)
        let result = _selection.map((item) => ({
          boxNo: item.boxNo,
          areaNo: item.areaNo,
          locationNo: item.locationNo,
          warehouseNo: item.warehouseNo,
          materialNo: item.materialNo,
          materialDesc: item.materialDesc,
          nowQty: item.quantity,
          changeQty: item.newQuantity,
          submitID: this.account,
          submitName: this.name
        }))
        await customerDialog({
          isCustomer: true,
          customerHtml: `
            <div style="height:100px;width:100%;overflow-y:auto">
              ${this.formatterDataToHtml(result)}
              <span>库存数量会有以上调整，确定提交吗？</span>
            </div>
            `
        })
        // 调用接口
        let res = await WMSAPI.post(passAPIName, { data: result })
        if (res && !res.IsError) {
          this.$toast.success(res.ErrMsg || '过账成功')
          // 清空表单和列表
          this.handleClear()
        } else {
          _showFailToast(res.ErrMsg)
        }
      } catch (e) {
        console.log(e)
        //
      } finally {
        this.loading = false
      }
    },
    /**
     * 格式化显示html内容
     * @param {*} arr
     */
    formatterDataToHtml(arr) {
      console.log(arr)
      let _result = arr.map(
        (item) =>
          `<div style="line-height:30px;">${item.materialNo} 调整数为<span style="color:red;">${
            item.changeQty
          }</span> ,</span> 调整后总数是<span style="color:red;">${this.conputedQty(item.nowQty, item.changeQty)}</span></div>\n`
      )
      return _result.join('')
    },

    /**
     * 计算总数
     * @param {*} val1 数量1
     * @param {*} val2 数量2
     */
    conputedQty(val1, val2) {
      if (Number(val2) < 0) {
        return Number(val1) - Math.abs(Number(val2))
      } else {
        return Number(val1) + Number(val2)
      }
    },

    /**
     * 动态获取值,因为虚拟表格的下标一直在重置，所以必须采用唯一值来动态取值
     * @param {*} id
     * @param {*} prop
     */
    dynamicGetValue(id, prop) {
      let target = this.list.find((item) => item.uuid === id)
      if (target) {
        return target[prop]
      }
    },

    // 数量校验函数
    validateNewQuantity(quantity, newQuantity) {
      return new Promise((resolve, reject) => {
        // 首先必须是一个整数
        if (Number(newQuantity) !== 0) {
          // 然后调整的数量不能超过原本的数量，意思是负数只能是负库存数
          if (Number(newQuantity) < 0) {
            if (Math.abs(Number(newQuantity)) <= Number(quantity)) {
              resolve(true)
            } else {
              _showFailToast('扣减库存不能超过原本库存')
              reject('扣减库存不能超过原本库存')
            }
          } else {
            // 正数随便填，不卡控
            resolve(true)
          }
        } else {
          _showFailToast('所填数量不能是0')
          reject('所填数量不能是0')
        }
      })
    },

    /**
     * 校验勾选的数据是否都符合规则
     * @param {*} selection 勾选的数组
     */
    async computedListValidate(selection) {
      return new Promise((resolve, reject) => {
        for (let index = 0; index < selection.length; index++) {
          const element = selection[index]
          let { quantity, newQuantity } = element
          if (!newQuantity) {
            reject(`勾选项的第${index + 1}项的存在不合法输入，请检查`)
            _showFailToast(`勾选项的第${index + 1}项的存在不合法输入，请检查`)
            break
          }
          // if (Number.isInteger(Number(newQuantity))) {
          // 然后调整的数量不能超过原本的数量，意思是负数只能是负库存数
          if (Number(newQuantity) < 0) {
            if (Math.abs(Number(newQuantity)) > Number(quantity)) {
              reject(`勾选项的第${index + 1}项的调减数量大于当前的库存数，请检查`)
              _showFailToast(`勾选项的第${index + 1}项的调减数量大于当前的库存数，请检查`)
              break
            } else {
              continue
            }
          } else {
            continue
          }
          // } else {
          //   reject(`勾选项的第${index + 1}项中所填入的调整数必须是一个整数`)
          //   _showFailToast(`勾选项的第${index + 1}项中所填入的调整数必须是一个整数`)
          //   break
          // }
        }
        resolve(true)
      })
    },

    // 得到仓库数据，更新仓库列表
    async getWareHouseListAndUpdate() {
      let res = await GetUserWarehouse()
      if (res.success) {
        // this.wareHouseList = res.datas
        this.formList[0].options = res.datas
        // tips:默认选中第一个
        if (res.datas.length > 0) {
          this.$set(this.form, 'warehouseNo', res.datas[0].warehouseNo)
        }
      }
    },

    /** 仓库change */
    wareHouseChange(val) {
      if (!val) return
      boxInputRef?.focus()
    },

    /** 区域回车，带出接收仓库 */
    locationIdEnter(val) {
      if (!val) return
      GetLocationInfo(val).then((res) => {
        if (!res.success) {
          _showFailToast(res.message)
        }
      })
    },

    // 初始化配置项
    initConfig() {
      let _this = this
      this.formList.forEach((item) => {
        if (item.prop === 'warehouseNo') {
          item.change = _this.wareHouseChange
          // item.options = this.wareHouseList
        }
        if (item.prop === 'wmsTools') {
          item.enter = (val) => this.boxIDEnter(val)
          boxInputRef = _this.getVueComponentByProp('wmsTools')
        }
        if (item.prop === 'locationId') {
          item.enter = _this.locationIdEnter
          areaInputRef = _this.getVueComponentByProp('locationId')
        }
      })
      // 对输入项目混入校验功能
      this.tableColumn.forEach((item) => {
        if (item.type === 'Table/NumberInput') {
          let _newQuantityRules = [
            { required: true, message: '请输入数量', trigger: 'onBlur' },
            { validator: this.validateNewQuantity, message: '数量不能为0' }
          ]
          item.rules = _newQuantityRules
        }
      })
    },

    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },

    // 点击行项的调整数量，打开一个弹窗来输入，防止因为键盘遮挡导致看不见信息
    openInputModel(val) {
      const { row } = val
      this.curEditUUID = row.uuid
      // 针对弹窗里面的内容进行赋值
      this.tempValue = {
        materialNo: row.materialNo,
        quantity: row.quantity,
        newQuantity: row.newQuantity
      }
      this.isShowInput = true
      this.$nextTick(() => {
        this.$refs.newQuantity.$refs.input.focus()
      })
    },
    // 确认调整数量
    async comfirmAdjustQty() {
      await this.validateNewQuantity(this.tempValue.quantity, this.tempValue.newQuantity)
      // 关闭弹窗
      this.isShowInput = false
      // 赋值表格
      this.list.forEach((item) => {
        if (item.uuid === this.curEditUUID) {
          item.newQuantity = this.tempValue.newQuantity
        }
      })
      // 清空内容
      this.tempValue = {
        materialNo: '',
        quantity: 0,
        newQuantity: 0
      }
      // 勾选表格
      this.selection = [...new Set([...this.selection, this.curEditUUID])]
      // 重置uuid
      this.curEditUUID = ''
    },
    // 取消调整数据
    cancel() {
      this.isShowInput = false
      this.tempValue = {
        materialNo: '',
        quantity: 0,
        newQuantity: 0
      }
      this.curEditUUID = ''
    },
    // 清除按钮
    handleClear() {
      this.list = []
      this.selectAll = false
      this.selection = []
      this.form = {
        warehouseNo: this.form.warehouseNo,
        wmsTools: '',
        locationId: ''
      }
      this.show = false
      this.fousOfFirst()
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
.input_wrapper {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  height: 100%;
  .content {
    margin-top: 10px;
    width: 80%;
    height: 182px;
    background-color: #fff;
  }
}
</style>
