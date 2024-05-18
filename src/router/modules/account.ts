export default {
  path: '/account',
  meta: {
    icon: 'material-symbols:supervisor-account-rounded',
    title: '账号管理'
  },
  component: () => import("@/views/account/index.vue"),
}