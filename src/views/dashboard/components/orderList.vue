<template>
  <div>
    <div class="container homecon">
      <h2 class="homeTitle homeTitleBtn">
        订单信息
        <ul class="conTab">
          <li
            v-for="(item, index) in tabList"
            :key="index"
            :class="activeIndex===index?'active':''"
            @click="handleClass(index)"
          >
            <el-badge
              class="item"
              :class="item.num>=10?'badgeW':''"
              :value="item.num>99?'99+':item.num"
              :hidden="!([2,3].includes(item.value)&&item.num)"
            >
              {{ item.label }}
            </el-badge>
          </li>
        </ul>
      </h2>
      <div>
        <div v-if="orderData.length>0">
          <el-table
            class="tableBox"
            style="width:100%"
            :data="orderData"
            stripe
            @row-click="handleTable"
          >
            <el-table-column prop="number" label="订单号" />
            <el-table-column label="订单菜品">
              <template slot-scope="scope">
                <div class="ellipsisHidden">
                  <el-popover
                    placement="top-start"
                    title
                    width="200"
                    trigger="hover"
                    :content="scope.row.orderDishes"
                  >
                    <span slot="reference">
                      {{ scope.row.orderDishes }}
                    </span>
                  </el-popover>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="地址" :class-name="dialogOrderStatus===2?'address':''">
              <template slot-scope="scope">
                <div class="ellipsisHidden">
                  <el-popover
                    placement="top-start"
                    title
                    width="200"
                    trigger="hover"
                    :content="scope.row.address"
                  >
                    <span slot="reference">
                      {{ scope.row.address }}
                    </span>
                  </el-popover>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              prop="estimatedDeliveryTime"
              label="预计送达时间"
              sortable
              class-name="orderTime"
              min-width="130"
            />
            <el-table-column prop="amount" label="实收金额" />
            <el-table-column label="备注">
              <template slot-scope="scope">
                <div class="ellipsisHidden">
                  <el-popover
                    placement="top-start"
                    title
                    width="200"
                    trigger="hover"
                    :content="scope.row.remark"
                  >
                    <span slot="reference">
                      {{ scope.row.remark }}
                    </span>
                  </el-popover>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              v-if="status===3"
              prop="tablewareNumber"
              label="餐具数量"
              min-width="80"
              align="center"
            />
            <el-table-column
              label="操作"
              align="center"
              :class-name="dialogOrderStatus===0?'operate':'otherOperate'"
              :min-width="[2,3].includes(dialogOrderStatus)?130:[0].includes(dialogOrderStatus)?140:'auto'"
            >
              <template slot-scope="{ row }">
                <div class="before">
                  <el-button
                    v-if="row.status===2"
                    class="blueBug"
                    type="text"
                    @click="orderAccept(row,$event),isTableOperateBtn=true"
                  >
                    接单
                  </el-button>
                  <el-button
                    v-if="row.status===3"
                    class="blueBug"
                    type="text"
                    @click="cancelOrDeliveryOrComplete(3,row.id,$event)"
                  >
                    派送
                  </el-button>
                </div>
                <div class="middle">
                  <el-button
                    v-if="row.status===2"
                    class="delBut"
                    type="text"
                    @click="orderReject(row,$event),isTableOperateBtn=true"
                  >
                    拒单
                  </el-button>
                  <el-button
                    v-if="[1,3,4,5].includes(row.status)"
                    class="delBut"
                    type="text"
                    @click="cancelOrder(row,$event)"
                  >
                    取消
                  </el-button>
                </div>
                <div class="after">
                  <el-button
                    class="blueBug non"
                    type="text"
                    @click="goDetail(row.id,row.status,row,$event)"
                  >
                    查看
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <Empty v-else :is-search="isSearch" />
        <el-pagination
          v-if="counts>10"
          class="pageList"
          :page-sizes="[10,20,30,40]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="counts"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
    <el-dialog
      class="order-dialog"
      title="订单信息"
      :visible="dialogVisible"
      width="53%"
      :before-close="handleClose"
      @update:visible="dialogVisible=$event"
    >
      <el-scrollbar style="height:100%">
        <div class="order-top">
          <div>
            <div style="display:inline-block">
              <label style="font-size:16px">
                订单号：
              </label>
              <div class="order-num">
                {{ diaForm.number }}
              </div>
            </div>
            <div
              class="order-status"
              :class="{status3:[3,4].includes(dialogOrderStatus)}"
              style="display:inline-block"
            >
              {{ orderList.filter(function(item){return item.value===dialogOrderStatus;})[0].label }}
            </div>
          </div>
          <p>
            <label>
              下单时间：
            </label>
            {{ diaForm.orderTime }}
          </p>
        </div>
        <div class="order-middle">
          <div class="user-info">
            <div class="user-info-box">
              <div class="user-name">
                <label>
                  用户名：
                </label>
                <span>
                  {{ diaForm.consignee }}
                </span>
              </div>
              <div class="user-phone">
                <label>
                  手机号：
                </label>
                <span>
                  {{ diaForm.phone }}
                </span>
              </div>
              <div v-if="[2,3,4,5].includes(dialogOrderStatus)" class="user-getTime">
                <label>
                  {{ dialogOrderStatus===5?'送达时间：':'预计送达时间：' }}
                </label>
                <span>
                  {{ dialogOrderStatus===5?diaForm.deliveryTime:diaForm.estimatedDeliveryTime }}
                </span>
              </div>
              <div class="user-address">
                <label>
                  地址：
                </label>
                <span>
                  {{ diaForm.address }}
                </span>
              </div>
            </div>
            <div class="user-remark" :class="{orderCancel:dialogOrderStatus===6}">
              <div>
                {{ dialogOrderStatus===6?'取消原因':'备注' }}
              </div>
              <span>
                {{ dialogOrderStatus===6?diaForm.cancelReason||diaForm.rejectionReason:diaForm.remark }}
              </span>
            </div>
          </div>
          <div class="dish-info">
            <div class="dish-label">
              菜品
            </div>
            <div class="dish-list">
              <div v-for="(item, index) in diaForm.orderDetailList" :key="index" class="dish-item">
                <span class="dish-name">
                  {{ item.name }}
                </span>
                <span class="dish-num">
                  x{{ item.number }}
                </span>
                <span class="dish-price">
                  ￥{{ item.amount?item.amount.toFixed(2):'' }}
                </span>
              </div>
            </div>
            <div class="dish-all-amount">
              <label>
                菜品小计
              </label>
              <span>
                ￥{{ (diaForm.amount-6-diaForm.packAmount).toFixed(2) }}
              </span>
            </div>
          </div>
        </div>
        <div class="order-bottom">
          <div class="amount-info">
            <div class="amount-label">
              费用
            </div>
            <div class="amount-list">
              <div class="dish-amount">
                <span class="amount-name">
                  菜品小计：
                </span>
                <span class="amount-price">
                  ￥{{ (diaForm.amount-6-diaForm.packAmount).toFixed(2)*100/100 }}
                </span>
              </div>
              <div class="send-amount">
                <span class="amount-name">
                  派送费：
                </span>
                <span class="amount-price">
                  ￥{{ 6 }}
                </span>
              </div>
              <div class="package-amount">
                <span class="amount-name">
                  打包费：
                </span>
                <span class="amount-price">
                  ￥{{ diaForm.packAmount?diaForm.packAmount.toFixed(2)*100/100:'' }}
                </span>
              </div>
              <div class="all-amount">
                <span class="amount-name">
                  合计：
                </span>
                <span class="amount-price">
                  ￥{{ diaForm.amount?diaForm.amount.toFixed(2)*100/100:'' }}
                </span>
              </div>
              <div class="pay-type">
                <span class="pay-name">
                  支付渠道：
                </span>
                <span class="pay-value">
                  {{ diaForm.payMethod===1?'微信支付':'支付宝支付' }}
                </span>
              </div>
              <div class="pay-time">
                <span class="pay-name">
                  支付时间：
                </span>
                <span class="pay-value">
                  {{ diaForm.checkoutTime }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </el-scrollbar>
      <span v-if="dialogOrderStatus!==6" slot="footer" class="dialog-footer">
        <el-checkbox v-if="dialogOrderStatus===2&&status===2" v-model="isAutoNext">
          处理完自动跳转下一条
        </el-checkbox>
        <el-button v-if="dialogOrderStatus===2" @click="orderReject(row,$event),isTableOperateBtn=false">
          拒 单
        </el-button>
        <el-button v-if="dialogOrderStatus===2" type="primary" @click="orderAccept(row,$event),isTableOperateBtn=false">
          接 单
        </el-button>
        <el-button v-if="[1,3,4,5].includes(dialogOrderStatus)" @click="dialogVisible=false">
          返 回
        </el-button>
        <el-button v-if="dialogOrderStatus===3" type="primary" @click="cancelOrDeliveryOrComplete(3,row.id,$event)">
          派 送
        </el-button>
        <el-button v-if="dialogOrderStatus===4" type="primary" @click="cancelOrDeliveryOrComplete(4,row.id,$event)">
          完 成
        </el-button>
        <el-button v-if="[1].includes(dialogOrderStatus)" type="primary" @click="cancelOrder(row,$event)">
          取消订单
        </el-button>
      </span>
    </el-dialog>
    <el-dialog
      class="cancelDialog"
      :title="cancelDialogTitle+'原因'"
      :visible="cancelDialogVisible"
      width="42%"
      :before-close="function(){return cancelDialogVisible=false,cancelReason='';}"
      @update:visible="cancelDialogVisible=$event"
    >
      <el-form label-width="90px">
        <el-form-item :label="cancelDialogTitle+'原因：'">
          <el-select :placeholder="'请选择'+cancelDialogTitle+'原因'" v-model="cancelReason">
            <el-option
              v-for="(item, index) in cancelDialogTitle==='取消'?cancelrReasonList:cancelOrderReasonList"
              :key="index"
              :label="item.label"
              :value="item.label"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="cancelReason==='自定义原因'" label="原因：">
          <el-input
            type="textarea"
            :placeholder="'请填写您'+cancelDialogTitle+'的原因（限20字内）'"
            maxlength="20"
            v-model.trim="remark"
          />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="cancelDialogVisible=false,cancelReason=''">
          取 消
        </el-button>
        <el-button type="primary" @click="confirmCancel">
          确 定
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import Empty from '@/components/Empty/index.vue'
import {
  getOrderDetailPage,
  queryOrderDetailById,
  completeOrder,
  deliveryOrder,
  orderCancel,
  orderReject,
  orderAccept,
} from '@/api/order'
@Component({
  name: 'Orderview',
  components: {
    Empty,
  },
})
export default class extends Vue {
  @Prop({ default: '' }) orderStatics!: any

  private orderId = '' //订单号
  private dialogOrderStatus = 0 //弹窗所需订单状态，用于详情展示字段
  private activeIndex = 0

  private dialogVisible = false //详情弹窗
  private cancelDialogVisible = false //取消，拒单弹窗
  private cancelDialogTitle = '' //取消，拒绝弹窗标题
  private cancelReason = ''
  private remark = '' //自定义原因
  private diaForm = []
  private row = {}
  private isAutoNext = true
  private isSearch: boolean = false
  private counts = 0
  private page: number = 1
  private pageSize: number = 10
  private status = 2
  private orderData = []
  private isTableOperateBtn = true
  private cancelOrderReasonList = [
    {
      value: 1,
      label: '订单量较多，暂时无法接单',
    },
    {
      value: 2,
      label: '菜品已销售完，暂时无法接单',
    },
    {
      value: 3,
      label: '餐厅已打烊，暂时无法接单',
    },
    {
      value: 0,
      label: '自定义原因',
    },
  ]

  private cancelrReasonList = [
    {
      value: 1,
      label: '订单量较多，暂时无法接单',
    },
    {
      value: 2,
      label: '菜品已销售完，暂时无法接单',
    },
    {
      value: 3,
      label: '骑手不足无法配送',
    },
    {
      value: 4,
      label: '客户电话取消',
    },
    {
      value: 0,
      label: '自定义原因',
    },
  ]
  private orderList = [
    {
      label: '全部订单',
      value: 0,
    },
    {
      label: '待付款',
      value: 1,
    },
    {
      label: '待接单',
      value: 2,
    },
    {
      label: '待派送',
      value: 3,
    },
    {
      label: '派送中',
      value: 4,
    },
    {
      label: '已完成',
      value: 5,
    },
    {
      label: '已取消',
      value: 6,
    },
  ]
  get tabList() {
    return [
      {
        label: '待接单',
        value: 2,
        num: this.orderStatics.toBeConfirmed,
      },
      {
        label: '待派送',
        value: 3,
        num: this.orderStatics.confirmed,
      },
    ]
  }
  created() {
    this.getOrderListData(this.status)
  }
  // // 获取订单数据
  async getOrderListData(status) {
    const params = {
      page: this.page,
      pageSize: this.pageSize,
      status: status,
    }
    const data = await getOrderDetailPage(params)
    this.orderData = data.data.data.records
    this.counts = data.data.data.total
    this.$emit('getOrderListBy3Status')
    if (
      this.dialogOrderStatus === 2 &&
      this.status === 2 &&
      this.isAutoNext &&
      !this.isTableOperateBtn &&
      data.data.records.length > 1
    ) {
      const row = data.data.records[0]
      this.goDetail(row.id, row.status, row, row)
    } else {
      return null
    }
  }

  //接单
  orderAccept(row: any, event) {
    event.stopPropagation()
    this.orderId = row.id
    this.dialogOrderStatus = row.status
    orderAccept({ id: this.orderId })
      .then((res) => {
        if (res.data.code === 1) {
          this.$message.success('操作成功')
          this.orderId = ''
          // this.dialogOrderStatus = 0
          this.dialogVisible = false
          this.getOrderListData(this.status)
        } else {
          this.$message.error(res.data.msg)
        }
      })
      .catch((err) => {
        this.$message.error('请求出错了：' + err.message)
      })
  }
  //打开取消订单弹窗
  cancelOrder(row: any, event) {
    event.stopPropagation()
    this.cancelDialogVisible = true
    this.orderId = row.id
    this.dialogOrderStatus = row.status
    this.cancelDialogTitle = '取消'
    this.dialogVisible = false
    this.cancelReason = ''
  }
  //打开拒单弹窗
  orderReject(row: any, event) {
    event.stopPropagation()
    this.cancelDialogVisible = true
    this.orderId = row.id
    this.dialogOrderStatus = row.status
    this.cancelDialogTitle = '拒绝'
    this.dialogVisible = false
    this.cancelReason = ''
  }
  //确认取消或拒绝订单并填写原因
  confirmCancel(type) {
    if (!this.cancelReason) {
      return this.$message.error(`请选择${this.cancelDialogTitle}原因`)
    } else if (this.cancelReason === '自定义原因' && !this.remark) {
      return this.$message.error(`请输入${this.cancelDialogTitle}原因`)
    }

    ;(this.cancelDialogTitle === '取消' ? orderCancel : orderReject)({
      id: this.orderId,
      // eslint-disable-next-line standard/computed-property-even-spacing
      [this.cancelDialogTitle === '取消' ? 'cancelReason' : 'rejectionReason']:
        this.cancelReason === '自定义原因' ? this.remark : this.cancelReason,
    })
      .then((res) => {
        if (res.data.code === 1) {
          this.$message.success('操作成功')
          this.cancelDialogVisible = false
          this.orderId = ''
          // this.dialogOrderStatus = 0
          this.getOrderListData(this.status)
        } else {
          this.$message.error(res.data.msg)
        }
      })
      .catch((err) => {
        this.$message.error('请求出错了：' + err.message)
      })
  }

  // 派送，完成
  cancelOrDeliveryOrComplete(status: number, id: string, event) {
    event.stopPropagation()
    const params = {
      status,
      id,
    }
    ;(status === 3 ? deliveryOrder : completeOrder)(params)
      .then((res) => {
        if (res.data.code === 1) {
          this.$message.success('操作成功')
          this.orderId = ''
          // this.dialogOrderStatus = 0
          this.dialogVisible = false
          this.getOrderListData(this.status)
        } else {
          this.$message.error(res.data.msg)
        }
      })
      .catch((err) => {
        this.$message.error('请求出错了：' + err.message)
      })
  }
  // 查看详情
  async goDetail(id: any, status: number, row: any, event) {
    event.stopPropagation()
    // console.log(111, index, row)
    this.diaForm = []
    this.dialogVisible = true
    this.dialogOrderStatus = status
    const { data } = await queryOrderDetailById({ orderId: id })
    this.diaForm = data.data
    this.row = row
  }
  // 关闭弹层
  handleClose() {
    this.dialogVisible = false
  }
  // tab切换
  handleClass(index) {
    this.activeIndex = index
    if (index === 0) {
      this.status = 2
      this.getOrderListData(2)
    } else {
      this.status = 3
      this.getOrderListData(3)
    }
  }
  // 触发table某一行
  handleTable(row, column, event) {
    event.stopPropagation()
    this.goDetail(row.id, row.status, row, event)
  }
  // 分页
  private handleSizeChange(val: any) {
    this.pageSize = val
    this.getOrderListData(this.status)
  }

  private handleCurrentChange(val: any) {
    this.page = val
    this.getOrderListData(this.status)
  }
}
</script>

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

.dashboard-container.home .homecon {
  margin-bottom: 0;
}

.order-top {
  border-bottom: 1px solid #e7e6e6;
  padding-bottom: 26px;
  padding-left: 22px;
  padding-right: 22px;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: justify;
  -ms-flex-pack: justify;
  justify-content: space-between;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
}

.order-top .order-status {
  width: 57.25px;
  height: 27px;
  background: #333;
  border-radius: 13.5px;
  color: #fff;
  margin-left: 19px;
  text-align: center;
  line-height: 27px;
}

.order-top .status3 {
  background: #f56c6c;
}

.order-top p {
  color: #333;
}

.order-top p label {
  color: #666;
}

.order-top .order-num {
  font-size: 16px;
  color: #2a2929;
  font-weight: 700;
  display: inline-block;
}

.order-middle .user-info {
  min-height: 140px;
  background: #fbfbfa;
  margin-top: 23px;
  padding: 20px 43px;
  color: #333;
}

.order-middle .user-info .user-info-box {
  min-height: 55px;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-wrap: wrap;
  flex-wrap: wrap;
}

.order-middle .user-info .user-info-box .user-name {
  -webkit-box-flex: 67%;
  -ms-flex: 67%;
  flex: 67%;
}

.order-middle .user-info .user-info-box .user-phone {
  -webkit-box-flex: 33%;
  -ms-flex: 33%;
  flex: 33%;
}

.order-middle .user-info .user-info-box .user-getTime {
  margin-top: 14px;
  -webkit-box-flex: 80%;
  -ms-flex: 80%;
  flex: 80%;
}

.order-middle .user-info .user-info-box .user-getTime label {
  margin-right: 3px;
}

.order-middle .user-info .user-info-box label {
  margin-right: 17px;
  color: #666;
}

.order-middle .user-info .user-info-box .user-address {
  margin-top: 14px;
  -webkit-box-flex: 80%;
  -ms-flex: 80%;
  flex: 80%;
}

.order-middle .user-info .user-info-box .user-address label {
  margin-right: 30px;
}

.order-middle .user-info .user-remark {
  height: 43px;
  line-height: 43px;
  background: #fffbf0;
  border: 1px solid #fbe396;
  border-radius: 4px;
  margin-top: 10px;
  padding: 6px;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
}

.order-middle .user-info .user-remark div {
  display: inline-block;
  min-width: 53px;
  height: 32px;
  background: #fbe396;
  border-radius: 4px;
  text-align: center;
  line-height: 32px;
  color: #333;
  margin-right: 30px;
}

.order-middle .user-info .user-remark span {
  color: #f2a402;
}

.order-middle .user-info .orderCancel {
  background: #fff;
  border: 1px solid #b6b6b6;
}

.order-middle .user-info .orderCancel div {
  padding: 0 10px;
  background-color: #e5e4e4;
}

.order-middle .user-info .orderCancel span {
  color: #f56c6c;
}

.order-middle .dish-info {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-wrap: wrap;
  flex-wrap: wrap;
  padding: 20px 40px;
  border-bottom: 1px solid #e7e6e6;
}

.order-middle .dish-info .dish-label {
  color: #666;
}

.order-middle .dish-info .dish-list {
  -webkit-box-flex: 80%;
  -ms-flex: 80%;
  flex: 80%;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-wrap: wrap;
  flex-wrap: wrap;
}

.order-middle .dish-info .dish-list .dish-item {
  -webkit-box-flex: 50%;
  -ms-flex: 50%;
  flex: 50%;
  margin-bottom: 14px;
  color: #333;
}

.order-middle .dish-info .dish-list .dish-item .dish-num {
  margin-right: 51px;
}

.order-middle .dish-info .dish-label {
  margin-right: 65px;
}

.order-middle .dish-info .dish-all-amount {
  -webkit-box-flex: 1;
  -ms-flex: 1;
  flex: 1;
  padding-left: 92px;
  margin-top: 10px;
}

.order-middle .dish-info .dish-all-amount label {
  color: #333;
  font-weight: 700;
  margin-right: 5px;
}

.order-middle .dish-info .dish-all-amount span {
  color: #f56c6c;
}

.order-bottom .amount-info {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-wrap: wrap;
  flex-wrap: wrap;
  padding: 20px 40px;
  padding-bottom: 0;
}

.order-bottom .amount-info .amount-label {
  color: #666;
  margin-right: 65px;
}

.order-bottom .amount-info .amount-list {
  -webkit-box-flex: 80%;
  -ms-flex: 80%;
  flex: 80%;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-wrap: wrap;
  flex-wrap: wrap;
  color: #333;
}

.order-bottom .amount-info .amount-list .dish-amount,
.order-bottom .amount-info .amount-list .package-amount,
.order-bottom .amount-info .amount-list .pay-type {
  display: inline-block;
  width: 300px;
  margin-bottom: 14px;
  -webkit-box-flex: 50%;
  -ms-flex: 50%;
  flex: 50%;
}

.order-bottom .amount-info .amount-list .all-amount,
.order-bottom .amount-info .amount-list .pay-time,
.order-bottom .amount-info .amount-list .send-amount {
  display: inline-block;
  -webkit-box-flex: 50%;
  -ms-flex: 50%;
  flex: 50%;
  padding-left: 10%;
}

.order-bottom .amount-info .amount-list .package-amount .amount-name {
  margin-right: 14px;
}

.order-bottom .amount-info .amount-list .all-amount .amount-name {
  margin-right: 24px;
}

.order-bottom .amount-info .amount-list .all-amount .amount-price {
  color: #f56c6c;
}

.order-bottom .amount-info .amount-list .send-amount .amount-name {
  margin-right: 10px;
}
</style>

<style lang="scss">
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

.dashboard-container .cancelTime,
.dashboard-container .orderTime {
  padding-left: 30px;
}

.dashboard-container td.operate .cell .after,
.dashboard-container td.operate .cell .before,
.dashboard-container td.operate .cell .middle {
  height: 39px;
  width: 48px;
}

.dashboard-container td.operate .cell,
.dashboard-container td.otherOperate .cell {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-wrap: nowrap;
  flex-wrap: nowrap;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
}
</style>
