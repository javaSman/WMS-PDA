<template>
  <van-popup v-model="show" get-container="body" position="bottom" :close-on-click-overlay="true" class="externalPop">
    <div class="modalBlock">
      <van-button type="info" size="small" class="normal-btn btn-line" to="external/externalHandle/toDepot">
        <div class="btn-content">
          <span>机加</span>
          <div class="arrow-box">
            <svg
              t="1679734262926"
              class="icon"
              viewBox="0 0 1219 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              p-id="15844"
              width="16"
              height="16"
            >
              <path
                d="M735.550917 1024a24.380209 24.380209 0 0 1-16.090939-6.095052 24.380209 24.380209 0 0 1-2.194218-34.376096l287.442668-328.40142a24.45335 24.45335 0 0 1 36.814116 32.181877l-287.68647 328.40142a24.380209 24.380209 0 0 1-18.285157 8.289271zM1194.630259 499.825499H24.380209a24.380209 24.380209 0 0 1 0-48.760419h1102.229266L630.472214 43.184177A24.40459 24.40459 0 0 1 661.678882 5.638655l548.310909 451.033873A24.380209 24.380209 0 0 1 1194.630259 499.825499z"
                fill="#1296db"
                p-id="15845"
              />
            </svg>
          </div>
          <span>仓库</span>
        </div>
      </van-button>
      <van-button type="info" size="small" class="normal-btn btn-line" to="external/externalHandle/toValiSupplier">
        <div class="btn-content">
          <span>仓库</span>
          <div class="arrow-box">
            <svg
              t="1679734262926"
              class="icon"
              viewBox="0 0 1219 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              p-id="15844"
              width="16"
              height="16"
            >
              <path
                d="M735.550917 1024a24.380209 24.380209 0 0 1-16.090939-6.095052 24.380209 24.380209 0 0 1-2.194218-34.376096l287.442668-328.40142a24.45335 24.45335 0 0 1 36.814116 32.181877l-287.68647 328.40142a24.380209 24.380209 0 0 1-18.285157 8.289271zM1194.630259 499.825499H24.380209a24.380209 24.380209 0 0 1 0-48.760419h1102.229266L630.472214 43.184177A24.40459 24.40459 0 0 1 661.678882 5.638655l548.310909 451.033873A24.380209 24.380209 0 0 1 1194.630259 499.825499z"
                fill="#1296db"
                p-id="15845"
              />
            </svg>
          </div>
          <span>供应商</span>
        </div>
      </van-button>
      <van-button type="info" size="small" class="normal-btn btn-line" to="external/externalHandle/toMes">
        <div class="btn-content">
          <span>仓库</span>
          <div class="arrow-box">
            <svg
              t="1679734262926"
              class="icon"
              viewBox="0 0 1219 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              p-id="15844"
              width="16"
              height="16"
            >
              <path
                d="M735.550917 1024a24.380209 24.380209 0 0 1-16.090939-6.095052 24.380209 24.380209 0 0 1-2.194218-34.376096l287.442668-328.40142a24.45335 24.45335 0 0 1 36.814116 32.181877l-287.68647 328.40142a24.380209 24.380209 0 0 1-18.285157 8.289271zM1194.630259 499.825499H24.380209a24.380209 24.380209 0 0 1 0-48.760419h1102.229266L630.472214 43.184177A24.40459 24.40459 0 0 1 661.678882 5.638655l548.310909 451.033873A24.380209 24.380209 0 0 1 1194.630259 499.825499z"
                fill="#1296db"
                p-id="15845"
              />
            </svg>
          </div>
          <span>机加</span>
        </div>
      </van-button>
      <van-button type="info" size="small" class="cancel-btn" @click="show = false">取消</van-button>
    </div>
  </van-popup>
</template>

<script>
export default {
  name: 'ExternalMenu',
  props: {
    isShow: { type: Boolean, default: false }
  },
  data() {
    return {}
  },
  computed: {
    show: {
      get() {
        return this.isShow
      },
      set(val) {
        this.$emit('update:isShow', val)
      }
    }
  },
  methods: {}
}
</script>

<style scoped lang="scss">
.externalPop {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  .modalBlock {
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    .normal-btn {
      height: 40px;
      width: 100%;
      background-color: #ffffff;
      border: 0px;
      color: #1296db;
      font-size: 16px;
    }
    .cancel-btn {
      height: 40px;
      width: 100%;
      background-color: #ffffff;
      border: 0px;
      color: #7d7d7d;
      font-size: 16px;
    }
    .btn-content {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: row;
    }
    .arrow-box {
      width: 16px;
      height: 16px;
      padding: 0px 5px;
    }
    .btn-line {
      border-bottom: 1px solid #f7f8f9;
    }
    .van-button ::before {
      background-color: yellow;
    }
  }
}
</style>
