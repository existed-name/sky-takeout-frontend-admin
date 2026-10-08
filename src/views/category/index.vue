<template>
  <div class="dashboard-container">
    <div class="container">
      <div class="tableBar" style="display:inline-block;width:100%">
        <label style="margin-right:10px">
          分类名称：
        </label>
        <el-input style="width:15%" placeholder="请填写分类名称" clearable v-model="name" @clear="init" @keyup.enter.native="init" />
        <label style="margin-right:5px;margin-left:20px">
          分类类型：
        </label>
        <el-select style="width:15%" placeholder="请选择" clearable v-model="categoryType" @clear="init">
          <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <div style="float:right">
          <el-button class="continue" type="primary" @click="addClass('class')">

          + 新增菜品分类

          </el-button>
          <el-button style="margin-left:20px" type="primary" @click="addClass('meal')">

          + 新增套餐分类

          </el-button>
        </div>
        <el-button class="normal-btn continue" @click="init(true)">

        查询

        </el-button>
      </div>
      <el-table v-if="tableData.length" class="tableBox" :data="tableData" stripe>
        <el-table-column prop="name" label="分类名称" />
        <el-table-column prop="type" label="分类类型">
          <template slot-scope="scope">
            <span>
              {{ scope.row.type=='1'?'菜品分类':'套餐分类' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" />
        <el-table-column label="操作" width="200" align="center">
          <template slot-scope="scope">
            <el-button class="blueBug" type="text" size="small" @click="editHandle(scope.row)">

            修改

            </el-button>
            <el-button class="delBut" type="text" size="small" @click="deleteHandle(scope.row.id)">

            删除

            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <Empty v-else :is-search="isSearch" />
      <el-pagination v-if="counts>10" class="pageList" :page-sizes="[10,20,30,40]" :page-size="pageSize" layout="total, sizes, prev, pager, next, jumper" :total="counts" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
    </div>
    <el-dialog :title="classData.title" :visible="classData.dialogVisible" width="30%" :before-close="handleClose" @update:visible="$set(classData,'dialogVisible',$event)">
      <el-form ref="classData" class="demo-form-inline" :model="classData" :rules="rules" label-width="100px">
        <el-form-item label="分类名称：" prop="name">
          <el-input placeholder="请输入分类名称" maxlength="20" v-model="classData.name" />
        </el-form-item>
        <el-form-item label="排序：" prop="sort">
          <el-input placeholder="请输入排序" v-model="classData.sort" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button size="medium" @click="classData.dialogVisible=false,$refs.classData.resetFields()">
          取 消
        </el-button>
        <el-button :class="{continue:actionType==='add'}" type="primary" size="medium" @click="submitForm()">
          确 定
        </el-button>
        <el-button v-if="action!='edit'" type="primary" size="medium" @click="submitForm('go')">

        保存并继续添加

        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import HeadLable from '@/components/HeadLable/index.vue'
import {
  getCategoryPage,
  deleCategory,
  editCategory,
  addCategory
} from '@/api/category'
import Empty from '@/components/Empty/index.vue'

@Component({
  name: 'Category',
  components: {
    HeadLable,
    Empty
  }
})
export default class extends Vue {
  private options: any = [
    {
      value: 1,
      label: '菜品分类'
    },
    {
      value: 2,
      label: '套餐分类'
    }
  ]
  private actionType: string = ''
  private categoryType: number = null
  private name: string = ''
  private action: string = ''
  private counts: number = 0
  private page: number = 1
  private pageSize: number = 10
  private tableData = []
  private type = ''
  private isSearch: boolean = false
  private classData: any = {
    title: '添加菜品分类',
    dialogVisible: false,
    categoryId: '',
    name: '',
    sort: ''
  }

  get rules() {
    return {
      name: [
        {
          required: true,
          trigger: 'blur',
          validator: (rule: any, value: string, callback: Function) => {
            // const reg = /[\u4e00-\u9fa5]/
            var reg = new RegExp('^[A-Za-z\u4e00-\u9fa5]+$')
            if (!value) {
              callback(new Error(this.classData.title + '不能为空'))
            } else if (value.length < 2) {
              callback(new Error('分类名称输入不符，请输入2-20个字符'))
            } else if (!reg.test(value)) {
              callback(new Error('分类名称包含特殊字符'))
            } else {
              callback()
            }
          }
        }
      ],
      sort: [
        {
          required: true,
          trigger: 'blur',
          validator: (rule: any, value: string, callback: Function) => {
            if (value || String(value) === '0') {
              const reg = /^\d+$/
              if (!reg.test(value)) {
                callback(new Error('排序只能输入数字类型'))
              } else if (Number(value) > 99) {
                callback(new Error('排序只能输入0-99数字'))
              } else {
                callback()
              }
            } else {
              callback(new Error('排序不能为空'))
            }
          }
        }
      ]
    }
  }

  created() {
    this.init()
  }

  // 初始化信息
  private async init(isSearch?) {
    this.isSearch = isSearch
    await getCategoryPage({
      page: this.page,
      pageSize: this.pageSize,
      name: this.name ? this.name : undefined,
      type: this.categoryType ? this.categoryType : undefined
    })
      .then(res => {
        if (String(res.data.code) === '1') {
          this.tableData =
            res && res.data && res.data.data && res.data.data.records
          this.counts = Number(res.data.data.total)
        } else {
          this.$message.error(res.data.msg)
        }
      })
      .catch(err => {
        console.log(err, 'err')
        this.$message.error('请求出错了：' + err.message)
      })
  }

  // 添加
  private addClass(st: any) {
    if (st == 'class') {
      this.classData.title = '新增菜品分类'
      this.type = '1'
    } else {
      this.classData.title = '新增套餐分类'
      this.type = '2'
    }
    this.action = 'add'
    this.classData.name = ''
    this.classData.sort = ''
    this.classData.dialogVisible = true
    this.actionType = 'add'
  }

  // 修改
  private editHandle(dat: any) {
    this.classData.title = '修改分类'
    this.action = 'edit'
    this.classData.name = dat.name
    this.classData.sort = dat.sort
    this.classData.id = dat.id
    // 后端修改接口要求分类类型必填，从列表行取回原值
    this.classData.type = dat.type
    this.classData.dialogVisible = true
    this.actionType = 'edit'
  }

  // 关闭弹窗
  private handleClose(st: string) {
    console.log(this.$refs.classData, 'this.$refs.classData')
    this.classData.dialogVisible = false
    //对该表单项进行重置，将其值重置为初始值并移除校验结果
    this.$refs.classData.resetFields()
  }

  //删除
  private deleteHandle(id: any) {
    this.$confirm('此操作将永久删除该分类，是否继续？', '确定删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      deleCategory(id)
        .then(res => {
          if (res.data.code === 1) {
            this.$message.success('删除成功！')
            this.init()
          } else {
            this.$message.error(res.data.msg)
          }
        })
        .catch(err => {
          this.$message.error('请求出错了：' + err.message)
        })
    })
  }

  $refs!: {
    classData: any
  }

  //数据提交
  submitForm(st: any) {
    if (this.action === 'add') {
      this.$refs.classData.validate((value: boolean) => {
        if (value) {
          addCategory({
            name: this.classData.name,
            type: Number(this.type),
            sort: this.classData.sort
          })
            .then(res => {
              if (res.data.code === 1) {
                this.$message.success('分类添加成功！')
                this.$refs.classData.resetFields()
                if (!st) {
                  this.classData.dialogVisible = false
                }
                this.init()
              } else {
                this.$message.error(res.data.msg)
              }
            })
            .catch(err => {
              this.$message.error('请求出错了：' + err.message)
            })
        }
      })
    } else {
      this.$refs.classData.validate((value: boolean) => {
        if (value) {
          editCategory({
            id: this.classData.id,
            name: this.classData.name,
            sort: this.classData.sort,
            // 后端修改接口要求分类类型必填，取修改弹窗打开时回填的类型
            type: this.classData.type
          })
            .then(res => {
              if (res.data.code === 1) {
                this.$message.success('分类修改成功！')
                this.classData.dialogVisible = false
                this.$refs.classData.resetFields()
                this.init()
              } else {
                this.$message.error(res.data.msg)
              }
            })
            .catch(err => {
              this.$message.error('请求出错了：' + err.message)
            })
        }
      })
    }
  }

  //分页
  private handleSizeChange(val: any) {
    this.pageSize = val
    this.init()
  }

  private handleCurrentChange(val: any) {
    this.page = val
    this.init()
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

.dashboard-container {
  margin: 30px;
}

.dashboard-container .container {
  background: #fff;
  position: relative;
  z-index: 1;
  padding: 30px 28px;
  border-radius: 4px;
}

.dashboard-container .container .tableBar {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  margin-bottom: 20px;
  -webkit-box-pack: justify;
  -ms-flex-pack: justify;
  justify-content: space-between;
}

.dashboard-container .container .tableBox {
  width: 100%;
  border: 1px solid #f3f4f7;
  border-bottom: 0;
}

.dashboard-container .container .pageList {
  text-align: center;
  margin-top: 30px;
}

.dashboard-container .container .normal-btn {
  background: #333;
  color: #fff;
  margin-left: 20px;
}
</style>

<style lang="scss">
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
</style>
