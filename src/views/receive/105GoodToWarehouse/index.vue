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
          <van-checkbox v-model="selectAll" :disabled="disableCheck" shape="square" @click="handleSelectAll">全选</van-checkbox>
        </van-grid-item>
      </van-grid>
    </van-sticky>

    <!-- 列表 -->
    <TableVue
      ref="table"
      :is-virtually="true"
      :table-data.sync="list"
      :selection.sync="selectedList"
      :table-column="tableColumn"
      :disabled-chk="disableCheck"
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
  <!-- <ToggleFormVue
    :form-list="formList"
    :show-form-list="showFormList"
    :table-column="tableColumn"
    :pass-a-p-i-name="passAPIName"
    :list-a-p-i-name="listAPIName"
    mode="one"
    scanl-key="objnr"
    :is-check-and-to-top="true"
    :chk-disabled="true"
    auto-submit
  /> -->
</template>

<script>
import FormVue from '@/components/Form/index.vue'
import TableVue from '@/components/Table/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import Dates from '@/utils/datetime'
import { v4 as uuidv4 } from 'uuid'
import { WMSAPI_WCF, WMSAPI } from '@/api/generalAPI'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { getEditableKey, computedTotal } from '@/utils/validateOperateForQty'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
import { checkItemToTop } from '@/utils/business'
import { customerDialog } from '@/components/CustomerDialog'
import { mapGetters } from 'vuex'
// 105良品入库
const cachedName = 'receive.105GoodToWarehouse'
import { formList, showFormList, tableColumn } from './config'

const passAPIName = '9037Wcf/WarehouseService.svc/rest/ZxwmsXmbeCommonPostGr'
const listAPIName = 'business/webapi/ZxwmsXmbeCommonListMrp'
export default {
  name: cachedName,
  components: {
    // ToggleFormVue，
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
      scanLoading: false,
      disableCheck: true, // 是否可以手动勾选
      imOclas: 'XWMS105'
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
      let barcodeRef = this.getVueComponentByProp('imBarcode')
      if (val.length > 18) {
        _showFailToast('当前所扫条码超过最大长度，可能是扫太快导致的，请适当增加扫码间隔时间')
        this.form.imBarcode = ''
        barcodeRef.focus()
        return false
      }
      if (!val) {
        _showFailToast('请输入条码')
        return
      }
      // 以list的长度作为判断条件，大于0，表面如果页面明细没有被清除，等于0表明页面无信息
      if (this.list.length > 0) {
        let target = this.list.filter((item) => item['objnr'] === val || item['kdauf'] === val || item['kdauf'] + '-000001' === val)

        if (target.length > 0) {
          if (this.selectedList.length > 0 && this.selectedList.includes(target[0].uuid)) {
            _showFailToast('请勿重复扫码')
            this.form.imBarcode = ''
            barcodeRef.focus()
            return
          }
          // 每次都是追加，不是覆盖，因为存在连续扫码的情况
          this.selectedList = [...this.selectedList, ...target.map((item) => item.uuid)]
          // 进行勾选
          // tips: 这里有个特殊行为，就是针对这些一条一条扫码匹配的，有些要进行匹配后置顶操作的
          this.list = checkItemToTop(this.list, target[0])
          this.$nextTick(() => {
            this.form.imBarcode = ''
            barcodeRef.focus()
            // 将列表视图滚动回顶层
            this.$refs.table.$refs.wrapperRef.scrollTop = 0
          })
        } else {
          _showFailToast('没有找到结果，请检查重试或清除结果后重新扫码')
          this.form.imBarcode = ''
          barcodeRef.focus()
        }
      } else {
        try {
          // 否则加载接口数据然后全选
          this.scanLoading = true
          let res = await WMSAPI.get(this.listAPIName, { imBarcode: val, imOclas: this.imOclas })
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
            // 增加uuid为唯一识别符
            // 这里条码扫的是什么，如果能有返回值，那么条码就用扫码的值赋值
            if (_data.length === 1 && _data[0].ktext !== '良品') {
              _data = _data.map((item) => ({ ...item, objnr: val, uuid: uuidv4() }))
            } else {
              _data = _data.map((item) => ({ ...item, uuid: uuidv4() }))
            }
            // _data.forEach((item) => {
            //   item.uuid = uuidv4()
            //   arr.push({ ...item, objnr: val })
            // })
            // 赋值表格数据
            this.list = _data
            this.$nextTick(() => {
              this.form.imBarcode = ''
              barcodeRef.focus()
              // 光标重新聚焦
            })
          } else {
            _showFailToast(res.message)
            this.$nextTick(() => {
              this.form.imBarcode = ''
              barcodeRef.focus()
              // 光标重新聚焦
            })
          }
        } catch (e) {
          console.log(e)
        } finally {
          this.scanLoading = false
          this.form.imBarcode = ''
          barcodeRef.focus()
        }
      }
    },
    // 过账
    async handleConfirm() {
      const _selection = this.list.filter((item) => this.selectedList.includes(item.uuid))
      try {
        await this.$refs.formComponent.$refs.refForm.validate()
        await this.$refs.table.$refs.refForm.validate()
        if (this.selectedList.length === 0) {
          _showFailToast('请勾选数据')
          return
        }
        let key = getEditableKey(tableColumn)
        await customerDialog({
          count: this.selectedList.length,
          total: computedTotal(_selection, key),
          countPrefix: '本次过账共',
          countSuffix: '条数据,',
          totalPrefix: '累计数量是',
          totalSuffix: '确定过账吗?'
        })
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
        // let _data = {
        //   postDate,
        //   title: _form,
        //   data: _list
        // }
        let res = await WMSAPI_WCF.post(this.passAPIName, {
          ImOclas: this.imOclas,
          ImCardno: this.account,
          ImCardname: this.name,
          Data: _list,
          postDate
        })
        if (res.success) {
          _showSuccessToast(res.message)
          // this.$dialog.alert({
          //   message: res.msg
          // })
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
    // 根据prop的值获取该输入框
    getVueComponentByProp(prop) {
      return this.$refs.formComponent.$refs[prop][0].$refs.inputRef
    },
    // 清空
    clearHandler() {
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
