export default {
  path: '/bank',
  meta: {
    icon: 'gg:list',
    title: '银行白名单'
  },
  component: () => import("@/views/bank/index.vue"),
}