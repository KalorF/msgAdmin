import { http } from "@/utils/http";

export const createGroupCourse = (data?: object) => {
  return http.request<any>("post", "/api/course/group/create", { data });
};

export const delGroupCourse = (id: string) => {
  return http.request<any>("post", `/api/course/group/delete/${id}`, {});
};

export const getGroupCourseById = (id: string) => {
  return http.request<any>("get", `/api/course/group/get/${id}`, {});
};

export const getGroupCourseList = () => {
  return http.request<any>("get", `/api/course/group/list`, {});
};

export const postGroupCourseUpdate = (data: any) => {
  return http.request<any>("post", `/api/course/group/update`, { data });
};

export const createCourse = (data: any) => {
  return http.request<any>("post", "/api/course/create", { data });
}

export const delCourse = (id: string) => {
  return http.request<any>("post", `/api/course/delete/${id}`, { });
}

export const getCourseById = (id: string) => {
  return http.request<any>("get", `/api/course/get/${id}`, { });
}

export const getCourseList = (data: any) => {
  return http.request<any>("post", `/api/course/list`, { data});
}

export const getCourseListByGroup = (group_id: string) => {
  return http.request<any>("get", `/api/course/list/${group_id}`, {  });
}

export const updateCourse = (data: any) => {
  return http.request<any>("post", `/api/course/update`, { data });
}

export const getAllCourse = () => {
  return http.request<any>("get", `/api/course/all`, { });
}