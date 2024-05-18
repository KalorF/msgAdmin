export default {
  path: '/exammanger',
  meta: {
    icon: 'healthicons:i-exam-multiple-choice-outline',
    title: '考试系统'
  },
  component: () => import("@/views/exammg/index.vue")
}