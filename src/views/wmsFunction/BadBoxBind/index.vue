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
    <TableVue ref="table" :table-data.sync="tableData" :table-column="tableColumn" :selection.sync="selection" @input-num-handler="inputNumHandler" />
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
import { formList, showFormList, tableColumn } from './config'
import Dates from '@/utils/datetime'
const passAPIName = 'business/webapi/PostIn'
// const listAPIName = 'business/webapi/GetMaterialBarcodeList'
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
import { _showFailToast } from '@/utils/message'
import { v4 as uuidv4 } from 'uuid'
import { WMSAPI } from '@/api/generalAPI'
import { customerDialog } from '@/components/CustomerDialog'
import { computedTotal } from '@/utils/validateOperateForQty'
import { GetBoxDetail } from '@/api/common'
import { mapGetters } from 'vuex'
// 不良箱号绑定
const cachedName = 'WMSFunction.BadBoxBind'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
const imOclas = '不良箱号绑定'
const imOclas2 = 'XWMS124'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { postTransferPramamsForWmsInPostIn } from '@/utils/postTransferPramsForWms'
// let staticData = []
export default {
  name: cachedName,
  components: { FormVue, TableVue, ActionBarVue },
  data() {
    return {
      passAPIName,
      listAPIName,
      formList,
      showFormList,
      tableColumn,
      tableData: [],
      selection: [],
      form: {
        postDate: today
      },
      materialBoxList: [],
      show: false,
      selectAll: false,
      loading: false,
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
    // 授权回调
    authComfir() {
      this.fousOfFirst()
    },
    initConfig() {
      this.formList.forEach((item) => {
        if (item.prop === 'wmsTools') {
          item.enter = this.getBoxDetails
        }
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
        }
      })
    },
    /** 箱子号回车带出明细
     *  判断是否存在
     */
    async getBoxDetails(val) {
      if (!this.form.wmsTools) {
        _showFailToast('箱子号不能为空')
        return
      }
      try {
        this.scanLoading = true
        let res = await GetBoxDetail(val)
        if (res.success) {
          if (res.box) {
            this.$set(this.form, 'locationId', res.box.locationNo) // locationID 字段根据需求
            let _data = res.materialBarcodeList
            // 将箱子明细暂存
            this.materialBoxList = _data
            this.$refs.formComponent.$refs.imBarcode[0].$refs.inputRef.focus()
          } else {
            _showFailToast('当前箱子没有绑定区域')
          }
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },
    // tips:判断物料的开头是不是2或者字母，是的话才能被过账，因为这个代表这是机加件的意思
    computedType(matnr) {
      if (/^[a-zA-Z]|^2/.test(matnr)) {
        return true
      } else {
        return false
      }
    },
    /** 条码回车 */
    async barcodeEnter(val) {
      if (!this.form.imBarcode) {
        _showFailToast('请扫条码')
        return
      }

      // 2.判断是否已存在于箱子内
      // if (this.materialBoxList.length > 0) {
      //   if (this.materialBoxList.findIndex((item) => item['barcode'] === val) === -1) {
      //     _showFailToast('所扫条码不在载具中，请重新扫码')
      //     // 查询结果之后重新聚焦
      //     this.$set(this.form, 'imBarcode', '')
      //     this.$refs.formComponent.$refs.imBarcode[0].$refs.inputRef.focus()
      //     return
      //   }
      // }
      try {
        this.scanLoading = true
        let res = await WMSAPI.get(this.listAPIName, {
          imBarcode: val,
          imOclas: imOclas2
        })
        if (res.success) {
          let _data = res.data
          if (_data === null || _data.length === 0) {
            _showFailToast('暂无数据')
            return
          }
          // 1.判断是否重复扫码
          if (this.tableData.length > 0) {
            let target = this.tableData.filter((item) => item['barcode'] === _data[0].barcode)
            if (target.length > 0) {
              _showFailToast('请勿重复扫码')
              this.$set(this.form, 'imBarcode', '')
              this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
              return
            }
          }

          _data = _data.map((item) => ({
            ...item,
            uuid: uuidv4(),
            matnr: item.idnrk ? item.idnrk : item.matnr
          }))
          this.tableData = [...this.tableData, ..._data]
          this.$set(this.form, 'imBarcode', '')
          // 存储原始数据
          // staticData = JSON.parse(JSON.stringify(this.list))
          let arrs = this.tableData.map((item) => item.uuid)
          // 默认勾选数据
          this.$refs.table?.handleSelect(arrs)
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },
    /** 过账 */
    async handleConfirm() {
      if (this.selection.length !== this.tableData.length) {
        _showFailToast('必须全部勾选才能过账')
        return
      }
      try {
        // await validateAuthAndSelected(this.extraParams, this.selection)
        await customerDialog({
          count: this.selection.length,
          total: computedTotal(this.selection, 'scrqty'),
          countPrefix: '本次过账共',
          countSuffix: '条数据,',
          totalPrefix: '累计数量是',
          totalSuffix: '确定过账吗?'
        })
        this.loading = true
        // 处理接口参数
        let _form = Object.assign({}, this.form)
        let postDate = _form.postDate
        delete _form.postDate
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(this.selection))
        _list.forEach((item) => delete item.uuid)
        // 混入箱子等信息
        // tips：针对sap的objnr字段需要特殊处理，如果objnr本身没有值的情况，那么需要将kdauf拼接posnv，用-拼接
        _list = _list.map((item) => ({
          ...item,
          wmsTools: this.form.boxID,
          locationId: this.form.locationID,
          objnr: item.objnr ? item.objnr : `${item.kdauf}-${item.posnv}`
        }))
        let _data = fomrmatShipmentSubmitParams(
          imOclas,
          this.account,
          this.name,
          this.form.warehouseNo,
          _list,
          'in',
          this.extraParams,
          '',
          'barcode',
          'txz01',
          postDate
        )
        // 针对wms的部分特殊处理
        _list = _list.map((item) => ({
          ...item,
          wmsTools: this.form.wmsTools,
          locationId: this.form.locationId,
          barcode: this.computedType(item.matnr.replace(/^0+/gi, '')) ? `${item.kdauf}-000001` : item.objnr
        }))
        _data.wmsPostInList = postTransferPramamsForWmsInPostIn(_list, imOclas, 'barcode', 'txz01', 'scrqty')
        let res = await WMSAPI.post(passAPIName, _data)
        if (res && res.success) {
          this.$dialog({ message: res.message })
          // _showSuccessToast(res.message || '过账成功')
          // 清空表单和列表
          this.handleClear()
        } else {
         _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.loading = false
      }
    },
    /** 清除 */
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
      this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
    },
    inputNumHandler(key, index) {
      console.log(key, index)
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
