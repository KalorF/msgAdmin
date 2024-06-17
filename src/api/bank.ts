import { http } from "@/utils/http";

export const createBank = (data: any) => {
  return http.request<any>("post", "/api/bank/batch_create", { data });
};

export const createProject = (data: any) => {
  return http.request<any>("post", "/api/bank/batch_create_bank_project", {
    data
  });
};

export const deleteBank = (data: any) => {
  return http.request<any>("post", "/api/bank/batch_delete", { data });
};

export const deleteProject = (data: any) => {
  return http.request<any>("post", "/api/bank/batch_delete_bank_project", {
    data
  });
};

export const getAllProject = () => {
  return http.request<any>("get", "/api/bank/get_all_bank_project");
};

export const bankQuery = (data: any) => {
  return http.request<any>("post", "/api/bank/query", { data });
};
