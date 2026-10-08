<template>
  <div class="addDish">
    <div class="leftCont">
      <div class="tabBut" v-show="seachKey.trim() == ''">
        <span v-for="(item, index) in dishType" :key="index" :class="{act:index==keyInd}" @click="checkTypeHandle(index,item.id)">
          {{ item.name }}
        </span>
      </div>
      <div class="tabList">
        <div class="table" :class="{borderNone:!dishList.length}">
          <div v-if="dishList.length==0" style="padding-left:10px">
            <Empty />
          </div>
          <el-checkbox-group v-if="dishList.length>0" v-model="checkedList" @change="checkedListHandle">
            <div v-for="(item, index) in dishList" :key="item.name+item.id" class="items">
              <el-checkbox :key="index" :label="item.name">
                <div class="item">
                  <span style="flex:3;text-align:left">
                    {{ item.dishName }}
                  </span>
                  <span>
                    {{ item.status==0?'停售':'在售' }}
                  </span>
                  <span>
                    {{ Number(item.price).toFixed(2)*100/100 }}
                  </span>
                </div>
              </el-checkbox>
            </div>
          </el-checkbox-group>
        </div>
      </div>
    </div>
    <div class="ritCont">
      <div class="tit">
        
      已选菜品({{ checkedListAll.length }})
    
      </div>
      <div class="items">
        <div v-for="(item, ind) in checkedListAll" :key="ind" class="item">
          <span>
            {{ item.dishName||item.name }}
          </span>
          <span class="price">
            ￥ {{ Number(item.price).toFixed(2)*100/100 }} 
          </span>
          <span class="del" @click="delCheck(item.name)">
            <img src="@/assets/icons/btn_clean@2x.png" alt />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
// import {getDishTypeList, getDishListType} from '@/api/dish';
import { getCategoryList, queryDishList } from '@/api/dish'
import Empty from '@/components/Empty/index.vue'

@Component({
  name: 'selectInput',
  components: {
    Empty
  }
})
export default class extends Vue {
  @Prop({ default: '' }) private value!: number
  @Prop({ default: [] }) private checkList!: any[]
  @Prop({ default: '' }) private seachKey!: string
  private dishType: [] = []
  private dishList: [] = []
  private allDishList: any[] = []
  private dishListCache: any[] = []
  private keyInd = 0
  private searchValue: string = ''
  public checkedList: any[] = []
  private checkedListAll: any[] = []
  private ids: any = new Set()
  created() {
    this.init()
  }

  @Watch('seachKey')
  private seachKeyChange(value: any) {
    if (value.trim()) {
      this.getDishForName(this.seachKey)
    }
  }

  public init() {
    // 菜单列表数据获取
    this.getDishType()
    // 初始化选项
    this.checkedList = this.checkList.map((it: any) => it.name)
    // 已选项的菜品-详细信息
    this.checkedListAll = this.checkList.reverse()
  }
  // 获取套餐分类
  public getDishType() {
    getCategoryList({ type: 1 }).then(res => {
      if (res && res.data && res.data.code === 1) {
        this.dishType = res.data.data
        this.getDishList(res.data.data[0].id)
      } else {
        this.$message.error(res.data.msg)
      }
    })
  }

  // 通过套餐ID获取菜品列表分类
  private getDishList(id: number) {
    queryDishList({ categoryId: id }).then(res => {
      if (res && res.data && res.data.code === 1) {
        if (res.data.data.length == 0) {
          this.dishList = []
          return
        }
        let newArr = res.data.data
        newArr.forEach((n: any) => {
          n.dishId = n.id
          n.copies = 1
          // n.dishCopies = 1
          n.dishName = n.name
        })
        this.dishList = newArr
        if (!this.ids.has(id)) {
          this.allDishList = [...this.allDishList, ...newArr]
        }
        this.ids.add(id)
      } else {
        this.$message.error(res.data.msg)
      }
    })
  }

  // 关键词收搜菜品列表分类
  private getDishForName(name: any) {
    queryDishList({ name }).then(res => {
      if (res && res.data && res.data.code === 1) {
        let newArr = res.data.data
        newArr.forEach((n: any) => {
          n.dishId = n.id
          n.dishName = n.name
        })
        this.dishList = newArr
      } else {
        this.$message.error(res.data.msg)
      }
    })
  }
  // 点击分类
  private checkTypeHandle(ind: number, id: any) {
    this.keyInd = ind
    this.getDishList(id)
  }
  // 添加菜品
  private checkedListHandle(value: [string]) {
    // TODO 实现倒序 由于value是组件内封装无法从前面添加 所有取巧处理倒序添加
    // 倒序展示 - 数据处理前反正 为正序
    this.checkedListAll.reverse()
    // value 是一个只包含菜品名的数组 需要从 dishList中筛选出 对应的详情
    // 操作添加菜品
    const list = this.allDishList.filter((item: any) => {
      let data
      value.forEach((it: any) => {
        if (item.name == it) {
          data = item
        }
      })
      return data
    })
    // 编辑的时候需要与已有菜品合并
    // 与当前请求下的选择性 然后去重就是当前的列表
    const dishListCat = [...this.checkedListAll, ...list]
    let arrData: any[] = []
    this.checkedListAll = dishListCat.filter((item: any) => {
      let allArrDate
      if (arrData.length == 0) {
        arrData.push(item.name)
        allArrDate = item
      } else {
        const st = arrData.some(it => item.name == it)
        if (!st) {
          arrData.push(item.name)
          allArrDate = item
        }
      }
      return allArrDate
    })
    // 如果是减菜 走这里
    if (value.length < arrData.length) {
      this.checkedListAll = this.checkedListAll.filter((item: any) => {
        if (value.some(it => it == item.name)) {
          return item
        }
      })
    }
    this.$emit('checkList', this.checkedListAll)
    // 数据处理完反转为倒序
    this.checkedListAll.reverse()
  }

  open(done: any) {
    this.dishListCache = JSON.parse(JSON.stringify(this.checkList))
  }

  close(done: any) {
    this.checkList = this.dishListCache
  }

  // 删除
  private delCheck(name: any) {
    const index = this.checkedList.findIndex(it => it === name)
    const indexAll = this.checkedListAll.findIndex(
      (it: any) => it.name === name
    )

    this.checkedList.splice(index, 1)
    this.checkedListAll.splice(indexAll, 1)
    this.$emit('checkList', this.checkedListAll)
  }
}
</script>

<style lang="scss">
.addDish .el-checkbox__label {
  width: 100%;
}

.addDish .empty-box {
  margin-top: 50px;
  margin-bottom: 0;
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

.addDish {
  padding: 0 20px;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  line-height: 40px;
}

.addDish .empty-box img {
  width: 190px;
  height: 147px;
}

.addDish .borderNone {
  border: none!important;
}

.addDish .tit,
.addDish span {
  color: #333;
}

.addDish .leftCont {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  border-right: 1px solid #efefef;
  width: 60%;
  padding: 15px;
}

.addDish .leftCont .tabBut {
  width: 110px;
  font-weight: 700;
  border-right: 2px solid #f4f4f4;
}

.addDish .leftCont .tabBut span {
  display: block;
  text-align: center;
  cursor: pointer;
  position: relative;
}

.addDish .leftCont .act {
  border-color: #ffc200!important;
  color: #ffc200!important;
}

.addDish .leftCont .act:after {
  content: " ";
  display: inline-block;
  background-color: #ffc200;
  width: 2px;
  height: 40px;
  position: absolute;
  right: -2px;
}

.addDish .leftCont .tabList {
  -webkit-box-flex: 1;
  -ms-flex: 1;
  flex: 1;
  padding: 15px;
  height: 400px;
  overflow-y: scroll;
}

.addDish .leftCont .tabList .table {
  border: 1px solid #f4f4f4;
  border-bottom: 1px solid #f4f4f4;
}

.addDish .leftCont .tabList .table .items {
  border-bottom: 1px solid #f4f4f4;
  padding: 0 10px;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
}

.addDish .leftCont .tabList .table .items .el-checkbox,
.addDish .leftCont .tabList .table .items .el-checkbox__label {
  width: 100%;
}

.addDish .leftCont .tabList .table .items .item {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  padding-right: 20px;
}

.addDish .leftCont .tabList .table .items .item span {
  display: inline-block;
  text-align: center;
  -webkit-box-flex: 1;
  -ms-flex: 1;
  flex: 1;
  font-weight: 400;
}

.addDish .ritCont {
  width: 40%;
}

.addDish .ritCont .tit {
  margin: 0 15px;
  font-weight: 700;
}

.addDish .ritCont .items {
  height: 338px;
  padding: 4px 15px;
  overflow: scroll;
}

.addDish .ritCont .item {
  -webkit-box-shadow: 0 1px 4px 3px rgba(0,0,0,.03);
  box-shadow: 0 1px 4px 3px rgba(0,0,0,.03);
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  text-align: center;
  padding: 0 10px;
  margin-bottom: 20px;
  border-radius: 6px;
  color: #818693;
}

.addDish .ritCont .item span:first-child {
  text-align: left;
  color: #20232a;
  -webkit-box-flex: 70%;
  -ms-flex: 70%;
  flex: 70%;
}

.addDish .ritCont .item .price {
  display: inline-block;
  -webkit-box-flex: 70%;
  -ms-flex: 70%;
  flex: 70%;
  text-align: left;
}

.addDish .ritCont .item .del {
  cursor: pointer;
}

.addDish .ritCont .item .del img {
  position: relative;
  top: 5px;
  width: 20px;
}
</style>
