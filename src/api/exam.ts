import { http } from "@/utils/http";

export const createExam = (data?: string) => {
  return http.request<any>("post", "/api/exam/create", { data });
};

export const getExamlist = () => {
  return http.request<any>("get", `/api/exam/list`,{});
}


export const delExam = (id: string) => {
  return http.request<any>("post", `/api/exam/delete/${id}`, {});
};

export function getExamDetail(id: string) {
return http.request<any>("get", `/api/exam/get/${id}`, {});
}

export const recoverAccount = (id: string) => {
  return http.request<any>("post", `/api/account/recover/${id}`, {});
};

export const getAccountById = (id: number) => {
  return http.request<any>("get", `/api/account/get/${id}`, {});
};

export const getAccountByAccount = (account: string) => {
  return http.request<any>("get", `/api/account/get/account/${account}`, {});
};


export const postAccountUpdate = (data: any) => {
  return http.request<any>("post", `/api/account/update`, { data });
}

export const postAccountUpdateStaffPwd = (data: any) => {
  return http.request<any>("post", `/api/account/update/staff/password`, { data });
}

export const getAccountlistByOrg = (data: any) => {
  return http.request<any>("get", `/api/account/organization/list/${data.orgId}/${data.offset}/${data.limit}`);
}

export const getAccountByName = (name) => {
  return http.request<any>("get", `/api/account/search/${name}`);
}

export const postAccountUpdateMyPassword= (data: any) => {
  return http.request<any>("post", `/api/account/update/my/password`, { data });
}