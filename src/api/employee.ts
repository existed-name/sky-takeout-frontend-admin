import request from '@/utils/request'
/**
 *
 * 员工管理
 *
 **/
// 登录
// 说明：这是管理端唯一免登录的端点；密码按明文提交，由后端自行做 MD5，前端不要加密。
// 登录失败时后端同样返回 HTTP 200，只把 code 置为 0 并带上中文提示，因此调用方必须按 code 判定。
export const login = (data: any) =>
  request({
    'url': '/employees/login',
    'method': 'post',
    data
  })
// 退出
// 说明：形参 params 保留不删（调用方会传 {}），删掉会让调用方报“参数过多”。
export const userLogout = (params: any) =>
  request({
    'url': '/employees/logout',
    'method': 'post'
  })

export const getEmployeeList = (params: any) => {
  return request({
    url: '/employees',
    method: 'get',
    params
  })
}

// 修改---启用禁用接口
export const enableOrDisableEmployee = (params: any) => {
  return request({
    url: '/employees/' + params.id + '/status',
    method: 'put',
    data: { status: params.status }
  })
}

// 新增---添加员工
export const addEmployee = (params: any) => {
  return request({
    url: '/employees',
    method: 'post',
    data: { ...params }
  })
}

// 修改---添加员工
export const editEmployee = (params: any) => {
  // 修改时员工标识只出现在请求路径里，请求体需要剔除 id
  const { id, ...data } = params
  return request({
    url: '/employees/' + id,
    method: 'put',
    data
  })
}

// 修改页面反查详情接口
export const queryEmployeeById = (id: string | (string | null)[]) => {
  return request({
    url: '/employees/' + id,
    method: 'get'
  })
}
