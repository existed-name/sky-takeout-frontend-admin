<template>
  <div class="HeadLable">
    <span v-if="goback" class="goBack" @click="goBack()">
      <img src="@/assets/icons/btn_back@2x.png" alt />
       返回
    </span>
    <span v-if="!butList">
      {{ title }}
    </span>
    <div v-if="butList">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({
  'name': 'Hamburger'
})
export default class extends Vue {
  @Prop({ 'default': false }) private goback!: boolean
  @Prop({ 'default': false }) private butList!: boolean
  @Prop({ 'default': '集团管理' }) private title!: string

  private toggleClick() {
    this.$emit('toggleClick')
  }

  private goBack() {
    this.$router.go(-1)
  }
}
</script>

<style scoped lang="scss">
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

.HeadLable {
  background: #fff;
  color: #333;
  height: 64px;
  font-size: 16px;
  padding-left: 22px;
  line-height: 64px;
  font-weight: 700;
  margin-bottom: 15px;
  top: 0;
  left: 0;
  opacity: 0;
  -webkit-animation: opacity .5s ease-out .8s forwards;
  animation: opacity .5s ease-out .8s forwards;
}

.HeadLable .goBack {
  border-right: 1px solid #d8dde3;
  padding-right: 14px;
  margin-right: 14px;
  font-size: 16px;
  color: #333;
  cursor: pointer;
  font-weight: 400;
}

.HeadLable .goBack img {
  position: relative;
  top: 24px;
  margin-right: 5px;
  width: 18px;
  height: 18px;
  float: left;
}

// ---- 由 Step 6 修复回填：原产物中的 @keyframes opacity（Step 1 抽取时漏掉 at 规则，
//      导致 animation 引用悬空、.HeadLable 因 opacity:0 且动画不执行而不可见）。----
@keyframes opacity {
  0% { opacity: 0; left: 80px; }
  to { opacity: 1; left: 0; }
}
</style>
