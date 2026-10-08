<template>
  <div class="wscn-http404-container">
    <div class="wscn-http404">
      <div class="pic-404">
        <img class="pic-404__parent" src="@/assets/404-images/404.png" alt="404" />
        <img class="pic-404__child left" src="@/assets/404-images/404-cloud.png" alt="404" />
        <img class="pic-404__child mid" src="@/assets/404-images/404-cloud.png" alt="404" />
        <img class="pic-404__child right" src="@/assets/404-images/404-cloud.png" alt="404" />
      </div>
      <div class="text-404">
        <div class="text-404__oops">
          OOPS!
        </div>
        <div class="text-404__info">
          All rights reserved
        </div>
        <div class="text-404__headline">
          {{ message }}
        </div>
        <div class="text-404__info">
          Please check that the URL you entered is correct, or click the button below to return to the homepage.
        </div>
        <a class="text-404__return-home" href="#/dashboard">
          Back to home
        </a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({
    'name': 'Page404'
})
export default class extends Vue {
  private message = '404 Page Not Found'
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

.wscn-http404-container {
  -webkit-transform: translate(-50%,-50%);
  transform: translate(-50%,-50%);
  position: absolute;
  top: 40%;
  left: 50%;
}

.wscn-http404 {
  position: relative;
  width: 1200px;
  padding: 0 50px;
  overflow: hidden;
}

.wscn-http404 .pic-404 {
  position: relative;
  float: left;
  width: 600px;
  overflow: hidden;
}

.wscn-http404 .pic-404__parent {
  width: 100%;
}

.wscn-http404 .pic-404__child {
  position: absolute;
}

.wscn-http404 .pic-404__child.left {
  width: 80px;
  top: 17px;
  left: 220px;
  opacity: 0;
  -webkit-animation-name: cloudLeft;
  animation-name: cloudLeft;
  -webkit-animation-duration: 2s;
  animation-duration: 2s;
  -webkit-animation-timing-function: linear;
  animation-timing-function: linear;
  -webkit-animation-fill-mode: forwards;
  animation-fill-mode: forwards;
  -webkit-animation-delay: 1s;
  animation-delay: 1s;
}

.wscn-http404 .pic-404__child.mid {
  width: 46px;
  top: 10px;
  left: 420px;
  opacity: 0;
  -webkit-animation-name: cloudMid;
  animation-name: cloudMid;
  -webkit-animation-duration: 2s;
  animation-duration: 2s;
  -webkit-animation-timing-function: linear;
  animation-timing-function: linear;
  -webkit-animation-fill-mode: forwards;
  animation-fill-mode: forwards;
  -webkit-animation-delay: 1.2s;
  animation-delay: 1.2s;
}

.wscn-http404 .pic-404__child.right {
  width: 62px;
  top: 100px;
  left: 500px;
  opacity: 0;
  -webkit-animation-name: cloudRight;
  animation-name: cloudRight;
  -webkit-animation-duration: 2s;
  animation-duration: 2s;
  -webkit-animation-timing-function: linear;
  animation-timing-function: linear;
  -webkit-animation-fill-mode: forwards;
  animation-fill-mode: forwards;
  -webkit-animation-delay: 1s;
  animation-delay: 1s;
}

.wscn-http404 .text-404 {
  position: relative;
  float: left;
  width: 300px;
  padding: 30px 0;
  overflow: hidden;
}

.wscn-http404 .text-404__oops {
  font-size: 32px;
  line-height: 40px;
  color: #1482f0;
  margin-bottom: 20px;
  -webkit-animation-fill-mode: forwards;
  animation-fill-mode: forwards;
}

.wscn-http404 .text-404__headline,
.wscn-http404 .text-404__oops {
  font-weight: 700;
  opacity: 0;
  -webkit-animation-name: slideUp;
  animation-name: slideUp;
  -webkit-animation-duration: .5s;
  animation-duration: .5s;
}

.wscn-http404 .text-404__headline {
  font-size: 20px;
  line-height: 24px;
  color: #222;
  margin-bottom: 10px;
  -webkit-animation-delay: .1s;
  animation-delay: .1s;
  -webkit-animation-fill-mode: forwards;
  animation-fill-mode: forwards;
}

.wscn-http404 .text-404__info {
  font-size: 13px;
  line-height: 21px;
  color: grey;
  margin-bottom: 30px;
  -webkit-animation-delay: .2s;
  animation-delay: .2s;
  -webkit-animation-fill-mode: forwards;
  animation-fill-mode: forwards;
}

.wscn-http404 .text-404__info,
.wscn-http404 .text-404__return-home {
  opacity: 0;
  -webkit-animation-name: slideUp;
  animation-name: slideUp;
  -webkit-animation-duration: .5s;
  animation-duration: .5s;
}

.wscn-http404 .text-404__return-home {
  display: block;
  float: left;
  width: 110px;
  height: 36px;
  background: #1482f0;
  border-radius: 100px;
  text-align: center;
  color: #fff;
  font-size: 14px;
  line-height: 36px;
  cursor: pointer;
  -webkit-animation-delay: .3s;
  animation-delay: .3s;
  -webkit-animation-fill-mode: forwards;
  animation-fill-mode: forwards;
}

// ---- 由 Step 6 修复回填：原产物 404 chunk 中的 @keyframes（Step 1 抽取时漏掉 at 规则，
//      导致 animation-name 悬空、云朵与文字因 opacity:0 且动画不执行而不可见）。----
@keyframes cloudLeft {
  0% { top: 17px; left: 220px; opacity: 0; }
  20% { top: 33px; left: 188px; opacity: 1; }
  80% { top: 81px; left: 92px; opacity: 1; }
  to { top: 97px; left: 60px; opacity: 0; }
}

@keyframes cloudMid {
  0% { top: 10px; left: 420px; opacity: 0; }
  20% { top: 40px; left: 360px; opacity: 1; }
  70% { top: 130px; left: 180px; opacity: 1; }
  to { top: 160px; left: 120px; opacity: 0; }
}

@keyframes cloudRight {
  0% { top: 100px; left: 500px; opacity: 0; }
  20% { top: 120px; left: 460px; opacity: 1; }
  80% { top: 180px; left: 340px; opacity: 1; }
  to { top: 200px; left: 300px; opacity: 0; }
}

@keyframes slideUp {
  0% { transform: translateY(60px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
