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
          <van-checkbox v-model="selectAll" shape="square" @click="handleSelectAll">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>
    <!-- 列表 -->
    <TableVue ref="table" :is-virtually="true" :table-data.sync="tableData" :table-column="tableColumn" :selection.sync="selection" />
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
import FormVue from '@/components/Form/index.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config/indexDetails'
import Dates from '@/utils/datetime'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
import { mapGetters } from 'vuex'
import { WMSAPI } from '@/api/generalAPI'
import { v4 as uuidv4 } from 'uuid'
import { _showFailToast } from '@/utils/message'
// import { _showFailToast } from '@/utils/message'
// 盘点明细单号-WMS
const listApiName = 'business/inventorydetail/all'
const cachedName = 'WMSFunction.InventoryDetails-WMS'
export default {
  name: cachedName,
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
      show: false,
      form: {
        postDate: today
      },
      loading: false,
      selection: [],
      selectAll: false,
      tableData: [],
      scanLoading: false
    }
  },
  computed: {
    ...mapGetters(['account', 'name']),
    multiList() {
      let { selection, tableData } = this
      return { selection, tableData }
    }
  },
  watch: {
    multiList: {
      handler: function (val) {
        const { selection, tableData } = val
        this.selectAll = selection.length === tableData.length && selection.length !== 0
      }
    }
  },
  mounted() {
    this.initConfig()
    this.fousOfFirst()
    if (this.$route.query.inventoryID) {
      this.$set(this.form, 'inventoryID', this.$route.query.inventoryID)
      this.getDetailList(this.$route.query.inventoryID)
    }
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
    initConfig() {
      this.formList.forEach((item) => {
        if (item.prop === 'boxNo') {
          item.enter = this.boxNo
        }
      })
    },
    /**
     * @description: 箱子号回车,去匹配列表中的箱子并勾选它
     * @param {*} val
     */
    async boxNo(val) {
      if (this.tableData.length <= 0) {
        _showFailToast('当前盘单没有盘点明细')
        return
      }
      let target = this.tableData.find((item) => item.boxNo === val)
      if (target) {
        this.selection = [...this.selection, target.uuid]
      }
      console.log(target)
    },
    async handleConfirm() {},
    handleClear() {
      this.tableData = []
      this.selectAll = false
      this.selection = []
      this.form = {
        postDate: today
      }
      this.show = false
      this.fousOfFirst()
    },
    handleSelectAll() {
      if (this.selection.length === this.tableData.length) {
        this.selection = []
      } else {
        this.selection = this.tableData.map((item) => item.uuid)
      }
    },
    // 根据盘点单去获取对应的盘点明细
    async getDetailList(id) {
      let res = await WMSAPI.get(listApiName, { OrderID: id })
      if (res.items && res.items.length > 0) {
        this.tableData = res.items.map((item) => ({ ...item, uuid: uuidv4() }))
      }
    }
  }
}
</script>
