<script lang="ts" setup>
import { ref, reactive } from "vue";
defineOptions({
  name: "banklist"
});

const formInline = reactive({
  user: "",
  region: "",
  date: ""
});

const onSubmit = () => {
  console.log("submit!");
};

const tableData = ref([
  {
    pname: "冠捷电子科技股份有限公司",
    name: "农业银行",
    create: "2024-03-13 16:57:37"
  },
  {
    pname: "深圳市南山区工商业联合会",
    name: "农业银行",
    create: "2024-03-13 16:57:37"
  },
  {
    pname: "包商银行股份有限公司深圳分行",
    name: "农业银行",
    create: "2024-03-13 16:57:38"
  },
  {
    pname: "富德保险控股股份有限公司",
    name: "农业银行",
    create: "2024-03-13 16:57:38"
  }
]);

const currentPage4 = ref(4);
const pageSize4 = ref(100);

const handleSizeChange = (val: number) => {
  console.log(`${val} items per page`);
};
const handleCurrentChange = (val: number) => {
  console.log(`current page: ${val}`);
};
</script>

<template>
  <div class="p-4 bg-white rounded-lg flex flex-col h-[calc(100%-30px)]">
    <el-form :inline="true" :model="formInline" class="demo-form-inline">
      <el-form-item label="单位名称">
        <el-input
          v-model="formInline.user"
          placeholder="请输入单位名称"
          clearable
        />
      </el-form-item>
      <el-form-item label="银行产品">
        <el-select
          v-model="formInline.region"
          placeholder="请输入银行产品"
          clearable
        >
          <el-option label="农业银行" value="1" />
          <el-option label="工商银行" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="最近更新时间">
        <el-date-picker
          v-model="formInline.date"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          clearable
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">查询</el-button>
        <el-button type="default" @click="onSubmit">重置</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="tableData" style="width: 100%" class="flex-1">
      <el-table-column prop="pname" label="单位名称" width="300" />
      <el-table-column prop="name" label="银行产品" width="300" />
      <el-table-column prop="create" label="创建时间" sortable />
    </el-table>
    <div class="mt-4 flex justify-end">
      <el-pagination
        class="flex-wrap gap-y-2"
        v-model:current-page="currentPage4"
        v-model:page-size="pageSize4"
        :page-sizes="[100, 200, 300, 400]"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="400"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.demo-form-inline .el-input {
  --el-input-width: 210px;
}
.demo-form-inline .el-select {
  --el-select-width: 210px;
}
</style>
