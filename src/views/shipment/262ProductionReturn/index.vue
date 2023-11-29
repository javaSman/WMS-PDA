<template>
  <!-- <ToggleFormVue
    :form-list="formList"
    :show-form-list="showFormList"
    :table-column="tableColumn"
    :pass-a-p-i-name="passAPIName"
    :list-a-p-i-name="listAPIName"
    mode="one"
    scanl-key="barcode"
    auto-submit
  /> -->
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
        <van-grid-item>总数：{{ list.length }}</van-grid-item>
        <van-grid-item>已确认：{{ selectedList.length }}</van-grid-item>
        <van-grid-item>剩余数：{{ list.length - selectedList.length }}</van-grid-item>
        <van-grid-item>
          <van-checkbox v-model="selectAll" shape="square" @click="handleSelectAll">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>

    <!-- 列表 -->
    <TableVue ref="table" :table-data.sync="list" :selection.sync="selectedList" :table-column="tableColumn" />
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
import FormVue from '@/components/Form/index.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import Dates from '@/utils/datetime'
import { mapGetters } from 'vuex'
import { _showFailToast } from '@/utils/message'
import { checkItemToTop } from '@/utils/business'
import { customerDialog } from '@/components/CustomerDialog'
import { computedTotal } from '@/utils/validateOperateForQty'
// 262生产退料
const cachedName = 'shipment.262ProductionReturn'
// import ToggleFormVue from '@/views/businessComponents/ToggleForm.vue'
import { formList, showFormList, tableColumn } from './config'
import { WMSAPI } from '@/api/generalAPI'
import { v4 as uuidv4 } from 'uuid'
// const passAPIName = '/exportGoodsBusiness/doPost262'
// const listAPIName = '/exportGoodsBusiness/findList262'
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
const passAPIName = 'business/webapi/ZxwmsXxmbeCommonPostDl'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
const imOclas = 'XWMS262'
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
      scanLoading: false
    }
  },
  computed: {
    ...mapGetters(['authUserInfo', 'account', 'name']),
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
        if (selectedList.length > 0 && list.length > 0 && selectedList.length === list.length) {
          this.handleConfirm()
        }
      }
    },
    // 观察数据模式，条码绑定回车
    mode: {
      handler: function (val) {
        if (val === 'addTo') this.formList[0].enter = this.barcodeEnterByAddTo
        else this.formList[0].enter = this.barcodeEnter
      },
      deep: true,
      immediate: true
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
        this.$refs.table.$refs.checkboxGroup.toggleAll(this.selectAll)
      })
    },
    /**
     * @description: 条码回车事件，需判断匹配明细的方式
     * @param {*} val 条码值
     */
    async barcodeEnter(val) {
      let inputRef = this.$refs.formComponent.$refs[this.formList[0].prop][0].$refs.inputRef
      if (!val) {
        _showFailToast('请输入条码')
        return
      }
      // 以list的长度作为判断条件，大于0，表面如果页面明细没有被清除，等于0表明页面无信息
      if (this.list.length > 0) {
        // 从结果集中寻找
        let target = this.list.filter((item) => item['barcode'] === val)
        if (target.length > 0) {
          // 每次都是追加，不是覆盖，因为存在连续扫码的情况
          let arrs = [...this.selectedList.map((item) => item.uuid), ...target.map((item) => item.uuid)]
          // 进行勾选
          this.$refs.table.handleSelect(arrs)
          // tips: 这里有个特殊行为，就是针对这些一条一条扫码匹配的，有些要进行匹配后置顶操作的
          this.list = checkItemToTop(this.list, target[0])
          this.$nextTick(() => {
            // 光标重新聚焦
            this.form[this.formList[0].prop] = ''
            inputRef.focus()
          })
        } else {
          _showFailToast('没有找到结果，请检查重试或清除结果后重新扫码')
        }
      } else {
        try {
          this.scanLoading = true
          let res = await WMSAPI.post(this.listAPIName, { imBarcode: val, imOclas: imOclas })
          if (res && res.success) {
            let _data = res.data
            this.form = Object.assign({}, this.form, _data.title)
            // 清空输入框
            this.form[this.formList[0].prop] = ''
            // 混入唯一值，用于勾选数据
            if (_data.length === 1) {
              this.list = _data.map((item) => ({ ...item, uuid: uuidv4(), barcode: val }))
            } else {
              this.list = _data.map((item) => ({ ...item, uuid: uuidv4() }))
            }
          } else {
            _showFailToast(res.message)
          }
        } catch (e) {
          console.log(e)
        } finally {
          this.scanLoading = false
        }
      }
    },
    // 过账
    async handleConfirm() {
      try {
        await this.$refs.formComponent.$refs.refForm.validate()
        await this.$refs.table.$refs.refForm.validate()
        if (this.selectedList.length === 0) {
          _showFailToast('请勾选数据')
          return
        }
        await customerDialog({
          count: this.selectedList.length,
          total: computedTotal(this.selectedList, 'erfmg'),
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
        // let _form = Object.assign({}, this.form)
        // 混入时间参数
        // _form = { ..._form }
        // let postDate = _form.postDate
        // delete _form.postDate
        // 删除uuid,遍历实现
        let _list = JSON.parse(JSON.stringify(this.selectedList))
        _list.forEach((item) => delete item.uuid)
        // 重新格式化一下时间
        // _list = _list.map((item) => ({
        //   ...item,
        // cpudt: dayjs(item.cpudt).format('yyyy-mm-dd'),
        // cputm: dayjs(item.cputm).format('HH:mm:ss')
        // }))
        // let _data = {
        //   postDate,
        //   title: _form,
        //   data: _list
        // }
        let _data = {
          ImOclas: imOclas,
          ImCardno: this.account,
          ImCardname: this.name,
          Data: _list.map((item) => ({ ...item, oclas: imOclas }))
        }

        let res = await WMSAPI.post(this.passAPIName, _data)
        if (res.success) {
          await this.$dialog.alert({
            message: res.message
          })
          this.clearHandler()
        } else {
          _showFailToast(res.message)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.loading = false
      }
    },
    // 初始化配置项
    initConfig() {
      this.formList.forEach((item) => {
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
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
