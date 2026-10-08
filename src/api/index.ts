import request from '@/utils/request'
// 订单管理
  export const getOrderData = () =>
  request({
    'url': `/workspace/overview/orders`,
    'method': 'get'
  })
// 菜品总览
export const getOverviewDishes = () =>
request({
  'url': `/workspace/overview/dishes`,
  'method': 'get'
})
// 套餐总览
export const getSetMealStatistics = () =>
request({
  'url': `/workspace/overview/setmeals`,
  'method': 'get'
})
// 营业数据
export const getBusinessData = (params: any) =>
request({
  'url': `/workspace/overview/data`,
  'method': 'get',
  params
})
/**
 *
 * 报表数据
 *
 **/

// 营业额统计
export const getTurnoverStatistics= (params: any) =>
  request({
    'url': `/report/turnover-statistics`,
    'method': 'get',
    params
  })

// 用户统计
export const getUserStatistics= (params: any) =>
  request({
    'url': `/report/user-statistics`,
    'method': 'get',
    params
  })
  // 订单统计
export const getOrderStatistics= (params: any) =>
request({
  'url': `/report/order-statistics`,
  'method': 'get',
  params
})
  // 销量排名TOP10
  export const getTop= (params: any) =>
  request({
    'url': `/report/sales-statistics`,
    'method': 'get',
    params
  })
  // 导出运营数据报表：后端要求必填 begin/end（yyyy-MM-dd），返回 Excel 文件流
  export function exportInfor(params: any) {
    return request({
      url: '/report/export',
      method: 'get',
      responseType: 'blob',
      params
    })
  }
