import ExamDetail from '@/views/exammg/ExamDetail.vue';
export default {
  path: '/exammanger',
  meta: {
    icon: 'healthicons:i-exam-multiple-choice-outline',
    title: '考试系统'
  },
  component: () => import("@/views/exammg/index.vue"),
  children: [
    {
      path: '/exam/:id',
      meta: {
        icon: 'healthicons:i-exam-multiple-choice-outline',
        title: '考试系统'
      },
      name: 'ExamDetail',
      component: () => import("@/views/exammg/ExamDetail.vue") // 路由懒加载
    }
  ]
}
