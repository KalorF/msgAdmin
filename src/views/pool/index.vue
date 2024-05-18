<script lang="ts" setup>
import {
  poolCreate,
  poolDel,
  poolList,
  poolUpdate,
  allocConfig,
  upsertAllocConfig
} from "@/api/alloc";
import { getAllTags, getAllGroupTag } from "@/api/tag";
import {
  getAccountlistByOrg,
  getAccountByName,
  postAccountUpdate
} from "@/api/account";
import { ref, reactive, onMounted, watch, computed } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import dayjs from "dayjs";
import { nextTick } from "process";
import { message } from "@/utils/message";

const orgList = ref([]);
const myorg = ref();
const dialogVisiable = ref(false);
const isEdit = ref(false);
const curId = ref("");
const activeOrg = ref("");
const accountList = ref([]);
const pageSize = ref(10);
const currentPage = ref(1);
const total = ref(0);

const formdData = ref({
  name: "",
  tagOptions: []
});

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

const getConfig = () => {
  allocConfig().then(res => {
    console.log(res);
  });
};

const getAccountData = () => {
  getAccountlistByOrg({
    orgId: activeOrg.value,
    limit: pageSize.value,
    offset: currentPage.value - 1
  }).then(res => {
    if (res.code === 200) {
      accountList.value = res.data.accounts || [];
      total.value = res.data.count || 0;
    }
  });
};

const getallOrgData = () => {
  return poolList().then(res => {
    if (res.code === 200) {
      orgList.value = res.data.pool_list || [];
    }
  });
};

const handleCancelCreate = () => {
  dialogVisiable.value = false;
  setTimeout(() => {
    isEdit.value = false;
    formdData.value.name = "";
    formdData.value.tagOptions = [];
  }, 250);
};

const confirmCreate = () => {
  if (formdData.value.name === "") {
    message("请输入客户池名称");
    return;
  }
  if (formdData.value.tagOptions.length === 0) {
    message("请选择客户标签");
    return;
  }
  const func = isEdit.value ? poolUpdate : poolCreate;
  const data: any = {
    condition: {
      all: true,
      has_tag_id_str_list: formdData.value.tagOptions
    },
    name: formdData.value.name
  };
  if (isEdit.value) {
    data.id = curId.value;
  }
  func(data)
    .then(res => {
      if (res.code === 200) {
        message(isEdit.value ? "编辑成功" : "创建成功", { type: "success" });
        getallOrgData();
        handleCancelCreate();
      } else {
        message(isEdit.value ? "编辑失败" : "创建失败", { type: "error" });
      }
    })
    .catch(err => {
      message(isEdit.value ? "编辑失败" : "创建失败", { type: "error" });
    });
};

const handleEdit = (item: any) => {
  isEdit.value = true;
  curId.value = item.config.id;
  formdData.value.name = item.config.name;
  formdData.value.tagOptions = item.config.condition.has_tag_id_str_list;
  dialogVisiable.value = true;
};

const handleDel = (id: string) => {
  ElMessageBox.confirm("确认删除该客户池吗?", "提示", {
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      poolDel({ name: id }).then(res => {
        if (res.code === 200) {
          ElMessage.success("删除成功");
          getallOrgData();
        } else {
          ElMessage.error("删除失败");
        }
      });
    })
    .catch(() => {});
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  getAccountData();
};
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  getAccountData();
};

const selOrg = (id: string) => {
  pageSize.value = 10;
  currentPage.value = 1;
  total.value = 0;
  activeOrg.value = id;
};

const dialogSearch = ref(false);
const accountName = ref("");
const searchData = ref(null);

const handleCancelSearch = () => {
  dialogSearch.value = false;
  accountName.value = "";
  searchData.value = null;
};

const handleEditAuth = (item: any) => {
  ElMessage({
    message: "功能开发中",
    type: "info",
    customClass: "pure-message"
  });
};

onMounted(async () => {
  await getallOrgData();
  if (orgList.value.length) {
    activeOrg.value = orgList.value[0].config.id;
    accountList.value = orgList.value[0].staff_list || [];
  }
  getTagOptions();
});

watch(activeOrg, () => {
  const item = orgList.value.find(item => item.config.id === activeOrg.value);
  accountList.value = item.staff_list;
});
</script>

<template>
  <div class="p-4 py-1 bg-white rounded-lg flex h-[calc(100%-30px)] w-full">
    <div
      class="w-[260px] h-full border-r border-r-slate-100 flex flex-col gap-2 pr-2"
    >
      <el-button type="primary" bg text @click="dialogVisiable = true"
        >创建客户池</el-button
      >
      <div
        v-for="item in orgList"
        :key="item.id"
        class="rounded-md hover:bg-[#f5f7fa] p-2 w-full text-sm flex items-center"
        :class="{ 'bg-[#f5f7fa]': item.config.id === activeOrg }"
        @click="selOrg(item.config.id)"
      >
        {{ item.config.name }}
        <div class="ml-auto flex">
          <svg
            @click.stop="handleEdit(item)"
            class="w-4 h-4 mr-2 text-gray-400 hover:text-slate-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1024 1024"
            data-v-ea893728=""
          >
            <path
              fill="currentColor"
              d="M832 512a32 32 0 1 1 64 0v352a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h352a32 32 0 0 1 0 64H192v640h640z"
            ></path>
            <path
              fill="currentColor"
              d="m469.952 554.24 52.8-7.552L847.104 222.4a32 32 0 1 0-45.248-45.248L477.44 501.44l-7.552 52.8zm422.4-422.4a96 96 0 0 1 0 135.808l-331.84 331.84a32 32 0 0 1-18.112 9.088L436.8 623.68a32 32 0 0 1-36.224-36.224l15.104-105.6a32 32 0 0 1 9.024-18.112l331.904-331.84a96 96 0 0 1 135.744 0z"
            ></path>
          </svg>
          <svg
            @click.stop="handleDel(item.config.name)"
            class="w-4 h-4 text-gray-400 hover:text-slate-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1024 1024"
            data-v-ea893728=""
          >
            <path
              fill="currentColor"
              d="M160 256H96a32 32 0 0 1 0-64h256V95.936a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32V192h256a32 32 0 1 1 0 64h-64v672a32 32 0 0 1-32 32H192a32 32 0 0 1-32-32zm448-64v-64H416v64zM224 896h576V256H224zm192-128a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32m192 0a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32"
            ></path>
          </svg>
        </div>
      </div>
    </div>
    <div class="w-full px-2 flex flex-col">
      <div class="flex items-center">
        <span class="border-l-[#ff922b] border-l-4 text-sm pl-1 rounded"
          >客户池员工</span
        >
        <el-button
          type="default"
          class="w-[100px] ml-auto"
          @click="dialogSearch = true"
          >添加账号</el-button
        >
      </div>
      <el-table
        header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
        :data="accountList"
        style="width: 100%"
        class="flex-1 mt-2"
      >
        <el-table-column prop="account" label="账号" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="phone" label="手机" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column label="创建时间">
          <template #default="scope">
            {{ dayjs(+scope.row.created_at * 1000).format("YYYY-MM-DD HH:mm") }}
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button link type="primary" @click="handleEditAuth(scope.row)">
              编辑权限</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-2 flex justify-end">
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
    </div>

    <!-- 创建客户池子 -->
    <el-dialog
      v-model="dialogVisiable"
      :title="isEdit ? '编辑客户池' : '创建客户池子'"
      width="400"
      @closed="handleCancelCreate"
      align-center
    >
      <el-form class="demo-form-inline">
        <el-form-item label="客户池名称">
          <el-input
            v-model="formdData.name"
            placeholder="请输入客户池名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="客户标签">
          <el-select
            v-model="formdData.tagOptions"
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
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancelCreate">取消</el-button>
          <el-button type="primary" @click="confirmCreate">
            {{ isEdit ? "确认修改" : "确认创建" }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
