export default {
  path: '/progress_set',
  meta: {
    icon: 'material-symbols:progress-activity-sharp',
    title: '进度设置管理'
  },
  component: () =>  import("@/views/progress/index.vue"),
}