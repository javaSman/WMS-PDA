<template>
  <div>
    <!-- 表单布局 -->
    <van-cell-group>
      <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
        <FormVue ref="formComponent" :form-data.sync="form" :form-list="formList" />
      </van-cell>
    </van-cell-group>

    <van-sticky :offset-top="46">
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
    <TableVue
      ref="table"
      :table-data.sync="list"
      :table-column="tableColumn"
      :selection.sync="selectedList"
      :is-virtually="true"
      :disabled-chk="false"
    />
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
import { formList, showFormList, tableColumn } from './config'
import FormVue from '@/components/Form/index.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { AGVAPI } from '@/api/generalAGV'
import { WMSAPI } from '@/api/generalAPI'
import { getEditableKey, computedTotal } from '@/utils/validateOperateForQty'
import { getItem } from '@/utils/auth'
import { checkItemToTop } from '@/utils/business'
import { v4 as uuidv4 } from 'uuid'
import mixinPartList from '@/views/mixins/PartList'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { mapGetters } from 'vuex'
export default {
  name: 'TransferCrossRegionalReceptionWMS',
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
      numberInputRef: null,
      barcodeInputRef: null,
      selectAll: false, // 是否全选
      agvname: 'agv/webapi',
      apiname: 'business/webapi',
      passAPIName: 'agv/webapi/PickUpFinish',
      imOclas: '',
      confirmTips: '',
      location: '' // 配送地点
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
    multiList: {
      handler: function (val) {
        const { selectedList, list } = val
        this.selectAll = selectedList.length === list.length && selectedList.length !== 0
      }
    }
  },
  created() { },
  mounted() {
    this.initConfig()
    this.InputRef?.focus()
  },
  methods: {
    async getImOclas() {
      // 根据备料单号查询备料单是否存在及当前状态
      try {
        if (this.selectAll === true) {
         this.selectedList = []
        }
        let res = await AGVAPI.get('agv/webapi/getPickingExits', { pickingNo: this.form.picking })
        if (res.success) {
          this.imOclas = res.oclas
          this.location = res.destination
          this.getData(this.imOclas)
          if (!res.oclas) {
            _showFailToast('未查到该领料单的移动类型')
            return true
          }
        } else {
          _showFailToast(res.message)
          return true
        }
      } catch (e) {
        console.log(e)
      }
    },
    async getData(val) {
      WMSAPI.get(this.apiname, {
        imOclas: val,
        imBarcode: this.form.picking
      }, 'ZxwmsXmbeCommonListMrp').then((res) => {
        if (res && res.success) {
          this.list = res.data
          this.list = this.list.map((item) => ({ ...item, uuid: uuidv4(), location: this.location }))
          // _showSuccessToast(res.message)
        } else {
          _showFailToast(res.message)
        }
      })
    },
    /** 全选和反选 */
    handleSelectAll() {
      if (this.selectedList.length === this.list.length) {
        this.selectedList = []
      } else {
        this.selectedList = this.list.map((item) => item.uuid)
      }
    },
        // 过账
      async handleConfirm() {
      try {
        // 表单验证
        await this.$refs.formComponent?.$refs?.refForm.validate()
        // // 表格必填项验证
        // await this.$refs.table?.$refs?.refForm.validate()
        if (this.selectedList.length === 0) {
          _showFailToast('请勾选数据')
          return
        }
        if (this.selectAll === false) {
          _showFailToast('请全部勾选完成再过账')
          return
        }
        let key = getEditableKey()
        let data = JSON.parse(JSON.stringify(this.selectedList))
        let newdata = this.list.filter(item => data.some(someitem => someitem == item.uuid))
        if (!this.confirmTips && key && !newdata.every((item) => Number(item[key]) > 0)) {
          _showFailToast('所提交项中存在数量小于或等于0的项目，请检查')
          return
        }
        // 过账前确认
        await this.$dialog.confirm({
          title: '提示',
          message:
            this.confirmTips || `本次过账共 ${newdata.length}  条数据,累计数量是:  ${computedTotal(newdata, key)},是否确认过账？`
        })
        // 开始过账
        this.loading = true
        let user = getItem('Users')
         let content = {
          pickingNo: this.form.picking,
          operator: user.userName,
          operatorNo: user.name,
          pickingDetails: newdata
         }
          let res = await AGVAPI.post(this.passAPIName, content)
          if (res && res.success) {
            this.$toast.success(res.message || '过账成功')
            // 清空表单和列表
            this.handleClear()
          } else {
            _showFailToast(res.message)
          }
          this.loading = false
        } catch (e) {
        console.log(e)
        this.loading = false
      }
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
        if (item.prop === 'picking') {
          item.enter = _this.getImOclas
          this.InputRef = _this.getVueComponentByProp(item.prop)
        }
      })
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

