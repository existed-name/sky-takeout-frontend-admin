import request from '@/utils/request'

// 获取营业状态
export const getStatus = () =>
  request({
    'url': '/shop/status',
    'method': 'get'
  })

// 设置营业状态
// 说明：后端路径固定为 /shop/status（不把状态值拼进路径），状态值通过请求体传递。
export const setStatus = (data: any) =>
  request({
    'url': '/shop/status',
    'method': 'put',
    'data': { status: data }
  })
