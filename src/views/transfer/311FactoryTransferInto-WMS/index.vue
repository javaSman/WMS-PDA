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
import { mapGetters } from 'vuex'
import { WMSAPI_WCF, MISWMSAPI } from '@/api/generalAPI'
const today = new Dates(new Date()).strftime('YYYY-MM-DD')
import { GetBoxInfoByBoxId } from '@/api/common'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
let originObj = {} // 备份原本的数据,过账时要把原本的数据传入头部的
export default {
  name: 'Transfer311FactoryTransferWMS',
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
      form: {},
      tableData: [],
      result: [],
      boxInfo: {},
      barcodeInfo: {},
      loading: false
    }
  },
  /* 获取当前登录人、登录账号 */
  computed: {
    ...mapGetters(['account', 'name'])
  },
  mounted() {
    this.initConfig()
    this.getTargetWarehouseDataList()
  },
  methods: {
    /* 回车事件绑定 */
    initConfig() {
      this.formList.forEach((item) => {
        /* 条码回车 */
        if (item.prop === 'imBarcode') {
          item.enter = this.barcodeEnter
        }
        if (item.prop === 'boxID') {
          item.enter = this.boxNoEnter
        }
        /* 转移数量回车 */
        if (item.prop === 'qty') {
          item.enter = this.erfmgEnter
        }
      })
    },
    /** 获取目标库位，一进入界面就调用 */
    async getTargetWarehouseDataList() {
      // let res = await requestWMS({
      //   method: 'POST',
      //   url: ' http://int.lyric-robot.com:8501/eip-mapp-sapwms-server/t001L/findT001LList'
      // })
      /* 获取目标库位接口 */
      let res = await MISWMSAPI.post('/t001L/findT001LList')
      if (res.success) {
        this.formList[2].options = res.data.map((item) => ({
          text: `${item.werks}-${item.lgort}/${item.lgobe}`,
          value: `${item.werks}-${item.lgort}/${item.lgobe}`
        }))
      }
      /* 测试数据 */
      // this.formList[2].options = [
      //   {
      //     text: '2288-1000/成品仓',
      //     value: '2288-1000/成品仓'
      //   },
      //   {
      //     text: '2288-4904/二期双向智能仓',
      //     value: '2288-4904/二期双向智能仓'
      //   }
      // ]
    },

    /** 条码回车 */
    async barcodeEnter(val) {
      // if (this.result.length > 0 && this.result.some((item) => item.barcode === val)) {
      //   _showFailToast('当前条码已存在，请重新输入')
      //   this.form = {
      //     postDate: today
      //   }
      //   return
      // }
      let res = await WMSAPI_WCF.post('9037Wcf/WarehouseService.svc/rest/GetZxwmsXmbeBarcodeListRqitInfo', {
        IM_BARCODE: val,
        IM_OCLAS: 'XWMS311'
      })
      if (!res.IsError && res.ZxwmsXmbeBarcodeListRqitInfo) {
        let _data = (this.barcodeInfo = res.ZxwmsXmbeBarcodeListRqitInfo)
        // tips:然后用上面的返回值的继续调用下一个接口,这里的特殊是imBaroce要传入的是工厂-库位
        let res2 = await WMSAPI_WCF.post('9037Wcf/WarehouseService.svc/rest/ZxwmsXmbeCommonListMrp', {
          imOclas: 'XWMS311',
          imBarcode: `${_data.WERKS}-${_data.LGORT}`,
          IM_MATNR: _data.MATNR
        })
        if (!res2.IsError) {
          let _title = res2.data[0]
          // 保留一份原本的数据用于过账
          originObj = _title
          // tips:这里老系统应该用的title值，因为界面并不会显示多条内容
          // 更新顶部信息
          Object.assign(this.form, _title)
          this.$set(this.form, 'receiveWharehouse', `${_title.werks}-${_title.lgort}`)
          this.$set(this.form, 'matnr', _title.matnr.replace(/^0+/gi, ''))
          this.$set(this.form, 'maktx', _title.maktx)
        } else {
          _showFailToast(res2.message)
        }
      }
    },

    /* 载具回车 */
    async boxNoEnter(val) {
      if (!val) return
      // 调用接口带出区域，如果区域有值，光标跳转到条码，没有跳转到区域
      let res = await GetBoxInfoByBoxId(val)
      // 判断箱子号是否存在
      if (res.success) {
        // 判断箱子号是否可以带出货位
        if (res.locationNo) {
          this.boxInfo = {
            boxID: val,
            locationNo: res.locationNo
          }
          this.$set(this.form, 'locationID', res.locationNo) // locationID 字段根据需求
          this.barcodeInputRef?.focus()
        } else {
          this.areaInputRef?.focus()
        }
      } else {
        _showFailToast(res.message)
        if (res.message.includes('没有绑定货位')) {
          this.areaInputRef?.focus()
        } else {
          this.boxInputRef?.focus() // boxInputRef 字段根据需求
          this.$set(this.form, 'boxID', '')
        }
        this.$set(this.form, 'locationID', '')
      }
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
          barcode: this.form.imBarcode,
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
      // tips:混入来源库位与目标库位信息数据展示
      let arr = data.map((item) => ({
        ...item,
        lgortLable: this.form.receiveWharehouse,
        lgottLable: this.form.targetWharehouse.match(/(\S*)\//)[1],
        zxstXmbeStruList: {
          ...originObj,
          erfmg: this.form.qty,
          lgott: this.form.targetWharehouse.match(/(\S*)\//)[1].split('-')[1],
          werkt: this.form.targetWharehouse.match(/(\S*)\//)[1].split('-')[0]
        },
        wmsPostInList: {
          /* 箱子信息中取 */
          boxID: this.boxInfo.boxID, // 所属载具
          locationID: this.boxInfo.locationNo, // 货位
          /* 条码信息中取 */
          materialID: this.barcodeInfo.MATNR, // 物料号
          materialDesc: this.barcodeInfo.MAKTX, // 物料描述
          barcode: this.barcodeInfo.OBJNR, // 物料条码
          batchID: this.barcodeInfo.PRODBATCH, // 批次
          projectID: this.barcodeInfo.PROJE, // 项目号
          /* 另外获取 */
          quantity: this.form.qty, // 入库数量
          cardNo: this.account, // 工号
          cardName: this.name, // 姓名
          /* 过账信息中获取 */
          stationID: originObj.workt, // 工位号
          oclas: originObj.oclas, // 移动类型
          ngeln: originObj.ngeln, // ECN号
          resultMsg: originObj.ebeln, // Sap过账凭证消息
          poid: originObj.ebelp, // 采购单号
          poItemNo: originObj.umidr, // 采购单行号
          proofNumber: originObj.mblnr // 物料凭证
        }
      }))
      /* 进行数据叠加 */
      this.result.push(...arr)
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
          iM_OCLAS: 'XWMS311', // 移动类型
          IM_CARDNO: this.account, // 登录人工号
          IM_CARDNAME: this.name, // 登录人姓名
          // warehouseNo: `${originObj.werks}-${originObj.lgort}`, // 仓库编号
          zxstXmbeStruList: this.result.map((item) => item.zxstXmbeStruList), // Sap过账明细
          wmsPostInList: this.result.map((item) => item.wmsPostInList) // WMS过账明细
        }
        console.log(result)
        await this.$dialog.confirm({
          message: '是否确认过账?'
        })
        this.loading = true

        let res = await WMSAPI_WCF.post('9037Wcf/WarehouseService.svc/rest/PostIn', result)
        _showSuccessToast(res.message)
        this.handleClear()
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
