<script setup lang="ts">
import { ref } from "vue";
import { DataAnalysis } from "@element-plus/icons-vue";

const tableData = [
  {
    index: 1,
    date: "员工1",
    name: "Tom",
    address: "No. 189, Grove St, Los Angeles"
  },
  {
    index: 2,
    date: "员工2",
    name: "Tom",
    address: "No. 189, Grove St, Los Angeles"
  },
  {
    index: 3,
    date: "员工3",
    name: "Tom",
    address: "No. 189, Grove St, Los Angeles"
  },
  {
    index: 4,
    date: "员工4",
    name: "Tom",
    address: "No. 189, Grove St, Los Angeles"
  },
  {
    index: 5,
    date: "员工5",
    name: "Tom",
    address: "No. 189, Grove St, Los Angeles"
  },
  {
    index: 6,
    date: "员工6",
    name: "Tom",
    address: "No. 189, Grove St, Los Angeles"
  },
  {
    index: 7,
    date: "员工7",
    name: "Tom",
    address: "No. 189, Grove St, Los Angeles"
  }
];

const formInline = ref({
  name: "",
  date: 0
});

const onSubmit = () => {
  console.log("dsasd");
};

const onReset = () => {
  console.log("reset");
};

defineOptions({
  name: "Welcome"
});
</script>

<template>
  <div class="p-4 bg-white rounded-lg flex flex-col h-[calc(100%-30px)] w-full">
    <el-form :inline="true" :model="formInline" class="demo-form-inline">
      <el-form-item label="统计员工">
        <el-input
          v-model="formInline.name"
          placeholder="请输入客户名称"
          clearable
        />
      </el-form-item>
      <el-form-item label="最近更新时间">
        <el-date-picker
          v-model="formInline.date"
          type="date"
          placeholder="请选择"
          value-format="x"
          clearable
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">查询</el-button>
        <el-button type="default" @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="flex flex-wrap gap-6 content-start">
      <div
        style="height: 120px"
        class="h-70 w-60 rounded-md border p-4 border-slate-50 shadow hover:border-slate-100 hover:shadow-sm relative"
      >
        <p class="text-gray-700">客户数量</p>
        <p class="text-stone-400 text-sm mt-2">全部成员</p>
        <p class="text-2xl font-semibold mt-2">242829</p>
        <el-icon :size="25" class="!text-zinc-400 !absolute top-2 right-2"
          ><DataAnalysis
        /></el-icon>
      </div>
      <div
        style="height: 120px"
        class="h-70 w-60 rounded-md border p-4 border-slate-50 shadow hover:border-slate-100 hover:shadow-sm"
      >
        <p class="text-gray-700">客户数量</p>
        <p class="text-stone-400 text-sm mt-2">全部成员</p>
        <p class="text-2xl font-semibold mt-2">5435436</p>
      </div>
    </div>
    <div class="mt-4 flex-1">
      <el-table
        header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
        :data="tableData"
        style="width: 100%"
      >
        <el-table-column label="名次" width="80">
          <template #default="props">
            <p
              class="text-amber-300 text-xl font-semibold"
              v-if="props.row.index === 1"
            >
              {{ props.row.index }}
            </p>
            <p
              class="text-amber-600 text-base font-semibold"
              v-else-if="props.row.index === 2"
            >
              {{ props.row.index }}
            </p>
            <p
              class="text-red-400 text-base font-semibold"
              v-else-if="props.row.index === 3"
            >
              {{ props.row.index }}
            </p>
            <p v-else>{{ props.row.index }}</p>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="员工" width="180" />
        <el-table-column prop="name" label="通话时长" width="180" />
        <el-table-column prop="address" label="入库客户数" />
        <el-table-column prop="address" label="联系客户数" />
        <el-table-column prop="address" label="通话次数" />
        <el-table-column prop="address" label="通话时长" />
      </el-table>
    </div>
  </div>
</template>
