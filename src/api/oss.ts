import { http } from "@/utils/http";

export const postOss = (data: any) => {
  return http.request<any>("post", `/api/oss/sign`, { data });
};
