<script lang="ts" setup>
import { nextTick, onMounted, ref } from "vue";
import AddExam from "./addExam.vue";
import dayjs from "dayjs";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Edit, Delete, Tickets } from "@element-plus/icons-vue";

const showAdd = ref(false);
const list = ref([
  {
    name: "测试试卷",
    id: "1",
    updated_at: "0"
  }
]);

const handleEdit = (item: any) => {
  console.log(item);
};

const handleDel = (id: string) => {
  console.log(id);
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

    <template v-if="list.length">
      <div
        v-for="item in list"
        :key="item.id"
        class="rounded-lg border border-slate-100 w-[260px] h-[200px] shadow-sm flex flex-col relative overflow-hidden hover:border-slate-200 hover:shadow-md transition-all"
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
          <div class="mr-2 text-sm">{{ item.name }}</div>
          <div class="flex flex-col ml-auto items-end">
            <div class="flex items-center text-zinc-600 transform scale-95">
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
              <p class="text-xs ml-1">
                {{ dayjs(+item.updated_at * 1000).format("YYYY-MM-DD HH:mm") }}
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
