<template>
  <QueryToggleFormVue
    ref="table"
    :form-data.sync="form"
    :table-data.sync="list"
    :form-list.sync="formList"
    :show-form-list.sync="showFormList"
    :table-column.sync="tableColumn"
    :show-arrow="false"
    :scan-loading="loading"
    confirm-text="打印表格内容"
    @confirm="comfirSearch"
  />
</template>

<script>
// 生产订单状态查询
import QueryToggleFormVue from '@/views/businessComponents/QueryToggleForm.vue'
import { formList, showFormList, tableColumn } from './config'
import { MISWMSAPI } from '@/api/generalAPI'
import { _showFailToast } from '@/utils/message'
import { PrintInterface } from '@/utils/printTools'
import { getItemLocalS } from '@/utils/auth'
const listAPIName = 'getData/getSubMateStock'
const cachedName = 'query.componentQuery'
export default {
  name: cachedName,
  components: {
    QueryToggleFormVue
  },
  data() {
    return {
      form: {},
      list: [],
      formList,
      showFormList,
      tableColumn,
      loading: false
    }
  },
  mounted() {
    //  这里项目号和条码都绑定enter事件
    this.formList[0].enter = this.enterHandler
    this.fousOfFirst()
  },
  methods: {
    // tips：让第一个可以输入的输入源获取光标
    fousOfFirst() {
      let result = this.formList.filter((item) => item.type === 'Input')
      if (result.length > 0) {
        let prop = result[0].prop
        this.$refs.table.$refs.formComponent.$refs[prop][0].$refs.inputRef.focus()
      }
    },
    // 条码或者项目号回车
    async enterHandler() {
      try {
        this.loading = true
        let res = await MISWMSAPI.post(listAPIName, {
          vzzdoex: this.form.barcode,
          vproje: this.form.projectNum
        })
        if (res && res.success) {
          this.list = res.data
          // 这里调用打印机进行打印
          setTimeout(() => {
            this.printHandler()
          }, 20)
        } else {
          _showFailToast(res.msg)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.loading = false
      }
    },

    // 打印代码
    printHandler() {
      let device = getItemLocalS('CURRENT_PRINT')
      if (device) {
        PrintInterface(device, this.printTemplate)
      } else {
        _showFailToast('当前没有绑定打印机，确保手机连接上蓝牙打印机后点击姓名处进行设置')
      }
    },
    printTemplate(outputStream) {
      // let userInfo = JSON.parse(uni.getStorageSync('userInfo'))
      for (let index = 0; index < this.list.length; index++) {
        let text = '! 0 200 200 200 1\r\n'
        text += 'SPEED 1\r\n'
        const item = this.list[index]
        text += `T 5 0 140 40 物  料  号：\r\n`
        text += `T 5 0 250 40 ${item.matnr}\r\n`
        text += 'T 5 0 140 80 项目工位：\r\n'
        text += `T 5 0 250 80 ${item.pojWor}\r\n`
        text += `T 5 0 140 120 组  件  号：\r\n`
        text += `T 5 0 250 120 ${item.idnrk.slice(0, 14)}\r\n`
        // if (item.idnrk.length > 14) {
        //   text += `T 5 0 250 160 ${item.idnrk.slice(14, item.idnrk.length)}\r\n`
        //   text += `T 5 0 140 200 数    量：\r\n`
        //   text += `T 5 0 250 200 ${item.menge + '' + item.meins}\r\n`
        // } else {
        //   text += `T 5 0 140 160 数    量：\r\n`
        //   text += `T 5 0 250 160 ${item.menge + '' + item.meins}\r\n`
        // }
        text += 'FORM\r\n'
        text += 'END\r\n'
        text += 'PRINT\r\n'
        let arrayBuffer = plus.android.invoke(text, 'getBytes', 'gbk')
        outputStream.write(arrayBuffer)
        outputStream.flush()
      }
      this.$nextTick(() => {
        // 清空输入界面并且把光标跳转至扫码框
        this.$set('barcode', '')
        // this.list = []
        this.fousOfFirst()
      })
    },
    async comfirSearch() {
      if (!this.form.barcode) {
        _showFailToast('请先扫条码')
        return
      }
      if (this.list.length <= 0) {
        _showFailToast('当前没有内容可以打印')
        return
      }
      this.printHandler()
    }
  }
}
</script>
