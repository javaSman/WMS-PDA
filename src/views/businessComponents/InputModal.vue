<template>
  <div>
    <van-overlay :show="visible">
      <div class="wrapper">
        <div class="context">
          <div class="tips">{{ tipsMsg }}</div>
          <div class="inputItem">
            <van-field ref="inputNumber" v-model="value" type="number" placeholder="请输入数量" @keyup.enter="comfirNumber" />
            <div class="back">
              <span @click="coloseMocal">返回</span>
            </div>
            <van-button block color="green" class="btn" @click="comfirNumber">确定</van-button>
          </div>
        </div>
      </div>
    </van-overlay>
  </div>
</template>

<script>
import { _showFailToast } from '@/utils/message'
export default {
  name: 'InputModal',
  props: {
    visible: { type: Boolean, default: () => false },
    tipsMsg: {
      type: String,
      default: '请输入数量'
    }
  },
  data() {
    return {
      authLoading: false,
      value: null
    }
  },
  watch: {
    visible(n) {
      if (!n) {
        this.value = null
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.$refs.inputNumber.$refs.input.focus()
    }, this)
  },
  methods: {
    // 关闭校验框
    // TODO 此处应该跳转路由，暂定关闭
    coloseMocal() {
      this.$emit('update:visible', false)
    },
    // 确认登陆授权,此处调用登陆接口（暂定）
    async comfirNumber() {
      if (this.value && Number(this.value) > 0) {
        this.$emit('inputNumber', this.value)
        this.$emit('update:visible', false)
      } else {
        _showFailToast('数量不能为空且必须大于0')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 14px;
}

.context {
  width: 95%;
  height: auto;
  border-radius: 6px;
  background-color: #fff;
  position: relative;
  padding: 10px;
  box-sizing: border-box;

  .title {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    column-gap: 10px;

    .title_name {
      font-size: 18px;
      font-weight: 400;
    }
  }

  .tips {
    color: rgba(45, 17, 215, 0.9);
    text-align: left;
    margin-top: 5px;
  }

  .inputItem {
    margin-top: 20px;

    input {
      width: 100%;
      border: none;
      border-bottom: 1px solid #ccc;
    }
  }

  .back {
    margin-top: 10px;
    text-align: right;
    color: rgba(45, 17, 215, 0.9);
  }

  .btn {
    margin-top: 10px;
  }
}
</style>
