<template>
  <div>
    <ToggleFormVue
      ref="toggleFormVue"
      :form-list="formList"
      :show-form-list="showFormList"
      :table-column="tableColumn"
      :pass-a-p-i-name="passAPIName"
      :list-a-p-i-name="listAPIName"
      :is-pass="dataMap.isPass"
      :snrc.sync="dataMap.list"
      :barcode.sync="dataMap.barcode"
      :is-alter-message="true"
      scanl-key="barcode"
      @clickHandler="handleClickSerialNumber"
    />
    <serialNumberVue :visible.sync="dataMap.visible" :list="dataMap.list" :is-pass.sync="dataMap.isPass" :barcode="dataMap.barcode" />
  </div>
</template>

<script>
// Z31转移到结算仓/样机仓
const cachedName = 'transfer.Z31TransferToWarehouse'
import ToggleFormVue from '@/views/businessComponents/ToggleForm.vue'
import serialNumberVue from './serialNumber.vue'
import { formList, showFormList, tableColumn } from './config'

const passAPIName = 'divertBusiness/doPostZ31'
const listAPIName = 'divertBusiness/findListZ31'
export default {
  name: cachedName,
  components: {
    ToggleFormVue,
    serialNumberVue
  },
  data() {
    return {
      formList,
      showFormList,
      tableColumn,
      passAPIName,
      listAPIName,
      dataMap: {
        visible: false,
        list: [],
        isPass: false,
        barcode: '' // 扫码的条码值
      }
    }
  },
  watch: {
    'dataMap.list.length': {
      immediate: true,
      deep: true,
      handler(n) {
        if (n === 0) this.dataMap.isPass = true
      }
    }
  },
  methods: {
    /**
     * @description: 序列号按钮
     * @param key 当前的行prop
     * @param data 当前行数据
     * @param index 当前行下标
     */
    handleClickSerialNumber(data, index) {
      this.dataMap.visible = true
    }
  }
}
</script>
