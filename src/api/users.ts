import request from '@/utils/request'
  // 获取营业状态
  export const getStatus = () =>
  request({
    'url': `/shop/status`,
    'method': 'get'
  })
    // 设置营业状态
    export const setStatus = (data:any) =>
    request({
      'url': `/shop/`+data,
      'method': 'put',
      'data':data
    })