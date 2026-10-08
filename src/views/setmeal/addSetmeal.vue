<template>
  <div class="addBrand-container">
    <div class="container">
      <el-form ref="ruleForm" class="demo-ruleForm" :model="ruleForm" :rules="rules" :inline="true" label-width="180px">
        <div>
          <el-form-item label="套餐名称:" prop="name">
            <el-input placeholder="请填写套餐名称" maxlength="14" v-model="ruleForm.name" />
          </el-form-item>
          <el-form-item label="套餐分类:" prop="idType">
            <el-select placeholder="请选择套餐分类" v-model="ruleForm.idType" @change="$forceUpdate()">
              <el-option v-for="(item, index) in setMealList" :key="index" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </div>
        <div>
          <el-form-item label="套餐价格:" prop="price">
            <el-input placeholder="请设置套餐价格" v-model="ruleForm.price" />
          </el-form-item>
        </div>
        <div>
          <el-form-item label="套餐菜品:" required>
            <el-form-item>
              <div class="addDish">
                <span v-if="dishTable.length==0" class="addBut" @click="openAddDish('new')">
                  
                + 添加菜品
                </span>
                <div v-if="dishTable.length!=0" class="content">
                  <div class="addBut" style="margin-bottom:20px" @click="openAddDish('change')">
                    
                  + 添加菜品
                
                  </div>
                  <div class="table">
                    <el-table style="width:100%" :data="dishTable">
                      <el-table-column prop="name" label="名称" width="180" align="center" />
                      <el-table-column prop="price" label="原价" width="180" align="center">
                        <template slot-scope="scope">
                          
                        {{ Number(scope.row.price).toFixed(2)*100/100 }}
                      
                        </template>
                      </el-table-column>
                      <el-table-column prop="address" label="份数" align="center">
                        <template slot-scope="scope">
                          <el-input-number size="small" :min="1" :max="99" label="描述文字" v-model="scope.row.copies" />
                        </template>
                      </el-table-column>
                      <el-table-column prop="address" label="操作" width="180px;" align="center">
                        <template slot-scope="scope">
                          <el-button class="delBut non" type="text" size="small" @click="delDishHandle(scope.$index)">
                            
                          删除
                        
                          </el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </div>
              </div>
            </el-form-item>
          </el-form-item>
        </div>
        <div>
          <el-form-item label="套餐图片:" required prop="image">
            <image-upload :prop-image-url="imageUrl" business-type="setmeal" @imageChange="imageChange">
              
            图片大小不超过2M
              <br />
              仅能上传 PNG JPEG JPG类型图片
              <br />
              建议上传200*200或300*300尺寸的图片
          
            </image-upload>
          </el-form-item>
        </div>
        <div class="address">
          <el-form-item label="套餐描述:">
            <el-input type="textarea" :rows="3" maxlength="200" placeholder="套餐描述，最长200字" v-model="ruleForm.description" />
          </el-form-item>
        </div>
        <div class="subBox address">
          <el-form-item>
            <el-button @click="$router.back()">
              
            取消
          
            </el-button>
            <el-button :class="{continue:actionType==='add'}" type="primary" @click="submitForm('ruleForm',false)">
              
            保存
          
            </el-button>
            <el-button v-if="actionType=='add'" type="primary" @click="submitForm('ruleForm',true)">
              
            保存并继续添加
          
            </el-button>
          </el-form-item>
        </div>
      </el-form>
    </div>
    <el-dialog v-if="dialogVisible" class="addDishList" title="添加菜品" :visible="dialogVisible" width="60%" :before-close="handleClose" @update:visible="dialogVisible=$event">
      <el-input class="seachDish" style="width:293px;height:40px" placeholder="请输入菜品名称进行搜索" size="small" clearable v-model="value">
        <i slot="prefix" class="el-input__icon el-icon-search" style="cursor:pointer" @click="seachHandle" />
      </el-input>
      <AddDish v-if="dialogVisible" ref="adddish" :check-list="checkList" :seach-key="seachKey" :dish-list="dishList" @checkList="getCheckList" />
      <span slot="footer" class="dialog-footer">
        <el-button @click="handleClose">
          取 消
        </el-button>
        <el-button type="primary" @click="addTableList">
          添 加
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import HeadLable from '@/components/HeadLable/index.vue'
import ImageUpload from '@/components/ImgUpload/index.vue'
import AddDish from './components/AddDish.vue'
import { querySetmealById, addSetmeal, editSetmeal } from '@/api/setMeal'
import { getCategoryList } from '@/api/dish'

@Component({
  name: 'addShop',
  components: {
    HeadLable,
    AddDish,
    ImageUpload
  }
})
export default class extends Vue {
  private value: string = ''
  private setMealList: [] = []
  private seachKey: string = ''
  private dishList: [] = []
  private imageUrl: string = ''
  private actionType: string = ''
  private dishTable: [] = []
  private dialogVisible: boolean = false
  private checkList: any[] = []
  private ruleForm = {
    name: '',
    categoryId: '',
    price: '',
    code: '',
    image: '',
    description: '',
    dishList: [],
    status: true,
    idType: ''
  }

  get rules() {
    return {
      name: {
        required: true,
        validator: (rule: any, value: string, callback: Function) => {
          if (!value) {
            callback(new Error('请输入套餐名称'))
          } else {
            const reg = /^([A-Za-z0-9\u4e00-\u9fa5]){2,20}$/
            if (!reg.test(value)) {
              callback(new Error('套餐名称输入不符，请输入2-20个字符'))
            } else {
              callback()
            }
          }
        },
        trigger: 'blur'
      },
      idType: {
        required: true,
        message: '请选择套餐分类',
        trigger: 'change'
      },
      image: {
        required: true,
        message: '菜品图片不能为空'
      },
      price: {
        required: true,
        // 'message': '请输入套餐价格',
        validator: (rules: any, value: string, callback: Function) => {
          const reg = /^([1-9]\d{0,5}|0)(\.\d{1,2})?$/
          if (!reg.test(value) || Number(value) <= 0) {
            callback(
              new Error(
                '套餐价格格式有误，请输入大于零且最多保留两位小数的金额'
              )
            )
          } else {
            callback()
          }
        },
        trigger: 'blur'
      },
      code: { required: true, message: '请输入商品码', trigger: 'blur' }
    }
  }

  created() {
    this.getDishTypeList()
    this.actionType = this.$route.query.id ? 'edit' : 'add'
    if (this.actionType == 'edit') {
      this.init()
    }
  }

  private async init() {
    querySetmealById(this.$route.query.id).then(res => {
      if (res && res.data && res.data.code === 1) {
        this.ruleForm = res.data.data
        this.ruleForm.status = res.data.data.status == '1'
        ;(this.ruleForm as any).price = res.data.data.price
        this.imageUrl = res.data.data.image
        this.checkList = res.data.data.setmealDishes
        this.dishTable = res.data.data.setmealDishes.reverse()
        this.ruleForm.idType = res.data.data.categoryId
      } else {
        this.$message.error(res.data.msg)
      }
    })
  }
  private seachHandle() {
    this.seachKey = this.value
  }
  // 获取套餐分类
  private getDishTypeList() {
    getCategoryList({ type: 2, page: 1, pageSize: 1000 }).then(res => {
      if (res && res.data && res.data.code === 1) {
        this.setMealList = res.data.data.map((obj: any) => ({
          ...obj,
          idType: obj.id
        }))
      } else {
        this.$message.error(res.data.msg)
      }
    })
  }

  // 通过套餐ID获取菜品列表分类
  // private getDishList (id:number) {
  //   getDishListType({id}).then(res => {
  //     if (res.data.code == 200) {
  //       const { data } = res.data
  //       this.dishList = data
  //     } else {
  //       this.$message.error(res.data.desc)
  //     }
  //   })
  // }

  // 删除套餐菜品
  delDishHandle(index: any) {
    this.dishTable.splice(index, 1)
    this.checkList = this.dishTable
    // this.checkList.splice(index, 1)
  }

  // 获取添加菜品数据 - 确定加菜倒序展示
  private getCheckList(value: any) {
    this.checkList = [...value].reverse()
  }

  // 添加菜品
  openAddDish(st: string) {
    this.seachKey = ''
    this.dialogVisible = true
  }
  // 取消添加菜品
  handleClose(done: any) {
    // this.$refs.adddish.close()
    this.dialogVisible = false
    this.checkList = JSON.parse(JSON.stringify(this.dishTable))
    // this.dialogVisible = false
  }

  // 保存添加菜品列表
  public addTableList() {
    this.dishTable = JSON.parse(JSON.stringify(this.checkList))
    this.dishTable.forEach((n: any) => {
      n.copies = 1
    })
    this.dialogVisible = false
  }

  public submitForm(formName: any, st: any) {
    ;(this.$refs[formName] as any).validate((valid: any) => {
      if (valid) {
        if (this.dishTable.length === 0) {
          return this.$message.error('套餐下菜品不能为空')
        }
        if (!this.ruleForm.image) return this.$message.error('套餐图片不能为空')
        let prams = { ...this.ruleForm } as any
        prams.setmealDishes = this.dishTable.map((obj: any) => ({
          copies: obj.copies,
          dishId: obj.dishId,
          name: obj.name,
          price: obj.price
        }))
        ;(prams as any).status =
          this.actionType === 'add' ? 0 : this.ruleForm.status ? 1 : 0
        prams.categoryId = this.ruleForm.idType
        // delete prams.dishList
        if (this.actionType == 'add') {
          delete prams.id
          addSetmeal(prams)
            .then(res => {
              if (res && res.data && res.data.code === 1) {
                this.$message.success('套餐添加成功！')
                if (!st) {
                  this.$router.push({ path: '/setmeal' })
                } else {
                  ;(this as any).$refs.ruleForm.resetFields()
                  this.dishList = []
                  this.dishTable = []
                  this.ruleForm = {
                    name: '',
                    categoryId: '',
                    price: '',
                    code: '',
                    image: '',
                    description: '',
                    dishList: [],
                    status: true,
                    id: '',
                    idType: ''
                  } as any
                  this.imageUrl = ''
                }
              } else {
                this.$message.error(res.data.msg)
              }
            })
            .catch(err => {
              this.$message.error('请求出错了：' + err.message)
            })
        } else {
          delete prams.updateTime
          editSetmeal(prams)
            .then(res => {
              if (res.data.code === 1) {
                this.$message.success('套餐修改成功！')
                this.$router.push({ path: '/setmeal' })
              } else {
                // this.$message.error(res.data.desc || res.data.message)
              }
            })
            .catch(err => {
              this.$message.error('请求出错了：' + err.message)
            })
        }
      } else {
        // console.log('error submit!!')
        return false
      }
    })
  }

  imageChange(value: any) {
    this.ruleForm.image = value
  }
}
</script>

<style lang="css">
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

<style lang="scss">
.addBrand-container .avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.addBrand-container .avatar-uploader .el-upload:hover {
  border-color: #ffc200;
}

.addBrand-container .avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 200px;
  height: 160px;
  line-height: 160px;
  text-align: center;
}

.addBrand-container .avatar {
  width: 200px;
  height: 160px;
  display: block;
}

.addBrand-container .el-input {
  width: 293px;
}

.addBrand-container .address .el-form-item__content {
  width: 777px!important;
}

.addBrand-container .el-input__prefix {
  top: 2px;
}

.addBrand-container .addDish .el-input {
  width: 130px;
}

.addBrand-container .addDish .el-input-number__increase {
  border-left: 1px solid #fbe396;
  background: #fffbf0;
}

.addBrand-container .addDish .el-input-number__decrease {
  border-right: 1px solid #fbe396;
  background: #fffbf0;
}

.addBrand-container .addDish input {
  border: 1px solid #fbe396;
}

.addBrand-container .addDish .table {
  border: 1px solid #ebeef5;
  border-radius: 3px;
}

.addBrand-container .addDish .table th {
  padding: 5px 0;
}

.addBrand-container .addDish .table td {
  padding: 7px 0;
}

.addBrand-container .addDishList .seachDish {
  position: absolute;
  top: 12px;
  right: 20px;
}

.addBrand-container .addDishList .el-dialog__footer {
  padding-top: 27px;
}

.addBrand-container .addDishList .el-dialog__body {
  padding: 0;
  border-bottom: 1px solid #efefef;
}

.addBrand-container .addDishList .seachDish .el-input__inner {
  height: 40px;
  line-height: 40px;
}
</style>

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

.addBrand-container .container .el-input {
  width: 350px;
}

.addBrand-container .container .addDish {
  width: 777px;
}

.addBrand-container .container .addDish .addBut {
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

.addBrand-container .container .addDish .content {
  background: #fafafb;
  padding: 20px;
  border: 1px solid #d8dde3;
  border-radius: 3px;
}
</style>
