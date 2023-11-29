<template>
  <div>
    <van-field ref="inputRef" v-model="barcode" clearable label="图纸条码" placeholder="请输入图纸条码" @keyup.enter="enterBarcode" />
    <SimpleTable v-if="isShow" :background.sync="curBackground" :columns="tableColumn" :show-msg.sync="showTextValue" />
    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" @clear="handleClear" />
    <van-overlay :show="scanLoading" :duration="0">
      <div class="loading_wrapper" @click.stop>
        <van-loading color="#ffffff" type="spinner">数据加载中</van-loading>
      </div>
    </van-overlay>
  </div>
</template>

<script>
import SimpleTable from '@/views/businessComponents/SimpleTable.vue'
import ActionBarVue from '../businessComponents/ActionBar.vue'
import { MISWMSAPI } from '@/api/generalAPI'
import { _showFailToast } from '@/utils/message'
const queryAPIName = 'mes/getDeliveryDate'
const cachedName = 'query.paymentDateOfMilitaryOrderInBT'
import dayjs from 'dayjs'
export default {
  name: cachedName,
  components: {
    SimpleTable,
    ActionBarVue
  },
  data() {
    return {
      barcode: '',
      curBackground: '',
      showTextValue: {},
      isShow: false,
      scanLoading: false,
      tableColumn: [
        { label: '图纸条码', prop: 'barcode' },
        { label: '物料编码', prop: 'materialNo' },
        { label: '军令状纳期', prop: 'deliveryDate' },
        { label: '项目工位', prop: 'projectStation' },
        { label: '生产批', prop: 'batchNo' },
        { label: '周别', prop: 'weeks' }
      ]
    }
  },
  mounted() {
    this.$refs?.inputRef?.focus()
  },
  methods: {
    getWeek(val) {
      let date = new Date(val)
      var date2 = new Date(date.getFullYear(), 0, 1)
      var day1 = date.getDay()
      if (day1 === 0) day1 = 7
      var day2 = date2.getDay()
      if (day2 === 0) day2 = 7
      let d = Math.round((date.getTime() - date2.getTime() + (day2 - day1) * (24 * 60 * 60 * 1000)) / 86400000)
      // 当周数大于52则为下一年的第一周
      if (Math.ceil(d / 7) + 1 > 52) {
        return 1
      }
      return Math.ceil(d / 7) + 1
    },
    async enterBarcode() {
      this.scanLoading = true
      try {
        this.$refs?.inputRef?.blur()
        let res = await MISWMSAPI.post(queryAPIName, {
          imBarcode: this.barcode
        })
        if (res && res.success) {
          this.isShow = true
          Object.assign(this.showTextValue, res.data)
          // 根据查询的军令状纳期动态修改背景颜色
          // 军令状纳期≤当天日期，明细渲染成红色
          // 军令状纳期-当天≤7天，明细渲染成黄色
          // 军令状纳期-当天日期＞7天，明细渲染成绿色
          let startTiem = dayjs(this.showTextValue.deliveryDate).format('YYYY-MM-DD')
          let endTiem = dayjs(new Date()).format('YYYY-MM-DD')
          const num = dayjs(startTiem).diff(endTiem, 'day')
          // 计算两个数的差距
          let num2 = this.getWeek(res.data.deliveryDate)
          this.showTextValue.weeks = num2
          if (num > 7) {
            this.curBackground = 'rgb(149, 242, 4)'
          } else if (num >= 1 && num <= 7) {
            this.curBackground = 'yellow'
          } else {
            this.curBackground = 'red'
          }
        } else {
          _showFailToast(res.msg)
        }
      } catch (e) {
        console.log(e)
      } finally {
        this.scanLoading = false
      }
    },
    handleClear() {
      this.barcode = ''
      this.showTextValue = {}
      this.isShow = false
      this.$refs?.inputRef?.focus()
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .van-action-bar-button--first,
::v-deep .van-action-bar-button--last {
  border-radius: 0;
}
.action_bar {
  height: 50px;
  position: fixed;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  .clear {
    flex: 1;
  }
}
.loading_wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
