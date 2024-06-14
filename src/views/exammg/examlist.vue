<script lang="ts" setup>
import { ref, onMounted, watch } from "vue";
import { getUserExamList, getExamlist } from "@/api/exam";
import { useUserStoreHook } from "@/store/modules/user";
import {
  Edit,
  Delete,
  Tickets,
  Clock,
  Finished
} from "@element-plus/icons-vue";
import ExamDetail from "./ExamDetail.vue";
import dayjs from "dayjs";

const userStore = useUserStoreHook();
const list = ref([]);
const showList = ref(true);
const currentId = ref("");

const getList = () => {
  getUserExamList({
    uidStrList: [userStore.userInfo.id]
  }).then(res => {
    if (res.code === 200) {
      const history = res.data || [];
      if (history.length) {
        list.value.forEach((item: any) => {
          const find = history.filter((h: any) => h.exam_id === item.id);
          if (find) {
            item.history = find;
          } else {
            item.history = [];
          }
        });
      }
      console.log(list.value);
    }
  });
};

const getListExam = async () => {
  return getExamlist().then(res => {
    if (res.code === 200) {
      list.value = res.data;
    }
  });
};

const viewDetail = (item: any) => {
  currentId.value = item.id;
  showList.value = false;
};

const handleBack = async () => {
  showList.value = true;
  currentId.value = "";
  await getListExam();
  getList();
};

onMounted(async () => {
  showList.value = true;
  await getListExam();
  getList();
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
        >
          <div
            v-if="item.history"
            class="text-[#ffffff] text-xs absolute left-0 top-0 p-1 px-2 z-20 rounded-br-lg font-semibold"
            :class="{
              '!bg-[#33A1C9]': !item.history.length,
              '!bg-[#32CD32]': item.history.length
            }"
          >
            {{ item.history.length ? "已考试" : "未考试" }}
          </div>
          <el-popover
            v-if="item.history && item.history.length"
            width="260"
            placement="bottom"
            trigger="click"
          >
            <template #reference>
              <div
                class="absolute text-sm top-0 right-0 text-[#ffffff] hover:text-neutral-300 rounded flex justify-center items-center py-1 px-2 bg-[#00000080]"
              >
                <el-icon :size="18"><Finished /></el-icon>
              </div>
            </template>
            <template #default>
              <div class="max-h-30 flex flex-col gap-3 overflow-auto">
                <div
                  class="flex items-center text-zinc-700 hover:bg-[#f5f7fa] rounded-lg p-2"
                  v-for="(h, idx) in item.history"
                  :key="idx"
                >
                  <div class="text-sm w-30">
                    <p>第{{ idx + 1 }}次成绩</p>
                    <p>
                      {{
                        dayjs(h.updated_at * 1000).format("YYYY-MM-DD HH:mm")
                      }}
                    </p>
                  </div>
                  <div class="ml-auto text-xs">分数: {{ h.score }}</div>
                </div>
              </div>
            </template>
          </el-popover>
          <div
            class="absolute bottom-[60px] text-sm right-0 text-[#ffffff] rounded flex justify-center items-center py-1 px-2 bg-[#00000080]"
          >
            总分: {{ item.score }}
          </div>
          <div
            class="flex justify-center items-center h-[140px] w-full bg-[#dff4f3]"
            @click.stop="viewDetail(item)"
          >
            <el-icon :size="40"><Tickets /></el-icon>
          </div>
          <div
            @click.stop="viewDetail(item)"
            class="flex items-center w-full h-[60px] px-3"
          >
            <div class="mr-2 text-sm">{{ item.title }}</div>
            <div class="flex flex-col ml-auto items-end">
              <div class="flex items-center text-zinc-600 transform scale-95">
                <p class="text-base ml-1 flex items-center">
                  <el-icon class="mr-1"><Clock /></el-icon>
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
