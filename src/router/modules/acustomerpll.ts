export default {
  path: '/customerpool',
  meta: {
    icon: 'fluent-mdl2:manager-self-service',
    title: '客户池'
  },
  component: () => import("@/views/pool/index.vue"),
}