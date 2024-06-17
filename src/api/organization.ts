import { http } from "@/utils/http";

export const createOrg = (data?: object) => {
  return http.request<any>("post", "/api/organization/create", { data });
};

export const delOrg = (id: string) => {
  return http.request<any>("post", `/api/organization/delete/${id}`, {});
};

export const orgGet = () => {
  return http.request<any>("get", `/api/organization/get`, {});
};

export const orgGetById = (id: string) => {
  return http.request<any>("get", `/api/organization/get/${id}`, {});
};

export const orgGetlistById = (id: string) => {
  return http.request<any>("get", `/api/organization/list/${id}`, {});
};

export const updateOrg = (data: any) => {
  return http.request<any>("post", `/api/organization/update`, { data });
};

export const getAllOrg = () => {
  return http.request<any>("get", `/api/organization/all`, {});
};
