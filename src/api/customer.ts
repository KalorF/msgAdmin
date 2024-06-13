import { http } from "@/utils/http";

export const batchUpsert = (data?: any) => {
  return http.request<any>("post", "/api/customer/batch/upsert", { data });
};

export const createCustomer = (data?: any) => {
  return http.request<any>("post", "/api/customer/create", { data });
};

export const deleteCustomer = (id?: string) => {
  return http.request<any>("post", `/api/customer/delete/${id}`, { });
};

export const deleteCustomerForce = (id?: string) => {
  return http.request<any>("post", `/api/customer/force_delete/${id}`, { });
};

export const customerList = (data?: any) => {
  return http.request<any>("post", `/api/customer/list/`, { data });
};

export const customerRecover = (id?: any) => {
  return http.request<any>("post", `/api/customer/recover/${id}`, { });
};

export const customerSelect = (data?: any) => {
  return http.request<any>("post", `/api/customer/select`, { data });
};

export const customerUpdate = (data?: any) => {
  return http.request<any>("post", `/api/customer/update`, { data });
};

export const getCustomerById = (id: string) => {
  return http.request<any>("get", `/api/customer/${id}`, { });
}

export const getCustomerByTagId = (data: any) => {
  return http.request<any>("post", `/api/customer/select_by_tag_id_list`, { data });
}

export const createCustomerRecoed = (data: any) => {
  return http.request<any>("post", `/api/customer/follow/record/create`, { data });
}

export const recordDel = (id: string) => {
  return http.request<any>("post", `/api/customer/follow/record/delete/${id}`, { });
}

export const recordList = (data: any) => {
  return http.request<any>('get', `/api/customer/follow/record/list`, { data })
}

export const recordListByCustomer = (data: any) => {
  return http.request<any>('get', `/api/customer/follow/record/list_by_customer`, { params: data })
}

export const recordListByCustomerAndStaff = (data: any) => {
  return http.request<any>('get', `/api/customer/follow/record/list_by_customer_and_staff`, { params: data })
}

export const recordListByStaff = (data: any) => {
  return http.request<any>('get', `/api/customer/follow/record/list_by_staff`, { data })
}

export const recordUpdate = (data: any) => {
  return http.request<any>('post', `/api/customer/follow/record/update/${data.id}`, { data })
}

export const visitCreate = (data: any) => {
  return http.request<any>("post", `/api/customer/visit/create`, { data });
}

export const delVisit = (id: string) => {
  return http.request<any>("post", `/api/customer/visit/force_delete/${id}`, { });
}

export const visitListByCustomer = (data: any) => {
  return http.request<any>('get', `/api/customer/visit/list_by_customer/${data.customer_id}`, { params: data })
}

export const visitUpdate = (data: any) => {
  return http.request<any>('post', `/api/customer/visit/update/${data.id}`, { data })
}

export const customerBatchCreate = (data: any) => {
  return http.request<any>('post', '/api/customer/batch/create', { data });
}

export const operateCreate = (data: any) => {
  return http.request<any>('post', '/api/customer/operator', { data });
}

export const getOperateByCustomerId = (customer_id: string) => {
  return http.request<any>('get', `/api/customer/operator/customer/${customer_id}`)
}

export const getOperateById = (data: any) => {
  return http.request<any>('get', `/api/customer/operator/${data.operator_id}/${data.offset}/${data.limit}`)
}


export const customerQuery = (data: any) => {
  return http.request<any>('post', `/api/customer/query`, { data });
}

export const customerUpte = (data: any) => {
  return http.request<any>('post', '/api/customer/update', { data });
}

export const customerViewList = () => {
  return http.request<any>('post', '/api/customer/queryview/list', { });
}

export const customerView = (data: any) => {
  return http.request<any>('post', '/api/customer/queryview', { data });
}

export const deleteQueryView = (data: any) => {
  return http.request<any>('post', '/api/customer/batch_delete_query_view', { data });
}