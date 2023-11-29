<template>
  <div>
    <!-- 表单布局 -->
    <van-cell-group>
      <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
        <template v-if="showFormList.length > 0" #title>
          <van-icon :name="show ? 'arrow-down' : 'arrow'" @click="show = !show" />
        </template>
        <template>
          <FormVue ref="formComponent" :form-data.sync="form" :form-list="formList" />
        </template>
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
      :is-virtually="true"
      :table-data.sync="tableData"
      :table-column="tableColumn"
      :selection.sync="selection"
      @inputNumHandler="inputNumHandler"
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
// 机加件入库(机加)
import FormVue from '@/components/Form/index.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { formList, showFormList, tableColumn } from './config'
import { _showFailToast } from '@/utils/message'
import { mapGetters } from 'vuex'
import { v4 as uuidv4 } from 'uuid'
import { WMSAPI } from '@/api/generalAPI'
const passAPIName = 'business/webapi/ZxwmsXmbePartRkPost'
const listAPIName = 'business/webapi/ZxwmsXmbePartRkList'
const imOclas = 'XWMSZZ1'
const cachedName = 'machinedWarehousing.machinedWarehousingInventory'
import Dates from '@/utils/datetime'
import { customerDialog } from '@/components/CustomerDialog'
import { computedTotal } from '@/utils/validateOperateForQty'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
// 保留一份静态数据用于校验输入数量
let staticData = []
export default {
  name: cachedName,
  components: {
    FormVue,
    TableVue,
    ActionBarVue
  },
  data() {
    return {
      show: false,
      formList,
      showFormList,
      tableColumn,
      passAPIName,
      listAPIName,
      imOclas,
      tableData: [],
      selection: [],
      loading: false,
      scanLoading: false,
      form: {
        postDate: today
      }, // 表单对象，初始化过账日期
      selectAll: false,
      numBlurParams: { key: 'erfmg', index: 0 }
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
    this.fousOfFirst()
    this.initConfig()
  },
  methods: {
    // tips：让第一个可以输入的输入源获取光标
    fousOfFirst() {
      let result = this.formList.filter((item) => item.type === 'Input')
      if (result.length > 0) {
        // tips:获取第一行的输入key
        let prop = result[0].prop
        this.$refs.formComponent.$refs[prop][0].$refs.inputRef.focus()
      }
    },
    /** 全选和反选 */
    handleSelectAll() {
      this.$nextTick(() => {
        this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
      })
    },
    /**
     * @description: 条码回车事件，需判断匹配明细的方式
     * @param {*} val 条码值
     */
    async barcodeEnter(val) {
      if (!val) {
        _showFailToast('请输入条码')
        return
      }
      if (this.tableData.length > 0) {
        _showFailToast('请先扫码勾选数据再过账')
        return
      } else {
        this.$set(this.form, 'inventroyNumber', val)
        try {
          // 否则加载接口数据然后全选
          this.scanLoading = true
          let res = await WMSAPI.get(this.listAPIName, { IM_BARCODE: val })
          if (res && res.success) {
            let _data = res.data
            if (_data.length === 0) {
              _showFailToast('暂无数据')
              return
            }
            // TODO: 使用静态测试数据
            // let _data: any[] = testData.data
            if (_data.length > 0) {
              this.form = Object.assign({}, this.form, _data[0])
            }
            // let arr = []
            // // 增加uuid为唯一识别符
            // _data.forEach((item) => {
            //   item.uuid = uuidv4()
            //   arr.push(item)
            // })
            // 赋值表格数据
            this.tableData = _data.map((item) => ({ ...item, uuid: uuidv4() }))
            // 存储原始数据
            staticData = JSON.parse(JSON.stringify(this.tableData))
            // this.selectedList = this.tableData.map((item) => item.uuid)
            // 勾选
            this.$nextTick(() => {
              console.log(this.tableData.map((item) => item.uuid))
              // 默认勾选数据
              this.selection = this.tableData.map((item) => item.uuid)
            })
          } else {
            _showFailToast(res.message)
          }
        } catch (e) {
          console.log(e)
        } finally {
          this.scanLoading = false
          this.form.imBarcode = ''
          // 查询结果之后重新聚焦
        }
      }
    },

    // 过账
    async handleConfirm() {
      try {
        // 表单验证
        await this.$refs.formComponent?.$refs.refForm.validate()
        await this.$refs.table.$refs.refForm.validate()
        // 确认是否可以过账
        if (this.tableData.length === 0) {
          _showFailToast('请勾选数据')
          return
        }
        await customerDialog({
          count: this.tableData.length,
          total: computedTotal(this.tableData, 'erfmg'),
          countPrefix: '本次过账共',
          countSuffix: '条数据,',
          totalPrefix: '累计拣货数量是',
          totalSuffix: '确定过账吗?'
        })
        // 开始过账
        this.loading = true
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(this.tableData))
        _list.forEach((item) => delete item.uuid)
        let _data = {
          iM_CARDNO: this.account,
          iM_CARDNAME: this.name,
          tX_PART: _list.map((item) => ({ ...item, checkqty: item.erfmg }))
        }
        let res = await WMSAPI.post(this.passAPIName, _data)
        if (res && res.success) {
          this.$dialog.alert({ message: res.message || '过账成功' })
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
    // 校验规则
    validateErfmg() {
      let { key, index } = this.numBlurParams
      // 改变后的值
      let x = Number(this.tableData[index][key])
      // 原始值
      let y = staticData[index]['checkqty']
      if (!x || x < 0) return false
      if (x > y) return false
      else return true
    },

    // 初始化配置项
    async initConfig() {
      this.tableColumn.forEach((item) => {
        if (item.type === 'Table/NumberInput') {
          let _erfmgRules = [
            { required: true, message: '请输入数量', trigger: 'onBlur' },
            { validator: this.validateErfmg, message: '数量不能小于0或者大于检测数量' }
          ]
          item.rules = _erfmgRules
        }
      })
      this.formList.forEach((item) => {
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
        }
      })
    },
    inputNumHandler(key, index) {
      console.log(key, index)
      this.numBlurParams = { key, index }
    },

    // 清空
    handleClear() {
      // table数据
      this.tableData = []
      // 选中项集合
      this.selection = []
      // 表单
      this.form = {
        postDate: today
      }
      this.fousOfFirst()
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
