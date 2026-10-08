<template>
  <div class="upload-item">
    <el-upload ref="uploadfiles" class="avatar-uploader" :class="{borderNone:imageUrl}" :accept="type" action="/api/common/upload" :show-file-list="false" :on-success="handleAvatarSuccess" :on-remove="handleRemove" :on-error="handleError" :before-upload="beforeAvatarUpload" :headers="headers">
      <img v-if="imageUrl" class="avatar" :src="imageUrl" />
      <i v-else class="el-icon-plus avatar-uploader-icon" />
      <span v-if="imageUrl" class="el-upload-list__item-actions">
        <span class="el-upload-span" @click.stop="oploadImgDel">
          
        删除图片
      
        </span>
        <span class="el-upload-span">
           重新上传 
        </span>
      </span>
    </el-upload>
    <p class="upload-tips">
      <slot></slot>
    </p>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { baseUrl } from '@/config.json'
import { getToken } from '@/utils/cookies'
@Component({
  name: 'UploadImage'
})
export default class extends Vue {
  @Prop({ default: '.jpg,.jpeg,.png' }) type: string
  @Prop({ default: 2 }) size: number
  @Prop({ default: '' }) propImageUrl: string

  private headers = {
    token: getToken()
  }
  private imageUrl = ''
  handleRemove() {}

  @Watch('propImageUrl')
  private onChange(val) {
    this.imageUrl = val
  }

  handleError(err, file, fileList) {
    console.log(err, file, fileList, 'handleError')
    this.$message({
      message: '图片上传失败',
      type: 'error'
    })
  }

  handleAvatarSuccess(response: any, file: any, fileList: any) {
    // this.imageUrl = response.data
    this.imageUrl = `${response.data}`
    // this.imageUrl = `${baseUrl}/common/download?name=${response.data}`

    this.$emit('imageChange', this.imageUrl)
  }

  oploadImgDel() {
    this.imageUrl = ''
    this.$emit('imageChange', this.imageUrl)
  }
  beforeAvatarUpload(file) {
    const isLt2M = file.size / 1024 / 1024 < this.size
    if (!isLt2M) {
      this.$message({
        message: `上传文件大小不能超过${this.size}M!`,
        type: 'error'
      })
      return false
    }
  }
}
</script>

<style lang="scss">
.borderNone .el-upload {
  border: 1px solid #d9d9d9!important;
}
</style>

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

.avatar-uploader .el-icon-plus:after {
  position: absolute;
  display: inline-block;
  content: " "!important;
  left: calc(50% - 20px);
  top: calc(50% - 40px);
  width: 40px;
  height: 40px;
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD4AAAA+CAYAAABzwahEAAADcUlEQVRoQ+2aTWgTQRTH39skpQl4kTZQ8GDxlJmmiGixFKFYTwULgm0QL4p6UCx4ED0JwZNQBK0gIuJJD20FxbsQxEOLrGI+Xg6CVqRoIbQg3kzmSWIaU01iN/uRlc4eN/Pe/H/vzfx3dgnCNr1wm3KDBt9undcd1x33qAKDg4O7sFjsfUf01qMpN03TkaUupTzKSs0BQNhAfNwTjZ5KpVJFLwvgObiUcgKYF5i5awMUEZ/0RqMnvIT3FLwRdKfgPQNvBd0JeE/AtwLtNbzr4FagvYR3FbyJka0CYoqVStRAAe4ywIV6V3fb8FwDb9LplWAoNFYqlaZYqes1UMQ+RDy36R4AuAnvCng8FhtXiE/rH1kAsBwMhQ6n0+mPUsprf4IT0de/7pcrg7iQy+USiMhOPucdB08mk8b83NwqAPTUdfS9YRhj2Wz2c/leM/CGv/2CnyKiBV+DMzNKIVYAoK8iFDEHAEfKHd0Q3gq8EXwA4Fgmn3/ma/CyuHg8PlwqFm8iwKfuSGTaNM1Cveh/gVfhjyPzuAJYJKL7TkJX+uF0wq3k2wr4VvLYGaPB7VTPaqzu+O+jWl+9+VktZDvj9VJvp2rtxuilrpc66j3e7vaxGqfNzWrF7IzX5qbNTZubnR1kKVabm6Vy2RyszU2bm8/MTQjRhcyXECCkEG8T0Xebq7wS7tZSr3zonJ8/iwD93eHwrGmaX5rpbWluQogZYL5cCUa8R0Tn/QwuhDgNzA+rGt9MJRIHksmkaqS5JbgUYomZh6qBi5TPD/sZfECIWcU8vaExEAzuz2QypmVwEYuVg/ZVO75ERAf9DC6FuMPMF2ueaRhDuVzutQavq0DrPa47XjE3vdTt7nMhxElgflTN8y0cifSYpvnDbl7f7/HJyckAESVBqb0BxFtpohd2oSvnA7+bmxOQjXJo8GpV0G+Ps/+r4wBZyufjbol2Iq+U8gErdcbZAwwAGABX2DAaHgGdEG4nBzLvZoAZZt5pH1yIl8B8yI6gTsYGgsE9mUzmg+Ujq4zFbjDA1U6KtzH3MuXz/c3iWx5ZR0ZGdqyvraVqLyo2VHgZiojrDDBBRK/aAi8HjY6OBguFwgQzDyBzt5cAVudSAIyIy4j4PJvNlv951fTqyFdWq0BujNfgblTVzzl1x/3cHTe06Y67UVU/5/wJeI6VXSXjSTAAAAAASUVORK5CYII=) 50% no-repeat;
  background-size: 20px;
}

.el-upload-list__item-actions:hover .upload-icon {
  display: inline-block;
}

.el-icon-zoom-in:before {
  content: "\E626";
}

.el-icon-delete:before {
  content: "\E612";
}

.el-upload-list__item-actions:hover {
  opacity: 1;
}

.upload-item {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
}

.upload-item .el-form-item__content {
  width: 500px!important;
}

.upload-tips {
  font-size: 12px;
  color: #666;
  display: inline-block;
  line-height: 17px;
  margin-left: 36px;
}

.el-upload-list__item-actions {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  cursor: default;
  text-align: center;
  color: #fff;
  opacity: 0;
  font-size: 20px;
  background-color: rgba(0,0,0,.5);
  -webkit-transition: opacity .3s;
  transition: opacity .3s;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column;
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader {
  display: inline-block;
}

.avatar-uploader .el-upload:hover {
  border-color: #ffc200;
}

.el-upload-span {
  width: 100px;
  height: 30px;
  border: 1px solid #fff;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  line-height: 30px;
}

.el-upload-span:first-child {
  margin-bottom: 20px;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 200px;
  height: 160px;
  line-height: 160px;
  text-align: center;
}

.avatar {
  width: 200px;
  height: 160px;
  display: block;
}
</style>
