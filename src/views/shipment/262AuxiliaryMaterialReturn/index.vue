<template>
  <div>
    <!-- 表单布局 -->
    <van-cell-group>
      <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
        <template v-if="showFormList.length > 0" #title>
          <van-icon :name="show ? 'arrow-down' : 'arrow'" @click="show = !show" />
        </template>
        <FormVue ref="formComponent" :form-data.sync="form" :form-list="formList" @onDropdown="dropdowHandler" />
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
          <van-checkbox v-model="selectAll" shape="square" @click="handleSelectAll">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>
    <!-- 列表 -->
    <TableVue
      ref="table"
      :table-data.sync="tableData"
      :table-column="formateTableColumn"
      :selection.sync="selection"
      :is-virtually="true"
      @inputNumHandler="inputNumHandler"
    />

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
import FormVue from '@/components/Form/index.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { WMSAPI, MISWMSAPI } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { deepClone } from '@/utils'
import { GetBoxInfoByBoxId, GetUserWarehouse } from '@/api/common'
import { _showFailToast } from '@/utils/message'
// 查询表体数据的接口
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
const imOclas = 'XWMS262P'
const passAPIName = 'business/webapi/OutStock'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
const cachedName = 'shipment.262AuxiliaryMaterialReturn'
import { customerDialog } from '@/components/CustomerDialog'
// 262辅料退料
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
      formList,
      showFormList,
      tableColumn,
      // -----
      tableData: [],
      numBlurParams: {
        key: 'erfmg',
        index: 0
      },
      show: false,
      scanLoading: false,
      form: {
        postDate: today
      },
      loading: false,
      selectAll: false,
      selection: [], // 箱子号带出的明细的勾选项
      originTableData: [], // 保留一份原始对象,用于校验数量的变更
      // -----

      userAuthVisible: true,
      extraParams: {}
    }
  },
  computed: {
    // 特殊处理一下数据适配数量编辑的校验
    formateTableColumn() {
      return this.tableColumn.map((item) => {
        if (item.prop === 'erfmg' || item.type === 'Table/Number') {
          return {
            ...item,
            rules: [
              { required: true, message: '请输入数量', trigger: 'onBlur' },
              { validator: this.validateFunc, message: '数量不能大于原数量且不能小于等于0' } // 库存数量
            ]
          }
        } else {
          return item
        }
      })
    },
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
      }
    }
  },
  created() {
    this.getWareHouseListAndUpdate()
  },
  mounted() {
    this.initConfig()
    this.getWareHouseListAndUpdate()
    this.getFactoryArea()
  },
  methods: {
    // tips：让第一个可以输入的输入源获取光标
    fousOfFirst() {
      let result = this.formList.filter((item) => item.type === 'Input')
      if (result.length > 0) {
        // let prop = result[0].prop
        // tips:这个是特殊的，这里直接定位到箱子号即可
        this.$refs.formComponent.$refs['wmsTools'][0].$refs.inputRef.focus()
      }
    },
    authComfir() {
      this.fousOfFirst()
    },
    initConfig() {
      let _this = this
      _this.formList[5].enter = _this.barcodeEnter
      _this.formList[4].enter = _this.boxEnter
    },
    // 具体校验函数
    validateFunc() {
      let { key, index } = this.numBlurParams
      // 改变后的值
      let x = Number(this.tableData[index][key])
      // 原始值
      let y = this.originTableData[index][key]
      // if (!x || x < 0) return '数量不能小于等于0'
      // if (x > y) return '数量不能大于' + y
      if (!x || x < 0 || x > y) return false
      else return true
    },

    /**
     * @description: 条码确认事件,加载列表数据
     * @param {*} val
     */
    async barcodeEnter(val) {
      if (!this.form.imBarcode) {
        _showFailToast('请扫条码')
        return
      }
      try {
        this.scanLoading = true
        let res = await WMSAPI.get(listAPIName, { imOclas: imOclas, imBarcode: val })
        // let res = await MISWMSAPI.get('zxtaAufo/get262PByBarcode', {
        //   aufnr: '',
        //   cardName: this.extraParams?.cardname,
        //   cardNo: this.extraParams?.cardno,
        //   lgort: this.form.wmsTools,
        //   objnr: val,
        //   proj: '',
        //   workp: ''
        // })
        if (res.success) {
          let _data = res.data
          // 混入唯一值，用于勾选数据
          this.tableData = _data.map((item) => ({ ...item, uuid: uuidv4(), operator: this.extraParams.cardname }))
          // 深拷贝保留一份副本
          this.originTableData = deepClone(this.tableData)
          // nextTick(() => {
          //   // 默认勾选数据
          //   let selectArr = this.tableData.map((item) => item.uuid)
          //   table.value?.handleSelect(selectArr)
          // })
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },
    // 箱子输入确认事件
    async boxEnter(val) {
      let res = await GetBoxInfoByBoxId(val)
      if (res.success) {
        // TODO 这里获取箱子数据
        this.$set(this.form, 'locationId', res.locationNo)
        this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
      } else {
        this.$set(this.form, 'wmsTools', '')
        let inputRef = this.getVueComponentByProp('wmsTools')
        inputRef.focus()
        _showFailToast(res.message)
      }
    },

    // 获取可编辑项的prop
    // 取出tableColumn中类型是Table/Number的项目的prop，因为这个才是可以编辑的项
    getEditableKey() {
      let tarItem = tableColumn.find((item) => item.type === 'Table/Number')
      let key = tarItem ? tarItem.prop : 'erfmg'
      return key
    },

    // dropdown选择回调
    async dropdowHandler(val, prop) {
      if (prop === 'areaId') {
        let res = await MISWMSAPI.post('/divertBusiness/findWerksByFactory', {
          factory: val
        })
        if (res.success) {
          if (res.data.length > 0) {
            this.$set(this.form, 'werks', res.data[0].werks)
            this.$set(this.form, 'lgort', res.data[0].lgort)
          }
        }
      }
    },
    // 确定过账
    async handleConfirm() {
      let key = this.getEditableKey()
      if (!this.form.imBarcode) {
        _showFailToast('请输入条码号')
        return
      }
      if (this.selection.length <= 0) {
        _showFailToast('请勾选要过账的数据')
        return
      }
      try {
        this.loading = true
        await this.$refs.formComponent.$refs.refForm.validate()
        // 根据selection去映射一份被选中的数据
        const _selection = this.tableData.filter((item) => this.selection.includes(item.uuid))
        if (_selection.every((item) => Number(item[key]) <= 0)) {
          _showFailToast('所提交项中存在数量小于或等于0的项目，请检查')
          return
        }
        // await this.$dialog.confirm({
        //   title: '提示',
        //   message: `本次过账共 ${this.selection.length} 条数据,累计数量是: ${this.computedTotal(_selection)},是否确认过账？`
        // })
        await customerDialog({
          count: this.selection.length,
          total: this.computedTotal(_selection),
          countPrefix: '本次过账共',
          countSuffix: '条数据,',
          totalPrefix: '累计数量是',
          totalSuffix: '确定过账吗?'
        })

        // 处理接口参数
        let _form = Object.assign({}, this.form)
        let postDate = _form.postDate
        delete _form.postDate
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(this.selection))
        _list.forEach((item) => delete item.uuid)
        let _data = {
          postDate,
          title: _form,
          data: _list
        }
        // 混入其他参数
        _data.boxId = this.form.wmsTools
        _data.whid = this.form.warehouseNo
        let res = await MISWMSAPI.post(passAPIName, _data)
        if (res && res.success) {
          this.$toast.success(res.msg)
          // 清空表单和列表
          this.submitClear()
        } else {
          _showFailToast(res.data)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.loading = false
      }
    },
    /** 根据prop的值获取该输入框 */
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    // 清除按钮
    handleClear() {
      this.tableData = []
      this.selectAll = false
      this.selection = []
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo
      }
      this.show = false
      let inputRef = this.getVueComponentByProp('imBarcode')
      inputRef.focus()
    },
    submitClear() {
      this.tableData = []
      this.selectAll = false
      this.selection = []
      this.form = {
        postDate: today,
        warehouseNo: this.form.warehouseNo,
        areaId: this.form.areaId,
        werks: this.form.werks,
        lgort: this.form.lgort
      }
      this.show = false
      let inputRef = this.getVueComponentByProp('imBarcode')
      inputRef.focus()
    },
    // 全选
    handleSelectAll() {
      this.selection = this.tableData.map((item) => item.uuid)
      // this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
    },
    // 计算勾选的累计数量
    computedTotal(arr) {
      let key = this.getEditableKey()
      return arr.reduce((pre, next) => {
        // eslint-disable-next-line no-prototype-builtins
        if (pre.hasOwnProperty(key)) {
          return Number(pre[key]) + Number(next[key])
        } else {
          return Number(pre) + Number(next[key])
        }
      }, 0)
    },

    // 数量输入框的回调事件
    inputNumHandler(key, index) {
      console.log(key, index)
    },
    // 得到仓库数据，更新仓库列表
    // TODO 这部分先写死一个工号获取仓库数据
    async getWareHouseListAndUpdate() {
      let _this = this
      let res = await GetUserWarehouse()
      if (res.success) {
        _this.formList[0].options = res.datas
        // tips:默认选中第一个
        if (res.datas.length > 0) {
          this.$set(this.form, 'warehouseNo', res.datas[0].warehouseNo)
        }
      }
    },
    // 获取厂数据
    async getFactoryArea() {
      let res = await MISWMSAPI.post('/divertBusiness/listFactory', {})
      if (res.success) {
        // tips: 返回内容是这样的13:26{"code":"0000","msg":"操作成功","data":[{"werks":"2288","factory":"星腾F栋","lgort":"4603"}],"zipFlag":false,"success":true}
        this.formList[1].options = res.data.map((item) => ({ text: item, value: item }))
        // tips:默认选中第一个项的内容
        if (res.data.length > 0) {
          this.$set(this.form, 'areaId', res.data[0])
          // tips:根据第一个厂区默认取获取仓位和工厂数据
          let res2 = await MISWMSAPI.post('/divertBusiness/findWerksByFactory', {
            factory: res.data[0]
          })
          if (res2.success) {
            if (res2.data.length > 0) {
              this.$set(this.form, 'werks', res2.data[0].werks)
              this.$set(this.form, 'lgort', res2.data[0].lgort)
            }
          }
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
