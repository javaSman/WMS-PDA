<template>
  <div class="vant-table">
    <table cellspacing="0" style="width: 100%" class="table">
      <thead>
        <tr>
          <th v-for="(item, index) in column" :key="index" class="th">{{ item.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in tableData" :key="index" class="list-tr" @click="clickRow(item)">
          <td v-for="(context, i) in column" :key="i">{{ item[context.prop] }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script>
const cachedName = 'VantTable'
export default {
  name: cachedName,
  props: {
    tableTitle: { type: String, default: '' }, // 表头标题
    column: { type: Array, default: () => [] }, // 表格字段列配置
    tableData: { type: Array, default: () => [] }, // 表格数据
    navShow: { type: Boolean, default: false } // 是否显示表格头标题
  },
  data() {
    return {}
  },
  methods: {
    clickRow(row) {
      this.$emit('clickRow', row)
    }
  }
}
</script>
<style scoped lang="scss">
// -------标题加横线
table tbody {
  display: block;
  overflow-y: scroll;
}
table thead,
tbody tr {
  display: table;
  table-layout: fixed;
  width: 98%;
}

// 表格样式
.vant-table {
  text-align: left;
  padding: 10px 10px 0px 10px;
  height: 100%;
  overflow: auto;
}
.vant-table {
  .table {
    border-radius: 10px;
    border-collapse: collapse;
    .th,
    .list-tr {
      font-size: 10px; // 最小12号|待优化
      line-height: 30px;
      letter-spacing: 0px; // 文字间距
    }
    .th {
      background-color: unset;
      color: unset;
      height: 25px;
    }
    tbody tr {
      background-color: #fff;
      border: 1px solid #000;
      margin: 10px 0;
    }
  }
}
</style>
