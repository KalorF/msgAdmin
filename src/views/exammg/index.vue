<script lang="ts" setup>
import { nextTick, onMounted, ref } from "vue";
import AddExam from "./addExam.vue";
import ExamDetail from "./ExamDetail.vue";
import dayjs from "dayjs";
import { ElMessage } from "element-plus";
import { Edit, Delete, Tickets } from "@element-plus/icons-vue";
import { getExamlist, delExam } from "@/api/exam";
import { useRouter } from "vue-router";

const showAdd = ref(false);
const list = ref([]);
const router = useRouter();

getExamlist()
  .then(res => {
    if (res.code === 200) {
      console.log("res is ", res);
      list.value = res.data;
      console.log("list is ", list.value);
    } else {
      ElMessage.error("Failed to fetch the exam list");
    }
  })
  .catch(err => {
    ElMessage.error(err.msg);
  });

const handleEdit = (item: any) => {
  console.log(item);
};

const handleDel = (id: string) => {
  delExam(id)
    .then(res => {
      if (res.code === 200) {
        ElMessage.success("试卷删除成功");
        getExamlist()
          .then(res => {
            if (res.code === 200) {
              list.value = res.data;
            }
          })
          .catch(err => {
            ElMessage.error(err.msg);
          });
      } else {
        ElMessage.error("试卷删除成功失败");
      }
    })
    .catch(err => {
      ElMessage.error(err.msg);
    });
};

const navigateToDetail = (id: string) => {
  console.log("1212");
  router.push({ name: "ExamDetail", params: { id } });
};
</script>

<template>
  <div
    v-if="!showAdd"
    class="p-4 bg-white rounded-lg flex flex-col h-[calc(100%-30px)]"
  >
    <el-button class="w-40 mb-4" type="primary" bg round @click="showAdd = true"
      >添加考卷</el-button
    >
    <template v-if="list && list.length">
      <div
        v-for="item in list"
        :key="item.id"
        class="rounded-lg border border-slate-100 w-[260px] h-[200px] shadow-sm flex flex-col relative overflow-hidden hover:border-slate-200 hover:shadow-md transition-all"
        @click="navigateToDetail(item.id)"
      >
        <div
          @click.stop="handleEdit(item)"
          class="absolute top-2 left-2 text-[#ffffff] hover:text-neutral-300 rounded flex justify-center items-center w-7 h-7 bg-[#00000080]"
        >
          <el-icon size="20"><Edit /></el-icon>
        </div>
        <div
          @click.stop="handleDel(item.id)"
          class="absolute top-2 right-2 text-[#ffffff] hover:text-neutral-300 rounded flex justify-center items-center w-7 h-7 bg-[#00000080]"
        >
          <el-icon size="18"><Delete /></el-icon>
        </div>
        <div
          class="flex justify-center items-center h-[140px] w-full bg-[#dff4f3]"
        >
          <el-icon :size="40"><Tickets /></el-icon>
        </div>
        <div class="flex items-center w-full h-[60px] px-3">
          <div class="mr-2 text-sm">{{ item.title }}</div>
          <div class="flex flex-col ml-auto items-end">
            <div class="flex items-center text-zinc-600 transform scale-95">
              <el-icon>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
                  <path
                    fill="currentColor"
                    d="M128 384v512h768V192H768v32a32 32 0 1 1-64 0v-32H320v32a32 32 0 0 1-64 0v-32H128v128h768v64zm192-256h384V96a32 32 0 1 1 64 0v32h160a32 32 0 0 1 32 32v768a32 32 0 0 1-32 32H96a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h160V96a32 32 0 0 1 64 0zm-32 384h64a32 32 0 0 1 0 64h-64a32 32 0 0 1 0-64m0 192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64m192-192h64a32 32 0 0 1 0 64h-64a32 32 0 0 1 0-64m0 192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64m192-192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64m0 192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64"
                  />
                </svg>
              </el-icon>
              <p class="text-xs ml-1">
                {{ dayjs(+item.limitTime * 1000).format("YYYY-MM-DD HH:mm") }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
  <AddExam @back="showAdd = false" v-else />
</template>

<style lang="scss" scoped></style>
