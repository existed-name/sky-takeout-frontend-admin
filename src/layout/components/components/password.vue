<template>
  <el-dialog
    class="pwdCon"
    title="修改密码"
    :visible="dialogFormVisible"
    width="568px"
    @update:visible="dialogFormVisible=$event"
    @close="handlePwdClose()"
  >
    <el-form ref="form" :model="form" label-width="85px" :rules="rules">
      <el-form-item label="原始密码：" prop="oldPassword">
        <el-input
          type="password"
          placeholder="请输入"
          v-model="form.oldPassword"
        />
      </el-form-item>
      <el-form-item label="新密码：" prop="newPassword">
        <el-input
          type="password"
          placeholder="6 - 20位密码，数字或字母，区分大小写"
          v-model="form.newPassword"
        />
      </el-form-item>
      <el-form-item label="确认密码：" prop="affirmPassword">
        <el-input
          type="password"
          placeholder="请输入"
          v-model="form.affirmPassword"
        />
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="handlePwdClose()">
        取 消
      </el-button>
      <el-button type="primary" @click="handleSave()">
        保 存
      </el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { Form as ElForm, Input } from 'element-ui'
// 接口
import { editPassword } from '@/api/users'
import {getOrderListBy} from '@/api/order';
@Component({
  name: 'Password',
})
export default class extends Vue {
  @Prop() private dialogFormVisible!: any
  private validatePwd = (rule: any, value: any, callback: Function) => {
    const reg = /^[0-9A-Za-z]{6,20}$/
    if (!value) {
      callback(new Error('请输入'))
    } else if (!reg.test(value)) {
      callback(new Error('6 - 20位密码，数字或字母，区分大小写'))
    } else {
      callback()
    }
  }
  private validatePass2 = (rule, value, callback) => {
    if (!value) {
      callback(new Error('请再次输入密码'))
    } else if (value !== this.form.newPassword) {
      callback(new Error('密码不一致，请重新输入密码'))
    } else {
      callback()
    }
  }
  rules = {
    oldPassword: [{ validator: this.validatePwd, trigger: 'blur' }],
    newPassword: [{ validator: this.validatePwd, trigger: 'blur' }],
    affirmPassword: [{ validator: this.validatePass2, trigger: 'blur' }],
  }
  private form = {} as any
  private affirmPassword = ''
  handleSave() {
    ;(this.$refs.form as ElForm).validate(async (valid: boolean) => {
      if (valid) {
        const parnt = {
          oldPassword: this.form.oldPassword,
          newPassword: this.form.newPassword,
        }
        //await editPassword(parnt)

        editPassword(parnt)
          .then((res) => {
            if (res.data.code === 1) {
              this.$message.success('密码修改成功')
            } else {
              this.$message.error(res.data.msg)
            }
          })
          .catch((err) => {
            this.$message.error('请求出错了：' + err.message)
          })
        this.$emit('handleclose')
        ;(this.$refs.form as ElForm).resetFields()
      } else {
        return false
      }
    })
  }
  handlePwdClose() {
    ;(this.$refs.form as ElForm).resetFields()
    this.$emit('handleclose')
  }
}
</script>

<style lang="scss">
.navbar .pwdCon .el-dialog__body {
  padding-top: 60px;
  padding: 60px 100px 0;
}

.navbar .pwdCon .el-input__inner {
  padding: 0 12px;
}

.navbar .pwdCon .el-form-item {
  margin-bottom: 26px;
}

.navbar .pwdCon .el-form-item__label {
  text-align: left;
}

.navbar .pwdCon .el-dialog__footer {
  padding-top: 14px;
}

.avatar-uploader .el-upload {
  border-radius: 4px!important;
  background: #fcfcfc;
}

.avatar-uploader .avatar-uploader-icon {
  background: #fcfcfc;
}

.avatar-uploader .el-icon-plus:before {
  content: "\4E0A\4F20\56FE\7247"!important;
  font-size: 12px;
  color: #000;
}

.el-dialog {
  border-radius: 8px;
}

.el-dialog__header {
  background: #fbfbfa;
  border-radius: 8px 8px 0 0;
  border: none;
}
</style>
