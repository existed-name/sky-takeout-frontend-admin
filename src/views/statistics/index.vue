<template>
  <div class="dashboard-container home">
    <TitleIndex :flag="flag" :tateData="tateData" @sendTitleInd="getTitleNum" @sendCustomRange="getCustomRange" />
    <div class="homeMain">
      <TurnoverStatistics :turnoverdata="turnoverData" />
      <UserStatistics :userdata="userData" />
    </div>
    <div class="homeMain homecon">
      <OrderStatistics :orderdata="orderData" />
      <Top :top10data="top10Data" />
    </div>
  </div>
</template>

<script lang="ts">import { Component, Vue } from 'vue-property-decorator'
import {
  get1stAndToday,
  past7Day,
  past30Day,
  pastWeek,
  pastMonth,
} from '@/utils/formValidate'
import {
  getTurnoverStatistics,
  getUserStatistics,
  getOrderStatistics,
  getTop,
} from '@/api/index'
// 组件
// 标题
import TitleIndex from './components/titleIndex.vue'
// 营业额统计
import TurnoverStatistics from './components/turnoverStatistics.vue'
// 用户统计
import UserStatistics from './components/userStatistics.vue'
// 订单统计
import OrderStatistics from './components/orderStatistics.vue'
// 排名
import Top from './components/top10.vue'
@Component({
  name: 'Dashboard',
  components: {
    TitleIndex,
    TurnoverStatistics,
    UserStatistics,
    OrderStatistics,
    Top,
  },
})
export default class extends Vue {
  private flag = 2
  private tateData = []
  private turnoverData = {} as any
  private userData = {}
  private orderData = {
    data: {},
  } as any
  private top10Data = {}
  created() {
    //this.init(this.flag)
    this.getTitleNum(2);
  }
  // 获取基本数据
  init(begin: any,end:any) {
    this.$nextTick(() => {
      this.getTurnoverStatisticsData(begin,end)
      this.getUserStatisticsData(begin,end)
      this.getOrderStatisticsData(begin,end)
      this.getTopData(begin,end)
    })
  }

  // 获取营业额统计数据（后端返回 items 对象数组，元素字段 date / turnover）
  async getTurnoverStatisticsData(begin: any, end: any) {
    const res = await getTurnoverStatistics({ begin, end })
    const payload = (res.data && res.data.data) || {}
    const items = payload.items || []
    this.turnoverData = {
      dateList: items.map((item: any) => item.date),
      turnoverList: items.map((item: any) => item.turnover)
    }
  }

  // 获取用户统计数据（userCountList 元素字段 date / total；userGrowthList 元素字段 date / growth）
  async getUserStatisticsData(begin: any, end: any) {
    const res = await getUserStatistics({ begin, end })
    const payload = (res.data && res.data.data) || {}
    const userCountList = payload.userCountList || []
    const userGrowthList = payload.userGrowthList || []
    this.userData = {
      dateList: userCountList.map((item: any) => item.date),
      totalUserList: userCountList.map((item: any) => item.total),
      newUserList: userGrowthList.map((item: any) => item.growth)
    }
  }

  // 获取订单统计数据（orderCountList / validOrderCountList 元素字段均为 date / count）
  async getOrderStatisticsData(begin: any, end: any) {
    const res = await getOrderStatistics({ begin, end })
    const payload = (res.data && res.data.data) || {}
    const orderCountList = payload.orderCountList || []
    const validOrderCountList = payload.validOrderCountList || []
    this.orderData = {
      data: {
        dateList: orderCountList.map((item: any) => item.date),
        orderCountList: orderCountList.map((item: any) => item.count),
        validOrderCountList: validOrderCountList.map((item: any) => item.count)
      },
      totalOrderCount: payload.totalOrderCount,
      validOrderCount: payload.validOrderCount,
      orderCompletionRate: payload.orderCompletionRate
    }
  }

  // 获取排行数据（items 元素字段 name / salesCount）
  async getTopData(begin: any, end: any) {
    const res = await getTop({ begin, end })
    const payload = (res.data && res.data.data) || {}
    const items = payload.items || []
    this.top10Data = {
      // 注意：后端排序方向尚未实测（见验收实测项 6）。
      // 若实测发现 /report/sales-statistics 已按销量降序返回，需删除这两个 .reverse()
      nameList: items.map((item: any) => item.name).reverse(),
      numberList: items.map((item: any) => item.salesCount).reverse()
    }
  }
  // 获取当前选中的tab时间
  getTitleNum(data) {
    switch (data) {
      case 1:
        this.tateData = get1stAndToday()
        break
      case 2:
        this.tateData = past7Day()
        break
      case 3:
        this.tateData = past30Day()
        break
      case 4:
        this.tateData = pastWeek()
        break
      case 5:
        this.tateData = pastMonth()
        break
    }
    this.init(this.tateData[0],this.tateData[1])
  }
  // 自定义日期区间：直接按用户选择的起止日期取数，复用同一套 init(begin, end) 通道
  getCustomRange(range: string[]) {
    if (!range || range.length < 2 || !range[0] || !range[1]) {
      return
    }
    this.tateData = range
    this.init(range[0], range[1])
  }
}
</script>
