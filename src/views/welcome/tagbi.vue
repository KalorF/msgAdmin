<script setup lang="ts">
import { ref, onMounted, reactive, computed } from "vue";
import { DataAnalysis } from "@element-plus/icons-vue";
import { tagList } from "@/api/bi";
import { getAllOrg } from "@/api/organization";
import tagPop from "@/components/tagPop/index.vue";

const tableData = ref([]);
const options = ref([]);
const defaultDate = ref();
const defaultTime = ref<[Date, Date]>([
  new Date(2000, 1, 1, 0, 0, 0),
  new Date(2000, 2, 1, 23, 59, 59)
]);

const formInline = reactive({
  organization_id_str_list: [],
  tag_id_str_list: [],
  date: []
});

const onSubmit = () => {
  getData();
};

const onReset = () => {
  formInline.organization_id_str_list = [];
  formInline.tag_id_str_list = [];

  formInline.date = [];
  getData();
};

const checkedItemsValue = computed(() => {
  return formInline.tag_id_str_list.map(item => item.name).join("、") || [];
});

const getData = () => {
  let data: any = {};
  if (formInline.organization_id_str_list.length) {
    data.organization_id_str_list = formInline.organization_id_str_list;
  }
  if (formInline.tag_id_str_list.length) {
    data.tag_id_str_list = formInline.tag_id_str_list.map(i => i.id);
  }
  if (formInline.date.length) {
    data.start_time = formInline.date[0] / 1000;
    data.end_time = Math.floor((formInline.date[1] + 86399) / 1000);
  }
  tagList(data).then(res => {
    if (res.code === 200) {
      const data = res.data.add_tag_item_list || [];
      data.forEach((item, index) => {
        item.index = index + 1;
      });
      tableData.value = data;
    }
  });
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
  getAllOrgData();
  getData();
});
</script>

<template>
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
    <el-form-item label="标签">
      <tagPop
        :checkedItems="formInline.tag_id_str_list"
        @change="value => (formInline.tag_id_str_list = value)"
      >
        <el-input
          style="width: 240px"
          v-model="checkedItemsValue"
          placeholder="请选择标签"
          clearable
          readonly
        />
      </tagPop>
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
      <el-table-column label="员工" width="180">
        <template #default="props">
          {{ props.row.staff.name }}
        </template>
      </el-table-column>
      <el-table-column label="新增标签客户数">
        <template #default="props">
          <div class="flex gap-4 flex-wrap">
            <div
              class="flex items-center"
              v-for="(item, index) in props.row.tag_count_list"
              :key="index"
            >
              <div
                class="p-1 px-2 text-xs rounded-md bg-[#eeeeee] text-[#303841]"
              >
                {{ item?.tag?.name }}
              </div>
              <p class="ml-1">{{ item?.count }}</p>
            </div>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style lang="sass" scoped></style>
