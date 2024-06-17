<script lang="ts" setup>
import { ref, onMounted, nextTick, onUnmounted } from "vue";
import {
  getUserChapter,
  userChapterCreate,
  userChapterUpdate
} from "@/api/chapter";
import { ArrowLeft } from "@element-plus/icons-vue";
import PDF from "pdf-vue3";
import { useUserStore } from "@/store/modules/user";

const emits = defineEmits(["back"]);
const props = defineProps<{
  detail?: any;
}>();
const videoRef = ref<HTMLElement | null>(null);
const currentDetail = ref(null);

let timer = null;
let second = 0;

const update = (time: number) => {
  userChapterUpdate({
    chapter_id: props.detail.id,
    cumulative_time: time * 1000 + "",
    status: 1,
    uid: store.userInfo.id
  }).finally(() => {
    clearInterval(timer);
  });
};

const loopFn = (time: number) => {
  timer = setInterval(() => {
    second++;
    if (props.detail.image_url && second >= 60) {
      update(second);
      second = 0;
    }
    if (props.detail.pdf_url && second >= 120) {
      update(second);
      second = 0;
    }
  }, time);
};

const store = useUserStore();

const getData = () => {
  if (store.userInfo) {
    return getUserChapter(store.userInfo.id, props.detail.id).then(res => {
      currentDetail.value = res.data;
    });
  }
};

const handletime = (time: any) => {
  const el = videoRef.value as HTMLVideoElement;
  if (el.currentTime === el.duration && currentDetail.value.status !== 1) {
    update(el.duration);
  }
};

const onPageChange = () => {};

onMounted(() => {
  nextTick(async () => {
    if (props.detail) {
      await getData();
      if (currentDetail.value.status !== 1) {
        if (props.detail.pdf_url || props.detail.image_url) {
          loopFn(1000);
        }
      }
    }
  });
});

onUnmounted(() => {
  clearInterval(timer);
  timer = null;
  second = 0;
});
</script>

<template>
  <div class="p-4 py-1 pt-3 bg-white rounded-lg w-full !h-[calc(100%-30px)]">
    <el-button round :icon="ArrowLeft" @click="emits('back')" class="w-[80px]"
      >返回</el-button
    >
    <div
      v-if="detail"
      class="flex w-full flex-col justify-center items-center mt-2 px-16 pb-4"
    >
      <p class="text-3xl font-semibold text-zinc-900">{{ detail.title }}</p>
      <p class="text-base text-zinc-700 mt-4">{{ detail.content }}</p>
      <div class="mt-5">
        <img v-if="detail.image_url" :src="detail.image_url" />
        <video
          ref="videoRef"
          v-else-if="detail.video_url"
          controls
          preload="auto"
          playinline
          @timeupdate="handletime"
          :src="detail.video_url"
        ></video>
        <div
          class="w-full flex-1 border border-slate-100 rounded-sm"
          v-if="detail.pdf_url"
        >
          <PDF @onPageChange="onPageChange" :src="detail.pdf_url" />
        </div>
      </div>
    </div>
  </div>
</template>
