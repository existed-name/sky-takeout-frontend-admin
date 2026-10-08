import request from '@/utils/request'
/**
 *
 * 套餐管理
 *
 **/

// 查询列表数据
export const getSetmealPage = (params: any) => {
  return request({
    url: '/setmeals',
    method: 'get',
    params,
  },)
}

// 删除数据接口
export const deleteSetmeal = (ids: string) => {
  return request({
    url: '/setmeals',
    method: 'delete',
    params: { ids }
  })
}

// 修改数据接口
export const editSetmeal = (params: any) => {
  // 主键拼进路径，请求体里不能再带主键（后端按路径变量取主键，
  // 请求体对应的数据传输对象里没有主键字段）
  const { id, ...rest } = params
  return request({
    url: '/setmeals/' + id,
    method: 'put',
    data: rest
  })
}

// 新增数据接口
export const addSetmeal = (params: any) => {
  return request({
    url: '/setmeals',
    method: 'post',
    data: { ...params }
  })
}

// 查询详情接口
export const querySetmealById = (id: string | (string | null)[]) => {
  return request({
    url: '/setmeals/' + id,
    method: 'get'
  })
}

// 起售禁售
// 后端只提供单条状态切换端点：主键在路径、状态值在请求体。
// 键名与菜品/员工/分类三个模块统一为 id
export const setmealStatusByStatus = (params: any) => {
  return request({
    url: '/setmeals/' + params.id + '/status',
    method: 'put',
    data: { status: params.status }
  })
}

//菜品分类数据查询
export const dishCategoryList = (params: any) => {
  return request({
    url: `/categories/list`,
    method: 'get',
    params: { ...params }
  })
}
