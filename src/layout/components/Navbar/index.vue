<template>
  <div class="navbar">
    <div class="statusBox">
      <hamburger
        id="hamburger-container"
        class="hamburger-container"
        :is-active="sidebar.opened"
        @toggleClick="toggleSideBar"
      />
      <span v-if="status===1" class="businessBtn">
        营业中
      </span>
      <span v-else class="businessBtn closing">
        打烊中
      </span>
    </div>
    <div :key="restKey" class="right-menu">
      <div class="rightStatus">
        <audio ref="audioVo" hidden>
          <source src="@/assets/preview.mp3" type="audio/mp3" />
        </audio>
        <audio ref="audioVo2" hidden>
          <source src="@/assets/reminder.mp3" type="audio/mp3" />
        </audio>
        <span class="navicon operatingState" @click="handleStatus">
          <i />
          营业状态设置
        </span>
      </div>
      <div class="avatar-wrapper">
        <div
          :class="shopShow?'userInfo':''"
          @mouseenter="toggleShow"
          @mouseleave="mouseLeaves"
        >
          <el-button :class="shopShow?'active':''" type="primary">
            {{ name }}
            <i class="el-icon-arrow-down" />
          </el-button>
          <div v-if="shopShow" class="userList">
            <p class="amendPwdIcon" @click="handlePwd">
              修改密码
              <i />
            </p>
            <p class="outLogin" @click="logout">
              退出登录
              <i />
            </p>
          </div>
        </div>
      </div>
    </div>
    <el-dialog
      title="营业状态设置"
      :visible="dialogVisible"
      width="25%"
      :show-close="false"
      @update:visible="dialogVisible=$event"
    >
      <el-radio-group v-model="setStatus">
        <el-radio :label="1">
          营业中
          <span>
            当前餐厅处于营业状态，自动接收任何订单，可点击打烊进入店铺打烊状态。
          </span>
        </el-radio>
        <el-radio :label="0">
          打烊中
          <span>
            当前餐厅处于打烊状态，仅接受营业时间内的预定订单，可点击营业中手动恢复营业状态。
          </span>
        </el-radio>
      </el-radio-group>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible=false">
          取 消
        </el-button>
        <el-button type="primary" @click="handleSave">
          确 定
        </el-button>
      </span>
    </el-dialog>
    <Password
      :dialog-form-visible="dialogFormVisible"
      @handleclose="handlePwdClose"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { AppModule } from '@/store/modules/app'
import { UserModule } from '@/store/modules/user'
import Breadcrumb from '@/components/Breadcrumb/index.vue'
import Hamburger from '@/components/Hamburger/index.vue'
import { getStatus, setStatus } from '@/api/users'
import Cookies from 'js-cookie'
// 修改密码弹层
import Password from '../components/password.vue'

@Component({
  name: 'Navbar',
  components: {
    Breadcrumb,
    Hamburger,
    Password,
  },
})
export default class extends Vue {
  private storeId = this.getStoreId
  private restKey: number = 0
  private websocket = null
  private message = ''
  private shopShow = false
  private dialogVisible = false
  private status = 1
  private setStatus = 1
  private dialogFormVisible = false
  get sidebar() {
    return AppModule.sidebar
  }

  get device() {
    return AppModule.device.toString()
  }

  getuserInfo() {
    return UserModule.userInfo
  }

  get name() {
    return (UserModule.userInfo as any).name
      ? (UserModule.userInfo as any).name
      : JSON.parse(Cookies.get('user_info') as any).name
  }

  get getStoreId() {
    let storeId = ''
    if (UserModule.storeId) {
      storeId = UserModule.storeId
    } else if ((UserModule.userInfo as any).stores != null) {
      storeId = (UserModule.userInfo as any).stores[0].storeId
    }
    return storeId
  }
  mounted() {
    document.addEventListener('click', this.handleClose)
    // const msg = {
    //   data: {
    //     type: 2,
    //     content: '订单1653904906519客户催单，已下单23分钟，仍未接单。',
    //     details: '434'
    //   }
    // }
    this.getStatus()
  }
  created() {
    this.webSocket()
  }
  onload() {
  }
  destroyed() {
    this.websocket.close() //离开路由之后断开websocket连接
  }

  // 添加新订单提示弹窗
  webSocket() {
    const that = this as any
    let clientId = Math.random().toString(36).substr(2)
    let socketUrl = process.env.VUE_APP_SOCKET_URL + clientId
    console.log(socketUrl, 'socketUrl')
    if (typeof WebSocket == 'undefined') {
      that.$notify({
        title: '提示',
        message: '当前浏览器无法接收实时报警信息，请使用谷歌浏览器！',
        type: 'warning',
        duration: 0,
      })
    } else {
      this.websocket = new WebSocket(socketUrl)
      // 监听socket打开
      this.websocket.onopen = function () {
        console.log('浏览器WebSocket已打开')
      }
      // 监听socket消息接收
      this.websocket.onmessage = function (msg) {
        // 转换为json对象
        that.$refs.audioVo.currentTime = 0
        that.$refs.audioVo2.currentTime = 0

        console.log(msg, JSON.parse(msg.data), 'msg')
        // const h = this.$createElement
        const jsonMsg = JSON.parse(msg.data)
        if (jsonMsg.type === 1) {
          that.$refs.audioVo.play()
        } else if (jsonMsg.type === 2) {
          that.$refs.audioVo2.play()
        }
        that.$notify({
          title: jsonMsg.type === 1 ? '待接单' : '催单',
          duration: 0,
          dangerouslyUseHTMLString: true,
          onClick: () => {
            that.$router
              .push(`/order?orderId=${jsonMsg.orderId}`)
              .catch((err) => {
                console.log(err)
              })
            setTimeout(() => {
              location.reload()
            }, 100)
          },
          // 这里也可以把返回信息加入到message中显示
          message: `${
            jsonMsg.type === 1
              ? `<span>您有1个<span style=color:#419EFF>订单待处理</span>,${jsonMsg.content},请及时接单</span>`
              : `${jsonMsg.content}<span style='color:#419EFF;cursor: pointer'>去处理</span>`
          }`,
        })
      }
      // 监听socket错误
      this.websocket.onerror = function () {
        that.$notify({
          title: '错误',
          message: '服务器错误，无法接收实时报警信息',
          type: 'error',
          duration: 0,
        })
      }
      // 监听socket关闭
      this.websocket.onclose = function () {
        console.log('WebSocket已关闭')
      }
    }
  }

  private toggleSideBar() {
    AppModule.ToggleSideBar(false)
  }
  // 退出
  private async logout() {
    this.$store.dispatch('LogOut').then(() => {
      // location.href = '/'
      this.$router.replace({ path: '/login' })
    })
    // this.$router.push(`/login?redirect=${this.$route.fullPath}`)
  }
  // 营业状态
  async getStatus() {
    const { data } = await getStatus()
    this.status = data.data
    this.setStatus = this.status
  }
  // 下拉菜单显示
  toggleShow() {
    this.shopShow = true
  }
  // 下拉菜单隐藏
  mouseLeaves() {
    this.shopShow = false
  }
  // 触发空白处下来菜单关闭
  handleClose() {
    // clearTimeout(this.leave)
    // this.shopShow = false
  }
  // 设置营业状态
  handleStatus() {
    this.dialogVisible = true
  }
  // 营业状态设置
  async handleSave() {
    const { data } = await setStatus(this.setStatus)
    if (data.code === 1) {
      this.dialogVisible = false
      this.getStatus()
    }
  }
  // 修改密码
  handlePwd() {
    this.dialogFormVisible = true
  }
  // 关闭密码编辑弹层
  handlePwdClose() {
    this.dialogFormVisible = false
  }
}
</script>

<style lang="scss" scoped>

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

.navbar {
  height: 60px;
  position: relative;
  background: #ffc100;
}

.navbar .statusBox {
  float: left;
  height: 100%;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
}

.navbar .hamburger-container {
  padding: 0 12px 0 20px;
  cursor: pointer;
  -webkit-transition: background .3s;
  transition: background .3s;
  -webkit-tap-highlight-color: transparent;
}

.navbar .hamburger-container:hover {
  background: rgba(0,0,0,.025);
}

.navbar .breadcrumb-container {
  float: left;
}

.navbar .right-menu {
  float: right;
  margin-right: 20px;
  color: #333;
  font-size: 14px;
}

.navbar .right-menu span {
  padding: 0 10px;
  width: 130px;
  display: inline-block;
  cursor: pointer;
}

.navbar .right-menu span:hover {
  background: hsla(0,0%,100%,.52);
}

.navbar .right-menu .amendPwdIcon i {
  width: 18px;
  height: 18px;
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAAXNSR0IArs4c6QAAAy9JREFUWAntmE1oE0EUx7v5AEEUia1WUS8K1lpBKHrIRQ8iiN4EUSgoog1tCfZUUFGD3jwFISXJwVMFKR5VFAqiBw9FoSBSRPBSoWgUomCwaT78vZgZlnQ3ziYpCu7AZN7OvP//vXnzsW/T1eUXPwJ+BJpGwGo66jI4MjIyWC6X45ZlHUAl4qIm3cvVanWB9hE1mc1mC9LppXhycHp6OjgzM3MFx65jOOTJkGW9Q38ok8m88oILelGORCLX0L9JDXjB1XW7mdjpaDQ6NTs7+90Ub2xobGxsL1G7qogx9pB6iOetoVBoi1NlbBc652lzggO/vlgsZkQ2LcZLHIvFshi4KMQYfcJSHTM1Mjw8vA/d19SwYMLh8EAqlXor8p+KcQRxLqrIkG8r2aTlcLxhUo+VLgdMc6k+t9bYQQg2KRKWc17Jpi2T0phKpdJjijN2kAhoXeRlUwNKD0xJybTGh1MbtYH/KdH4LmOJ9IFC3s2p/uZlJqVSqdumbxwYbdQG1mIikVizuLiYwKEzdO7QA20Kstxwyqm+zAF61ozO1cF4PN6ztLT0HPCeZgRtjlXB38DJW248rg5ydz0AdNIGlMv2s+25VVEOyE5q7U6krRLRw9yrL5wIHffg6OjofvaMcq4cCASG0un0fSeCVvrGx8c3FAqFKbDHqRIkiaC8lVYUx83KRXpQaTK7e510TniTyWSet8lZuCvyzH4cZL87+uLYCaBPgFIgmfstdfaXV91X7CzUWdfmcrntThYcHURR9kmtcOuXldzplslrbuxom3Y7bg7adf6q7DvYbvj9CP6fEVQXaH32q7kNNDd3Yu3Sboy4VmgYeK+ecXZVkoWJiYl12NhWt/Ozt7f3o7Jpbx0dxCn97crMzvGhfsQOaleWNC6fz6fhruUC2Jujz55xaxPNspmnaB2ta0rGMQ/hJ41sUYBHnOqHa6ON4gQpl/z7sKLUZrCilw4+jC6Q0bxElGWwIOynldpWgacRf8fNOVF0XGIZmJyclBf5APUu9Qe1o4VIfoDwFM5dakbsusR2kKRCpP59zH6zvb8VORgMlkjn5nHsSyt4H+NHwI9AQwR+ATFg/+xwaeKHAAAAAElFTkSuQmCC) no-repeat;
  background-size: contain;
  margin-top: 8px;
}

.navbar .right-menu .outLogin i {
  width: 18px;
  height: 18px;
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAAXNSR0IArs4c6QAABDRJREFUWAntWEtoE1EUzae1iWiqUtEqWPztBBFDoauCBusXQaEqFFSobROqNXThwl93IsZ+aJs0UReCdFGpoFgV7KYrS4i40UUR3JmolZpa+1Gb1HPDe8Mz8yaZpFN0kYHh3nc/5565773Jm5hMhavQgX/bAbNR5d1u9+pkMhkgPIvF4g4EAt+MwC4yAoQwQO7swsLCCaaHIdtJX+xlWSwAzzebzQ6Zzm35SsMI5ksgW55ugm1tbYYth2ykRL8ugg0NDa3RaHSisbHxiZicjw6MIPDGm5qavHrysxIE0BkA+XCvxCY40tLSsk4PsCzG4/GsgL0edxk2VTvDloUqtowEAbAHpO4o0SbTYFdX12dhnJPq9/t/AG+AJ4FkiGrwsUxqEsSaWwaAIABTaw+7NOJwOE7LQHKxAaOesFhOMZGkWloYmgRjsdgFJG1jiV9tNtthn883rQWk104YhIX4cZazFev7vFa+lKDX67Wjc1eEpGuLmVoBJ6UyrOuC/So2znJhrKhSgrOzs/sRUUpRmI4xl8sVUjIMUgiTsBlcKXSqqbqkBNG940Jkf21tbUIYG6IyzH4B7JigK6oWwRoeUVRUNMj1TBKLXXkIUc+Ug6494n40RanJbSRVBNlaKGNBM729ve/EBC0dxYZx/2T3sFacaO/r63uL8QyzlcnWoYogCmzkINA/cj2bDAaDrxC/iW7Ss8Vzv1gDulKb+1W/r1arde38/HzKj7bzVwGPzyjRkS8ZAyROVmM7uag2xHsxTNVBkJsQAtYI+lKpSo202ql6KoIlJSVRzgQt38D1pZJiDbE2r6ci2N3d/R3OSQpA+x04faTazxOMlIRNNRjmJKv9VwkVQfLiqV4KUUcF3WhVwU6rqdSREoT3sRJhMtXhKQ37uOK4DLOOj9NqKmYpQbvd/hQRqYMBgHbiSHRSyTBIwfSeImwGN81qqtCtKgsMo6Ojc06nswRqNfM7Kysr70cikTlZfK42+kQFuYfIW0W5+Ey90dPT80KGI+0gBeKddAvrgr/XKhKJxIAR3yWEQVgoUUF1qAYI0oldemkSpNMvEs8BIMkyXTgjPkABmxRJh5FyCQOhLgonbKpBtbTSpVPMgzGlY5jq3xjvZbYdU1NTNVVVVcPhcDjO4/TI5ubmzfF4/Bli9/F4ELyMX597fCyTunYnFnQH1sxFAeAXwP1YBjfx9J8Eu0rFh9J6TOkl5HvgVI72yO/Eb3bWLztdBKkqThr1EH7cxTSmi6YIgg4Jz0HgA2SM7NDLoW+BPIBhFaS4lGhGPKFQ6C7FZrt0EyQg7L7d6MZtqHx3Z8NP94+g6634Y+l1ukNrnBNBDoJuHkKHaHqq0R3ViYjHkUQcHY1GENeBrg2JPj16XgQ5MHufHcQJeheI0MGinPliIBTFDn2DL7ihzs7OnDYUxy/IQgf+hw78AZS9fRmxzkdJAAAAAElFTkSuQmCC) no-repeat 100% 100%;
  background-size: contain;
  margin-top: 8px;
}

.navbar .right-menu .outLogin {
  cursor: pointer;
}

.navbar .right-menu:focus {
  outline: none;
}

.navbar .right-menu .right-menu-item {
  display: inline-block;
  padding: 0 8px;
  height: 100%;
  font-size: 18px;
  color: #5a5e66;
  vertical-align: text-bottom;
}

.navbar .right-menu .right-menu-item.hover-effect {
  cursor: pointer;
  -webkit-transition: background .3s;
  transition: background .3s;
}

.navbar .right-menu .right-menu-item.hover-effect:hover {
  background: rgba(0,0,0,.025);
}

.navbar .rightStatus {
  height: 100%;
  line-height: 60px;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  float: left;
}

.navbar .avatar-wrapper {
  margin-top: 14px;
  margin-left: 18px;
  position: relative;
  float: right;
  width: 120px;
  text-align: left;
}

.navbar .avatar-wrapper .user-avatar {
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

.navbar .avatar-wrapper .el-icon-caret-bottom {
  cursor: pointer;
  position: absolute;
  right: -20px;
  top: 25px;
  font-size: 12px;
}

.navbar .avatar-wrapper .el-button--primary {
  background: hsla(0,0%,100%,.52);
  border-radius: 4px;
  padding-top: 0;
  padding-bottom: 0;
  position: relative;
  width: 120px;
  padding-left: 12px;
  text-align: left;
  border: 0 none;
  height: 32px;
  line-height: 32px;
}

.navbar .avatar-wrapper .el-button--primary.active {
  background: hsla(0,0%,98%,0);
  border: 0 none;
}

.navbar .avatar-wrapper .el-button--primary.active .el-icon-arrow-down {
  -webkit-transform: rotate(-180deg);
  transform: rotate(-180deg);
}

.navbar .businessBtn {
  height: 22px;
  line-height: 20px;
  background: #fd3333;
  border: 1px solid #fff;
  border-radius: 4px;
  display: inline-block;
  padding: 0 6px;
  color: #fff;
}

.navbar .closing {
  background: #6a6a6a;
}

.navbar .navicon i {
  display: inline-block;
  width: 18px;
  height: 18px;
  vertical-align: sub;
  margin: 0 4px 0 0;
}

.navbar .operatingState i {
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAAAXNSR0IArs4c6QAAA2ZJREFUWEfNmEuoTmEUhp/jkoSRZIKETJQBCgO5lNvALUaIGUWhKKYuA0ShmBgRGYjCwGXgknIZMJCREDKRZIBSrr2n9Z6+f//7//9vb+fk7Dqdc/Ze3/re9a53rfXt3UW1ayDQBfzMXDYI+AP8yrTvdp5zyW4A8Ds20JphwERgPDAinHwB3gCvgG9xr2xtyz1zAAmIotTPGGAOsARYDIwKoOkGAv0RuAncAO4D74NZ7afntQEpRaJ7OLAV2AKMC3BpMAKrq3hP/78DTgEnga+AfZaCasWQ7juaZcAxYEIAcYRirtV6ASzavQZ2ANeCVbPeAKzMoe9pwS7gYESVbpCjO9uk68T2HuBIEozZbaLYDize48C2QqRlQNIqchWW2aXATgDbk0LpsS8y5PzujCgUUbvUVGFKtk6l9hH7R4uaSgEZjDRzCVAPKQo1BSDnWv8JuB0PFgAjS0RfXKf/1ctWh6Z6hG5A+q0NVE1PgMmRKrHT6hJ7cnQPmBdGd4G5UZl61upS+uT7BTA9qq8bgwEZ4e4QsTdrlxLbPAbmh+EdYGYGIJl7vUR+yKlLu6ianiJU93UEOYAeRbOUrZrgrExA3kNdXQyreQ4QIGlF+VwLnI+/rZ++BGQdaS/tfUFY3AClnzPAhszoUsrrMpT6OAtsVJFYQxLzS2B0hwpJGbMG/gWQK/UDMEniNqCpwNMQVm5vKQKSc2lodgWWvZd8TQOeGdBy4EoukrArApIvAVKV/QAGV/S3ArhqQOuAcxXSleb/IaCG+B24CKxJDmTtepHxOm3rVVS9BUjNUKwMBTbFWFAb8ajodDIQjgZAdVLmyMSMSnYv8DbCHhugNgNDMjXVkLI6oi5S/hk4DJyO+abnM4B9wMJkNpZJq0nUdco+BeSuK+qfAwdCT7ovca+MPqeUmlmtLy17D9aqjbEYaVEvOk/vBx4Aq4DLJdS4UhsaY93R0W6S65mErDO0NpPop5TMSI2sptHhE2LV4dqpzSh6D+80TV7XcrjKoM7xoxMgayTVV9noaTp+yKjOAS0HULu0tj2gpSzlHmHrAvJbRtsjrJ33q0O+QVV9DcplqtZrkPVkQfaLF0WD6jev0mkK+s3HhhRU2eeYpcCiDp9jbgHXe/tzjIGlr0su2//2waqYQoHrs096fwEcDClCnB1ZnQAAAABJRU5ErkJggg==) no-repeat;
  background-size: contain;
}

.navbar .mesCenter i {
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAmCAYAAACsyDmTAAAAAXNSR0IArs4c6QAAAuBJREFUWEftmM2rD1EYxz8XWdmwItmg2EjJRoksJG+FCGsv2Sjl77DwsqCwFFeivJWNSBYWIhuKHWHDgpW89a3nq7lz58yZM/O7ku7Urd+dOed5PvM93+e8zBj/2DU2Ip4ZEefn0HhDgdz/V4DU/y/mGwqkhLOBNYBiPQa+xW9DFkH1BdIQqe8s4BKwK7JeB/YD3wEBFQ9hKZDa2y8/gB2AIKqX4HRvZsVXndUqARKIAutvAbAKOA5sqCihNveBE8BT4H0oqTyd1OoKpEQKOAc4ChwAlgRcPYaAde8NcAE4DXwNZbNQXYAMsxK4GMrYH9Uh9LApqZ7bZ1JKL/CsC1QOyDBrgavAfEDe0eWETVVUNbS89BHYDTzKQbUBGWYp8DB8o+pRZZVc7iM/rQNet0HlFFLim8C2KOVSGIMb6nbESr5QCsjquKxt1BJl6m0dw9OCc0xolwO6BWwN33he6Qsl7ymGVeoM5IaLwzsLo+Q9IfYFUvUpxjtgfUwLk6CaFJJPNOYbgXsBo3Zd/JaDNdSmiO1cf/q1Ae0BxgeauQ5oc++N2J2ANM4ab01m56cI6GDM4s7VqtDfADoULzsNlPLQtEKp8neV/R8KHQbOTVHZH4nYRVV2KnaHXoNys3CX5451JmJngTRza1VeATwA5ia2qV2SpzZuyvE51rMX9SNTdenwQrccuAEsG9GiWgfzevYqTi0vqxu2prXsDrA5DnxDtxwpJTV0OmDeBbZUGzUBXQa0+I3SO3Uwx74C7EsB2T/ayKsK5gVUatuRO/y19ZPyn4CzwIeqj0axx+lr8MZ+TUC6l/KOnmm2VfVpKyof1JVSG31w0MFAKmjPk1JTQzfhWV+FBPwkDo2uGr2xfz8HVgd8kYJ9gDyZaYuripQCPiJr6tBbb48KmjTx5ej6ACmmC2AncBJYFIneAseAa32/EfUFqkLpA4TO/YqlofrSF8ZBcyq2PW86W2mY/MGhOPZv3ovOJ+lj/aUAAAAASUVORK5CYII=) no-repeat;
  background-size: contain;
}
</style>

<style lang="scss">
.el-notification {
  width: 419px!important;
}

.el-notification .el-notification__title {
  margin-bottom: 14px;
  color: #333;
}

.el-notification .el-notification__title .el-notification__content {
  color: #333;
}

.navbar .el-dialog {
  min-width: auto!important;
}

.navbar .el-dialog__header {
  height: 61px;
  line-height: 60px;
  background: #fbfbfa;
  padding: 0 30px;
  font-size: 16px;
  color: #333;
  border: 0 none;
}

.navbar .el-dialog__body {
  padding: 10px 30px 30px;
}

.navbar .el-dialog__body .el-radio,
.navbar .el-dialog__body .el-radio__input {
  white-space: normal;
}

.navbar .el-dialog__body .el-radio__label {
  padding-left: 5px;
  color: #333;
  font-weight: 700;
}

.navbar .el-dialog__body .el-radio__label span {
  display: block;
  line-height: 20px;
  padding-top: 12px;
  color: #666;
  font-weight: 400;
}

.navbar .el-dialog__body .el-radio__input.is-checked .el-radio__inner:after {
  background: #333;
}

.navbar .el-dialog__body .el-radio-group>.is-checked {
  border: 1px solid #ffc200;
}

.navbar .el-dialog__body .el-radio {
  width: 100%;
  background: #fbfbfa;
  border: 1px solid #e5e4e4;
  border-radius: 4px;
  padding: 14px 22px;
  margin-top: 20px;
}

.navbar .el-badge__content.is-fixed {
  top: 24px;
  right: 2px;
  width: 18px;
  height: 18px;
  line-height: 16px;
  font-size: 10px;
  border-radius: 50%;
  padding: 0;
}

.navbar .badgeW .el-badge__content.is-fixed {
  width: 30px;
  border-radius: 20px;
}

.el-icon-arrow-down {
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAOCAYAAAAvxDzwAAAAAXNSR0IArs4c6QAAAaxJREFUOE+Nkz9P21AUxc+1+9K5QmJigLmbnbhWhioCJhRVHWr1E8DCCCtV1K5l7FK+AFIYEEJMbRV1iNw4L1vnMHSqQGJ1X+xbXSsvyj9DvFi+756fz7m+JgAIgmBtNBq9IKJ/SilHaqtexpicmStE9KC1viMRhmG4aYy5BLAGIAWwKjQH8BzAvVLqbRzHtwIUce553j4RfQXAY3fFyx65Jn2O4xwkSXImLCsqoLVa7XOe50cADAD3CWAGQDmOc5okybE1ZoFyZ9/3FRHdMPMuABGUQYszIvrGzHtaazFQMCaxoihy2+12FgTBVpZlPwFsiOsl87S1P67rvu71ekOrlUQzc7IHnuc1iehqKrLts3MDM78ZDAbX07AFoBRsg+/7JwA+zkW3Y/igtf40D1sKHLumKIpoOByeM/O7MVT6ZW4XzWbzfavVkmdxPHFdBrR1rtfr62ma/gDwsigS/a5UKtvdbvev/Qjzm1C6azZOGIavjDHfRaiU2onj+NeyqBb86PI2Go1nnU5nVK1WD0XQ7/e/2FrZjj71N0ziT/09MzNbOfJc48LalDn8D44nqhELEZeSAAAAAElFTkSuQmCC) no-repeat 50% 50%;
  background-size: contain;
  width: 8px;
  height: 8px;
  -webkit-transform: rotate(0eg);
  transform: rotate(0eg);
  margin-left: 16px;
  position: absolute;
  right: 16px;
  top: 12px;
}

.el-icon-arrow-down:before {
  content: "";
}

.userInfo {
  background: #fff;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 99;
  -webkit-box-shadow: 0 2px 4px 0 rgba(0,0,0,.14);
  box-shadow: 0 2px 4px 0 rgba(0,0,0,.14);
  width: 100%;
  border-radius: 4px;
  line-height: 32px;
  padding: 0 0 5px;
  height: 105px;
}

.userInfo .userList {
  width: 95%;
  padding-left: 5px;
}

.userInfo p {
  cursor: pointer;
  height: 32px;
  line-height: 32px;
  padding: 0 5px 0 7px;
}

.userInfo p i {
  margin-left: 10px;
  vertical-align: middle;
  margin-top: 4px;
  float: right;
}

.userInfo p:hover {
  background: #f6f1e1;
}

.msgTip {
  color: #419eff;
  padding: 0 5px;
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
