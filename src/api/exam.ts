import { http } from "@/utils/http";

export const createExam = (data?: string) => {
  return http.request<any>("post", "/api/exam/create", { data });
};

export const getExamlist = () => {
  return http.request<any>("get", `/api/exam/list`, {});
};

export const delExam = (id: string) => {
  return http.request<any>("post", `/api/exam/delete/${id}`, {});
};

export function getExamDetail(id: string) {
  return http.request<any>("get", `/api/exam/get/${id}`, {});
}

export const updateExam = (data: any) => {
  return http.request<any>("post", "/api/exam/update", { data });
};

export const getUserExamList = (data: any) => {
  return http.request<any>("post", "/api/exam/listUserExamByUidList", { data });
};

export const createUserExam = (data: any) => {
  return http.request<any>("post", "/api/exam/createUserExam", { data });
};
