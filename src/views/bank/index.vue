<script lang="ts" setup>
import {
  bankQuery,
  createBank,
  deleteBank,
  createProject,
  deleteProject,
  getAllProject
} from "@/api/bank";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { ref, reactive, onMounted, computed } from "vue";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { usePermissionActionStroe } from "@/store/modules/permission";

defineOptions({
  name: "banklist"
});

const permission = usePermissionActionStroe();
const actions = computed(() => permission.value);

const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const formInline = reactive({
  bank_name: "",
  bank_project_id_str: "",
  date: []
});

const getData = () => {
  return bankQuery({
    bank_name: formInline.bank_name,
    bank_project_id_str: formInline.bank_project_id_str,
    limit: pageSize.value,
    offset: currentPage.value - 1,
    updated_at_begin: (formInline.date[0] || 0) / 1000,
    updated_at_end: (formInline.date[1] || 0) / 1000
  })
    .then(res => {
      if (res.code === 200) {
        tableData.value = res.data.banks || [];
        total.value = res.data.count || 0;
      } else {
        tableData.value = [];
        total.value = 0;
      }
    })
    .catch(err => {
      tableData.value = [];
      total.value = 0;
    });
};

const projectList = ref([]);
const getProject = () => {
  getAllProject()
    .then(res => {
      if (res.code === 200) {
        projectList.value = res.data;
      } else {
        projectList.value = [];
      }
    })
    .catch(err => {
      projectList.value = [];
    });
};

const onSubmit = () => {
  getData();
};

const onReset = () => {
  formInline.bank_name = "";
  formInline.bank_project_id_str = "";
  formInline.date = [];
};

const tableData = ref([]);

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  getData();
};
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  getData();
};

const dialogVisible = ref(false);
const addFormData = reactive({
  name: "",
  bank_project: ""
});

const handleCancelCrete = () => {
  addFormData.name = "";
  addFormData.bank_project = "";
  dialogVisible.value = false;
};

const handleConfirm = () => {
  if (addFormData.name === "") {
    message("请输入单位名称");
    return;
  }
  if (addFormData.bank_project === "") {
    message("请选择银行产品");
    return;
  }
  createBank({
    banks: [
      {
        bank_project_id: addFormData.bank_project,
        name: addFormData.name
      }
    ]
  })
    .then(res => {
      if (res.code === 200) {
        message("创建成功", { type: "success" });
        getData();
        handleCancelCrete();
      } else {
        message("创建失败", { type: "error" });
      }
    })
    .catch(() => {
      message("创建失败", { type: "error" });
    });
};

const keyMap = {
  单位名称: "name",
  银行产品: "project_name"
};

function replaceKey(array: any) {
  for (let i = 0; i < array.length; i++) {
    const obj = array[i];
    for (var key in obj) {
      var newKey = keyMap[key];
      if (newKey) {
        obj[newKey] = obj[key] + "";
        delete obj[key];
      }
    }
  }
  return array;
}

const mulTableData = ref([]);
const mulDialogVisiable = ref(false);

const handleMulCancel = () => {
  mulTableData.value = [];
  mulDialogVisiable.value = false;
};

const handleMul = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept =
    ".xls,.xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";
  input.onchange = (e: any) => {
    const fileread = new FileReader();
    fileread.onload = ev => {
      const data = new Uint8Array(ev.target.result as any);
      const workbook = XLSX.read(data, { type: "array" });
      const wsname = workbook.SheetNames[0]; // 取第一张表
      const ws = XLSX.utils.sheet_to_json(workbook.Sheets[wsname]); // 生成 JSON 格式的表格内容
      if (ws.length) {
        const data = replaceKey(ws);
        data.forEach(item => {
          if (item.project_name) {
            item.bank_project = { name: item.project_name };
            delete item.project_name;
          }
        });
        mulTableData.value = data;
        mulDialogVisiable.value = true;
      }
      document.body.removeChild(input);
    };
    fileread.readAsArrayBuffer(e.target.files[0]);
  };
  document.body.appendChild(input);
  input.click();
};

const handleConfirmImport = () => {
  createBank({ banks: mulTableData.value })
    .then(res => {
      if (res.code === 200) {
        message("导入成功", { type: "success" });
        handleMulCancel();
        getData();
        getProject();
      } else {
        message("导入失败", { type: "error" });
      }
    })
    .catch(err => {
      message("导入失败", { type: "error" });
    });
};

const projectVisiable = ref(false);
const mulPorjectName = ref("");

const projectCancel = () => {
  mulPorjectName.value = "";
  projectVisiable.value = false;
};

const projectConfirm = () => {
  if (mulPorjectName.value.trim() === "") {
    message("请输入产品名称");
    return;
  }
  const nameArr = mulPorjectName.value.split("、").map(item => {
    return { name: item };
  });
  createProject({
    bank_project_list: nameArr
  })
    .then(res => {
      if (res.code === 200) {
        message("创建成功", { type: "success" });
        getProject();
        projectCancel();
      } else {
        message("创建失败", { type: "error" });
      }
    })
    .catch(err => {
      message("创建失败", { type: "error" });
    });
};

const selBankIds = ref([]);

const handleSelectionChange = (val: any) => {
  if (val.length) {
    selBankIds.value = val.map(item => item.id);
  } else {
    selBankIds.value = [];
  }
};

const handleDel = (id: string, fromMul = false) => {
  ElMessageBox.confirm("确认从银行白名单删除吗?", "提示", {
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      const data = fromMul
        ? { id_str_list: selBankIds.value }
        : { id_str_list: [id] };
      deleteBank(data).then(res => {
        if (res.code === 200) {
          message("删除成功", { type: "success" });
          getData();
        } else {
          message("删除失败", { type: "error" });
        }
      });
    })
    .catch(() => {});
};

const handleMulDel = () => {
  if (selBankIds.value.length === 0) {
    message("请选择删除名单");
    return;
  }
  handleDel("-1", true);
};

const projectTableShow = ref(false);
const selProjectIds = ref([]);

const handleSelectionChange2 = (val: any) => {
  if (val.length) {
    selProjectIds.value = val.map(item => item.id);
  } else {
    selProjectIds.value = [];
  }
};

const handleDelProject = (id: string, mul = false) => {
  ElMessageBox.confirm("确认删除该银行产品吗?", "提示", {
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      const data = mul
        ? { id_str_list: selProjectIds.value }
        : { id_str_list: [id] };
      deleteProject(data)
        .then(res => {
          if (res.code === 200) {
            message("删除成功", { type: "success" });
            getProject();
          } else {
            message("删除失败", { type: "error" });
          }
        })
        .catch(err => {
          message(err.response?.data?.msg, { type: "error" });
        });
    })
    .catch(() => {});
};

const handleMulDel2 = () => {
  if (selProjectIds.value.length === 0) {
    message("请选择删除名单");
    return;
  }
  handleDelProject("-1", true);
};

onMounted(() => {
  getData();
  getProject();
});
</script>

<template>
  <div class="p-4 bg-white rounded-lg flex flex-col h-[calc(100%-30px)]">
    <div class="flex mb-2">
      <span class="text-base font-semibold text-zinc-700">银行卡白名单</span>
      <div class="ml-auto flex flex-wrap gap-1 content-start relative">
        <el-button @click="projectTableShow = true" class="mr-[-8px]"
          >银行产品</el-button
        >
        <el-button
          v-if="actions.includes('CreateBank')"
          class=""
          type="default"
          @click="dialogVisible = true"
          >添加银行</el-button
        >
        <div class="relative">
          <el-button
            v-if="actions.includes('CreateBank')"
            class="ml-auto"
            type="default"
            @click="handleMul"
            >批量导入</el-button
          >
        </div>
        <a
          v-if="actions.includes('CreateBank')"
          class="absolute top-9 right-4 text-sm text-sky-500 underline hover:text-cyan-700"
          href="https://abynn.oss-cn-shenzhen.aliyuncs.com/%E6%89%B9%E9%87%8F%E9%93%B6%E8%A1%8C-1716470970466.xlsx"
          download="模版文件.xlsx"
          target="view_window"
        >
          模版文件
        </a>
      </div>
    </div>
    <div class="flex">
      <el-form :inline="true" :model="formInline" class="demo-form-inline">
        <el-form-item label="单位名称">
          <el-input
            v-model="formInline.bank_name"
            placeholder="请输入单位名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="银行产品">
          <el-select
            v-model="formInline.bank_project_id_str"
            placeholder="请选择银行产品"
            clearable
          >
            <el-option
              v-for="item in projectList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="最近更新时间">
          <el-date-picker
            v-model="formInline.date"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="x"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSubmit">查询</el-button>
          <el-button type="default" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table
      :data="tableData"
      style="width: 100%"
      header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
      @selection-change="handleSelectionChange"
      class="flex-1"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="name" label="单位名称" />
      <el-table-column label="银行产品">
        <template #default="scope">
          {{ scope.row.bank_project?.name }}
        </template>
      </el-table-column>
      <el-table-column label="添加时间" sortable>
        <template #default="props">
          {{ dayjs(props.row.created_at * 1000).format("YYYY-MM-DD HH:mm") }}
        </template>
      </el-table-column>
      <el-table-column label="最近更新时间" sortable>
        <template #default="props">
          {{ dayjs(props.row.updated_at * 1000).format("YYYY-MM-DD HH:mm") }}
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="props">
          <el-button
            v-if="actions.includes('DeleteBank')"
            link
            type="danger"
            @click="handleDel(props.row.id)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <div class="mt-4 flex justify-between">
      <el-button
        v-if="actions.includes('DeleteBank')"
        type="primary"
        @click="handleMulDel"
        >批量删除</el-button
      >
      <el-pagination
        class="flex-wrap gap-y-2"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 30, 40]"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="'添加银行'"
      width="425"
      @closed="handleCancelCrete"
      align-center
    >
      <el-form :inline="true" class="demo-form-inline">
        <el-form-item label="单位名称">
          <el-input
            v-model="addFormData.name"
            placeholder="请输入单位名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="银行产品">
          <el-select
            v-model="addFormData.bank_project"
            placeholder="请选择银行产品"
            clearable
          >
            <el-option
              v-for="item in projectList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
          <el-button
            v-if="actions.includes('CreateBankProject')"
            size="small"
            class="ml-2"
            @click="projectVisiable = true"
          >
            添加产品
          </el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancelCrete">取消</el-button>
          <el-button type="primary" @click="handleConfirm">
            确认添加
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="projectVisiable"
      :title="'添加银行产品'"
      width="400"
      @closed="projectCancel"
      align-center
    >
      <el-form :inline="true" class="demo-form-inline">
        <el-form-item label="银行产品">
          <el-input
            v-model="mulPorjectName"
            placeholder="请输入银行产品"
            clearable
          />
        </el-form-item>
      </el-form>
      <div class="text-xs mt-[-4px] text-gray-600">
        * 支持多个添加，产品名之间以 、隔开
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="projectCancel">取消</el-button>
          <el-button type="primary" @click="projectConfirm">
            确认添加
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="projectTableShow" :title="'银行产品'" width="500">
      <el-button
        v-if="actions.includes('CreateBankProject')"
        @click="projectVisiable = true"
        size="small"
        class="mb-2"
        >添加产品</el-button
      >
      <el-button
        v-if="actions.includes('DeleteBankProject')"
        @click="handleMulDel2"
        size="small"
        class="mb-2"
        >批量删除</el-button
      >
      <el-table
        :data="projectList"
        style="width: 100%"
        header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
        max-height="320"
        @selection-change="handleSelectionChange2"
        class="flex-1"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="单位名称" />
        <el-table-column label="添加时间" sortable>
          <template #default="props">
            {{ dayjs(props.row.created_at * 1000).format("YYYY-MM-DD HH:mm") }}
          </template>
        </el-table-column>
        <el-table-column label="最近更新时间" sortable>
          <template #default="props">
            {{ dayjs(props.row.updated_at * 1000).format("YYYY-MM-DD HH:mm") }}
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="props">
            <el-button
              v-if="actions.includes('DeleteBankProject')"
              link
              type="danger"
              @click="handleDelProject(props.row.id)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog
      v-model="mulDialogVisiable"
      @closed="handleMulCancel"
      title="批量导入"
      width="500"
    >
      <el-table
        header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
        max-height="320"
        :data="mulTableData"
      >
        <el-table-column prop="name" fixed="left" label="单位名称" />
        <el-table-column label="银行产品">
          <template #default="scope">
            {{ scope.row.bank_project?.name }}
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleMulCancel">取消</el-button>
          <el-button type="primary" @click="handleConfirmImport">
            确认导入
          </el-button>
        </div>
      </template>
    </el-dialog>
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
