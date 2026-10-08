import request from '@/utils/request'

// 查询列表页接口
export const getOrderDetailPage = (params: any) => {
  return request({
    url: '/orders',
    method: 'get',
    params
  })
}

// 查看接口：订单主键走路径变量
export const queryOrderDetailById = (params: any) => {
  return request({
    url: '/orders/' + params.orderId,
    method: 'get'
  })
}

// 派送接口：订单主键在动作词之前，接口不接收请求体
export const deliveryOrder = (params: any) => {
  return request({
    url: '/orders/' + params.id + '/delivery',
    method: 'put'
  })
}

// 完成接口：订单主键在动作词之前，动作词为名词 completion，接口不接收请求体
export const completeOrder = (params: any) => {
  return request({
    url: '/orders/' + params.id + '/completion',
    method: 'put'
  })
}

// 订单取消：订单主键走路径变量，请求体只提交取消原因
export const orderCancel = (params: any) => {
  return request({
    url: '/orders/' + params.id + '/cancelation',
    method: 'put',
    data: { cancelReason: params.cancelReason }
  })
}

// 接单：订单主键走路径变量，动作词为 acceptance，接口不接收请求体
export const orderAccept = (params: any) => {
  return request({
    url: '/orders/' + params.id + '/acceptance',
    method: 'put'
  })
}

// 拒单：订单主键走路径变量，请求体只提交拒单原因
export const orderReject = (params: any) => {
  return request({
    url: '/orders/' + params.id + '/rejection',
    method: 'put',
    data: { rejectionReason: params.rejectionReason }
  })
}

// 获取待处理，待派送，派送中数量
export const getOrderListBy = (params: any) => {
  return request({
    url: '/orders/statistics',
    method: 'get'
  })
}
