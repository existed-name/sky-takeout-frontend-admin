<template>
  <div :key="vueRest" class="addBrand-container">
    <div :key="restKey" class="container">
      <el-form ref="ruleForm" class="demo-ruleForm" :model="ruleForm" :rules="rules" :inline="true" label-width="180px">
        <div>
          <el-form-item label="菜品名称:" prop="name">
            <el-input placeholder="请填写菜品名称" maxlength="20" v-model="ruleForm.name" />
          </el-form-item>
          <el-form-item label="菜品分类:" prop="categoryId">
            <el-select placeholder="请选择菜品分类" v-model="ruleForm.categoryId">
              <el-option v-for="(item, index) in dishList" :key="index" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </div>
        <div>
          <el-form-item label="菜品价格:" prop="price">
            <el-input placeholder="请设置菜品价格" v-model="ruleForm.price" />
          </el-form-item>
        </div>
        <el-form-item label="口味做法配置:">
          <el-form-item>
            <div class="flavorBox">
              <span v-if="dishFlavors.length==0" class="addBut" @click="addFlavore">

              + 添加口味
              </span>
              <div v-if="dishFlavors.length!=0" class="flavor">
                <div class="title">
                  <span>
                    口味名（3个字内）
                  </span>
                </div>
                <div class="cont">
                  <div v-for="(item, index) in dishFlavors" :key="index" class="items">
                    <div class="itTit">
                      <SelectInput :dish-flavors-data="leftDishFlavors" :index="index" :value="item.name" @select="selectHandle" />
                    </div>
                    <div class="labItems" style="display:flex">
                      <span v-for="(it, ind) in item.value" :key="ind">
                        {{ it }}

                        <i @click="delFlavorLabel(index,ind)">
                          X
                        </i>
                      </span>
                      <div class="inputBox" :style="inputStyle" />
                    </div>
                    <span class="delFlavor delBut non" @click="delFlavor(item.name)">
                      删除
                    </span>
                  </div>
                </div>
                <div v-if="!!this.leftDishFlavors.length&&this.dishFlavors.length<this.dishFlavorsData.length" class="addBut" @click="addFlavore">

                添加口味

                </div>
              </div>
            </div>
          </el-form-item>
        </el-form-item>
        <div>
          <el-form-item label="菜品图片:" prop="image">
            <image-upload :prop-image-url="imageUrl" business-type="dish" @imageChange="imageChange">

            图片大小不超过2M
              <br />
              仅能上传 PNG JPEG JPG类型图片
              <br />
              建议上传200*200或300*300尺寸的图片

            </image-upload>
          </el-form-item>
        </div>
        <div class="address">
          <el-form-item label="菜品描述:" prop="region">
            <el-input type="textarea" :rows="3" maxlength="200" placeholder="菜品描述，最长200字" v-model="ruleForm.description" />
          </el-form-item>
        </div>
        <div class="subBox address">
          <el-button @click="$router.back()">

          取消

          </el-button>
          <el-button :class="{continue:actionType==='add'}" type="primary" @click="submitForm('ruleForm')">

          保存

          </el-button>
          <el-button v-if="actionType=='add'" type="primary" @click="submitForm('ruleForm','goAnd')">

          保存并继续添加

          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import HeadLable from '@/components/HeadLable/index.vue'
import SelectInput from './components/SelectInput.vue'
import ImageUpload from '@/components/ImgUpload/index.vue'
// getFlavorList口味列表暂时不做 getDishTypeList
import {
  queryDishById,
  addDish,
  editDish,
  getCategoryList
} from '@/api/dish'
@Component({
  name: 'addShop',
  components: {
    HeadLable,
    SelectInput,
    ImageUpload
  }
})
export default class extends Vue {
  private restKey: number = 0
  private textarea: string = ''
  private value: string = ''
  private imageUrl: string = ''
  private actionType: string = ''
  private dishList: string[] = []
  private dishFlavorsData: any[] = [] //原始口味数据
  private dishFlavors: any[] = [] //待上传口味的数据
  private leftDishFlavors: any[] = [] //下拉框剩余可选择的口味数据
  private vueRest = '1'
  private index = 0
  private inputStyle = { flex: 1 }
  private ruleForm = {
    name: '',
    id: '',
    price: '',
    code: '',
    image: '',
    description: '',
    dishFlavors: [],
    status: true,
    categoryId: ''
  }

  get rules() {
    return {
      name: [
        {
          required: true,
          validator: (rule: any, value: string, callback: Function) => {
            if (!value) {
              callback(new Error('请输入菜品名称'))
            } else {
              const reg = /^([A-Za-z0-9\u4e00-\u9fa5]){2,20}$/
              if (!reg.test(value)) {
                callback(new Error('菜品名称输入不符，请输入2-20个字符'))
              } else {
                callback()
              }
            }
          },
          trigger: 'blur'
        }
      ],
      categoryId: [
        { required: true, message: '请选择菜品分类', trigger: 'change' }
      ],
      image: {
        required: true,
        message: '菜品图片不能为空'
      },
      price: [
        {
          required: true,
          // 'message': '请填写菜品价格',
          validator: (rules: any, value: string, callback: Function) => {
            const reg = /^([1-9]\d{0,5}|0)(\.\d{1,2})?$/
            if (!reg.test(value) || Number(value) <= 0) {
              callback(
                new Error(
                  '菜品价格格式有误，请输入大于零且最多保留两位小数的金额'
                )
              )
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ],
      code: [{ required: true, message: '请填写商品码', trigger: 'blur' }]
    }
  }

  created() {
    this.getDishList()
    // 口味临时数据
    this.getFlavorListHand()
    this.actionType = this.$route.query.id ? 'edit' : 'add'
    if (this.$route.query.id) {
      this.init()
    }
  }

  mounted() {}
  @Watch('dishFlavors')
  changeDishFlavors() {
    this.getLeftDishFlavors()
  }

  //过滤已选择的口味下拉框无法再次选择
  getLeftDishFlavors() {
    let arr = []
    this.dishFlavorsData.map(item => {
      if (
        this.dishFlavors.findIndex(item1 => item.name === item1.name) === -1
      ) {
        arr.push(item)
      }
    })
    this.leftDishFlavors = arr
  }

  private selectHandle(val: any, key: any, ind: any) {
    const arrDate = [...this.dishFlavors]
    const index = this.dishFlavorsData.findIndex(item => item.name === val)
    arrDate[key] = JSON.parse(JSON.stringify(this.dishFlavorsData[index]))
    this.dishFlavors = arrDate
  }

  private async init() {
    queryDishById(this.$route.query.id).then(res => {
      if (res && res.data && res.data.code === 1) {
        this.ruleForm = { ...res.data.data }
        this.ruleForm.price = String(res.data.data.price)
        this.ruleForm.status = res.data.data.status == '1'
        this.dishFlavors =
          res.data.data.flavors &&
          res.data.data.flavors.map(obj => ({
            ...obj,
            value: JSON.parse(obj.value)
          }))
        let arr = []
        this.getLeftDishFlavors()
        this.imageUrl = res.data.data.image
      } else {
        this.$message.error(res.data.msg)
      }
    })
  }

  // 按钮 - 添加口味
  private addFlavore() {
    this.dishFlavors.push({ name: '', value: [] }) // JSON.parse(JSON.stringify(this.dishFlavorsData))
  }

  // 按钮 - 删除口味
  private delFlavor(name: string) {
    let ind = this.dishFlavors.findIndex(item => item.name === name)
    this.dishFlavors.splice(ind, 1)
  }

  // 按钮 - 删除口味标签
  private delFlavorLabel(index: number, ind: number) {
    this.dishFlavors[index].value.splice(ind, 1)
  }

  //口味位置记录
  private flavorPosition(index: number) {
    this.index = index
  }

  // 添加口味标签
  private keyDownHandle(val: any) {
    if (event) {
      event.cancelBubble = true
      event.preventDefault()
      event.stopPropagation()
    }

    if (val.target.innerText.trim() != '') {
      this.dishFlavors[this.index].flavorData.push(val.target.innerText)
      val.target.innerText = ''
    }
  }

  // 获取菜品分类
  private getDishList() {
    getCategoryList({ type: 1 }).then(res => {
      if (res.data.code === 1) {
        this.dishList = res && res.data && res.data.data
      } else {
        this.$message.error(res.data.msg)
      }
      // if (res.data.code == 200) {
      //   const {data} = res.data
      //   this.dishList = data
      // } else {
      //   this.$message.error(res.data.desc)
      // }
    })
  }

  // 获取口味列表
  private getFlavorListHand() {
    // flavor flavorData
    this.dishFlavorsData = [
      { name: '甜味', value: ['无糖', '少糖', '半糖', '多糖', '全糖'] },
      { name: '温度', value: ['热饮', '常温', '去冰', '少冰', '多冰'] },
      { name: '忌口', value: ['不要葱', '不要蒜', '不要香菜', '不要辣'] },
      { name: '辣度', value: ['不辣', '微辣', '中辣', '重辣'] }
    ]
  }

  private submitForm(formName: any, st: any) {
    ;(this.$refs[formName] as any).validate((valid: any) => {
      console.log(valid, 'valid')
      if (valid) {
        if (!this.ruleForm.image) return this.$message.error('菜品图片不能为空')
        let params: any = { ...this.ruleForm }
        // params.flavors = this.dishFlavors
        params.status =
          this.actionType === 'add' ? 0 : this.ruleForm.status ? 1 : 0
        // params.price *= 100
        params.categoryId = this.ruleForm.categoryId
        params.flavors = this.dishFlavors.map(obj => ({
          ...obj,
          value: JSON.stringify(obj.value)
        }))
        delete params.dishFlavors
        if (this.actionType == 'add') {
          delete params.id
          addDish(params)
            .then(res => {
              if (res.data.code === 1) {
                this.$message.success('菜品添加成功！')
                if (!st) {
                  this.$router.push({ path: '/dish' })
                } else {
                  this.dishFlavors = []
                  // this.dishFlavorsData = []
                  this.imageUrl = ''
                  this.ruleForm = {
                    name: '',
                    id: '',
                    price: '',
                    code: '',
                    image: '',
                    description: '',
                    dishFlavors: [],
                    status: true,
                    categoryId: ''
                  }
                  this.restKey++
                }
              } else {
                this.$message.error(res.data.desc || res.data.msg)
              }
            })
            .catch(err => {
              this.$message.error('请求出错了：' + err.message)
            })
        } else {
          delete params.createTime
          delete params.updateTime
          editDish(params)
            .then(res => {
              if (res && res.data && res.data.code === 1) {
                this.$router.push({ path: '/dish' })
                this.$message.success('菜品修改成功！')
              } else {
                this.$message.error(res.data.desc || res.data.msg)
              }
              // if (res.data.code == 200) {
              //   this.$router.push({'path': '/dish'})
              //   this.$message.success('菜品修改成功！')
              // } else {
              //   this.$message.error(res.data.desc || res.data.message)
              // }
            })
            .catch(err => {
              this.$message.error('请求出错了：' + err.message)
            })
        }
      } else {
        return false
      }
    })
  }

  imageChange(value: any) {
    this.ruleForm.image = value
  }
}
</script>

<style scoped lang="scss">
.addBrand-container .el-form--inline .el-form-item__content {
  width: 293px;
}

.addBrand-container .el-input {
  width: 350px;
}

.addBrand-container .address .el-form-item__content {
  width: 777px!important;
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

.addBrand-container {
  margin: 30px;
}

.addBrand-container .container {
  position: relative;
  z-index: 1;
  background: #fff;
  padding: 30px;
  border-radius: 4px;
  min-height: 500px;
}

.addBrand-container .container .subBox {
  padding-top: 30px;
  text-align: center;
  border-top: 1px solid #f3f4f7;
}

.addBrand-container .container .upload-item .el-form-item__error {
  top: 90%;
}

.flavorBox {
  width: 777px;
}

.flavorBox .addBut {
  background: #ffc200;
  display: inline-block;
  padding: 0 20px;
  border-radius: 3px;
  line-height: 40px;
  cursor: pointer;
  border-radius: 4px;
  color: #333;
  font-weight: 500;
}

.flavorBox .flavor {
  border: 1px solid #dfe2e8;
  border-radius: 3px;
  padding: 15px;
  background: #fafafb;
}

.flavorBox .flavor .title {
  color: #606168;
}

.flavorBox .flavor .title .des-box {
  padding-left: 44px;
}

.flavorBox .flavor .cont .items {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  margin: 10px 0;
}

.flavorBox .flavor .cont .items .itTit {
  width: 150px;
  margin-right: 15px;
}

.flavorBox .flavor .cont .items .itTit input {
  width: 100%;
}

.flavorBox .flavor .cont .items .labItems {
  -webkit-box-flex: 1;
  -ms-flex: 1;
  flex: 1;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-wrap: wrap;
  flex-wrap: wrap;
  border-radius: 3px;
  min-height: 39px;
  border: 1px solid #d8dde3;
  background: #fff;
  padding: 0 5px;
}

.flavorBox .flavor .cont .items .labItems span {
  display: inline-block;
  color: #ffc200;
  margin: 5px;
  line-height: 26px;
  padding: 0 10px;
  background: #fffbf0;
  border: 1px solid #fbe396;
  border-radius: 4px;
  font-size: 12px;
}

.flavorBox .flavor .cont .items .labItems span i {
  cursor: pointer;
  font-style: normal;
}

.flavorBox .flavor .cont .items .labItems .inputBox {
  display: inline-block;
  width: 100%;
  height: 36px;
  line-height: 36px;
  overflow: hidden;
}

.flavorBox .flavor .cont .items .delFlavor {
  display: inline-block;
  padding: 0 10px;
  color: #f19c59;
  cursor: pointer;
}
</style>
