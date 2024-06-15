<script lang="ts" setup>
import { ref, onMounted, nextTick, computed, watch } from "vue";
import {
  getChapterList,
  getUserChapterList,
  getUserChapter
} from "@/api/chapter";
import { ArrowLeft, Document, VideoPlay } from "@element-plus/icons-vue";
import { useUserStoreHook } from "@/store/modules/user";
import Detail from "./detail.vue";

const emits = defineEmits(["back"]);
const props = defineProps<{
  groupId?: string;
  courseId?: string | null;
}>();
const showDetail = ref(false);
const detailInfo = ref(null);

const userStore = useUserStoreHook();

const userInfo = computed(() => {
  return userStore && userStore.userInfo;
});

const container = ref<HTMLElement | null>(null);
const listHeight = ref(0);
const list = ref([]);

const getList = () => {
  if (props.courseId) {
    return getChapterList(props.courseId)
      .then(res => {
        if (res.code === 200) {
          if (res.data.length) {
            list.value = res.data;
          } else {
            list.value = [];
          }
        } else {
          list.value = [];
        }
      })
      .catch(err => {
        list.value = [];
      });
  }
};

const updateStatus = () => {
  if (list.value) {
    list.value.forEach(item => {
      getUserChapter(userInfo.value.id, item.id).then(res => {
        if (res.code === 200) {
          item.status = res.data.status;
        }
      });
    });
  }
};

const userChapterList = () => {
  const idList = list.value.map(item => item.id);
  getUserChapterList({ chapter_id_list: idList, uid: userInfo.value.id }).then(
    res => {
      if (res.code === 200) {
        console.log(res.data);
      }
    }
  );
};

const viewDetail = (item: any) => {
  detailInfo.value = item;
  showDetail.value = true;
};

watch(showDetail, () => {
  if (!showDetail.value) {
    updateStatus();
  }
});

onMounted(() => {
  nextTick(async () => {
    const cntel = container.value;
    if (cntel) {
      const { height } = cntel.getBoundingClientRect();
      listHeight.value = height - 80;
    }
    await getList();
    updateStatus();
    // userChapterList();
  });
});
</script>

<template>
  <div
    v-if="!showDetail"
    ref="container"
    class="p-4 py-1 pt-3 bg-white rounded-lg w-full !h-[calc(100%-30px)] flex flex-col"
  >
    <el-button round :icon="ArrowLeft" @click="emits('back')" class="w-[80px]"
      >返回</el-button
    >
    <div
      v-if="list.length"
      class="w-full mt-4 overflow-auto flex flex-wrap shrink-0 pb-4 content-start"
      :style="`height: ${listHeight}px`"
    >
      <div
        v-for="item in list"
        :key="item.id"
        @click="viewDetail(item)"
        class="rounded-lg border mb-4 mr-4 border-slate-100 w-[260px] h-[210px] shadow-sm flex flex-col relative overflow-hidden hover:border-slate-200 hover:shadow-md transition-all"
      >
        <div
          class="text-[#ffffff] text-xs absolute left-0 top-0 p-1 px-2 z-20 rounded-br-lg font-semibold"
          :class="{
            '!bg-[#33A1C9]': !item.status,
            '!bg-[#32CD32]': item.status === 1
          }"
        >
          {{ item.status === 1 ? "已学习" : "未学习" }}
        </div>
        <img
          v-if="item.image_url"
          class="w-full h-[140px] object-fill"
          :src="item.image_url"
          alt=""
        />
        <div
          v-else-if="item.video_url"
          class="w-full h-[140px] relative overflow-hidden"
        >
          <div
            class="text-[#ffffff] hover:text-neutral-300 rounded-full flex justify-center items-center w-8 h-8 bg-[#00000066] z-10 absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%]"
          >
            <el-icon size="32"><VideoPlay /></el-icon>
          </div>
          <video
            muted
            preload="true"
            class="object-content w-full h-full"
            :src="item.video_url"
          ></video>
        </div>
        <div
          v-if="item.pdf_url"
          class="w-full h-[140px] relative bg-[#FFFAF0] border-b text-neutral-400 border-neutral-100 flex items-center justify-center flex-col"
        >
          <el-icon size="40"><Document /></el-icon>
          PDF
        </div>
        <div class="flex flex-col w-full h-[70px] px-3 relative justify-center">
          <div class="mr-2 text-sm text-ellipsis">{{ item.title }}</div>
          <p class="text-xs text-zinc-400 text-ellipsis line-clamp-2">
            {{ item.content }}
          </p>
        </div>
      </div>
    </div>
    <div v-else class="flex w-full justify-center mt-4">
      <el-empty :image-size="100" description="暂无要学习的章节哦～～" />
    </div>
  </div>
  <Detail v-else :detail="detailInfo" @back="showDetail = false" />
</template>
