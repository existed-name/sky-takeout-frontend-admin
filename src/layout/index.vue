<template>
  <div class="app-wrapper" :class="classObj">
    <div
      v-if="classObj.mobile&&sidebar.opened"
      class="drawer-bg"
      @click="handleClickOutside"
    />
    <sidebar class="sidebar-container" />
    <div class="main-container">
      <navbar />
      <app-main />
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator'
import { mixins } from 'vue-class-component'
import { DeviceType, AppModule } from '@/store/modules/app'
import { AppMain, Navbar, Sidebar } from './components'
import ResizeMixin from './mixin/resize'

@Component({
  name: 'Layout',
  components: {
    AppMain,
    Navbar,
    Sidebar,
  },
})
export default class extends mixins(ResizeMixin) {
  get classObj() {
    return {
      hideSidebar: !this.sidebar.opened,
      openSidebar: this.sidebar.opened,
      withoutAnimation: this.sidebar.withoutAnimation,
      mobile: this.device === DeviceType.Mobile,
    }
  }

  private handleClickOutside() {
    AppModule.CloseSideBar(false)
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

.app-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  min-width: 1366px;
  overflow-x: auto;
  overflow-y: hidden;
}

.app-wrapper:after {
  content: "";
  display: table;
  clear: both;
}

.main-container {
  height: 100%;
  width: calc(100% - 190px);
}

.drawer-bg {
  background: #000;
  opacity: .3;
  width: 100%;
  top: 0;
  height: 100%;
  position: absolute;
  z-index: 999;
}

.main-container {
  min-height: 100%;
  -webkit-transition: margin-left .28s;
  transition: margin-left .28s;
  margin-left: 190px;
  background: #f3f4f7;
  position: relative;
}

.sidebar-container {
  -webkit-transition: width .28s;
  transition: width .28s;
  width: 190px!important;
  height: 100%;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1001;
  overflow: hidden;
}

.hideSidebar .main-container {
  margin-left: 80px;
  width: calc(100% - 80px);
}

.hideSidebar .sidebar-container {
  width: 80px!important;
}

.mobile .main-container {
  margin-left: 0;
}

.mobile .sidebar-container {
  -webkit-transition: -webkit-transform .28s;
  transition: -webkit-transform .28s;
  transition: transform .28s;
  transition: transform .28s,-webkit-transform .28s;
  width: 190px!important;
}

.mobile.openSidebar {
  position: fixed;
  top: 0;
}

.mobile.hideSidebar .sidebar-container {
  pointer-events: none;
  -webkit-transition-duration: .3s;
  transition-duration: .3s;
  -webkit-transform: translate3d(-190px,0,0);
  transform: translate3d(-190px,0,0);
}

.withoutAnimation .main-container,
.withoutAnimation .sidebar-container {
  -webkit-transition: none;
  transition: none;
}
</style>
