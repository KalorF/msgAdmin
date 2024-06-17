import { http } from "@/utils/http";

export const allocStaffREason = (id: string) => {
  return http.request<any>(
    "get",
    `/api/customer/allocation_record/alloc/${id}`,
    {}
  );
};

export const allocConfig = () => {
  return http.request<any>("get", `/api/customer/allocation_config`, {});
};

export const upsertAllocConfig = (data: any) => {
  return http.request<any>("post", `/api/customer/allocation_config`, { data });
};

export const allocrecord = (data: any) => {
  return http.request<any>(
    "get",
    `/api/customer/allocation_record/${data.staff_id}/${data.offset}/${data.limit}`,
    {}
  );
};

export const checkAllocByStaff = (id: string) => {
  return http.request<any>(
    "get",
    `/api/customer/allocation_record/check_alloc/${id}`
  );
};

export const lastAllocRecord = (id: string) => {
  return http.request<any>(
    "get",
    `/api/customer/latest_allocation_record/${id}`
  );
};

export const poolCreate = (data: any) => {
  return http.request<any>("post", `/api/customer/pool/create`, { data });
};

export const poolDel = (data: any) => {
  return http.request<any>(
    "post",
    `/api/customer/pool/delete/${data.name}`,
    {}
  );
};

export const poolList = () => {
  return http.request<any>("get", `/api/customer/pool/list`, {});
};

export const poolUpdate = (data: any) => {
  return http.request<any>("post", `/api/customer/pool/update`, { data });
};

export const staffConfigBatchUpsert = (data: any) => {
  return http.request<any>(
    "post",
    "/api/customer/staff_allocation_config/batch/upsert",
    { data }
  );
};

export const staffConfigDel = (staff_id: string) => {
  return http.request<any>(
    "post",
    `/api/customer/staff_allocation_config/delete/${staff_id}`,
    {}
  );
};

export const staffConfigGet = (staff_id: string) => {
  return http.request<any>(
    "get",
    `/api/customer/staff_allocation_config/get/${staff_id}`,
    {}
  );
};

export const staffConfigUpsert = (data: any) => {
  return http.request<any>(
    "post",
    `/api/customer/staff_allocation_config/upsert/${data.staff_id}`,
    { data }
  );
};

export const getpoolList = () => {
  return http.request<any>("get", "/api/allocation/pool");
};

export const poolSet = (data: any) => {
  return http.request<any>("post", "/api/allocation/pool", { data });
};

export const poolDelete = (data: any) => {
  return http.request<any>("post", "/api/allocation/pool/batch/delete", {
    data
  });
};

export const poolDelStaff = (data: any) => {
  return http.request<any>("post", `/api/allocation/pool/staff/batch/delete`, {
    data
  });
};

export const poolSetStaff = (data: any) => {
  return http.request<any>("post", `/api/allocation/pool/staff/batch/set`, {
    data
  });
};

export const allocSetConfig = (data: any) => {
  return http.request<any>("post", `/api/allocation/config`, { data });
};

export const allocConfigCheck = (data: any) => {
  return http.request<any>("get", `/api/allocation/check`, { params: data });
};

export const allocConfigAlloc = (data: any) => {
  return http.request<any>("get", `/api/allocation/alloc`, { params: data });
};
