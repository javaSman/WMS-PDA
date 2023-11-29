<template>
  <div>
    <van-overlay :show="visible">
      <div class="wrapper">
        <div class="context">
          <div class="title">
            <SvgIcon icon-file-name="userAuth" />
            <span class="title_name">用户验证</span>
          </div>
          <div class="tips">{{ tipsMsg }}</div>
          <div class="inputItem">
            <van-field
              ref="authUserName"
              v-model="userInfo.account"
              type="text"
              placeholder="请输入用户名"
              clearable
              clear-trigger="always"
              @keyup.enter="comfirmUserName"
            />
            <!-- <input ref="authUserName" v-model="userInfo.account" placeholder="请输入账号" @keyup.enter="comfirmUserName" /> -->
            <div class="inputItem">
              <van-field
                ref="authPassword"
                v-model="userInfo.password"
                type="password"
                placeholder="请输入密码"
                clearable
                clear-trigger="always"
                @keyup.enter="comfirmPassword"
              />
              <!-- <input ref="authPassword" v-model="userInfo.password" placeholder="请输入密码" type="password" @keyup.enter="comfirmPassword" /> -->
            </div>
            <div class="back">
              <span @click="coloseMocal">返回</span>
            </div>
            <van-button block color="green" :loading="authLoading" class="btn" @click="comfirAuth">确定</van-button>
          </div>
        </div>
      </div>
    </van-overlay>
  </div>
</template>

<script>
import SvgIcon from '@/components/SvgIcon/index.vue'
import { WMSLogin } from '@/api/login'
import { _showFailToast } from '@/utils/message'

export default {
  name: 'UserAuth',
  components: { SvgIcon },
  props: {
    visible: { type: Boolean, default: () => false },
    extra: { type: Object, default: null },
    tipsMsg: {
      type: String,
      default: '请输入接收人！'
    }
  },
  data() {
    return {
      userInfo: {
        account: '',
        password: ''
      },
      authLoading: false
    }
  },
  mounted() {
    // tips:打开弹窗之后自动聚焦到用户名列表
    this.$nextTick(() => {
      this.$refs.authUserName.$refs.input.focus()
    })
  },
  methods: {
    // 关闭校验框
    // TODO 此处应该跳转路由，暂定关闭
    coloseMocal() {
      this.$emit('update:visible', false)
      this.$router.go(-1)
    },
    comfirmUserName(e) {
      this.userInfo.account = e.target.value.trim()
      this.$refs.authPassword.$refs.input.focus()
    },
    comfirmPassword(e) {
      this.userInfo.password = e.target.value.trim()
      this.comfirAuth()
    },
    // 确认登陆授权,此处调用登陆接口（暂定）
    async comfirAuth() {
      let { userInfo } = this
      try {
        if (userInfo.account && userInfo.password) {
          this.authLoading = true
          // TODO 现在所有鉴权的接口都使用WMS登录接口
          let _obj = {
            userName: userInfo.account,
            password: userInfo.password,
            client_id: 'basic-web',
            client_secret: '1q2w3e*',
            grant_type: 'password'
          }
          let _data = new FormData()
          for (let d in _obj) {
            _data.append(d, _obj[d])
          }
          let res = await WMSLogin(_data)
          if (res.access_token) {
            // let res2 = await getuserInfo(userInfo.account)
            // 获取store的账号和名称+这次鉴权人的账号和名称合并成一个参数给外部
            let localUser = this.$store.state.user
            let combineParams = {
              cardmo: localUser.account,
              cardmame: localUser.name,
              cardno: res.users_name,
              cardname: res.name
            }
            // 放入缓存
            this.$store.commit('user/SET_AUTH_USER_INFO', combineParams)
            this.$emit('update:extra', combineParams)
            this.$emit('update:visible', false)
            // 这里放一个事件出去,某些业务可能需要授权后再调用过账业务的
            this.$emit('comfir', combineParams)
          } else {
            _showFailToast(res.error_description)
          }
          this.authLoading = false
        } else {
          _showFailToast('账号和密码不允许为空')
        }
      } catch {
        this.authLoading = false
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
