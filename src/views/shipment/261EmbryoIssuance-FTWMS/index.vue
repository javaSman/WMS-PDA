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
    <div v-show="show" class="hideenWrapper">
      <HiddenForm :list.sync="hiddenFormList" />
    </div>
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
    <TableVue ref="table" :table-data.sync="tableData" :table-column="tableColumn" :selection.sync="selection" />
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
import HiddenForm from './components/HiddenForm.vue'
import UserAuth from '@/views/businessComponents/UserAuth.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { MISWMSAPI, WMSAPI } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { GetBoxInfoByBoxId } from '@/api/common'
import { computedTotal, validateAuthAndSelected } from '@/utils/validateOperateForQty'
import { validateTableSelected } from '@/utils/business'
import { fomrmatShipmentSubmitParams } from '@/utils/formatShipmentBusiness'
import { _showFailToast, _showSuccessToast } from '@/utils/message'

// 过账接口
const passAPIName = 'business/webapi/OutStock'
// 查询表头数据的接口
const listAPINameForHeader = '/exportGoodsBusiness/findList261'
// 查询表体数据的接口
const listAPINameForBody = '/divertBusiness/getValidBarcode'
const imOclas = 'XWMS261P'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
const cachedName = 'shipment.262EmbryoReturnWMS'
// 261胚料发料-分摊-WMS

export default {
  name: cachedName,
  components: {
    HiddenForm,
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
      userAuthVisible: true, // 控制是否鉴权
      extraParams: {}, // 鉴权 的额外参数
      selectAll: false, // 是否全选
      exParams: {}, // 存储额外的参数对象
      hiddenFormList: [], // 隐藏区域的数据,这个图号也可以扫多份,因此是一个数组来的
      scanLoading: false
    }
  },
  computed: {
    multiList() {
      let { selection, tableData } = this
      return { selection, tableData }
    }
  },
  watch: {
    // 对比选中项长度与数据数组总长度，是否可以勾选全选复选框
    multiList: {
      handler: function (val) {
        const { selection, tableData } = val
        this.selectAll = selection.length === tableData.length && selection.length !== 0
      }
    }
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
        this.$refs.formComponent.$refs[prop][0].$refs.inputRef.focus()
      }
    },
    authComfir() {
      this.fousOfFirst()
    },
    initConfig() {
      formList[0].enter = this.boxEnter
      formList[1].enter = this.blueprintEnter
      formList[2].enter = this.barcodeEnter
    },
    // 箱子输入确认事件
    async boxEnter(val) {
      let _this = this
      let res = await GetBoxInfoByBoxId(val)
      if (res.success) {
        // TODO 这里获取箱子数据
        // _this.$set(this.form, 'locationId', res.locationNo)
        let inputRef = this.getVueComponentByProp('pictNum')
        inputRef.focus()
      } else {
        _this.$set(this.form, 'wmsTools', '')
        let inputRef = this.getVueComponentByProp('wmsTools')
        inputRef.focus()
        _showFailToast(res.message)
      }
    },

    /**
     * @description: 图纸输入框确定,这里如果没有扫条码的时候可以扫多次，如果扫码这里就不能给扫
     * @param {*} val
     */
    async blueprintEnter(val) {
      let inputRef = this.getVueComponentByProp('pictNum')
      if (!this.form.pictNum) {
        _showFailToast('请扫图纸号')
        return
      }
      if (this.hiddenFormList.map((item) => item.barcode).includes(val)) {
        _showFailToast('当前图纸号已存在，请勿重复添加')
        return
      }
      try {
        this.scanLoading = true
        if (this.tableData.length <= 0) {
          let res = await MISWMSAPI.post(listAPINameForHeader, { imBarcode: val })
          if (res.success) {
            let _data = res.data
            if (res.data.title.sapStatus === 'I') {
              this.$dialog({ message: res.data.title.sapMsg })
            }
            // 工厂号
            let werks = Number(_data.title.werks)
            // TODO这里不确定是否图号列表的werks都是一致，如果都是一致的那么这里的代码可以正常执行，如果不是这里就要修改业务逻辑
            if (werks === 3888 || werks <= 0) {
              if (this.hiddenFormList.length <= 1) {
                if (!this.hiddenFormList.find((item) => item.barcode === _data.title.barcode)) {
                  this.hiddenFormList.push(_data.title)
                  this.show = true
                  this.$set(this.form, 'pictNum', '')
                  inputRef?.focus()
                } else {
                  _showFailToast('当前图纸号已存在，请勿重复添加')
                  this.$set(this.form, 'pictNum', '')
                  inputRef?.focus()
                }
              } else {
                _showFailToast('当工厂是3888或者小于0时只能扫一条图纸号')
              }
            } else {
              // if (!this.hiddenFormList.find((item) => item.barcode === _data.title.barcode)) {
              this.hiddenFormList.push(_data.title)
              this.show = true
              this.$set(this.form, 'pictNum', '')
              inputRef?.focus()
              // } else {
              //   _showFailToast('当前图纸号已存在，请勿重复添加')
              //   this.$set(this.form, 'pictNum', '')
              //   inputRef?.focus()
              // }
            }
          }
        } else {
          _showFailToast('当前所扫图纸号已扫条码号，不允许再扫图纸号，请清空内容后再扫')
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },

    /**
     * @description: 条码输入确定
     * @param {*} val
     */
    barcodeEnter(val) {
      let inputRef = this.getVueComponentByProp('imBarcode')
      let _this = this
      if (!this.form.imBarcode) {
        _showFailToast('请扫条码号')
        return
      }
      this.scanLoading = true
      MISWMSAPI.post(listAPINameForBody, {
        imBarcode: val,
        imOclas: 'XWMS261P',
        cardNo: this.extraParams?.cardno,
        psnName: this.extraParams?.cardname
      })
        .then((res) => {
          let _data = res.data

          if (!this.tableData.find((item) => item.matnr === _data.matnr)) {
            // 这里还需要判断物料编码的开头情况，如果不是以407或者40301开头的不允许添加并提示报错
            if (_data.matnr.startsWith('407') || _data.matnr.startsWith('40301')) {
              if (this.hiddenFormList.some((item) => item.werks !== _data.werks)) {
                _showFailToast('当前所扫条码的工厂与图纸号不符合，不允许添加')
              } else {
                // 符合条件的放入数组之前先混入uuid
                this.tableData.push({ ..._data, uuid: uuidv4() })
                this.tableData = this.tableData.map((item) => ({
                  ...item,
                  erfmg: Number(item.erfmg) > 0 ? item.erfmg : '',
                  operator: this.extraParams.cardname
                }))
                this.$set(this.form, 'imBarcode', '')
                let selectArr = this.tableData.map((item) => item.uuid)
                // 将数据默认勾选上
                this.$refs.table?.handleSelect(selectArr)
              }
            } else {
              _showFailToast('不是407或者40301开头的物料不允许添加')
            }
          } else {
            _showFailToast('当前物料号已存在，请勿重复添加')
            _this.$set(this.form, 'pictNum', '')
            inputRef?.focus()
          }
        })
        .finally(() => {
          this.scanLoading = false
        })
    },

    // 确定过账
    async handleConfirm() {
      await this.$refs.formComponent.$refs.refForm.validate()
      await validateAuthAndSelected(this.extraParams, this.selection)
      await validateTableSelected(tableColumn, this.selection)
      if (this.selection.length > 1) {
        // 根据selection去映射一份被选中的数据
        await this.$dialog.confirm({
          title: '提示',
          message: `本次过账共 ${this.selection.length} 条数据,累计数量是: ${computedTotal(this.selection)},是否确认过账？`
        })
        try {
          this.loading = true
          // 处理接口参数
          let _form = Object.assign({}, this.form)
          let postDate = _form.postDate
          delete _form.postDate
          // 删除uuid,遍历实现,同时把箱子和区域信息混入
          let result = []
          this.selection.forEach((item) => {
            result.push({
              ...item,
              warehouseNo: this.form.warehouseNo,
              areaId: this.form.areaId,
              locationId: this.form.locationId,
              wmsTools: this.form.wmsTools
            })
          })
          let _list = JSON.parse(JSON.stringify(result))
          _list.forEach((item) => delete item.uuid)
          let { account, name } = this.$store.getters
          let _data = fomrmatShipmentSubmitParams(
            imOclas,
            account,
            name,
            this.form.warehouseNo,
            _list,
            'out',
            this.extraParams,
            undefined,
            undefined,
            'maktx',
            postDate
          )
          // tips:重新组装传递给sap的数据
          let sapObj = _data.zxstXmbeStruList
          if (this.hiddenFormList.length <= 0) {
            _showFailToast('图纸列表不能为空')
            return
          }
          _data.zxstXmbeStruList = sapObj.map((item) => ({
            aufnr: this.hiddenFormList[this.hiddenFormList.length - 1].aufnr,
            erfme: item.gmein,
            erfmg: item.erfmg,
            lgort: item.lgort,
            maktx: item.maktx,
            matnr: item.matnr,
            menge: item.erfmg,
            ngeln: item.ngeln,
            objnr: item.objnr,
            prodbatct: item.prodbatct,
            proje: item.proje,
            werks: item.werks,
            workp: item.workp,
            ...this.extraParams
          }))
          let res = await WMSAPI.post(passAPIName, _data)
          if (res && res.success) {
            _showSuccessToast({
              message: res.msg,
              duration: 10 * 1000
            })
            // this.$toast.success(res.message || '过账成功')
            // 清空表单和列表
            this.submitClear()
          } else {
            _showFailToast(res.message)
          }
        } catch (e) {
          console.log(e)
        } finally {
          this.loading = false
        }
      } else {
        _showFailToast('单个图纸物料请使用胚料发料功能')
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
      this.hiddenFormList = []
      this.form = {
        postDate: today
      }
      // this.extraParams = null
      this.show = false
      this.fousOfFirst()
    },
    submitClear() {
      this.tableData = []
      this.selectAll = false
      this.selection = []
      this.hiddenFormList = []
      this.form = {
        postDate: today,
        wmsTools: this.form.wmsTools,
        pictNum: this.form.pictNum
      }
      // this.extraParams = null
      this.show = false
      this.$refs.formComponent.$refs['imBarcode'][0].$refs.inputRef.focus()
    },
    // 全选
    handleSelectAll() {
      this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
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
.hideenWrapper {
  max-height: 200px;
  overflow-y: auto;
}
</style>
