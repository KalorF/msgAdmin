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
// import ExamDetail from "./ExamDetail.vue";
import dayjs from "dayjs";
import ExamDetail from "@/views/exammg/ExamDetail.vue";

const props = defineProps<{ show: boolean; info?: any }>();
const emits = defineEmits(["close"]);

const list = ref([]);

const getList = () => {
  getUserExamList({
    uidStrList: [props.info.id]
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
      } else {
        list.value.forEach((item: any) => {
          item.history = [];
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

watch(
  () => props.show,
  async val => {
    if (val) {
      list.value = [];
      await getListExam();
      getList();
    }
  },
  { immediate: true }
);

const showDetail = ref(false);
const examData = ref(null);

const handleBack = () => {
  showDetail.value = false;
  examData.value = null;
};

const handleView = (item: any) => {
  if (item.history && item.history.length) {
    examData.value = item.history[0];
    showDetail.value = true;
  }
};
</script>

<template>
  <el-dialog
    title="学习情况"
    v-model="props.show"
    width="600"
    @close="emits('close')"
  >
    <div
      v-if="!showDetail"
      class="flex flex-wrap overflow-auto gap-3 flex-1 mt-3 max-h-96"
    >
      <div
        v-for="item in list"
        :key="item.id"
        class="rounded-lg border border-slate-100 w-[260px] h-[200px] shadow-sm flex flex-col relative overflow-hidden hover:border-slate-200 hover:shadow-md transition-all"
        @click="handleView(item)"
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
        <div
          v-if="item.history && item.history.length"
          class="absolute text-sm top-0 right-0 text-[#ffffff] hover:text-neutral-300 rounded flex justify-center items-center py-1 px-2 bg-[#00000080]"
        >
          考试分数: {{ item.history[0].score }}
        </div>
        <!-- <el-popover
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
                    {{ dayjs(h.updated_at * 1000).format("YYYY-MM-DD HH:mm") }}
                  </p>
                </div>
                <div class="ml-auto text-xs">分数: {{ h.score }}</div>
              </div>
            </div>
          </template>
        </el-popover> -->
        <div
          class="absolute bottom-[60px] text-sm right-0 text-[#ffffff] rounded flex justify-center items-center py-1 px-2 bg-[#00000080]"
        >
          总分: {{ item.score }}
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
                <el-icon class="mr-1"><Clock /></el-icon>
                {{ item.limitTime }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <ExamDetail
      class="mt-[-10px] max-h-96 overflow-auto"
      v-if="showDetail"
      @back="handleBack"
      :exam="examData"
    />
  </el-dialog>
</template>
