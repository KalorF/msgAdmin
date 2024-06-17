import { http } from "@/utils/http";

export const createChapter = (data?: object) => {
  return http.request<any>("post", "/api/course/chapter/create", { data });
};

export const delChapter = (id: string) => {
  return http.request<any>("post", `/api/course/chapter/delete/${id}`, {});
};

export const getChapterById = (id: string) => {
  return http.request<any>("get", `/api/course/chapter/get/${id}`, {});
};

export const getChapterList = (courseId: string) => {
  return http.request<any>("get", `/api/course/chapter/list/${courseId}`, {});
};

export const updateChapter = (data: any) => {
  return http.request<any>("post", `/api/course/chapter/update`, { data });
};

export const userChapterCreate = (data: any) => {
  return http.request<any>("post", `/api/course/userchapter/create`, { data });
};

export const getUserChapter = (uid: string, chapter_id: string) => {
  return http.request<any>(
    "get",
    `/api/course/userchapter/get/${uid}/${chapter_id}`,
    {}
  );
};

export const getUserChapterList = (data: any) => {
  return http.request<any>("post", `/api/course/userchapter/list`, { data });
};

export const userChapterUpdate = (data: any) => {
  return http.request<any>("post", `/api/course/userchapter/update`, { data });
};
