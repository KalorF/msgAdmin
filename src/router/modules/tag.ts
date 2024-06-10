export default {
  path: '/tag',
  meta: {
    icon: 'prime:tag',
    title: '客户标签管理'
  },
  component: () =>  import("@/views/tag/index.vue"),
}