import request from '@/utils/request';
/**
 *
 * 分类管理
 *
 **/

// 查询分类列表接口
export const getCategoryPage = (params: any) => {
  return request({
    url: '/categories',
    method: 'get',
    params
  });
};

// 删除当前列的接口：主键在路径上，后端是 DELETE /categories/{id}
export const deleCategory = (ids: string) => {
  return request({
    url: '/categories/' + ids,
    method: 'delete'
  });
};

// 修改接口：主键在路径上，请求体只提交分类类型、名称与排序
export const editCategory = (params: any) => {
  return request({
    url: '/categories/' + params.id,
    method: 'put',
    data: { type: params.type, name: params.name, sort: params.sort }
  });
};

// 新增接口
export const addCategory = (params: any) => {
  return request({
    url: '/categories',
    method: 'post',
    data: { ...params }
  });
};
