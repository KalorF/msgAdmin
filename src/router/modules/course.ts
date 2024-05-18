export default {
  path: '/course',
  meta: {
    icon: 'material-symbols:menu-book-outline-sharp',
    title: '课程管理'
  },
  component: () => import("@/views/course/index.vue"),
}