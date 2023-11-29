<template>
  <div>
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
    <div class="oprate_btn" @click="openBatchDialog">
      <span>+</span>
      <span>添加批次</span>
    </div>
    <List :table-data.sync="result" />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" confirm-text="过账" @clear="handleClear" @confirm="handleConfirm" />
    <van-overlay :show="open">
      <div class="table_wrapper" @click.stop>
        <Table :visible.sync="open" :table-data.sync="tableData" @comfir="comfirAdd" />
      </div>
    </van-overlay>
  </div>
</template>

<script>
import FormVue from '@/components/Form/index.vue'
import { formList, showFormList } from './config'
import Table from './components/Table.vue'
import List from './components/List.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import Dates from '@/utils/datetime'
import { MISWMSAPI } from '@/api/generalAPI'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
// import { GetBoxInfoByBoxId } from '@/api/common'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
let originObj = {} // 备份原本的数据,过账时要把原本的数据传入头部的
export default {
  name: 'Transfer311FactoryTransfer',
  components: {
    FormVue,
    Table,
    List,
    ActionBarVue
  },
  data() {
    return {
      formList,
      showFormList,
      show: false,
      open: false,
      form: {
        postDate: today
      },
      tableData: [],
      result: [],
      loading: false
    }
  },
  mounted() {
    this.initConfig()
    this.getTargetWarehouseDataList()
  },
  methods: {
    initConfig() {
      this.formList.forEach((item) => {
        // if (item.prop === 'wmsTools') {
        //   item.enter = this.wmtToolsEnter
        // }
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
        }
        if (item.prop === 'targetWharehouse') {
          item.change = this.targetWharehouseChange
        }
        if (item.prop === 'qty') {
          item.enter = this.erfmgEnter
        }
      })
    },
    /** 获取目标库位，一进入界面就调用 */
    async getTargetWarehouseDataList() {
      // let res = await requestWMS({
      //   method: 'POST',
      //   url: 'http://192.168.11.133/eip-mapp-sapwms-server/t001L/findT001LList'
      // })
      let res = await MISWMSAPI.post('/t001L/findT001LList')
      if (res.success) {
        this.formList[2].options = res.data.map((item) => ({
          text: `${item.werks}-${item.lgort}/${item.lgobe}`,
          value: `${item.werks}-${item.lgort}/${item.lgobe}`
        }))
      }
    },
    /** 箱子回车 */
    // async wmtToolsEnter(val) {
    //   let res = await GetBoxInfoByBoxId(val)
    //   if (!res.success) {
    //     _showFailToast(res.message)
    //     this.$set(this.form, 'wmsTools', '')
    //   } else {
    //     this.$refs.formComponent.$refs.imBarcode[0].$refs.inputRef.focus()
    //   }
    // },
    /** 条码回车 */
    async barcodeEnter(val) {
      let res = await MISWMSAPI.post('/divertBusiness/getValidBarcode', {
        imBarcode: val,
        imOclas: 'XWMS311'
      })
      if (res.success && res.data) {
        let _data = res.data
        // tips:然后用上面的返回值的继续调用下一个接口,这里的特殊是imBaroce要传入的是工厂-库位

        let res2 = await MISWMSAPI.post('/divertBusiness/findList311B', {
          imBarcode: `${_data.werks}-${_data.lgort}`,
          imMatnr: _data.matnr
        })
        if (res2.success) {
          let _title = res2.data.title
          // 保留一份原本的数据用于过账
          originObj = _title
          // tips:这里老系统应该用的title值，因为界面并不会显示多条内容
          // 更新顶部信息
          Object.assign(this.form, _title)
          this.$set(this.form, 'receiveWharehouse', `${_title.werks}-${_title.lgort}`)
          this.$set(this.form, 'matnr', _title.matnr.replace(/^0+/gi, ''))
          this.$set(this.form, 'maktx', _title.maktx)
        }
      }
    },
    targetWharehouseChange(val) {
      console.log(val)
    },
    /** 数量输入，需校验是否超过条码数 */
    erfmgEnter(val) {
      if (!/^[0-9]*[1-9][0-9]*$/.test(val)) {
        _showFailToast('请输入一个正整数')
        this.$set(this.form, 'qty', '')
        return
      } else {
        if (!this.form.imBarcode) {
          _showFailToast('请先扫描条码')
          this.$set(this.form, 'qty', '')
          return
        }
        if (Number(this.form.erfmg) < Number(this.form.qty)) {
          _showFailToast(`数量不能超过当前条码数,当前条码数是${this.form.erfmg}`)
          this.$set(this.form, 'qty', '')
          return
        }
      }
    },
    /** 添加批次按钮，需要收集当前的输入信息形成一个数据传递给弹窗，目前发现老系统只能添加一条数据，不知道是不是bug */
    openBatchDialog() {
      if (!this.form.imBarcode) {
        _showFailToast('请重新扫条码或者扫描条码')
        return
      }
      if (!this.form.targetWharehouse) {
        _showFailToast('请选择一个目标库位')
        return
      }
      if (!this.form.qty) {
        _showFailToast('请输入一个数量')
        return
      }
      // tips:收集数据传入弹窗,老系统也是能添加一条数据的，如果后期要支持多条稍微修改一下即可
      this.tableData = [
        {
          erfmg: this.form.erfmg,
          qty: this.form.qty,
          isSelect: true,
          receiveWharehouse: this.form.receiveWharehouse,
          targetWharehouse: this.form.targetWharehouse,
          matnr: this.form.matnr
        }
      ]
      this.open = true
    },
    comfirAdd(data) {
      console.log(data)
      // tips:混入来源库位与目标库位信息数据展示
      this.result = data.map((item) => ({
        ...item,
        lgortLable: this.form.receiveWharehouse,
        lgottLable: this.form.targetWharehouse.match(/(\S*)\//)[1]
      }))
      this.form = {
        postDate: today
      }
      this.open = false
    },
    handleClear() {
      this.tableData = []
      this.result = []
      originObj = {}
      this.form = {
        postDate: today
      }
    },
    async handleConfirm() {
      if (this.result.length <= 0) {
        _showFailToast('请先扫条码执行必要操作')
        return
      }
      // tips:组装数据进行过账
      try {
        let result = {
          // 重新构造参数，其中data里面的数组就是更改后的，对比发现比原本的对象就多了三个字段,同时要用qty去覆盖erfmg的值
          data: this.result.map((item) => ({
            ...originObj,
            erfmg: item.qty,
            lgortLable: item.lgortLable,
            lgottLable: item.lgottLable,
            lgott: item.lgottLable.split('-')[1]
          })),
          postDate: this.form.postDate,
          title: originObj,
          wmsTools: this.form.wmsTools ? this.form.wmsTools : ''
        }
        await this.$dialog.confirm({
          message: '是否确认过账?'
        })
        this.loading = true

        let res = await MISWMSAPI.post('/divertBusiness/doPost311B', result)
        if (res.success) {
          this.loading = false
          _showSuccessToast(res.msg)
          this.handleClear()
        } else {
          _showFailToast(res.msg)
        }
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.oprate_btn {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  margin-top: 10px;
  cursor: pointer;
  span {
    &:first-child {
      font-size: 14px;
      font-weight: 600;
      scale: 2;
    }
    &:last-child {
      padding-left: 10px;
    }
  }
}
.table_wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
