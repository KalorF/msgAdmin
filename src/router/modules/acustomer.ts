export default {
  path: '/customer',
  meta: {
    icon: 'solar:user-id-outline',
    title: '客户管理'
  },
  component: () => import("@/views/customer/index.vue"),
}