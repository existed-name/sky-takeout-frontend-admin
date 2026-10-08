<template>
  <div class="empty-box">
    <div class="img-box">
      <img v-if="!isSearch" src="@/assets/table_empty.png" alt />
      <img v-else src="@/assets/search_table_empty.png" />
      <p>
        {{ !isSearch?'这里空空如也~':'Sorry，木有找到您搜索的内容哦~' }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
@Component({
  name: 'Empty'
})
export default class extends Vue {
  @Prop({ default: false }) isSearch: boolean //用来区分是搜索还是默认无数据
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

.empty-box {
  text-align: center;
  margin: 120px 0;
}

.empty-box img {
  margin: 0 atuo;
  width: 238px;
  height: 184px;
  margin-top: 156px;
  margin-bottom: 26px;
}

.empty-box p {
  color: #818693;
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

.empty-box {
  text-align: center;
  margin: 120px 0;
}

.empty-box img {
  margin: 0 atuo;
  width: 238px;
  height: 184px;
  margin-top: 156px;
  margin-bottom: 26px;
}

.empty-box p {
  color: #818693;
}
</style>
