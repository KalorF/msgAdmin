export default {
  path: "/mycustomer",
  meta: {
    icon: "clarity:users-line",
    title: "我的客户"
  },
  component: () => import("@/views/mycustomer/index.vue")
};
