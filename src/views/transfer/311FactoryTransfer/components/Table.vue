<template>
  <div class="table_wrap">
    <div class="top_wrap">
      <div class="header">
        <div>选择</div>
        <div>批次号码</div>
        <div>批次数量</div>
        <div>转移数量</div>
      </div>
      <div v-for="(item, index) in tableData" :key="index" class="content">
        <div>
          <van-checkbox v-model="item.isSelect" />
        </div>
        <div>{{ index + 1 }}</div>
        <div>{{ item.erfmg }}</div>
        <div>{{ item.qty }}</div>
      </div>
    </div>
    <div class="bottom_wrap">
      <div class="cancel" @click="cancelHandler">返回</div>
      <div class="comfir" @click="comfirHandler">确认</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Table',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    tableData: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      value: ''
    }
  },
  methods: {
    cancelHandler() {
      this.$emit('update:visible', false)
    },
    comfirHandler() {
      this.$emit(
        'comfir',
        this.tableData.filter((item) => item.isSelect)
      )
    }
  }
}
</script>

<style lang="scss" scoped>
.table_wrap {
  width: 90%;
  height: 30%;
  background: #fff;
  .top_wrap {
    width: 100%;
    height: 100%;
    .header {
      width: 100%;
      line-height: 30px;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      background: blue;
      color: #fff;
      border-bottom: 1px solid #ccc;
      flex-direction: row;
      div {
        &:first-child {
          flex: 1;
        }
        flex: 2;
        border-right: 1px solid #ccc;
      }
    }
    .content {
      width: 100%;
      line-height: 30px;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      border-bottom: 1px solid #ccc;
      div {
        &:first-child {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
        }
        flex: 2;
        border-right: 1px solid #ccc;
      }
    }
  }
  .bottom_wrap {
    border-top: 1px solid #ccc;
    background: #fff;
    line-height: 40px;
    display: flex;
    flex-direction: row;
    div {
      flex: 1;
      cursor: pointer;
    }
    .comfir {
      color: #fff;
      background: blue;
    }
  }
}
</style>
