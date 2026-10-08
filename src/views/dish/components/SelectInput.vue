<template>
  <div class="selectInput">
    <el-input style="width:100%" type="text" placeholder="请选择口味" clearable readonly v-model="value" @focus="selectFlavor(true)" @blur="outSelect(false)" />
    <div v-if="mak&&dishFlavorsData.length" class="flavorSelect">
      <span v-for="(it, ind) in dishFlavorsData" :key="ind" class="items" @click="checkOption(it,ind)">
        {{ it.name }}
      </span>
      <span v-if="dishFlavorsData==[]" class="none">
        无数据
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({
  name: 'selectInput',
})
export default class extends Vue {
  @Prop({ default: [] }) private selectFlavorsData!: []
  @Prop({ default: [] }) private dishFlavorsData!: []
  @Prop({ default: '' }) private value!: number
  @Prop({ default: 0 }) private index!: number
  private keyValue = NaN

  private mak: boolean = false

  private selectFlavor(st: boolean) {
    this.mak = st
  }

  private outSelect(st: boolean) {
    const _this = this
    setTimeout(function () {
      _this.mak = st
    }, 200)
  }

  private inputHandle(val: any) {
    this.selectFlavor(false)
  }

  checkOption(val: any, ind: any) {
    this.$emit('select', val.name, this.index, ind)
    this.keyValue = val.name
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

.selectInput {
  position: relative;
  width: 100%;
  min-width: 100px;
}

.selectInput .flavorSelect {
  position: absolute;
  width: 100%;
  border-radius: 3px;
  border: 1px solid #e4e7ed;
  line-height: 30px;
  text-align: center;
  background: #fff;
  top: 50px;
  z-index: 99;
}

.selectInput .flavorSelect .items {
  cursor: pointer;
  display: inline-block;
  width: 100%;
  line-height: 35px;
  border-bottom: 1px solid #f4f4f4;
  color: #666;
  margin: 0!important;
}

.selectInput .flavorSelect .items:hover {
  background-color: #fffbf0;
}

.selectInput .flavorSelect .items:active {
  background-color: #fffbf0;
  color: #ffc200;
}

.selectInput .flavorSelect .none {
  font-size: 14px;
}
</style>
