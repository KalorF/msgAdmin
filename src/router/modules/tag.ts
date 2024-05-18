export default {
  path: '/tag',
  meta: {
    icon: 'prime:tag',
    title: '标签管理'
  },
  component: () =>  import("@/views/tag/index.vue"),
}