<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { DataAnalysis } from "@element-plus/icons-vue";
import { callRank } from "@/api/bi";
import { getAllOrg } from "@/api/organization";
import tagbi from "./tagbi.vue";

const tableData = ref([]);
const options = ref([]);
const defaultDate = ref();
const defaultTime = ref<[Date, Date]>([
  new Date(2000, 1, 1, 0, 0, 0),
  new Date(2000, 2, 1, 23, 59, 59)
]);

const formInline = reactive({
  organization_id_str_list: [],
  date: []
});

const onSubmit = () => {
  getData();
};

const onReset = () => {
  formInline.organization_id_str_list = [];
  formInline.date = [];
  getData();
};

const getAllOrgData = () => {
  getAllOrg().then(res => {
    if (res.code === 200) {
      options.value = res.data || [];
    } else {
      options.value = [];
    }
  });
};

const getData = () => {
  let data: any = {};
  if (formInline.organization_id_str_list.length) {
    data.organization_id_str_list = formInline.organization_id_str_list;
  }
  if (formInline.date.length) {
    data.start_time = formInline.date[0] / 1000;
    data.end_time = Math.floor((formInline.date[1] + 86399999) / 1000);
  }
  callRank(data).then(res => {
    if (res.code === 200) {
      const data = res.data.rank_list || [];
      data.forEach((item, index) => {
        item.index = index + 1;
      });
      tableData.value = data;
    }
  });
};

defineOptions({
  name: "Welcome"
});

const activeValue = ref("callRank");

const handleChangeActive = (val: string) => {
  if (val === "callRank") {
    getData();
  }
};

const genDefaultData = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  defaultDate.value = new Date(year, month, day);
  formInline.date = [
    new Date(year, month, day).getTime(),
    new Date(year, month, day).getTime()
  ];
};

onMounted(() => {
  genDefaultData();
  getData();
  getAllOrgData();
});
</script>

<template>
  <div class="p-4 bg-white rounded-lg flex flex-col h-[calc(100%-30px)] w-full">
    <el-radio-group
      v-model="activeValue"
      class="mb-4"
      size="small"
      fill="#ff9a00"
      @change="handleChangeActive"
    >
      <el-radio-button label="电话排行" value="callRank" />
      <el-radio-button label="新增标签客户" value="tag" />
    </el-radio-group>
    <template v-if="activeValue === 'callRank'">
      <el-form :inline="true" :model="formInline" class="demo-form-inline">
        <el-form-item label="所在组织">
          <el-select
            v-model="formInline.organization_id_str_list"
            multiple
            placeholder="请选择"
            style="width: 240px"
            clearable
          >
            <el-option
              v-for="item in options"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期选择">
          <el-date-picker
            v-model="formInline.date"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="x"
            :default-value="[defaultDate, defaultDate]"
            :default-time="defaultTime"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSubmit">查询</el-button>
          <el-button type="default" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- <div class="flex flex-wrap gap-6 content-start">
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
    </div> -->
      <div class="mt-4 flex-1">
        <el-table
          header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
          :data="tableData"
          style="width: 100%"
        >
          <el-table-column label="名次" width="80">
            <template #default="props">
              <p
                v-if="props.row.index === 1"
                class="text-amber-300 text-xl font-semibold"
              >
                {{ props.row.index }}
              </p>
              <p
                v-else-if="props.row.index === 2"
                class="text-amber-600 text-base font-semibold"
              >
                {{ props.row.index }}
              </p>
              <p
                v-else-if="props.row.index === 3"
                class="text-red-400 text-base font-semibold"
              >
                {{ props.row.index }}
              </p>
              <p v-else>{{ props.row.index }}</p>
            </template>
          </el-table-column>
          <el-table-column label="员工">
            <template #default="props">
              {{ props.row.staff.name }}
            </template>
          </el-table-column>
          <el-table-column prop="call_duration" label="通话时长" />
          <el-table-column prop="call_count" label="通话次数" />
          <el-table-column prop="avg_call_duration" label="平均通话时长" />
          <el-table-column prop="connect_count" label="联系客户数" />
          <el-table-column prop="connect_rate" label="接通率" />
        </el-table>
      </div>
    </template>
    <tagbi v-else />
  </div>
</template>
