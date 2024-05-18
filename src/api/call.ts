import { http } from "@/utils/http";

export const createCall = (data?: object) => {
  return http.request<any>("post", "/api/customer/call_record/create", { data });
};

export const getCallById = (id: string) => {
  return http.request<any>("get", `/api/customer/call_record/get/${id}`)
}

export const getCallList = (data: any) => {
  return http.request<any>("get", `/api/customer/call_record/list`, { params: data });
}

export const getCallListByCustomer = (data: any) => {
  return http.request<any>("get", `/api/customer/call_record/list/customer`, { params: data });
}

export const getCallListByStaffAndCustomer = (data: any) => {
  return http.request<any>("get", `/api/customer/call_record/list/customer/staff`, { params: data });
}

export const getCallListByStaff = (data: any) => {
  return http.request<any>("get", `/api/customer/call_record/list/staff`, { params: data });
}

export const  updateCall = (data: any) => {
  return http.request<any>("post", `/api/customer/call_record/update`, { params: data });
}