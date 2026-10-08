<template>
  <div class="login">
    <div class="login-box">
      <img src="@/assets/login/login-l.png" alt />
      <div class="login-form">
        <el-form ref="loginForm" :model="loginForm" :rules="loginRules">
          <div class="login-form-title">
            <img style="width:149px;height:38px" src="@/assets/login/icon_logo.png" alt />
          </div>
          <el-form-item prop="username">
            <el-input type="text" auto-complete="off" placeholder="账号" prefix-icon="iconfont icon-user" v-model="loginForm.username" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input type="password" placeholder="密码" prefix-icon="iconfont icon-lock" v-model="loginForm.password" @keyup.enter.native="handleLogin" />
          </el-form-item>
          <el-form-item style="width:100%">
            <el-button class="login-btn" style="width:100%" :loading="loading" size="medium" type="primary" @click.prevent.native="handleLogin">
              <span v-if="!loading">
                登录
              </span>
              <span v-else>
                登录中...
              </span>
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Route } from 'vue-router'
import { Form as ElForm, Input } from 'element-ui'
import { UserModule } from '@/store/modules/user'
import { isValidUsername } from '@/utils/validate'

@Component({
  name: 'Login',
})
export default class extends Vue {
  private validateUsername = (rule: any, value: string, callback: Function) => {
    if (!value) {
      callback(new Error('请输入用户名'))
    } else {
      callback()
    }
  }
  private validatePassword = (rule: any, value: string, callback: Function) => {
    if (value.length < 6) {
      callback(new Error('密码必须在6位以上'))
    } else {
      callback()
    }
  }
  private loginForm = {
    username: 'admin',
    password: '123456',
  } as {
    username: String
    password: String
  }

  loginRules = {
    username: [{ validator: this.validateUsername, trigger: 'blur' }],
    password: [{ validator: this.validatePassword, trigger: 'blur' }],
  }
  private loading = false
  private redirect?: string

  @Watch('$route', { immediate: true })
  private onRouteChange(route: Route) {}

  // 登录
  private handleLogin() {
    ;(this.$refs.loginForm as ElForm).validate(async (valid: boolean) => {
      if (valid) {
        this.loading = true
        await UserModule.Login(this.loginForm as any)
          .then((res: any) => {
            if (String(res.code) === '1') {
              this.$router.push('/')
            } else {
              // this.$message.error(res.msg)
              this.loading = false
            }
          })
          .catch(() => {
            // this.$message.error('用户名或密码错误！')
            this.loading = false
          })
      } else {
        return false
      }
    })
  }
}
</script>

<style lang="scss">
.avatar-uploader .el-upload {
  border-radius:4px!important;
  background:#fcfcfc;
}
.avatar-uploader .avatar-uploader-icon {
  background:#fcfcfc;
}
.avatar-uploader .el-icon-plus:before {
  content:"\4E0A\4F20\56FE\7247"!important;
  font-size:12px;
  color:#000;
}
.el-dialog {
  border-radius:8px;
}
.el-dialog__header {
  background:#fbfbfa;
  border-radius:8px 8px 0 0;
  border:none;
}
.login {
  -webkit-box-pack:center;
  -ms-flex-pack:center;
  justify-content:center;
  -webkit-box-align:center;
  -ms-flex-align:center;
  align-items:center;
  height:100%;
  background-color:#333;
}
.login,.login-box {
  display:-webkit-box;
  display:-ms-flexbox;
  display:flex;
}
.login-box {
  width:1000px;
  height:474.38px;
  border-radius:8px;
}
.login-box img {
  width:60%;
  height:auto;
}
.title {
  margin:0 auto 10px auto;
  text-align:left;
  color:#707070;
}
.login-form {
  background:#fff;
  width:40%;
  border-radius:0 8px 8px 0;
  display:-webkit-box;
  display:-ms-flexbox;
  display:flex;
  -webkit-box-pack:center;
  -ms-flex-pack:center;
  justify-content:center;
  -webkit-box-align:center;
  -ms-flex-align:center;
  align-items:center;
}
.login-form .el-form {
  width:214px;
  height:307px;
}
.login-form .el-form-item {
  margin-bottom:30px;
}
.login-form .el-form-item.is-error .el-input__inner {
  border:0!important;
  border-bottom:1px solid #fd7065!important;
  background:#fff!important;
}
.login-form .input-icon {
  height:32px;
  width:18px;
  margin-left:-2px;
}
.login-form .el-input__inner {
  border:0;
  border-bottom:1px solid #e9e9e8;
  border-radius:0;
  font-size:12px;
  font-weight:400;
  color:#333;
  height:32px;
  line-height:32px;
}
.login-form .el-input__prefix {
  left:0;
}
.login-form .el-input--prefix .el-input__inner {
  padding-left:26px;
}
.login-form .el-input__inner::-webkit-input-placeholder {
  color:#aeb5c4;
}
.login-form .el-input__inner::-moz-placeholder {
  color:#aeb5c4;
}
.login-form .el-input__inner:-ms-input-placeholder {
  color:#aeb5c4;
}
.login-form .el-input__inner::-ms-input-placeholder {
  color:#aeb5c4;
}
.login-form .el-input__inner::placeholder {
  color:#aeb5c4;
}
.login-form .el-form-item--medium .el-form-item__content,.login-form .el-input--medium .el-input__icon {
  line-height:32px;
}
.login-btn {
  border-radius:17px;
  padding:11px 20px!important;
  margin-top:10px;
  font-size:12px;
  border:0;
  font-weight:500;
  color:#333;
  background-color:#ffc200;
}
.login-btn:focus,.login-btn:hover {
  background-color:#ffc200;
  color:#fff;
}
.login-form-title {
  height:36px;
  display:-webkit-box;
  display:-ms-flexbox;
  display:flex;
  -webkit-box-pack:center;
  -ms-flex-pack:center;
  justify-content:center;
  -webkit-box-align:center;
  -ms-flex-align:center;
  align-items:center;
  margin-bottom:40px;
}
.login-form-title .title-label {
  font-weight:500;
  font-size:20px;
  color:#333;
  margin-left:10px;
}
</style>
