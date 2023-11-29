<template>
  <div>
    <!-- 表单布局 -->
    <van-cell-group>
      <van-cell title-class="toggleFormCellTitle" style="padding-left: 0; padding-right: 0; border-radius: 0">
        <FormVue ref="formComponent" :form-data.sync="form" :form-list="formList" />
      </van-cell>
    </van-cell-group>
    <!-- 列表信息总览 -->
    <van-sticky :offset-top="46">
      <van-grid direction="horizontal" :column-num="3" :border="false" style="border-top: 1px solid #ccc; border-bottom: 1px solid #ccc">
        <van-grid-item>总数：{{ list.length }}</van-grid-item>
        <van-grid-item>已确认：{{ selection.length }}</van-grid-item>
        <van-grid-item>剩余数：{{ list.length - selection.length }}</van-grid-item>
      </van-grid>
    </van-sticky>
    <!-- 列表 -->
    <TableVue ref="table" :table-data.sync="list" :table-column="tableColumn" :selection.sync="selection" @input-num-handler="inputNumHandler" />

    <!-- 底部按钮 -->
    <ActionBarVue ref="actionBarVue" :loading="loading" :confirm-text="confirmText" @clear="handleClear" @confirm="handleConfirm" />
  </div>
</template>

<script>
import { getItem } from '@/utils/auth'
import FormVue from '@/components/Form/index.vue'
import TableVue from '@/components/singleTable/index.vue'
import ActionBarVue from '@/views/businessComponents/ActionBar.vue'

import { v4 as uuidv4 } from 'uuid'
import { WMSAPI } from '@/api/generalAPI'
import { AGVAPI } from '@/api/generalAGV'
import { _showFailToast, _showSuccessToast } from '@/utils/message'
import { formList, tableColumn } from './config'

export default {
  name: 'MaterialRackOutboundWMS',
  components: {
    FormVue,
    TableVue,
    ActionBarVue
  },
  data() {
    return {
      formList,
      tableColumn,
      form: {},
      confirmText: '确认',
      list: [], // 列表数据
      selection: [], // 选中的数据
      loading: false // 按钮loading
    }
  },
  created() {
    // this.getFocus('projectNo')
  },
  mounted() {
    WMSAPI.get('business/webapi', {}, 'GetWarehouseNos').then((res) => {
      this.formList[0].options = res.result
    })
    this.linkageEvent()
  },
  methods: {
    /** 聚焦 */
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
              this.handleEnter()
            }
            break
          }
          // 批次
          case 'batchNo': {
            item.change = () => {
              this.handleBatchNo()
            }
            break
          }
          // 工位号
          case 'stationNo': {
            item.change = () => {
              this.handleStationNo()
            }
            break
          }
          // 仓库
          case 'warehouseNo': {
            item.change = () => {
              this.handleWarehouseNo()
            }
            break
          }
          // 站点
          case 'agvSite': {
            item.change = () => {
              this.handleAgvSite()
            }
            break
          }
        }
      })
    },
    handleEnter() {
      WMSAPI.get('business/webapi', { projectNo: this.form.projectNo }, 'GetBatchNos').then((res) => {
        // console.log(res.result)
        if (res && res.success) {
          this.formList[3].options = res.result
        }
      })
    },
    handleBatchNo() {
      WMSAPI.get('business/webapi', { batchNo: this.form.batchNo, projectNo: this.form.projectNo }, 'GetStationNos').then((res) => {
        if (res && res.success) {
          this.formList[4].options = res.result
        }
      })
    },
    handleStationNo() {
      WMSAPI.get(
        'business/webapi',
        { warehouseNo: this.form.warehouseNo, stationNo: this.form.stationNo, projectNo: this.form.projectNo, getMaterialShelf: true },
        'GetBoxNos'
      ).then((res) => {
        if (res && res.success) {
          this.list = res.result
          this.list = this.list.filter((item) => {
            return item.materialShelfNo !== null
          })
          let _data = this.list
          console.log(this.list)
          this.list = _data.map((item) => ({
            ...item,
            uuid: uuidv4(),
            boxId: item.boxId,
            materialShelfNo: item.materialShelfNo,
            materialShelfStatus: item.materialShelfStatus
          }))
        }
      })
    },
    handleWarehouseNo() {
      WMSAPI.get('business/webapi', { warehouseNo: this.form.warehouseNo, projectNo: this.form.projectNo }, 'GetSiteNos').then((res) => {
        this.formList[1].options = res.result
      })
    },
    handleAgvSite() {
      this.getFocus('projectNo')
    },
    // 数量输入框的回调事件
    inputNumHandler(key, index) {
      console.log(key, index)
    },
    // 提交
    handleConfirm() {
      this.$refs.formComponent.$refs.refForm.validate().then(() => {
        if (this.selection.length === 0 || !this.selection[0].materialShelfNo) {
          _showFailToast({ message: '请选择有料架号的明细进行出库！', duration: 8 * 1000 })
        } else {
          let data = JSON.parse(JSON.stringify(this.selection))
          let user = getItem('Users')
          AGVAPI.post(
            'agv/webapi',
            {
              materialShelfNo: data[0].materialShelfNo,
              agvSite: this.form.agvSite,
              operatorNo: user.userName,
              operatorName: user.name
            },
            'ShelfOutStorage'
          ).then((res) => {
            if (res && res.success) {
              _showSuccessToast(res.message)
              this.handleClear()
            } else {
              _showFailToast(res.message)
            }
          })
        }
      })
    },
    // 清除按钮
    handleClear() {
      this.form = {}
      this.list = []
      this.selection = []
      this.formList[1].options = []
      this.formList[3].options = []
      this.formList[4].options = []
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
