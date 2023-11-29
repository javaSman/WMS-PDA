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
import { MISWMSAPI } from '@/api/generalAPI'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
// 过账接口
const passAPIName = '/exportGoodsBusiness/doPostSpefic261'
// 查询表头数据的接口
const listAPINameForHeader = '/exportGoodsBusiness/findList261'
// 查询表体数据的接口
const listAPINameForBody = '/divertBusiness/getValidBarcode'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
const cachedName = 'shipment.262EmbryoReturnWMS'
// 261胚料发料-分摊
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
    initConfig() {
      this.formList[0].enter = this.blueprintEnter
      this.formList[1].enter = this.barcodeEnter
    },
    authComfir() {
      // tips:让图纸条码号获取焦点
      this.fousOfFirst()
    },
    /**
     * @description: 图纸输入框确定,这里如果没有扫条码的时候可以扫多次，如果扫码这里就不能给扫
     * @param {*} val
     */
    async blueprintEnter(val) {
      let inputRef = this.getVueComponentByProp('pictNum')
      let _this = this
      if (!this.form.pictNum) {
        _showFailToast('请扫图纸号')
        return
      }
      if (this.tableData.length > 0) {
        _showFailToast('当前所扫图纸号已扫条码号，不允许再扫图纸号，请清空内容后再扫')
        return
      }
      if (this.hiddenFormList.map((item) => item.barcode).includes(val)) {
        _showFailToast('当前图纸号已存在，请勿重复添加')
        return
      }
      try {
        this.scanLoading = true
        let res = await MISWMSAPI.post(listAPINameForHeader, { imBarcode: val })
        if (res.success) {
          let _data = res.data
          if (res.data.title.sapStatus === 'I') {
            await this.$dialog({ message: res.data.title.sapMsg })
          }
          // 工厂号
          let werks = Number(_data.title.werks)
          // TODO这里不确定是否图号列表的werks都是一致，如果都是一致的那么这里的代码可以正常执行，如果不是这里就要修改业务逻辑
          if (werks === 3888 || werks <= 0) {
            if (this.hiddenFormList.length <= 1) {
              if (!this.hiddenFormList.find((item) => item.barcode === _data.title.barcode)) {
                this.hiddenFormList.push(_data.title)
                this.show = true
                _this.$set(this.form, 'pictNum', '')
                inputRef?.focus()
              } else {
                _showFailToast('当前图纸号已存在，请勿重复添加')
                _this.$set(this.form, 'pictNum', '')
                inputRef?.focus()
              }
            } else {
              _showFailToast('当工厂是3888或者小于0时只能扫一条图纸号')
            }
          } else {
            // if (!this.hiddenFormList.find((item) => item.barcode === _data.title.barcode)) {
            this.hiddenFormList.push(_data.title)
            this.show = true
            _this.$set(this.form, 'pictNum', '')
            inputRef?.focus()
            // } else {
            //   _showFailToast('当前图纸号已存在，请勿重复添加')
            //   _this.$set(this.form, 'pictNum', '')
            //   inputRef?.focus()
            // }
          }
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
    async barcodeEnter(val) {
      let inputRef = this.getVueComponentByProp('imBarcode')
      let _this = this
      if (!this.form.imBarcode) {
        _showFailToast('请扫条码号')
        return
      }
      try {
        this.scanLoading = true
        let res = await MISWMSAPI.post(listAPINameForBody, {
          imBarcode: val,
          imOclas: 'XWMS261P',
          cardNo: this.extraParams?.cardno,
          psnName: this.extraParams?.cardname
        })
        if (res.success) {
          let _data = res.data

          if (this.tableData.map((item) => item.matnr).includes(_data.matnr)) {
            _showFailToast('当前物料号已存在，请勿重复添加')
            _this.$set(this.form, 'pictNum', '')
            inputRef?.focus()
            return
          }
          if (this.hiddenFormList.some((item) => item.werks !== _data.werks)) {
            _showFailToast('当前所扫条码的工厂与图纸号不符合，不允许添加')
            return
          }
          // 这里还需要判断物料编码的开头情况，如果不是以407或者40301开头的不允许添加并提示报错
          if (_data.matnr.startsWith('407') || _data.matnr.startsWith('40301')) {
            // 符合条件的放入数组之前先混入uuid
            this.tableData.push({ ..._data, uuid: uuidv4(), erfmg: _data.erfmg > 0 ? _data.erfmg : '', operator: this.extraParams.cardname })
            let selectArr = this.tableData.map((item) => item.uuid)
            // 将数据默认勾选上
            this.$refs.table?.handleSelect(selectArr)
            _this.$set(this.form, 'imBarcode', '')
            inputRef.focus()
          } else {
            _showFailToast('不是407或者40301开头的物料不允许添加')
            return
          }
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },

    // 获取可编辑项的prop
    // 取出tableColumn中类型是Table/Number的项目的prop，因为这个才是可以编辑的项
    getEditableKey() {
      let tarItem = tableColumn.find((item) => item.type === 'Table/Number')
      let key = tarItem ? tarItem.prop : 'erfmg'
      return key
    },
    // 确定过账
    async handleConfirm() {
      // 构造参数,循环混入额外参数
      if (this.selection.length <= 0) {
        _showFailToast('请勾选要过账的数据')
        return
      }
      let key = this.getEditableKey()
      if (this.selection.length > 1) {
        if (this.selection.every((item) => Number(item[key]) <= 0)) {
          _showFailToast('所提交项中存在数量小于或等于0的项目，请检查')
          return
        }
        try {
          await this.$dialog.confirm({
            title: '提示',
            message: `本次过账共 ${this.selection.length} 条数据,累计数量是: ${this.computedTotal(this.selection)},是否确认过账？`
          })
          this.loading = true
          // 处理接口参数
          let _form = Object.assign({}, this.form)
          let postDate = _form.postDate
          delete _form.postDate
          // 删除uuid,遍历实现
          let _list = JSON.parse(JSON.stringify(this.selection))
          _list.forEach((item) => delete item.uuid)
          let _data = {
            postDate,
            data: this.hiddenFormList.map((item) => ({ ...item, ...this.extraParams })),
            post: _list.map((item) => ({
              erfmg: item.erfmg,
              erfme: item.gmein,
              lgort: item.lgort,
              menge: item.erfmg,
              matnr: item.matnr
            })),
            title: this.hiddenFormList[0]
          }
          // 增加额外的参数
          // if (this.exParams.wmsTools) _data.wmsTools = this.exParams.wmsTools // 卡板编号
          // if (this.exParams.whid) _data.whid = this.exParams.whid // 仓库ID
          // if (this.exParams.boxId) _data.boxId = this.exParams.boxId // 卡板编号
          let res = await MISWMSAPI.post(passAPIName, _data)
          if (res && res.success) {
            _showSuccessToast({
              message: res.msg,
              duration: 10 * 1000
            })
            // this.$toast.success(res.msg)
            // 清空表单和列表
            this.handleClear()
          } else {
            _showFailToast(res.data)
          }
        } catch (e) {
          console.log(e)
        } finally {
          this.loading = false
        }
      } else {
        _showFailToast('当前只有一条数据，请使用【261胚料发料】功能')
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
        postDate: today
      }
      this.extraParams = null
      this.show = false
      this.fousOfFirst()
    },
    // 全选
    handleSelectAll() {
      this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
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
