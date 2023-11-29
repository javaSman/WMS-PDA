<template>
  <div>
    <!-- 表单布局 -->
    <van-cell-group>
      <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
        <FormVue ref="formComponent" :form-data.sync="form" :form-list="formList" />
      </van-cell>
    </van-cell-group>

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
    <TableVue ref="table" :table-data.sync="list" :table-column="tableColumn" :selection.sync="selectedList" :disabled-chk="false" />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" confirm-text="解绑" @clear="handleClear" @confirm="handleConfirm" />
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
  </div>
</template>

<script>
import { formList, showFormList, tableColumn } from './config'
import FormVue from '@/components/Form/index.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { getList } from '@/api/generalSAP'
import { getItem } from '@/utils/auth'
import { checkItemToTop } from '@/utils/business'
import { v4 as uuidv4 } from 'uuid'
import mixinPartList from '@/views/mixins/PartList'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { mapGetters } from 'vuex'
export default {
  name: 'TransferCrossRegionalReceptionUnbindingWMS',
  components: {
    FormVue,
    TableVue,
    ActionBarVue
  },
  mixins: [mixinPartList],
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      form: {},
      // show: false, // 点击左侧箭头是否展开
      selectedList: [], // 选中项集合
      list: [], // 列表数据
      loading: false, // 过账按钮loading
      wareHouseList: [], // 用于存储仓库列表
      chkDisabled: false, // 是否禁用复选框
      scanLoading: false,
      tableBtnParams: {},
      InputRef: null,
      barcodeInputRef: null,
      numberInputRef: null,
      selectAll: false // 是否全选
    }
  },
  computed: {
    ...mapGetters(['account', 'name'])
    // selectAll() {
    //   return this.selectedList.length === this.list.length && this.selectedList.length !== 0
    // }
  },
  created() {},
  mounted() {
    this.initConfig()
    this.InputRef?.focus()
  },
  methods: {
    getData() {
      let data = {
        FunctionName: 'ZXWMS_XMBE_COMMON_LIST_MRP',
        Parameter: {
          IM_OCLAS: 'XWMSCOURIER',
          IM_BARCODE: this.form.IM_BARCODE
        },
        ParameterType: 0,
        TableName: 'TX_DATA,TX_DATA',
        ReturnValue: 'EX_RET2'
      }
      data.Parameter = JSON.stringify(data.Parameter)
      getList(data)
        .then((res) => {
          if (res.IsError === false) {
            this.list = JSON.parse(res.Tables[0].Value)
            this.list = this.list.map((item) => ({ ...item, uuid: uuidv4() }))
            this.barcodeInputRef?.focus()
          } else {
            _showFailToast(res.ErrMsg)
          }
        })
        .catch(() => {})
    },
    async getBarcodeData(val) {
      let target2 = this.list.find((item) => item.RSPOS === val.replace(/-/g, '\n').split('\n')[1])
      if (target2) {
        let arrs = [...this.selectedList.map((item) => item.uuid), target2.uuid]
        // 进行勾选
        this.$refs.table?.handleSelect(arrs)
        this.list = checkItemToTop(this.list, target2)
        await this.clear()
        if (this.list.length !== arrs.length) {
          this.$nextTick(() => {
            // 光标聚焦
            this.numberInputRef?.focus()
          })
        }
      } else {
        // _showFailToast({ message: '条码错误' })
        this.numberInputRef?.focus()
      }
    },
    handleSelectAll() {
      if (this.$refs.table) {
        this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
      }
    },
    handleConfirm() {
      this.$refs.formComponent.$refs.refForm.validate().then(() => {
        this.$dialog
          .confirm({
            title: '提示',
            message: '是否解绑勾选的快递单号',
            width: '90%'
          })
          .then(() => {
            if (this.selectedList.length === 0) {
              _showFailToast('请勾选单号')
              return
            }
            let data = JSON.parse(JSON.stringify(this.selectedList))
            let detailList = []
            data.map(function (item, index) {
              // 新数组用来盛放每一项中的各个参数
              let array = item.COURIER.split(',')
              let arr = [] // 去重复后的新数组
              arr = array.filter((element, index, self) => {
                return self.indexOf(element) === index
              })
              item.COURIER = arr.toString()
              var newArray = {}
              newArray['REQNO'] = item.REQNO
              newArray['RSPOS'] = item.RSPOS
              newArray['CHARG'] = item.CHARG
              newArray['IDNRK'] = item.IDNRK
              newArray['MAKTX'] = item.MAKTX
              newArray['WORKT'] = item.WORKT
              newArray['ZZDOEX'] = item.ZZDOEX
              newArray['COURIER'] = item.COURIER
              newArray['WMS_AREA'] = item.WMS_AREA
              detailList[index] = newArray
            })
            let user = getItem('Users')
            let content = {
              FunctionName: 'ZXWMS_XMBE_COMMON_POST_TR',
              Parameter: {
                IM_OCLAS: 'XWMSRELIEVE',
                TX_DATA: detailList,
                IM_CARDNO: user.userName,
                IM_CARDNAME: user.name
              },
              ParameterType: 1,
              TableName: 'TX_DATA,TX_DATA',
              ReturnValue: 'EX_RET2'
            }
            content.Parameter = JSON.stringify(content.Parameter)
            this.loading = true
            getList(content)
              .then((res) => {
                if (res.IsError === false) {
                  this.loading = false
                  _showSuccessToast({ message: res.ErrMsg, duration: 8 * 1000 })
                  this.handleClear()
                } else {
                  this.loading = true
                  _showFailToast(res.ErrMsg)
                }
              })
              .catch(() => {
                this.loading = false
              })
          })
      })
    },
    computedTotal(arr) {
      const key = 'erfmg'
      return arr.reduce((pre, next) => {
        // eslint-disable-next-line no-prototype-builtins
        if (pre.hasOwnProperty(key)) {
          return Number(pre[key]) + Number(next[key])
        } else {
          return Number(next[key])
        }
      }, 0)
    },
    // 清空
    handleClear() {
      // table数据
      this.list = []
      // 选中项集合
      this.selectedList = []
      // 表单
      this.form = {}
      this.selectAll = false
    },
    clear() {
      this.$set(this.form, 'imBarcode', '')
    },
    initConfig() {
      let _this = this
      this.formList.forEach((item) => {
        if (item.prop === 'IM_BARCODE') {
          item.enter = _this.getData
          this.InputRef = _this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'imBarcode') {
          item.enter = _this.getBarcodeData
          this.barcodeInputRef = _this.getVueComponentByProp(item.prop)
        }
        if (item.prop === 'number') {
          item.enter = _this.numberData
          this.numberInputRef = _this.getVueComponentByProp(item.prop)
        }
      })
    },
    numberData(val) {
      if (!val) {
        _showFailToast('请输入快递单号')
      }
      let data = JSON.parse(JSON.stringify(this.selectedList))
      if (data) {
        for (let i = 0; i < this.list.length; i++) {
          for (let j = 0; j < data.length; j++) {
            if (data[j].RSPOS === this.list[i].RSPOS) {
              let array = this.list[i].COURIER.split(',')
              let index = array.indexOf(this.form.number)
              if (index !== -1) {
                let newArray = array.filter((item) => item !== this.form.number)
                this.list[i].COURIER = newArray.toString()
                this.form.number = ''
                this.numberInputRef?.focus()
              }
            }
          }
        }
      }
    },
    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    }
  }
}

// 按钮-配件清单
</script>

<style lang="scss" scoped>
.loading_wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
