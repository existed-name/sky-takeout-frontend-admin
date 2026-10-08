import request from '@/utils/request'
/**
 *
 * 菜品管理
 *
 **/
// 查询列表接口
export const getDishPage = (params: any) => {
  return request({
    url: '/dishes',
    method: 'get',
    params
  })
}

// 删除接口
export const deleteDish = (ids: string) => {
  return request({
    url: '/dishes',
    method: 'delete',
    params: { ids }
  })
}

// 修改接口
export const editDish = (params: any) => {
  // 主键拼进路径，请求体里不能再带主键（后端按路径变量取主键，
  // 请求体对应的数据传输对象里没有主键字段）
  const { id, ...rest } = params
  return request({
    url: '/dishes/' + id,
    method: 'put',
    data: rest
  })
}

// 新增接口
export const addDish = (params: any) => {
  return request({
    url: '/dishes',
    method: 'post',
    data: { ...params }
  })
}

// 查询详情
export const queryDishById = (id: string | (string | null)[]) => {
  return request({
    url: '/dishes/' + id,
    method: 'get'
  })
}

// 获取菜品分类列表
export const getCategoryList = (params: any) => {
  return request({
    url: '/categories/list',
    method: 'get',
    params
  })
}

// 查菜品列表的接口
export const queryDishList = (params: any) => {
  return request({
    url: '/dishes/list',
    method: 'get',
    params
  })
}

// 起售停售---起售停售接口
// 后端只提供单条状态切换端点：主键在路径、状态值在请求体
export const dishStatusByStatus = (params: any) => {
  return request({
    url: '/dishes/' + params.id + '/status',
    method: 'put',
    data: { status: params.status }
  })
}

//菜品分类数据查询
export const dishCategoryList = (params: any) => {
  return request({
    url: '/categories/list',
    method: 'get',
    params: { ...params }
  })
}
