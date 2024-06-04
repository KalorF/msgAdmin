import { http } from "@/utils/http";

export const callRank = (data: any) => {
  return http.request<any>("post", "/api/bi/call_rank", { data });
}

export const tagList = (data: any) => {
  return http.request<any>('post', '/api/bi/add_tag_customer_query', { data });
}