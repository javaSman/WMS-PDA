<template>
  <div class="query_wrapper">
    <!-- 表单布局 -->
    <van-cell-group class="query_operator">
      <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
        <template>
          <FormVue ref="formComponent" :form-data.sync="form" :form-list="formList" />
        </template>
      </van-cell>
    </van-cell-group>
    <!-- 隐藏字段布局 -->
    <TableVue ref="table" :table-data.sync="tableData" :table-column="tableColumn" />
    <!-- 底部按钮 -->
    <div style="height: 50px" />
    <ActionBarVue ref="actionBarVue" :loading="loading" :confirm-text="'查询'" @clear="handleClear" @confirm="handleQueryInventory" />
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading" z-index="2024">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
  </div>
</template>

<script>
// 库存查询
import FormVue from '@/components/Form/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showInfo, tableColumn } from './config'
import { _showFailToast } from '@/utils/message'
import TableVue from '@/components/Table/index.vue'
const cachedName = 'query.inventoryQuery'
import { getLgortListByMaterialNo, getLocationAndBoxListByMaterialNoAndLgort } from '@/api/common'
export default {
  name: cachedName,
  components: {
    FormVue,
    ActionBarVue,
    TableVue
  },
  data() {
    return {
      tableData: [],
      formList,
      tableColumn,
      showInfo,
      form: {},
      loading: false,
      scanLoading: false
    }
  },
  mounted() {
    //  绑定enter事件
    this.formList[0].enter = this.barcodeQuery
    this.formList[1].enter = this.materialQuery
    this.formList[2].change = this.warehouseChange
    this.$refs.formComponent.$refs.barcode[0].$refs.inputRef.focus()
  },
  methods: {
    // 条码查询
    async barcodeQuery(val) {
      this.scanLoading = true
      let res = await getLgortListByMaterialNo({ MaterialNo: this.form.matnr, Barcode: val })
      if (res.success) {
        let lgorts = res.data.filter((item) => item.lgort)
        if (lgorts.length > 0) {
          this.formList[2].options = lgorts.map((item) => ({ text: item.lgort, value: item.lgort }))
          // 默认第一个仓位
          this.$set(this.form, 'lgort', lgorts[0].lgort)
        } else {
          _showFailToast('当前条码没有工厂库位，请联系管理员')
        }
        let res2 = await getLocationAndBoxListByMaterialNoAndLgort({
          MaterialNo: this.form.matnr,
          Barcode: this.form.barcode,
          Lgort: this.form.lgort
        })
        if (res2.success) {
          this.tableData = res2.data
          // console.log(res2)
        } else {
          _showFailToast(res2.message)
        }
        this.scanLoading = false
      } else {
        _showFailToast(res.message)
        this.scanLoading = false
      }
    },
    // 物料号查询
    async materialQuery(val) {
      this.scanLoading = true
      let res = await getLgortListByMaterialNo({ MaterialNo: this.form.matnr, Barcode: this.form.barcode })
      if (res.success) {
        let lgorts = res.data.filter((item) => item.lgort)
        if (lgorts.length > 0) {
          this.formList[2].options = lgorts.map((item) => ({ text: item.lgort, value: item.lgort }))
          // 默认第一个仓位
          this.$set(this.form, 'lgort', lgorts[0].lgort)
        } else {
          _showFailToast('当前条码没有工厂库位，请联系管理员')
        }
        let res2 = await getLocationAndBoxListByMaterialNoAndLgort({
          MaterialNo: this.form.matnr,
          Barcode: this.form.barcode,
          Lgort: this.form.lgort
        })
        if (res2.success) {
          this.tableData = res2.data
          // console.log(res2)
        } else {
          _showFailToast(res2.message)
        }
        this.scanLoading = false
      } else {
        _showFailToast(res.message)
        this.scanLoading = false
      }
    },
    // 查询
    async handleQueryInventory() {
      this.scanLoading = true
      let res = await getLgortListByMaterialNo({ MaterialNo: this.form.matnr, Barcode: this.form.barcode })
      if (res.success) {
        if (!this.form.lgort) {
          _showFailToast('当前条码没有工厂库位，请联系管理员')
          return
        }
        // let lgorts = res.data.filter((item) => item.lgort)
        // if (lgorts.length > 0) {
        //   this.formList[2].options = lgorts.map((item) => ({ text: item.lgort, value: item.lgort }))
        //   // 默认第一个仓位
        //   this.$set(this.form, 'lgort', lgorts[0].lgort)
        // } else {
        //   _showFailToast('当前条码没有工厂库位，请联系管理员')
        // }
        let res2 = await getLocationAndBoxListByMaterialNoAndLgort({
          MaterialNo: this.form.matnr,
          Barcode: this.form.barcode,
          Lgort: this.form.lgort
        })
        if (res2.success) {
          this.tableData = res2.data
          // console.log(res2)
        } else {
          _showFailToast(res2.message)
        }
        this.scanLoading = false
      } else {
        _showFailToast(res.message)
        this.scanLoading = false
      }
      // let res = await getLocationAndBoxListByMaterialNoAndLgort({
      //   MaterialNo: this.form.matnr,
      //   Barcode: this.form.barcode,
      //   Lgort: this.form.lgort
      // })
      // if (res.success) {
      //   this.tableData = res.data
      //   // console.log(res2)
      //   this.scanLoading = false
      // } else {
      //   _showFailToast(res.message)
      //   this.scanLoading = false
      // }
    },
    // 仓库切换时直接调用查询接口进行查询
    async warehouseChange(val) {
      this.form.lgort = val
      this.handleQueryInventory()
    },
    // 清除
    handleClear() {
      this.form = {}
      this.tableData = []
      this.hiddenForm = {
        exLabst: '',
        exInsme: '',
        exUmlme: '',
        exWwqty: '',
        exKabst: '',
        exKnsme: ''
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.query_wrapper {
  position: relative;
  .query_operator {
    z-index: 2023;
    position: sticky;
    top: 0;
    left: 0;
    width: 100%;
  }
}
.showInfo {
  :deep(.van-cell-group) {
    border-radius: 0;
  }
  :deep(.van-cell__title) {
    width: 80px;
    display: block;
    flex: none;
    text-align: right;
    padding-right: 10px;
  }
}
.loading_wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  z-index: 2024;
}
</style>
