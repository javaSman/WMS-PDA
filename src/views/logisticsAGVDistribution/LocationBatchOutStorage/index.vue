<template>
  <div>
    <FormVue ref="formComponent" :form-data.sync="form" :form-list.sync="formList" />
    <!-- 列表信息总览 -->
    <van-sticky :offset-top="46">
      <van-grid direction="horizontal" :column-num="3" :border="false" style="border-top: 1px solid #ccc; border-bottom: 1px solid #ccc">
        <van-grid-item>总数：{{ tableData.length }}</van-grid-item>
        <van-grid-item>已确认：{{ selection.length }}</van-grid-item>
        <van-grid-item>剩余数：{{ tableData.length - selection.length }}</van-grid-item>
        <!-- <van-grid-item>
        <van-checkbox v-model="selectAll" shape="square" @click="handleSelectAll">全选</van-checkbox>
      </van-grid-item> -->
      </van-grid>
    </van-sticky>
    <!-- 列表 -->
    <TableVue ref="table" :table-data.sync="tableData" :table-column="tableColumn" :selection.sync="selection" />
    <div style="height: 50px" />
    <ActionBarVue ref="actionBarVue" :loading="loading" :confirm-text="'确定'" @clear="handleClear" @confirm="handleQueryInstorage" />
  </div>
</template>

<script>
import { getItem } from '@/utils/auth'
import FormVue from '@/components/Form/index.vue'
import TableVue from '@/components/singleTable/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'
import { v4 as uuidv4 } from 'uuid'
import { WMSAPI } from '@/api/generalAPI'
import { formList, tableColumn } from './config'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { AGVAPI } from '@/api/generalAGV'
export default {
  name: 'LocationBatchOutStorage',
  components: { FormVue, ActionBarVue, TableVue },
  data() {
    return {
      APIName: 'business/webapi',
      apiname: 'agv/webapi',
      formList,
      tableColumn,
      form: {},
      tableData: [],
      selection: [],
      loading: false
    }
  },
  created() {
    this.wharf()
    // this.getFocus('projectNo')
  },
  mounted() {
    this.linkageEvent()
  },
  methods: {
    // 聚焦
    getFocus(params) {
      this.$nextTick(() => {
        this.$refs.formComponent.$refs[params][0].$children[0].focus()
      })
    },
    linkageEvent() {
      this.formList.forEach((item) => {
        switch (item.prop) {
          // 项目号
          case 'projectNo': {
            item.enter = () => {
              this.batch()
            }
            break
          }
          // 批次
          case 'batchNo': {
            item.change = () => {
              this.location()
            }
            break
          }
          // 工位
          case 'stationNo': {
            item.change = () => {
              this.getList()
            }
            break
          }
          // 仓库
          case 'warehouseNo': {
            item.change = () => {
              this.stations()
            }
            break
          }
          // 站点
          case 'siteNos': {
            item.change = () => {
              this.handleSite()
            }
          }
        }
      })
    },
    // 获取批次
    batch() {
      WMSAPI.get(this.APIName, { projectNo: this.form.projectNo }, 'GetBatchNos').then((res) => {
        if (res && res.success) {
          this.formList[3].options = res.result
        } else {
          _showFailToast(res.message)
        }
      })
    },
    // 获取工位号
    location() {
      WMSAPI.get(this.APIName, { batchNo: this.form.batchNo, projectNo: this.form.projectNo }, 'GetStationNos').then((res) => {
        if (res && res.success) {
          this.formList[4].options = res.result
        } else {
          _showFailToast(res.message)
        }
      })
    },
    // 获取仓库
    wharf() {
      WMSAPI.get(this.APIName, {}, 'GetWarehouseNos').then((res) => {
        if (res && res.success) {
          this.formList[0].options = res.result
        } else {
          _showFailToast(res.message)
        }
      })
    },
    // 获取站点
    stations() {
      WMSAPI.get(this.APIName, { warehouseNo: this.form.warehouseNo, projectNo: this.form.projectNo }, 'GetSiteNos').then((res) => {
        if (res && res.success) {
          this.formList[1].options = res.result
        } else {
          _showFailToast(res.message)
        }
      })
    },
    // 查询表格数据
    getList() {
      WMSAPI.get(
        this.APIName,
        { warehouseNo: this.form.warehouseNo, stationNo: this.form.stationNo, projectNo: this.form.projectNo },
        'GetBoxNos'
      ).then((res) => {
        if (res && res.success) {
          this.tableData = res.result
          // 混入唯一值，用于勾选数据
          this.tableData = this.tableData.map((item) => ({ ...item, uuid: uuidv4(), boxID: item.boxId }))
        }
      })
    },
    // 站点改变时
    handleSite() {
      this.getFocus('projectNo')
    },
    // 确定
    handleQueryInstorage() {
      this.$refs.formComponent.$refs.refForm.validate().then(() => {
        let user = getItem('Users')
        let data = JSON.parse(JSON.stringify(this.selection))
        let content = {
          boxNo: data[0].boxId,
          agvSite: this.form.siteNos,
          operatorNo: user.userName,
          operatorName: user.name
        }
        AGVAPI.post(this.apiname, content, 'BoxOutbound').then((res) => {
          if (res && res.success) {
            _showSuccessToast(res.message)
          } else {
            _showFailToast(res.message)
          }
        })
      })
    },
    // 清除
    handleClear() {
      this.form = {}
      this.tableData = []
      this.selection = []
      this.formList[1].options = []
      this.formList[3].options = []
      this.formList[4].options = []
    }
  }
}
</script>
