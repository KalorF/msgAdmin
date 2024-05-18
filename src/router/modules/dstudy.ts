export default {
  path: '/study',
  meta: {
    icon: 'uil:book-reader',
    title: '我的学习'
  },
  component: () => import("@/views/study/index.vue"),
}