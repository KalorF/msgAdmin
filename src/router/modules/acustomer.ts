export default {
  path: "/customer",
  meta: {
    icon: "solar:user-id-outline",
    title: "公海库"
  },
  component: () => import("@/views/customer/index.vue")
};
