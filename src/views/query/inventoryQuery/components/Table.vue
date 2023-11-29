<template>
  <div>
    <div v-for="(item, index) in tableData" :key="index" class="item">
      <div>
        <span class="label">行号</span>
        <span class="result">{{ index + 1 }}</span>
      </div>
      <div>
        <span>{{ item.ktext }}</span>
      </div>
      <div>
        <span class="label">非限制</span>
        <span class="result">{{ item.labst }}</span>
      </div>
      <div>
        <span class="label">质检</span>
        <span class="result">{{ item.insme }}</span>
      </div>
      <div>
        <span class="label">在途</span>
        <span class="result">{{ item.umlme }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Table',
  props: {
    tableData: {
      type: Array,
      default: () => []
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
  }
}
</style>
