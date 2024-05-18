<script lang="ts" setup>
import { getGroupCourseList, getAllCourse } from "@/api/course";

import { ref, onMounted, nextTick } from "vue";
import dayjs from "dayjs";
import chapter from "./chapter.vue";

const formInline = ref({ groupId: "" });
const groupOptions = ref([]);
const allList = ref<any>({});
const showList = ref<any>({});
const container = ref<null | HTMLElement>(null);
const listHeight = ref(0);
const showChapter = ref(false);
const itemInfo = ref(null);

const getAllData = () => {
  // const ids = groupOptions.value.map(item => item.id);
  getAllCourse().then(res => {
    if (res.data && res.data.length) {
      const tempObj = {};
      res.data.forEach(item => {
        if (!tempObj[item.group_id]) {
          tempObj[item.group_id] = {
            children: [item],
            group_id: item.group_id
          };
        } else {
          tempObj[item.group_id].children.push(item);
        }
      });

      groupOptions.value.forEach(item => {
        if (tempObj[item.id]) {
          allList.value[item.id] = { ...tempObj[item.id], name: item.name };
        } else {
          allList.value[item.id] = {
            name: item.name,
            group_id: item.id,
            children: []
          };
        }
      });
      showList.value = allList.value;
    }
  });
};

const getOptions = () => {
  return getGroupCourseList()
    .then(res => {
      if (res.code === 200) {
        groupOptions.value = res.data.groups;
      } else {
        groupOptions.value = [];
      }
    })
    .catch(() => {
      groupOptions.value = [];
    });
};

const handleSelect = (value: string) => {
  if (!value) {
    showList.value = allList.value;
  } else {
    showList.value = { [value]: allList.value[value] };
  }
};

const viewDetail = (item: any) => {
  itemInfo.value = item;
  showChapter.value = true;
};

onMounted(async () => {
  nextTick(async () => {
    const cntel = container.value;
    if (cntel) {
      const { height } = cntel.getBoundingClientRect();
      listHeight.value = height - 80;
    }
  });
  await getOptions();
  getAllData();
});
</script>

<template>
  <div
    v-if="!showChapter"
    ref="container"
    class="p-4 bg-white rounded-lg flex flex-col h-[calc(100%-30px)]"
  >
    <el-form :inline="true" :model="formInline" class="demo-form-inline">
      <el-form-item label="课程分类">
        <el-select
          v-model="formInline.groupId"
          placeholder="选择分类"
          style="width: 240px"
          @change="handleSelect"
        >
          <el-option label="全部课程" value="" />
          <el-option
            v-for="item in groupOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <div class="w-full overflow-auto" :style="`height: ${listHeight}px`">
      <div class="relative mb-8" v-for="(item, key) of showList" :key="key">
        <p
          class="border-l-4 rounded border-[#FF9912] pl-2 text-base text-zinc-500 font-semibold"
        >
          {{ item.name }}
        </p>
        <div class="flex flex-wrap gap-4 mt-4">
          <template v-if="item.children && item.children.length">
            <div
              @click="viewDetail(c)"
              v-for="c in item.children"
              :key="c.id"
              class="rounded-lg border border-slate-100 w-[260px] h-[200px] shadow-sm flex flex-col relative overflow-hidden hover:border-slate-200 hover:shadow-md transition-all"
            >
              <img
                class="w-full h-[140px] object-fill"
                :src="
                  c.cover_url ||
                  'https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png'
                "
                alt=""
              />
              <div class="flex items-center w-full h-[60px] px-3">
                <div class="mr-2 text-sm">{{ c.name }}</div>
                <div class="flex flex-col ml-auto items-end">
                  <div class="flex items-center text-zinc-600">
                    <el-icon
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 1024 1024"
                        data-v-ea893728=""
                      >
                        <path
                          fill="currentColor"
                          d="M128 384v512h768V192H768v32a32 32 0 1 1-64 0v-32H320v32a32 32 0 0 1-64 0v-32H128v128h768v64zm192-256h384V96a32 32 0 1 1 64 0v32h160a32 32 0 0 1 32 32v768a32 32 0 0 1-32 32H96a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h160V96a32 32 0 0 1 64 0zm-32 384h64a32 32 0 0 1 0 64h-64a32 32 0 0 1 0-64m0 192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64m192-192h64a32 32 0 0 1 0 64h-64a32 32 0 0 1 0-64m0 192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64m192-192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64m0 192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64"
                        ></path></svg
                    ></el-icon>
                    <p class="text-xs ml-2">
                      {{
                        dayjs(+c.updated_at * 1000).format("YYYY-MM-DD HH:mm")
                      }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <div v-else class="flex w-full justify-center mt-4">
            <el-empty
              :image-size="100"
              description="此分类课程还没课程需要学些哦～～～"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
  <chapter
    v-else
    @back="showChapter = false"
    :group-id="itemInfo && itemInfo.group_id"
    :course-id="itemInfo.id"
  />
</template>

<style lang="scss" scoped></style>
