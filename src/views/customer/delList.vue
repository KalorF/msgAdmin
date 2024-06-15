<script lang="ts" setup>
import {
  createCustomer,
  customerUpdate,
  customerList,
  deleteCustomer,
  customerRecover,
  getCustomerByTagId,
  customerSelect,
  customerQuery,
  customerUpte
} from "@/api/customer";
import { getAllTags, getAllGroupTag } from "@/api/tag";
import { message } from "@/utils/message";
import { ref, reactive } from "vue";
import { Avatar } from "@element-plus/icons-vue";
import { onMounted, nextTick, computed } from "vue";
import { ElMessageBox } from "element-plus";
import dayjs from "dayjs";
import { usePermissionActionStroe } from "@/store/modules/permission";

defineOptions({
  name: "customerlist2"
});

const permission = usePermissionActionStroe();
const actions = computed(() => permission.value);

const formInline = reactive({
  user: "",
  company: "",
  phone: "",
  date: ""
});

const onSubmit = async () => {
  if (valueGroup.value.length) {
    const res = await getCustomerByTagId({ tag_id_list: valueGroup.value });
    tableData.value = res.data || [];
  } else {
    pageSize.value = 10;
    currentPage.value = 1;
    const res = await customerSelect({
      customer_condition: {
        is_deleted: true,
        name: formInline.user,
        company: formInline.company,
        phone: formInline.phone,
        created_at: +formInline.date / 1000 + ""
      },
      limit: pageSize.value,
      offset: currentPage.value - 1
    });
    if (res.code === 200 && res.data) {
      tableData.value = res.data.customers || [];
      total.value = res.data.total || 0;
    } else {
      total.value = 0;
      tableData.value = [];
    }
  }
};

const onReset = () => {
  Object.keys(formInline).forEach(key => {
    formInline[key] = "";
  });
  valueGroup.value = [];
  currentPage.value = 1;
  pageSize.value = 10;
  getData();
};

const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const tableData = ref([]);
const currentInfo = ref();

const getData = () => {
  customerQuery({
    condition: {
      info: {
        is_deleted: true
      }
    },
    page: {
      limit: pageSize.value,
      offset: currentPage.value - 1
    }
  })
    .then(res => {
      if (res.code === 200 && res.data) {
        tableData.value = res.data.customers || [];
        total.value = res.data.count || 0;
      } else {
        total.value = 0;
        tableData.value = [];
      }
    })
    .catch(() => {
      total.value = 0;
      tableData.value = [];
    });
};

const valueGroup = ref([]);

const options = ref([]);

const getTagOptions = async () => {
  const { data: groups = [] } = await getAllGroupTag();
  const { data: tags = [] } = await getAllTags();
  const temp = {};
  if (groups.length) {
    groups.forEach(item => {
      temp[item.id] = { ...item, children: [] };
    });
    if (tags.length) {
      tags.forEach(tag => {
        const group_id = tag.group_id;
        temp[group_id].children.push(tag);
      });
    }
  }
  if (Object.keys(temp).length) {
    options.value =
      Object.values(temp).filter((item: any) => item.children.length > 0) || [];
  } else {
    options.value = [];
  }
};

const dialogVisible = ref(false);
const dialogData = ref({
  name: {
    label: "客户名称",
    value: "",
    type: "text"
  },
  phone: {
    label: "手机",
    value: "",
    type: "tel"
  },
  company: {
    label: "公司",
    value: "",
    type: "text"
  },
  email: {
    label: "邮箱",
    value: "",
    type: "text"
  },
  wechat: {
    label: "微信",
    value: "",
    type: "text"
  },
  wecom: {
    label: "wecom",
    value: "",
    type: "text"
  },
  address: {
    label: "地址",
    value: "",
    type: "textarea"
  },
  working_address: {
    label: "工作地址",
    value: "",
    type: "textarea"
  }
});

const isEdit = ref(false);

const handleCancelCrete = () => {
  Object.values(dialogData.value).forEach(item => {
    item.value = "";
  });
  isEdit.value = false;
  currentInfo.value = null;
  dialogVisible.value = false;
};

const handleEdit = (item: any) => {
  Object.keys(dialogData.value).map(key => {
    dialogData.value[key].value = item[key];
  });
  isEdit.value = true;
  currentInfo.value = item;
  dialogVisible.value = true;
};

const handleConfirm = () => {
  let flag = false;
  Object.values(dialogData.value).some(item => {
    if (!item.value) {
      message(`请输入${item.label}`, { type: "info" });
      flag = true;
      return true;
    }
  });
  if (!flag) {
    const data: any = {};
    Object.keys(dialogData.value).forEach(key => {
      data[key] = dialogData.value[key].value;
    });
    if (isEdit.value) {
      data.id = currentInfo.value.id;
    }
    const func = isEdit.value ? customerUpdate : createCustomer;
    func({ ...data })
      .then(res => {
        if (res.code === 200) {
          message(isEdit.value ? "编辑成功" : "添加成功", { type: "success" });
          getData();
          handleCancelCrete();
        } else {
          message(isEdit.value ? "编辑失败" : "添加失败", { type: "error" });
        }
      })
      .catch(err => {
        if (err?.response?.data?.msg) {
          message(err?.response?.data?.msg, { type: "error" });
        } else {
          message(isEdit.value ? "编辑失败" : "添加失败", { type: "error" });
        }
      });
  }

  handleCancelCrete();
};
const checkboxGroup1 = ref(["Value1"]);

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  getData();
};
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  getData();
};

const handleDel = (item: any) => {
  ElMessageBox.confirm("确认删除该客户吗?", "提示", {
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      deleteCustomer(item.id)
        .then(res => {
          if (res.code === 200) {
            message("删除成功", { type: "success" });
            getData();
          } else {
            message("删除失败", { type: "error" });
          }
        })
        .catch(err => {
          message(err?.response?.data?.msg || "删除失败", { type: "error" });
        });
    })
    .catch(() => {});
};

const handlecover = (item: any) => {
  customerUpte({ ...item, is_deleted: false })
    .then(res => {
      if (res.code === 200) {
        message("恢复成功", { type: "success" });
        getData();
      } else {
        message("恢复失败", { type: "error" });
      }
    })
    .catch(err => {
      message(err?.response?.data?.msg || "恢复失败", { type: "error" });
    });
};

onMounted(() => {
  getData();
  // getTagOptions();
});
</script>

<template>
  <!-- <el-form :inline="true" :model="formInline" class="demo-form-inline">
    <el-form-item label="客户名称">
      <el-input
        v-model="formInline.user"
        placeholder="请输入客户名称"
        clearable
      />
    </el-form-item>
    <el-form-item label="公司">
      <el-input
        v-model="formInline.company"
        placeholder="请输入公司名称"
        clearable
      />
    </el-form-item>
    <el-form-item label="手机">
      <el-input v-model="formInline.phone" placeholder="请输入手机" clearable />
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
    <el-form-item label="标签">
      <el-select
        v-model="valueGroup"
        multiple
        placeholder="请选择"
        collapse-tags
        collapse-tags-tooltip
        :max-collapse-tags="3"
        filterable
        style="width: 240px"
      >
        <el-option-group
          v-for="group in options"
          :key="group.id"
          :label="group.name"
        >
          <el-option
            v-for="item in group.children"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-option-group>
      </el-select>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="onSubmit">查询</el-button>
      <el-button type="default" @click="onReset">重置</el-button>
    </el-form-item>
  </el-form> -->
  <el-table
    header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
    :data="tableData"
    style="width: 100%"
    class="flex-1"
  >
    <el-table-column type="expand">
      <template #default="props">
        <div
          class="ml-16 text-zinc-500 text-sm flex flex-col flex-wrap content-start gap-1"
        >
          <p>地址：{{ props.row.address }}</p>
          <p>工作地址：{{ props.row.working_address }}</p>
          <div
            v-if="props.row.tags"
            class="flex items-center flex-wrap gap-2 mb-2"
          >
            标签：
            <div
              class="p-1 px-4 rounded-md bg-[#eeeeee] text-[#303841]"
              v-for="item in props.row.tags"
              :key="item.id"
            >
              {{ item.name }}
            </div>
          </div>
        </div>
      </template>
    </el-table-column>
    <el-table-column label="客户名称">
      <template #default="props">
        <div class="flex items-center">
          <el-icon :size="24" color="#393e46"><Avatar /></el-icon>
          {{ props.row.name }}
        </div>
      </template>
    </el-table-column>
    <el-table-column prop="company" label="公司" />
    <el-table-column prop="phone" label="手机" />
    <el-table-column prop="wechat" label="微信" />
    <el-table-column prop="wecom" label="wecom" />
    <el-table-column label="添加时间" sortable>
      <template #default="props">
        {{ dayjs(props.row.updated_at * 1000).format("YYYY-MM-DD HH:mm") }}
      </template>
    </el-table-column>
    <el-table-column label="操作" #default="props">
      <el-button
        v-if="actions.includes('CreateCustomerAction')"
        link
        type="success"
        @click="handlecover(props.row)"
        >恢复</el-button
      >
      <!-- <el-button link type="danger" @click="handleDel(props.row)"
        >删除</el-button
      > -->
    </el-table-column>
  </el-table>
  <div class="mt-4 flex justify-end">
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
    :title="isEdit ? '客户信息' : '添加客户'"
    width="400"
    @closed="handleCancelCrete"
    align-center
  >
    <el-form label-position="right" class="demo-form-inline">
      <el-form-item
        :label="item.label"
        v-for="(item, key) in dialogData"
        :key="key"
      >
        <el-input
          v-model="item.value"
          :type="item.type"
          :placeholder="'请输入' + item.label"
          clearable
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancelCrete">取消</el-button>
        <el-button type="primary" @click="handleConfirm">
          {{ isEdit ? "确认修改" : "添加客户" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.demo-form-inline .el-input {
  --el-input-width: 210px;
}
.demo-form-inline .el-select {
  --el-select-width: 210px;
}
</style>
