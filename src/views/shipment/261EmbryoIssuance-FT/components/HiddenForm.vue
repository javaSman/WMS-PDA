<template>
  <div>
    <div v-for="(item, i) in list" :key="i" class="wrapper">
      <div class="row">
        <span class="label">机加件</span>
        <span class="content">{{ item.sjpno }}</span>
        <span style="color: red" class="operate" @click="deleteItem(i)">删除</span>
      </div>
      <div class="row">
        <span class="label">条码</span>
        <span class="content">{{ item.barcode }}</span>
      </div>
      <div class="row">
        <span class="label">描述</span>
        <span class="content">{{ item.zzdoex }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HiddenForm',
  components: {},
  props: {
    list: { type: Array, default: () => [] } // 清单列表数据
  },
  methods: {
    // 删除某一项
    deleteItem(i) {
      this.$dialog
        .confirm({
          title: '提示',
          message: '确认删除当前项目？'
        })
        .then(() => {
          let target = this.list.filter((_, index) => index !== i)
          this.$emit('update:list', target)
        })
        .catch(() => {
          // on cancel
        })
    }
  }
}
</script>

<style scoped lang="scss">
.wrapper {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  background-color: #fff;
  font-size: 13px;
  margin-bottom: 5px;
  .row {
    width: 100%;
    line-height: 25px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    position: relative;
    border-bottom: 1px solid #eeecec;
    .operate {
      position: absolute;
      right: 10px;
    }
    .label {
      padding-right: 5px;
      width: 100px;
      padding-left: 20px;
    }
  }
}
</style>
