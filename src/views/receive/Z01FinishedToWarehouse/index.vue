<template>
  <!-- <ToggleFormVue
    ref="toggleFormVue"
    scanl-key="barcode"
    :form-list="formList"
    :table-column="tableColumn"
    :pass-a-p-i-name="passAPIName"
    :list-a-p-i-name="listAPIName"
    chk-disabled
    mode="addTo"
  /> -->
  <div>
    <!-- 表单布局 -->
    <van-cell-group>
      <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
        <FormVue ref="formComponent" :form-data.sync="form" :form-list="formList" />
      </van-cell>
    </van-cell-group>
    <!-- 列表信息总览 -->
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
    <TableVue
      ref="table"
      :table-data.sync="list"
      :selection.sync="selectedList"
      :table-column="tableColumn"
      :disabled-chk="chkDisabled"
      :is-virtually="true"
      @clickHandlerEvent="clickHandler"
      @inputNumHandler="inputNumHandler"
    />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" @clear="clearHandler" @confirm="handleConfirm" />
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
  </div>
</template>

<script>
// Z01成品入库
const cachedName = 'receive.Z01FinishedToWarehouse'
// import { MISWMSAPI } from '@/api/generalAPI'
// import ToggleFormVue from '@/views/businessComponents/ToggleForm.vue'
import { formList, tableColumn } from './config'
// import { _showFailToast } from '@/utils/message'
const passAPIName = 'receivingAndWarehousing/doPostZ01'
const listAPIName = 'receivingAndWarehousing/findListZ01'
// const getDeliveryDate = 'mes/getDeliveryDate'
// const fourteenDay = 1000 * 60 * 60 * 24 * 14
import FormVue from '@/components/Form/index.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { MISWMSAPI } from '@/api/generalAPI'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { getEditableKey, computedTotal } from '@/utils/validateOperateForQty'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
import { customerDialog } from '@/components/CustomerDialog'
import { mapGetters } from 'vuex'
let staticData = [] // 用于存储列表原始数据
export default {
  name: cachedName,
  components: { FormVue, TableVue, ActionBarVue },
  data() {
    return {
      formList,
      tableColumn,
      passAPIName,
      listAPIName,
      form: {
        postDate: today
      }, // 表单对象，初始化过账日期
      show: false, // 点击左侧箭头是否展开
      selectAll: false, // 是否全选
      selectedList: [], // 选中项集合
      list: [], // 列表数据
      loading: false, // 过账按钮loading
      exParams: {}, // 存储额外的参数对象
      numBlurParams: {
        key: 'erfmg',
        index: 0
      }, // 用于存储当前正在编辑的行的索引
      scanLoading: false,
      chkDisabled: true,
      scanlKey: 'barcode'
    }
  },
  computed: {
    ...mapGetters(['authUserInfo']),
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
        // tips: 这里要判断一下是否是那种自动触发过账的
        if (this.autoSubmit && selectedList.length > 0 && list.length > 0 && selectedList.length === list.length) {
          this.handleConfirm()
        }
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
    /** 全选和反选 */
    handleSelectAll() {
      this.$nextTick(() => {
        if (this.selectedList.length === this.list.length) {
          this.selectedList = []
        } else {
          this.selectedList = this.list.map((item) => item.uuid)
        }
        // this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
      })
    },
    /**
     * @description: 当前操作模式为addTo时条码回车事件
     * @param {*} val 条码值
     */
    barcodeEnterByAddTo(val) {
      let inputRef = this.$refs.formComponent.$refs[this.formList[0].prop][0].$refs.inputRef
      if (!val) {
        _showFailToast('请输入条码')
        return
      }
      // 1.判断是否重复扫码
      if (this.list.length > 0) {
        let target = this.list.filter((item) => item[this.scanlKey] === val)
        if (target.length > 0) {
          // 清空输入框
          this.form[this.formList[0].prop] = ''
          let inputRef = this.$refs.formComponent.$refs[this.formList[0].prop][0].$refs.inputRef
          inputRef.focus()
          _showFailToast('请勿重复扫码')
          return
        }
      }
      this.scanLoading = true
      // 2.不重复则调用接口追加数据
      MISWMSAPI.post(this.listAPIName, { imBarcode: val })
        .then((res) => {
          if (res && res.success) {
            let _data = res.data
            this.form = Object.assign({}, this.form, _data.title)
            // 清空输入框
            this.form[this.formList[0].prop] = ''
            // 增加uuid为唯一识别符
            _data.data.forEach((item) => {
              item.uuid = uuidv4()
              item._erfmg = item.erfmg
              this.list.push(item)
            })
            // 存储原始数据
            staticData = JSON.parse(JSON.stringify(this.list))
            let arrs = this.list.map((item) => item.uuid)
            // 默认勾选数据
            this.selectedList = arrs
            // this.$refs.table?.handleSelect(arrs)
          } else {
            _showFailToast(res.msg)
            // 清空输入框
            this.form[this.formList[0].prop] = ''
          }
        })
        .catch((e) => {
          // 在返回错误后清空页面
          // this.clearHandler()
        })
        .finally(() => {
          this.scanLoading = false
          // 查询结果之后重新聚焦
          inputRef.focus()
        })
    },
    // 过账
    async handleConfirm() {
      let _selection = this.list.filter((item) => this.selectedList.includes(item.uuid))
      try {
        await this.$refs.formComponent.$refs.refForm.validate()
        await this.$refs.table.$refs.refForm.validate()
        if (this.selectedList.length === 0) {
          _showFailToast('请勾选数据')
          return
        }
        if (this.isAllSelectAndSubmit && this.list.length !== this.selectedList.length) {
          _showFailToast('存在未确认项，请确认数据。')
          return
        }
        let key = this.computedKey ? this.computedKey : getEditableKey()
        if (key && !_selection.every((item) => Number(item[key]) > 0)) {
          _showFailToast('所提交项中存在数量小于或等于0的项目，请检查')
          return
        }
        // if (this.isLimitMaterial) {
        //   console.log('选择的内容', this.selectedList)
        //   console.log('物料key', this.materialKey)
        //   if (this.selectedList.some((item) => !item[this.materialKey])) {
        //     _showFailToast('所选项的物料编码为空，不允许过账操作')
        //     return
        //   }
        // }
        await customerDialog({
          count: this.selectedList.length,
          total: computedTotal(_selection, key),
          countPrefix: '本次过账共',
          countSuffix: '条数据,',
          totalPrefix: '累计数量是',
          totalSuffix: '确定过账吗?'
        })
        // await this.$dialog.confirm({
        //   title: '提示',
        //   message: `本次过账共 ${this.selectedList.length} 条数据,累计数量是: ${computedTotal(this.selectedList, key)},是否确认过账？`
        // })
        this.loading = true
        // 处理接口参数
        let _form = Object.assign({}, this.form)
        // 混入时间参数
        // _form = { ..._form }s
        let postDate = _form.postDate
        delete _form.postDate
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(_selection))
        _list.forEach((item) => delete item.uuid)
        // 重新格式化一下时间
        // _list = _list.map((item) => ({
        //   ...item,
        // cpudt: dayjs(item.cpudt).format('yyyy-mm-dd'),
        // cputm: dayjs(item.cputm).format('HH:mm:ss')
        // }))
        let _data = {
          postDate,
          title: _form,
          data: _list
        }

        let res = await MISWMSAPI.post(this.passAPIName, _data)
        if (res.success) {
          _showSuccessToast(res.msg)
          this.clearHandler()
        } else {
          _showFailToast(res.msg)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.loading = false
      }
    },
    // 校验规则
    validateErfmg() {
      let { key, index } = this.numBlurParams
      // 改变后的值
      let x = Number(this.list[index][key])
      // 原始值
      let y = staticData[index][key]
      if (!x || x < 0) return false
      if (x > y) return false
      else return true
    },
    // 判断数量，不能大于原数量， 不能小于等于0
    inputNumHandler(key, index) {
      this.numBlurParams = { key, index }
    },
    // 初始化配置项
    initConfig() {
      this.formList.forEach((item) => {
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnterByAddTo
        }
      })
      this.tableColumn.forEach((item) => {
        if (item.type === 'Table/NumberInput') {
          let _erfmgRules = [
            { required: true, message: '请输入数量', trigger: 'onBlur' },
            { validator: this.validateErfmg, message: '数量不能大于原数量或者小于0' }
          ]
          item.rules = _erfmgRules
        }
      })
    },
    // 清空
    clearHandler() {
      // 额外参数
      this.exParams = {}
      // table数据
      this.list = []
      // 选中项集合
      this.selectedList = []
      // 表单
      this.form = {
        postDate: today
      }
      let inputRef = this.$refs.formComponent.$refs[this.formList[0].prop][0].$refs.inputRef
      inputRef.focus()
    },
    // 行右键点击方法
    clickHandler(key, data, index) {
      this.$emit('clickHandler', key, data, index)
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
