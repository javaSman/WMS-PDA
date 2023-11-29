<template>
  <div :style="{ background: background }">
    <div v-for="item in columns" :key="item.prop" class="item">
      <div class="label">{{ item.label }}</div>
      <div class="content">{{ showMsg[item.prop] }}</div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'SimpleTable',
  props: {
    columns: { type: Array, default: () => [] },
    showMsg: { type: Object, default: null },
    background: { type: String, default: null }
  }
}
</script>
<style lang="scss" scoped>
.item {
  line-height: 25px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 0 5px;
  border: 1px solid #ccc;
  font-size: 12px;
  .label {
    flex: 1;
    text-align: left;
    border-right: 1px solid #ccc;
  }
  .content {
    flex: 4;
    text-align: left;
    padding-left: 5px;
  }
}
</style>
