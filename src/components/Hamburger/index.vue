<template>
  <div :class="[{'is-active':isActive}]" @click="toggleClick">
    <svg-icon name="hamburger" width="20" height="20" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({
  'name': 'Hamburger'
})

export default class extends Vue {
  @Prop({ 'default': false }) private isActive!: boolean

  private toggleClick() {
    this.$emit('toggleClick');
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

.svg-icon {
  vertical-align: middle;
}

.is-active {
  -webkit-transform: rotate(180deg);
  transform: rotate(180deg);
}
</style>
