<template>
  <div>
    <!-- 表单布局 -->
    <van-cell-group>
      <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
        <template v-if="showFormList.length > 0" #title>
          <van-icon :name="show ? 'arrow-down' : 'arrow'" @click="show = !show" />
        </template>
        <FormVue ref="formComponent" :form-data.sync="form" :form-list="formList" class="form-group" />
      </van-cell>
    </van-cell-group>
    <!-- 隐藏字段布局 -->
    <van-cell-group v-show="show" :style="showFormList.length > 0 ? 'padding-left: 20px' : ''">
      <FormVue ref="showFormComponent" :form-data.sync="form" :form-list="showFormList" class="form-group" />
    </van-cell-group>
    <!-- 列表 -->
    <!-- <TableVue ref="table" :table-data.sync="tableData" :table-column="tableColumn" /> -->
    <!-- 要传入顶部列表的高度，一项是40,有隐藏项要加上隐藏项 -->
    <VirtualTable :wrapp-top="show ? 60 : 20" :table-data="tableData" :table-column="tableColumn" :disable-chck="true" />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" :confirm-text="confirmText" @clear="handleClear" @confirm="handleConfirm" />
    <!-- 调用扫条码时的loading效果，同时阻止用户继续操作 -->
    <van-overlay :show="scanLoading">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
  </div>
</template>

<script>
import VirtualTable from '@/components/VirtualTable/index.vue'
import FormVue from '@/components/Form/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import Dates from '@/utils/datetime'
import { formList, showFormList, tableColumn } from './config'
// 载具绑定/解绑货位-WMS
const cachedName = 'WMSFunction.InventoryBind-WMS'
const passAPIName = 'business/webapi/BoxBindOrUnbindingArea'
// import TableVue from '@/components/Table/index.vue'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
import { _showFailToast } from '@/utils/message'
import { WMSAPI } from '@/api/generalAPI'
import { GetBoxInfoByBoxId, GetLocationInfo, GetBoxDetail } from '@/api/common'
export default {
  name: cachedName,
  components: {
    FormVue,
    ActionBarVue,
    VirtualTable
  },
  data() {
    return {
      formList,
      showFormList,
      passAPIName,
      show: false,
      form: {
        postDate: today
      },
      operateType: 1, // 操作类型-bind-1|unbind-0
      loading: false,
      scanLoading: false,
      tableData: [],
      tableColumn
    }
  },
  computed: {
    // 按钮文字
    confirmText() {
      let str = ''
      switch (this.operateType) {
        case 1: {
          str = '绑定'
          break
        }
        case 0: {
          str = '解绑'
          break
        }
        default: {
          str = '绑定'
        }
      }
      return str
    },
    operateText() {
      return this.operateType === 1 ? '绑定' : '解绑'
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
    /** 初始化配置项 */
    initConfig() {
      this.formList.forEach((item) => {
        // 箱子号/接收箱子号-获取区域
        if (item.prop === 'boxNo') {
          item.enter = this.boxNoEnter
        }
        // 区域/货位/接收货位-验证货位值
        if (item.prop === 'locationNo') {
          item.enter = this.areaEnter
        }
      })
    } /** 清空 */,
    handleClear() {
      console.log(123456)
      // 表单
      this.form = {
        postDate: today
      }
      this.tableData = []
      this.fousOfFirst()
    },
    /** 箱子号回车
     *  1、查询箱子是否存在-
     *  2、查询箱子是否有绑定货位-（1）未绑定货位-光标跳转到【货位】；（2）已绑定货位-给货位赋值、光标跳转到【下一输入框】
     */
    async boxNoEnter(val) {
      if (!val) return
      // 调用接口带出区域，如果区域有值，光标跳转到条码，没有跳转到区域
      let res = await GetBoxInfoByBoxId(val)
      if (res.success) {
        // 判断箱子号是否可以带出货位
        if (res.locationNo) {
          this.$set(this.form, 'locationNo', res.locationNo) // locationID 字段根据需求
          this.operateType = 0 // 可进行【解绑】操作
          // 这里同时可以去获取对应的条码列表
          let res2 = await GetBoxDetail(val)
          if (res2.success) {
            this.tableData = res2.materialBarcodeList
            // 这里统计总数
            // this.$set(
            //   this.form,
            //   'total',
            //   this.tableData.map((item) => item.quantity).reduce((pre, next) => pre + next)
            // )
            // 这里统计项数
            this.$set(this.form, 'total', this.tableData.length)
            // console.log(res2)
          }
        } else {
          this.$refs.formComponent.$refs['locationNo'][0].$refs.inputRef.focus()
          this.operateType = 1 // 可进行【绑定】操作
        }
      } else {
        _showFailToast(res.message)
        this.operateType = 1 // 可进行【绑定】操作
        if (res.message.includes('没有绑定货位')) {
          this.$refs.formComponent.$refs['locationNo'][0].$refs.inputRef.focus()
        }
      }
    },
    /** 区域回车
     *  查询区域是否存在-（1）存在-光标跳转到【下一输入框】（2）不存在-错误提示
     */
    async areaEnter(val) {
      if (!val) return
      let res = await GetLocationInfo(val)
      if (!res.success) {
        _showFailToast(res.message)
        this.$set(this.form, 'locationNo', '')
        this.$refs.formComponent.$refs['locationNo'][0].$refs.inputRef.focus()
      }
    },
    /** 过账 */
    async handleConfirm() {
      try {
        // 表单验证
        await this.$refs.formComponent.$refs.refForm.validate()
        await this.$dialog.confirm({
          message: `是否确认${this.operateText}操作`
        })
        // 开始过账
        this.loading = true
        // 获取传参值
        let _data = {}
        _data = this.getPassParams()
        // 表单验证完后，若有自定义方法，则执行
        if (this.submit) {
          this.submit(_data, this.loading)
        } else {
          let res = await WMSAPI.post(this.passAPIName, _data)
          if (res && !res.IsError) {
            this.$toast.success(res.message || '操作成功')
            // 清空表单和列表
            this.handleClear()
          } else {
            _showFailToast(res.message)
          }
          this.loading = false
        }
      } finally {
        this.loading = false
      }
    },
    // 获取过账的参数
    getPassParams() {
      let { boxNo, locationNo } = this.form
      let { account, name } = this.$store.getters
      let _data = {
        cardNo: account, // 工号
        cardName: name, // 姓名
        boxNo: boxNo, // 箱子号
        locationNo: locationNo, // 货位（区域）
        type: this.operateType // 0:解绑 1:绑定
      }
      return _data
    }
  }
}
</script>
<style lang="scss" scoped>
.loading_wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
