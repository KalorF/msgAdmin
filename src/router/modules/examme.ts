export default {
  path: '/myexam',
  meta: {
    title: '我的考试',
    icon: 'healthicons:i-exam-qualification-outline'
  },
  component: () => import('@/views/exammg/examlist.vue')
}