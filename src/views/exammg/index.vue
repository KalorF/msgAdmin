<script lang="ts" setup>
import { nextTick, onMounted, ref } from "vue";
import AddExam from "./addExam.vue";
import ExamDetail from "./ExamDetail.vue";
import dayjs from "dayjs";
import { ElMessage, ElMessageBox } from "element-plus";
import { Edit, Delete, Tickets, Timer } from "@element-plus/icons-vue";
import { getExamlist, delExam } from "@/api/exam";
import { useRouter } from "vue-router";

const showAdd = ref(false);
const list = ref([]);
const router = useRouter();
const currentId = ref("");

const getList = () => {
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
};

const handleBack = () => {
  showAdd.value = false;
  currentId.value = "";
  getList();
};

const handleAdd = () => {
  currentId.value = "";
  showAdd.value = true;
};

const handleEdit = (item: any) => {
  currentId.value = item.id;
  showAdd.value = true;
};

const handleDel = (id: string) => {
  ElMessageBox.confirm("是否删除该试卷？", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      delExam(id)
        .then(res => {
          if (res.code === 200) {
            ElMessage.success("试卷删除成功");
            getList();
          } else {
            ElMessage.error("试卷删除成功失败");
          }
        })
        .catch(err => {
          ElMessage.error(err?.response?.data?.msg || "删除失败");
        });
    })
    .catch(() => {});
};

// const navigateToDetail = (id: string) => {
//   router.push({ name: "ExamDetail", params: { id } });
// };

onMounted(() => {
  getList();
});
</script>

<template>
  <div class="h-[calc(100%)]">
    <div
      v-if="!showAdd"
      class="p-4 bg-white rounded-lg flex flex-col h-[calc(100%-30px)]"
    >
      <el-button class="w-40 mb-4" type="primary" bg round @click="handleAdd"
        >添加考卷</el-button
      >
      <div class="flex flex-wrap overflow-auto gap-3">
        <template v-if="list && list.length">
          <div
            v-for="item in list"
            :key="item.id"
            class="rounded-lg border border-slate-100 w-[260px] h-[200px] shadow-sm flex flex-col relative overflow-hidden hover:border-slate-200 hover:shadow-md transition-all"
            @click="handleEdit(item)"
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
                  <p class="text-base ml-1 flex items-center">
                    <el-icon class="mr-1"><Timer /></el-icon>
                    {{ item.limitTime }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
    <AddExam @back="handleBack" :id="currentId" v-else />
  </div>
</template>

<style lang="scss" scoped></style>
