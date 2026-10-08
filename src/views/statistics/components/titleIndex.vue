<template>
  <div class="title-index">
    <div class="month">
      <ul class="tabs">
        <li v-for="(item, index) in tabsParam" :key="index" class="li-tab" :class="{active:index===nowIndex}" @click="toggleTabs(index)">
          
        {{ item }}
        
          <span />
        </li>
      </ul>
    </div>
    <div class="get-time">
      <p>
        
      已选时间：{{ tateData[0] }} 至
      {{ tateData[tateData.length-1] }}
    
      </p>
    </div>
    <div class="custom-time">
      <el-date-picker
        v-model="customRange"
        type="daterange"
        value-format="yyyy-MM-dd"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :clearable="true"
        unlink-panels
        @change="handleCustomRange"
      />
    </div>
    <el-button class="right-el-button" icon="iconfont icon-download" @click="handleExport">
      数据导出
    </el-button>
  </div>
</template>

<script lang="ts">import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { exportInfor } from '@/api/index'
@Component({
  name: 'TitleIndex',
})
export default class extends Vue {
  @Prop() private flag!: any
  @Prop() private tateData!: any
  @Prop() private turnoverData!: any

  nowIndex = 2 - 1
  value = []
  tabsParam = ['昨日', '近7日', '近30日', '本周', '本月']
  // 自定义起止日期，元素为 yyyy-MM-dd 字符串（依赖选择器的 value-format）
  customRange = [] as string[]
  @Watch('flag')
  getNowIndex(val) {
    this.nowIndex = val
  }
  // tab切换
  toggleTabs(index: number) {
    this.nowIndex = index
    this.value = []
    // 切回预设页签时清空自定义区间，保证「预设区间」与「自定义区间」互斥
    this.customRange = []
    this.$emit('sendTitleInd', index + 1)
  }
  // 自定义区间变化：校验后把区间上抛给父组件取数
  handleCustomRange(val: any) {
    // 清空选择器（val 为 null）或值不完整时不发请求
    if (!val || val.length < 2 || !val[0] || !val[1]) {
      this.customRange = []
      return
    }
    // 选择器自身已限制 begin <= end，这里再兜一次
    if (val[0] > val[1]) {
      this.$message.error('开始日期不能晚于结束日期')
      this.customRange = []
      return
    }
    // 自定义区间不再对应任何预设页签，取消页签高亮（nowIndex = -1 时不会命中任何页签）
    this.nowIndex = -1
    this.$emit('sendCustomRange', [val[0], val[1]])
  }
  /** 导出按钮操作：按当前所选时间区间导出运营数据 */
  handleExport() {
    // tateData 由父组件按页签设置（均为 yyyy-MM-dd 的两元素数组）；
    // 异常时序下可能为空，此时 begin/end 会变成 undefined、axios 会丢弃该参数，
    // 后端必填校验直接失败，因此在发请求前先拦一下
    if (!this.tateData || this.tateData.length < 2) {
      this.$message.error('请先选择统计时间区间')
      return
    }
    const begin = this.tateData[0]
    const end = this.tateData[this.tateData.length - 1]
    this.$confirm(`是否确认导出 ${begin} 至 ${end} 的运营数据?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        // 用箭头函数保留组件的 this（原写法是普通函数，取不到 tateData 与 $message）
        const { data } = await exportInfor({ begin, end })
        // 后端在参数/业务异常时会返回 HTTP 200 的 JSON（响应头已先按文件流设置过），
        // 因此不能只靠 code 判定：先看 blob 类型里是否含 json
        if (data && data.type && data.type.indexOf('json') !== -1) {
          const text = await data.text()
          let tip = '导出失败'
          try {
            const result = JSON.parse(text)
            tip = result.msg || tip
          } catch (err) {
            // 解析失败时保留默认提示
          }
          this.$message.error(tip)
          return
        }
        const url = window.URL.createObjectURL(data)
        const a = document.createElement('a')
        document.body.appendChild(a)
        a.href = url
        a.download = '运营数据统计报表.xlsx'
        a.click()
        window.URL.revokeObjectURL(url)
      })
      .catch(err => {
        // 用户点「取消」时 $confirm 会以 'cancel' 拒绝，不视为失败
        if (err === 'cancel' || err === 'close') return
        // HTTP 4xx/5xx、网络不通等都会走这里（axios 以 reject 返回）；
        // 401 的登录跳转已在响应拦截器里处理
        this.$message.error('导出失败：' + (err && err.message ? err.message : '网络异常'))
      })
  }
}
</script>
