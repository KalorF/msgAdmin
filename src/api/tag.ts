import { http } from "@/utils/http";

export const getAllTags = () => {
  return http.request<any>("get", `/api/tag/all`, {});
};

export const createTag = (data: any) => {
  return http.request<any>("post", `/api/tag/create`, { data });
};

export const customerTagUpsert = (data: any) => {
  return http.request<any>("post", `/api/tag/customer/batch/upsert`, { data });
};

export const customerTagList = (data: any) => {
  return http.request<any>("post", `/api/tag/customer/list`, { data });
};

export const delTag = (id: string) => {
  return http.request<any>("post", `/api/tag/delete/${id}`, {});
};

export const getTagById = (id: string) => {
  return http.request<any>("get", `/api/tag/get/${id}`, {});
};

export const getAllGroupTag = () => {
  return http.request<any>("get", `/api/tag/group/all`, {});
};

export const createGroupTag = (data: any) => {
  return http.request<any>("post", `/api/tag/group/create`, { data });
};

export const deleteGroupTag = (id: string) => {
  return http.request<any>("post", `/api/tag/group/delete/${id}`, {});
};

export const updateGroupTag = (data: any) => {
  return http.request<any>("post", `/api/tag/group/update`, { data });
};

export const updateTag = (data: any) => {
  return http.request<any>("post", `/api/tag/update`, { data });
};
