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
    <ActionBarVue ref="actionBarVue" :loading="loading" :confirm-text="confirmText" @clear="clearHandler" @confirm="handleConfirm" />
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
import { v4 as uuidv4 } from 'uuid'
import { MISWMSAPI } from '@/api/generalAPI'
import { WMSAPI_WCF } from '@/api/generalAPI'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { getEditableKey, computedTotal } from '@/utils/validateOperateForQty'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
import { checkItemToTop } from '@/utils/business'
import { customerDialog } from '@/components/CustomerDialog'
import { mapGetters } from 'vuex'
let staticData = [] // 用于存储列表原始数据
export default {
  name: 'ToggleFormVue',
  components: { FormVue, TableVue, ActionBarVue },
  props: {
    formList: { type: Array, default: () => [] }, // 表单项数组
    showFormList: { type: Array, default: () => [] }, // 需要展开显示的数据字段参数
    viewData: { type: Object, default: () => ({}) }, // 列表信息总览数据
    tableColumn: { type: Array, default: () => [] }, // 列表字段参数
    chkDisabled: { type: Boolean, default: () => false },
    submit: {
      type: Function,
      default: undefined
    }, // 过账按钮前执行事件
    passAPIName: { type: String, default: () => '' }, // 过账接口地址
    listAPIName: { type: String, default: () => '' }, // 扫码查询接口地址
    confirmText: { type: String, default: () => '过账' }, // 底部按钮显示文本
    enterFrontEvent: {
      type: Function,
      default: () => false
    }, // 条码回车事件前执行事件
    enterAfterEvent: {
      type: Function,
      default: undefined
    }, // 条码回车事件后执行事件，用于重新组合数据
    snrc: { type: Array, default: () => [] }, // 确认信息数组
    isPass: { type: Boolean, default: () => true },
    // 1.扫码匹配字段一标识key，此key是用来实现业务的，必须传入；2.追加数据判断是否重复扫码的唯一识别符
    scanlKey: { type: String, default: '' },
    // 当前模式，all：加载接口后全选；one：扫码匹配或手动勾选，需传值scanlKey匹配字段；handler：只能手动勾选；addTo：追加数据
    mode: { type: String, default: 'one' },
    isCheckAndToTop: { type: Boolean, default: () => false }, // 是否选择后置顶操作
    isAllSelectAndSubmit: { type: Boolean, default: () => false }, // 是否全选才能过账
    autoSubmit: { type: Boolean, default: () => false }, // tips: 是否触发自动过账行为,当全选时自动触发过账动作
    computedKey: { type: String, default: () => null }, // 指定一个计数逻辑key，用于处理那些特殊的数量，例如不良数之类的
    isAutoFocus: { type: Boolean, default: true }, // 是否自动对第一个输入源进行聚焦
    isAlterMessage: { type: Boolean, default: false }, // 是否是弹窗形式的提示
    isLimitMaterial: { type: Boolean, default: false }, // 是否卡控物料编码为空时不允许过账
    materialKey: { type: String, default: 'matnr' }, // 物料编码的key
    isShowAuthor: { type: Boolean, default: false }, // 是否显示领料人
    isWcfInterface: { type: Boolean, default: false }, // 是否走WCF接口
    imOclas: { type: String, default: '' } // 移动类型
  },
  data() {
    return {
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
        if (this.autoSubmit && selectedList.length > 0 && list.length > 0 && selectedList.length === list.length) {
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
      if (this.isAutoFocus) {
        let result = this.formList.filter((item) => item.type === 'Input')
        if (result.length > 0) {
          let prop = result[0].prop
          this.$refs.formComponent.$refs[prop][0].$refs.inputRef.focus()
        }
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
        // 1.当模式是扫码匹配
        if (this.mode === 'one') {
          // 从结果集中寻找
          let target = this.list.filter((item) => item[this.scanlKey] === val)
          if (target.length > 0) {
            if (this.selectedList.length > 0 && this.selectedList.includes(target[0].uuid)) {
              _showFailToast('已经扫码，请勿重复扫码')
              return
            } else {
              // 每次都是追加，不是覆盖，因为存在连续扫码的情况
              let arrs = [...this.selectedList, ...target.map((item) => item.uuid)]
              // 进行勾选
              this.selectedList = arrs
              // this.$refs.table.handleSelect(arrs)
              // tips: 这里有个特殊行为，就是针对这些一条一条扫码匹配的，有些要进行匹配后置顶操作的
              if (this.isCheckAndToTop) {
                this.list = checkItemToTop(this.list, target[0])
              }
              this.$nextTick(() => {
                // 光标重新聚焦
                this.form[this.formList[0].prop] = ''
                inputRef.focus()
              })
            }
          } else {
            this.$nextTick(() => {
              // 光标重新聚焦
              this.form[this.formList[0].prop] = ''
              inputRef.focus()
            })
            _showFailToast('没有找到结果，请检查重试或清除结果后重新扫码')
          }
        }
        // 2.当模式是手动勾选
        if (this.mode === 'handler') {
          _showFailToast('请手动勾选数据过账或清除信息后再扫码！')
        }
        // 3.当前模式是默认全选
        if (this.mode === 'all') {
          _showFailToast('请清除信息后再扫码！')
        }
        // 2.如果是allDisabled那就是全选然后不能勾选的情况
        if (this.mode === 'allAntDisable') {
          _showFailToast('请清除信息后再扫码！')
        }
      } else {
        this.scanLoading = true
        // 否则加载接口数据然后全选
        // 如果有前置事件，则执行
        if (await this.enterFrontEvent(val, this.form.postDate)) {
          return
        } else {
          this.scanLoading = true
          MISWMSAPI.post(this.listAPIName, { imBarcode: val })
            .then((res) => {
              if (res && res.success) {
                let _data = res.data
                this.form = Object.assign({}, this.form, _data.title)
                // 清空输入框
                this.form[this.formList[0].prop] = ''
                let arr = []
                // 增加uuid为唯一识别符
                _data.data.forEach((item) => {
                  item.uuid = uuidv4()
                  arr.push(item)
                })
                // 赋值表格数据
                this.list = this.isShowAuthor ? arr.map((item) => ({ ...item, operator: this.authUserInfo.cardname })) : arr
                // 存储原始数据
                staticData = JSON.parse(JSON.stringify(arr))
                // 重新组合数据
                this.enterAfterEvent && this.enterAfterEvent(this.list, staticData)
                // 处理snrc确认数组 增加uuid为唯一识别符
                let snrc = []
                let _snrc = _data.snrc || []
                _snrc.forEach((item) => {
                  item.uuid = uuidv4()
                  snrc.push(item)
                })
                let arrs = this.list.map((item) => item.uuid)
                // 默认将数据全选
                if (this.mode === 'all') {
                  this.selectedList = arrs
                  // this.$refs.table?.handleSelect(arrs)
                }
                // 序列号
                this.$emit('update:snrc', _snrc)
                // 额外的参数对象
                if (_data.wmsTools) this.exParams.wmsTools = _data.wmsTools // 卡板编号
                if (_data.whid) this.exParams.whid = _data.whid // 仓库ID
                if (_data.boxId) this.exParams.boxId = _data.boxId // 卡板编号
              } else {
                _showFailToast(res.msg)
              }
            })
            .catch((e) => {
              // 在返回错误后清空页面
              this.clearHandler()
            })
            .finally(() => {
              this.scanLoading = false
              // 查询结果之后重新聚焦
              inputRef.focus()
            })
        }
      }
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
        // 确认是否可以过账
        if (!this.isPass) {
          _showFailToast('序列号未扫描完。')
          return
        }
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
        console.log('这里执行')
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
        // 增加额外的参数
        if (this.exParams.wmsTools) _data.wmsTools = this.exParams.wmsTools // 卡板编号
        if (this.exParams.whid) _data.whid = this.exParams.whid // 仓库ID
        if (this.exParams.boxId) _data.boxId = this.exParams.boxId // 卡板编号
        // 表单验证完后，若有自定义方法，则执行
        if (this.submit) {
          await this.submit(_data, this.loading)
          this.loading = false
        } else {
          let res = null
          // tips:如果外部需要走WCF接口，那么这里传入新的接口地址即可
          if (this.isWcfInterface) {
            res = await WMSAPI_WCF.post(this.passAPIName, {
              ImOclas: this.imOclas,
              ImCardno: this.account,
              ImCardname: this.name,
              Data: _list,
              postDate
            })
          } else {
            res = await MISWMSAPI.post(this.passAPIName, _data)
          }
          if (res.success) {
            if (this.isAlterMessage) {
              await this.$dialog.alert({ message: this.isWcfInterface ? res.message : res.msg })
              let inputRef = this.$refs.formComponent.$refs[this.formList[0].prop][0].$refs.inputRef
              inputRef.focus()
            } else {
              _showSuccessToast(this.isWcfInterface ? res.message : res.msg)
            }
            this.clearHandler()
          } else {
            _showFailToast(this.isWcfInterface ? res.message : res.msg)
          }
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
