export default {
  path: '/org',
  meta: {
    icon: 'eos-icons:organization-outlined',
    title: '组织管理'
  },
  component: () => import("@/views/org/index.vue"),
}