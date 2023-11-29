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
          <van-checkbox v-model="selectAll" :disabled="disableCheck" shape="square" @click="handleSelectAll">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>
    <!-- 列表 -->
    <TableVue
      ref="table"
      :table-data.sync="tableData"
      :table-column="formateTableColumn"
      :selection.sync="selection"
      unique-key="boxNo"
      :disabled-chk="disableCheck"
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
import Dates from '@/utils/datetime'
import { GetBoxDetail, GetUserWarehouse } from '@/api/common'
import { nextTick } from 'vue'
import { WMSAPI } from '@/api/generalAPI'
import { _showFailToast } from '@/utils/message'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
const cachedName = 'WMSLineSideWarehouse.TransferAreaReception'
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
      show: false, // 控制隐藏区域
      form: {
        postDate: today
      }, // 表单数据
      loading: false, // 底部过账按钮loaidng
      tableData: [], // 列表数据
      selection: [], // 选中的数据
      numBlurParams: { key: 'erfmg', index: 0 },
      userAuthVisible: true, // 控制是否鉴权
      extraParams: {}, // 鉴权 的额外参数
      selectAll: false, // 是否全选
      exParams: {}, // 存储额外的参数对象
      hiddenFormList: [], // 隐藏区域的数据,这个图号也可以扫多份,因此是一个数组来的
      scanLoading: false,
      originTableData: [],
      disableCheck: false
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
              { validator: this.validateFunc, message: '数量不能大于原数量且不能小于等于0' }
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
  },
  methods: {
    // tips：让第一个可以输入的输入源获取光标
    fousOfFirst() {
      let result = this.formList.filter((item) => item.type === 'Input')
      if (result.length > 0) {
        let prop = result[0].prop
        this.$refs.refFormGroup.$refs.formComponent.$refs[prop][0].$refs.inputRef.focus()
      }
    },
    authComfir() {
      this.fousOfFirst()
    },
    initConfig() {
      this.formList[1].enter = this.boxEnter
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

    // 箱子输入确认事件,这里根据箱子号加载对应的物料明细
    async boxEnter(val) {
      this.scanLoading = true

      let res = await GetBoxDetail(val)
      if (res.success) {
        this.scanLoading = false
        // this.form.locationId = res.box.locationNo
        this.tableData = res.materialBarcodeList
        // 默认全部选中
        nextTick(() => {
          this.$refs.table?.handleSelect(this.tableData.map((item) => item.boxNo))
          // tips 选中之后就禁用选择
          this.disableCheck = true
        })
      } else {
        this.scanLoading = false
       _showFailToast(res.message)
      }
    },

    // 确定过账
    handleConfirm() {
      this.$refs.formComponent.$refs.refForm.validate().then(async () => {
        if (this.form.wmsTools && this.form.locationId) {
          this.$dialog
            .confirm({
              title: '提示',
              message: `确定过账吗？`
            })
            .then(async () => {
              this.loading = true
              let res = await WMSAPI.post('business/webapi/BoxBindOrUnbindingArea', {
                cardNo: this.extraParams?.cardno,
                cardName: this.extraParams?.cardname,
                boxNo: this.form.wmsTools,
                locationNo: this.form.locationId,
                type: 1
              })
              if (res.success) {
                this.$toast.success({ message: res.message })
                this.handleClear()
              } else {
               _showFailToast(res.message)
              }
            })
            .catch(() => {
              // on cancel
            })
            .finally(() => {
              this.loading = false
            })
        } else {
          _showFailToast('卡板/箱子号和区域不能为空')
        }
      })
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
      this.fousOfFirst()
    },
    // 全选
    handleSelectAll() {
      this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
    },

    // 数量输入框的回调事件
    inputNumHandler(key, index) {
      console.log(key, index)
    },
    // 得到仓库数据，更新仓库列表
    // TODO 这部分先写死一个工号获取仓库数据
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
