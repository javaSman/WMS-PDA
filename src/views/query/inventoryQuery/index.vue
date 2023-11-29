<template>
  <div>
    <!-- 表单布局 -->
    <van-cell-group>
      <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
        <template>
          <FormVue ref="formComponent" :form-data.sync="form" :form-list.sync="formList" />
        </template>
      </van-cell>
      <van-cell>
        <div ref="outer" class="scrollText">
          <div class="label">物料描述</div>
          <div class="st-inner" :class="{ 'st-scrolling': needToScroll }">
            <span ref="inner" class="st-section">{{ form2.maktx }}</span>
            <!-- 加两条是为了滚动的时候实现无缝衔接 -->
          </div>
        </div>
      </van-cell>
      <van-cell>
        <span>总数</span>
        <span style="padding-left: 20px">{{ form2.exTtqty }}</span>
        <span style="padding-left: 20px">{{ form2.exMeins }}</span>
      </van-cell>
    </van-cell-group>
    <Table v-if="show" :table-data="tableData" />
    <!-- 底部按钮 -->
    <div style="height: 50px" />
    <ActionBarVue ref="actionBarVue" :loading="loading" :confirm-text="'查询'" @clear="handleClear" @confirm="handleQueryInventory" />
  </div>
</template>

<script>
// 库存查询
import Table from './components/Table.vue'
import FormVue from '@/components/Form/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { MISWMSAPI } from '@/api/generalAPI'
import { formList } from './config'
import { _showFailToast } from '@/utils/message'
const cachedName = 'query.inventoryQuery'
let tempInfo = {} // 中转信息载体
export default {
  name: cachedName,
  components: {
    FormVue,
    ActionBarVue,
    Table
  },
  data() {
    return {
      needToScroll: false,
      tableData: [],
      formList,
      form: {},
      form2: {
        maktx: '',
        exTtqty: 0,
        exMeins: ''
      },
      show: false,
      loading: false
    }
  },
  beforeDestroy() {
    this.stopScroll()
  },
  mounted() {
    this.initConfig()
  },
  methods: {
    initConfig() {
      this.formList.forEach((item) => {
        if (item.prop === 'lgort') {
          item.change = this.lgortChange
        }
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
        }
        if (item.prop === 'matnr') {
          item.enter = this.materialEnter
        }
      })
    },
    /** 条码回车 */
    async barcodeEnter(val) {
      let res = await MISWMSAPI.post('/getData/getValidBarcode', {
        imBarcode: val
      })
      // 查条码只有可能有一条结果的
      if (res.success && res.data) {
        let _data = res.data
        let logrt_werkes = `${_data.werks}-${_data.lgort}`
        // tips：取出工厂库位，赋值到下拉列表中
        this.formList[2].options = [{ text: logrt_werkes, value: logrt_werkes }]
        // 默认选择第一条工厂库位
        this.$set(this.form, 'lgort', logrt_werkes)
        // 同时默认赋值物料编号
        this.$set(this.form, 'matnr', _data.matnr)
        let res2 = await MISWMSAPI.post('/getData/getMateStockStock', {
          imBarcode: _data.matnr,
          imLgort: _data.lgort,
          imWerks: _data.werks
        })
        if (res2.success) {
          let _data2 = res2.data.data
          let title = res2.data.title
          // 赋值物料描述和数量单位等信息
          this.form2 = {
            maktx: _data.maktx,
            exMeins: title.exMeins,
            exTtqty: title.exTtqty
          }
          // tips:如果_data2是空的那就不显示表格，如果有值就赋值给表格并显示
          if (_data2 && _data2.length > 0) {
            console.log('赋值表格')
            this.tableData = _data2
            this.show = true
            // tips:扫码条码一般没有下面这个东西
          }
        }
      } else {
        _showFailToast(res.message)
      }
    },
    /** 物料回车 */
    async materialEnter(val) {
      let res = await MISWMSAPI.post('/getData/getMateStock', {
        imMatnr: val
      })
      if (res.success && res.data.length > 0) {
        // 分组其中的工厂库位赋值选择器，然后默认选中第一个
        let _data = res.data[0]
        // 保留这个信息，当切换工厂库位时需要这里面的物料号信息
        tempInfo = res.data[0]
        this.formList[2].options = res.data.map((item) => ({
          text: `${item.werks}-${item.lgort}`,
          value: `${item.werks}-${item.lgort}`
        }))
        this.$set(this.form, 'lgort', this.formList[2].options[0].value)
        // tips:这样要发起另一个接口取获取对应的列表等信息和头部的库存信息,这个接口的特殊之处在于imBarcode是传入物料编号的
        let res2 = await MISWMSAPI.post('/getData/getMateStockStock', {
          imBarcode: _data.matnr,
          imLgort: _data.lgort,
          imWerks: _data.werks
        })
        if (res2.success) {
          let _data2 = res2.data.data
          let title = res2.data.title
          // 赋值物料描述和数量单位等信息
          this.form2 = {
            maktx: _data.maktx,
            exMeins: title.exMeins,
            exTtqty: title.exTtqty
          }
          // tips:如果_data2是空的那就不显示表格，如果有值就赋值给表格并显示
          if (_data2 && _data2.length > 0) {
            this.tableData = _data2
            this.show = true
          }
        }
      } else {
        _showFailToast(res.message)
      }
    },
    /** 当工厂库位切换时，调用接口查询数据 */
    async lgortChange(val) {
      if (val) {
        let [werks, lgort] = val.split('-')
        // tips:注意，此时切换工厂库位时，这个imBarcode要传入的是物料编码
        let res = await MISWMSAPI.post('/getData/getMateStockStock', {
          imBarcode: tempInfo.matnr,
          imLgort: lgort,
          imWerks: werks
        })
        if (res.success) {
          let _data2 = res.data.data
          let title = res.data.title
          // 赋值物料描述和数量单位等信息
          this.form2 = {
            maktx: tempInfo.maktx,
            exMeins: title.exMeins,
            exTtqty: title.exTtqty
          }
          // tips:如果_data2是空的那就不显示表格，如果有值就赋值给表格并显示
          if (_data2 && _data2.length > 0) {
            this.tableData = _data2
            this.show = true
          }
        }
      }
    },
    // 查询
    async handleQueryInventory(val) {},
    // 清除
    handleClear() {
      this.form = {}
      this.form2 = {}
      this.tableData = []
      this.tempInfo = []
      this.show = false
      this.formList[2].options = []
    },
    // 判断子元素宽度是否大于父元素宽度，超出则需要滚动，否则不滚动
    isOverflow() {
      let outer = this.$refs.outer
      let inner = this.$refs.inner
      let outerWidth = this.getWidth(outer)
      let innerWidth = this.getWidth(inner)
      return innerWidth > outerWidth - 60
    },

    // 获取元素宽度
    getWidth(el) {
      let { width } = el.getBoundingClientRect()
      return width
    },
    // 增加定时器，隔一秒check一次
    startScroll() {
      this.$nextTick(() => {
        let flag = this.isOverflow()
        this.needToScroll = flag
      })
    },
    // 关闭定时器
    stopScroll() {
      clearInterval(this._checkTimer)
    }
  }
}
</script>

<style lang="scss" scoped>
.scrollText {
  overflow: hidden;
  white-space: nowrap;
  padding-left: 60px;
  .label {
    position: absolute;
    left: 0px;
    z-index: 1;
    background: #fff;
  }
}
.st-inner {
  width: calc(100% - 60px);
  display: inline-block;
}
.st-section {
  font-size: 13px;
  color: #8c8a8a;
}
/* 向左匀速滚动动画 */
.st-scrolling {
  animation: 6s scroll infinite linear;
}

@keyframes scroll {
  0% {
    transform: translate3d(0%, 0, 0);
  }
  100% {
    transform: translate3d(-100%, 0, 0);
  }
}
</style>
