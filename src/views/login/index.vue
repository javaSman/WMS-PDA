<template>
  <div class="login-container">
    <van-nav-bar :title="narBarTitle" />
    <div class="center-content">
      <van-form ref="loginForm" :model="loginForm" class="login-form" autocomplete="on" label-position="left" :show-error="false">
        <div>
          <van-image width="4rem" height="4rem" fit="cover" :src="require('../../assets/lyric.png')">
            <template v-slot:loading>
              <van-loading type="spinner" size="20" />
            </template>
          </van-image>
        </div>
        <van-cell-group class="group-containe">
          <van-cell class="cell-containe">
            <van-field
              ref="username"
              v-model="loginForm.username"
              :rules="loginRules.username"
              label="用户名"
              placeholder="请输入用户名"
              name="username"
              label-width="3em"
              type="texte"
              autocomplete="on"
              @keyup.enter="usernameEnter"
              @focus="inputFocus"
            >
              <span slot="left-icon" class="svg-container">
                <svg-icon icon-file-name="user" />
              </span>
            </van-field>
          </van-cell>
          <van-cell class="cell-containe">
            <van-field
              ref="password"
              v-model="loginForm.password"
              :rules="loginRules.password"
              label="密码"
              placeholder="请输入密码"
              name="username"
              label-width="3em"
              :type="isShowPassword ? 'text' : 'password'"
              autocomplete="on"
              @keyup.enter="passwordEnter"
            >
              <span slot="left-icon" class="svg-container">
                <svg-icon icon-file-name="password" />
              </span>
              <span slot="right-icon" class="show-pwd" @click="togglePassword">
                <svg-icon :icon-file-name="isShowPassword ? 'eye-open' : 'eye'" />
              </span>
            </van-field>
          </van-cell>
        </van-cell-group>
        <van-button native-type="button" round :loading="loading" type="info" style="width: 100%; margin: 15px 0" @click="handleLogin">
          登录
        </van-button>
      </van-form>
    </div>
  </div>
</template>

<script>
import defaultSettings from '@/settings'
export default {
  name: 'Login',
  data() {
    return {
      defaultSettings,
      narBarTitle: defaultSettings.narBarTitle, // 导航标题
      /** 登录表单 */
      loginForm: {
        username: '',
        password: ''
      },
      /** 登录表单验证 */
      loginRules: {
        username: [{ required: true, message: '用户名不能为空' }],
        password: [
          { required: true, message: '密码不能为空' },
          { pattern: /^.{6,}$/, message: '密码不能少于6位字符' }
        ]
      },
      isShowPassword: false,
      loading: false,
      redirect: undefined
    }
  },
  mounted() {
    this.$refs.username.focus()
  },
  methods: {
    /** 解决pda获取光标时软键盘弹出问题 */
    inputFocus() {
      // tips:获取光标瞬间设置只读属性可以阻止键盘弹起
      this.$refs.username.$refs.input.setAttribute('readonly', 'readonly')
      // this.$refs.inputRef.setAttribute('readonly', 'readonly')
      // tips:当键盘弹起被阻止后的200ms后移除这个属性，此时光标仍然会在输入框上，以此实现目的
      setTimeout(() => {
        this.$refs.username.$refs.input.removeAttribute('readonly')
      }, 200)
    },
    /** 用户名回车 */
    usernameEnter(e) {
      // console.log(e.target.value)
      this.loginForm.username = e.target.value.trim()
      this.$refs.loginForm
        .validate('username')
        .then(() => {
          this.$refs.password.focus()
        })
        .catch(() => {
          this.$refs.username.focus()
        })
    },
    passwordEnter(e) {
      this.loginForm.password = e.target.value.trim()
      this.handleLogin()
    },
    /** 密码显示与隐藏 */
    togglePassword() {
      this.isShowPassword = !this.isShowPassword
      this.$nextTick(() => {
        this.$refs.password.focus()
      })
    },
    /** 登录*/
    handleLogin() {
      this.loginForm
      this.$refs.loginForm.validate().then(async () => {
        this.loading = true
        // this.loginForm 是调用登录传递的数据。

        let _obj = {
          userName: this.loginForm.username,
          password: this.loginForm.password,
          client_id: 'basic-web',
          client_secret: '1q2w3e*',
          grant_type: 'password'
        }

        let _data = new FormData()
        for (let d in _obj) {
          _data.append(d, _obj[d])
        }
        try {
          let loginRes = await this.$store.dispatch('user/userLogin', _data)
          if (loginRes) {
            // await this.$store.dispatch('user/getUserInfo') // 获取登录账户信息 -存至缓存
            this.$toast.success({
              message: '登录成功',
              duration: 0
            })
            // let result = res.result.filter((item) => /^pda_*/g.test(item.name)).map((item) => item.name.replace(/pda_/g, ''))
            this.$router.push({ path: this.redirect || '/', query: this.otherQuery })
          }
        } catch (err) {
          // console.log(err)
          // if (err) {
          //   // debugger
          //   // this.$toast.fail(err)
          // }
        } finally {
          this.loading = false
        }
      })
    }
  }
}
</script>

<style scoped lang="scss">
.login-container {
  width: 100%;
  height: 100%;
  text-align: center;
  .svg-container {
    padding-right: 5px;
    display: inline-block;
  }
  .center-content {
    border-radius: 10px;
    background: #fafafa;
    width: 85%;
    text-align: center;
    margin-top: 10px;
    padding: 5%;
    display: inline-block;
    vertical-align: middle;
  }
  .group-containe {
    background: unset;
    // width: 90%;
    // margin: 10px auto;
  }
  // cell组外框线不显示
  .group-containe::after {
    border: none;
  }
  .cell-containe {
    padding: 0px 0px;
    overflow: unset;
    margin: 20px 0;
  }
  // 达到验证错误信息能显示的目的
  .cell-containe .van-cell__value,
  .van-field {
    overflow: unset;
  }
  // 使用下拉框组件，达到验证错误信息能显示的目的
  .fieldRadio ::v-deep .van-field {
    overflow: unset;
  }
  // 验证错误提示位置
  .cell-containe ::v-deep .van-field__error-message {
    position: absolute;
    top: 28px;
    left: -90px;
  }
}
</style>
