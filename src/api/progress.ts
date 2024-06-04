import { http } from "@/utils/http";

export const progressList = () => {
  return http.request<any>("post", `/api/progress/list`, { });
}

export const upsertProgress = (data: any) => {
  return http.request<any>("post", `/api/progress/upsert`, { data });
}