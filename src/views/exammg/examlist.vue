<script lang="ts" setup>
import { ref, onMounted, watch } from "vue";
import { getUserExamList, getExamlist } from "@/api/exam";
import { useUserStoreHook } from "@/store/modules/user";
import { Edit, Delete, Tickets, Timer } from "@element-plus/icons-vue";
import ExamDetail from "./ExamDetail.vue";

const userStore = useUserStoreHook();
const list = ref([]);
const showList = ref(true);
const currentId = ref("");

const getList = () => {
  getUserExamList({
    uidStrList: [userStore.userInfo.id]
  }).then(res => {
    console.log(res);
  });
};

const getListExam = () => {
  getExamlist().then(res => {
    if (res.code === 200) {
      list.value = res.data;
    }
  });
};

const viewDetail = (item: any) => {
  currentId.value = item.id;
  showList.value = false;
};

const handleBack = () => {
  showList.value = true;
  currentId.value = "";
  getListExam();
  getList();
};

onMounted(() => {
  showList.value = true;
  getList();
  getListExam();
});
</script>

<template>
  <div class="h-[calc(100%)]">
    <div
      v-if="showList"
      class="p-4 bg-white rounded-lg flex flex-col h-[calc(100%-30px)]"
    >
      <div class="flex items-center">
        <div class="w-1 h-4 bg-orange-400 rounded-sm mr-2"></div>
        我的考试
      </div>
      <div class="flex flex-wrap overflow-auto gap-3 flex-1 mt-3">
        <div
          v-for="item in list"
          :key="item.id"
          class="rounded-lg border border-slate-100 w-[260px] h-[200px] shadow-sm flex flex-col relative overflow-hidden hover:border-slate-200 hover:shadow-md transition-all"
          @click="viewDetail(item)"
        >
          <!-- <div
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
          </div> -->
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
      </div>
    </div>
    <ExamDetail v-if="!showList" @back="handleBack" :id="currentId" />
  </div>
</template>

<style lang="scss" scoped></style>
