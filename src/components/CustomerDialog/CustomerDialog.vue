<template>
  <div class="pda_customer--marsk">
    <div class="alert">
      <div class="alert-title">
        <img src="../../assets/img/u92.svg" alt="" />
        <span>提示</span>
      </div>
      <div v-if="!isCustomer" class="alert-content">
        {{ countPrefix }}
        <span style="color: red; font-size: 20px; font-weight: 600">{{ count }}</span>
        {{ countSuffix }}
        {{ totalPrefix }}
        <span style="color: green; font-size: 20px; font-weight: 600">{{ total }},</span>
        {{ totalSuffix }}
      </div>
      <div v-else class="alert-content" v-html="customerHtml" />
      <div class="alert-btn">
        <div class="cancle" @click="close">取消</div>
        <div class="comfir" @click="comfir">确定</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CustomerDialog',
  data() {
    return {
      // 是否完全自定义内容
      isCustomer: false,
      count: 1,
      total: 33,
      countPrefix: '本次过账共',
      countSuffix: '条数据,',
      totalPrefix: '累计退货数量',
      totalSuffix: '确定过账吗?',
      promiseStatus: null,
      customerHtml: ''
    }
  },
  mounted() {
    this.init()
  },
  methods: {
    init() {
      return new Promise((resolve, reject) => {
        this.promiseStatus = { resolve, reject }
      })
    },
    close() {
      if (this.$el.parentNode) {
        // 先判断是否有父节点
        this.$el.parentNode.removeChild(this.$el)
      } // 把该节点从父节点中删除
      this.promiseStatus && this.promiseStatus.reject('已取消')
      this.$destroy() // 卸载组件
    },
    comfir() {
      if (this.$el.parentNode) {
        // 先判断是否有父节点
        this.$el.parentNode.removeChild(this.$el)
      } // 把该节点从父节点中删除
      this.promiseStatus && this.promiseStatus.resolve('comfir')
      this.$destroy() // 卸载组件
    }
  }
}
</script>

<style lang="scss" scoped>
body {
  position: fixed;
  left: 0;
  width: 100%;
}
.pda_customer--marsk {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(26, 25, 25, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  font-size: 14px;
  .alert {
    width: 90%;
    background: #fff;
    box-sizing: border-box;
    border-radius: 10px;
    padding: 10px;
    .alert-title {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      flex-direction: row;
      img {
        width: 20px;
        height: 20px;
      }
      span {
        padding-left: 10px;
      }
      color: #333;
      font-size: 18px;
    }
    .alert-content {
      padding: 20px;
      text-align: left;
    }
    .alert-btn {
      height: 30px;
      font-size: 16px;
      width: 100%;
      display: flex;
      justify-content: flex-start;
      align-content: center;
      border-top: 1px solid #ccc;
      .cancle {
        width: 50%;
        color: red;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .comfir {
        width: 50%;
        color: green;
        border-left: 1px solid #ccc;
        display: flex;
        justify-content: center;
        cursor: pointer;
        align-items: center;
      }
    }
  }
}
</style>
