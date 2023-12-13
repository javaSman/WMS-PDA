<template>
  <div>
    <div v-for="(item, index) in tableData" :key="index" class="item">
      <div class="content">
        <span class="label">条码</span>
        <span class="result">{{ item.barcode }}</span>
        <span class="special_text" @click="deleteHandler(index)">删除</span>
      </div>
      <div>
        <span class="label">物料编号</span>
        <span class="result">{{ item.matnr }}</span>
      </div>
      <div>
        <span class="label">批次号码</span>
        <span class="result">{{ index + 1 }}</span>
      </div>
      <div>
        <span class="label">转移数量</span>
        <span class="result">{{ item.qty }}</span>
      </div>
      <div>
        <span class="label">来源库位</span>
        <span class="result">{{ item.lgortLable }}</span>
      </div>
      <div>
        <span class="label">目标库位</span>
        <span class="result">{{ item.lgottLable }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { deepClone } from '@/utils'
export default {
  name: 'List',
  props: {
    tableData: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    deleteHandler(i) {
      let _tableData = deepClone(this.tableData)
      _tableData.splice(i, 1)
      this.$emit('update:tableData', _tableData)
    }
  }
}
</script>

<style lang="scss" scoped>
.item {
  width: 95%;
  background: #fff;
  margin-left: 1%;
  margin-right: 1%;
  margin-top: 5px;
  border-radius: 4px;
  border: 1px solid #ccc;
  padding: 0 5px;
  div {
    line-height: 40px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    border-bottom: 1px solid #ccc;
    &:last-child {
      border-bottom: none;
    }
    .label {
      display: inline-block;
      width: 100px;
      text-align: center;
      border-right: 1px solid #ccc;
    }
    .result {
      padding-left: 5px;
    }
      .special_text {
        margin-left: 38px;
        color: red;
        text-align: right;
        cursor: pointer;
      }
  }
}
</style>
