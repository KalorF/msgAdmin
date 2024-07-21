<script lang="ts" setup>
import {
  poolCreate,
  poolDel,
  poolList,
  poolUpdate,
  allocConfig,
  upsertAllocConfig,
  staffConfigDel,
  getpoolList,
  poolSet,
  allocSetConfig,
  poolDelStaff,
  poolDelete
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
import { message } from "@/utils/message";
import tagPop from "@/components/tagPop/index.vue";
import { customerQuery } from "@/api/customer";
import {
  Avatar,
  EditPen,
  More,
  Edit,
  Delete,
  Memo,
  Share,
  Sort
} from "@element-plus/icons-vue";
import topCollapse from "@/layout/components/sidebar/topCollapse.vue";

import { usePermissionActionStroe } from "@/store/modules/permission";

const permission = usePermissionActionStroe();
const actions = computed(() => permission.value);

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

const tagOptionsValue = computed(() => {
  return formdData.value.tagOptions.map(item => item.name).join("、") || [];
});

const options = ref([]);
const allTags = ref([]);

const getTagOptions = async () => {
  const { data: groups = [] } = await getAllGroupTag();
  // const { data: tags = [] } = await getAllTags();
  if (groups.length) {
    groups.map(item => {
      if (item.tag_list && item.tag_list.length) {
        allTags.value.push(...item.tag_list);
      }
    });
  }
  // const temp = {};
  // if (groups.length) {
  //   groups.forEach(item => {
  //     temp[item.id] = { ...item, children: [] };
  //   });
  //   if (tags.length) {
  //     tags.forEach(tag => {
  //       const group_id = tag.group_id;
  //       temp[group_id].children.push(tag);
  //     });
  //   }
  // }
  // if (Object.keys(temp).length) {
  //   options.value =
  //     Object.values(temp).filter((item: any) => item.children.length > 0) || [];
  // } else {
  //   options.value = [];
  // }
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
  return getpoolList().then(res => {
    if (res.code === 200) {
      orgList.value = res.data.allocation_pool_list || [];
      ruleData.value.number_per_time =
        res.data.allocation_config.number_per_time;
      ruleData.value.times_per_day = res.data.allocation_config.times_per_day;
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
  // if (formdData.value.tagOptions.length === 0) {
  //   message("请选择客户标签");
  //   return;
  // }
  const func = isEdit.value ? poolSet : poolSet;
  let data: any = {
    name: formdData.value.name,
    condition: {
      info: {
        customer_tag_list: formdData.value.tagOptions.map(i => ({
          tag_id: i.id
        }))
      }
    }
  };
  if (isEdit.value) {
    data = Object.assign(currentInfo.value, { ...data });
  }
  func({ pool: data })
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
      message(
        err?.response?.data?.msg || (isEdit.value ? "编辑失败" : "创建失败"),
        { type: "error" }
      );
    });
};

const currentInfo = ref();

const handleEdit = (item: any) => {
  isEdit.value = true;
  curId.value = item.id;
  formdData.value.name = item.name;
  currentInfo.value = item;
  const ids = item.condition.info.customer_tag_list.map(i => i.tag_id);
  formdData.value.tagOptions = allTags.value.filter(i => ids.includes(i.id));
  dialogVisiable.value = true;
};

const handleDel = (id: string) => {
  ElMessageBox.confirm("确认删除该客户池吗?", "提示", {
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      poolDelete({ id_str_list: [id] })
        .then(async res => {
          if (res.code === 200) {
            ElMessage.success("删除成功");
            getallOrgData();
          } else {
            ElMessage.error("删除失败");
          }
        })
        .catch(err => {
          ElMessage.error(err?.response?.data?.msg || "删除失败");
        });
    })
    .catch(() => {});
};

const handleDelFromPool = (item: any, fromMul = false) => {
  ElMessageBox.confirm("确认将该员工从客户池中移除吗?", "提示", {
    confirmButtonText: "确认移除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      const data = fromMul
        ? { staff_id_str_list: selMulIds.value }
        : { staff_id_str_list: [item.id] };
      poolDelStaff(data)
        .then(async res => {
          if (res.code === 200) {
            ElMessage.success("移除成功");
            await getallOrgData();
            const item = orgList.value.find(
              item => item.id === activeOrg.value
            );
            accountList.value = item.staff_allocation_list;
          } else {
            ElMessage.error("移除失败");
          }
        })
        .catch(err => {
          ElMessage.error(err?.response?.data?.msg || "移除失败");
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

const selOrg = item => {
  pageSize.value = 10;
  currentPage.value = 1;
  total.value = 0;
  currentInfo.value = item;
  activeOrg.value = item.id;
  handleViewCustomer();
};

const dialogSearch = ref(false);
const accountName = ref("");
const searchData = ref(null);

const ruleVisiable = ref(false);
const ruleData = ref({
  number_per_time: 0,
  times_per_day: 0
});

const ruleCancel = () => {
  // ruleData.value.number_per_time = 0;
  // ruleData.value.times_per_day = 0;
  ruleVisiable.value = false;
};

const handleSetRule = async () => {
  // try {
  //   const res = await allocConfig();
  //   if (res && res.data) {
  //     ruleData.value.number_per_time = res.data.number_per_time;
  //     ruleData.value.times_per_day = res.data.times_per_day;
  //   }
  // } catch (error) {}

  ruleVisiable.value = true;
};

const confirmRule = () => {
  if (ruleData.value.number_per_time === 0) {
    message("请设置每天领取次数");
    return;
  } else if (ruleData.value.times_per_day === 0) {
    message("请设置每次领取次数");
    return;
  }
  allocSetConfig({ ...ruleData.value })
    .then(res => {
      if (res.code === 200) {
        message("配置成功", { type: "success" });
        ruleCancel();
      } else {
        message("配置失败", { type: "error" });
      }
    })
    .catch(err => {
      message(err?.response?.data?.msg || "配置失败", { type: "error" });
    });
};

const selMulIds = ref([]);

const handleSelectionChange = (val: any) => {
  if (val.length) {
    selMulIds.value = val.map(item => item.id);
  } else {
    selMulIds.value = [];
  }
};

const hanldeMulDel = () => {
  if (selMulIds.value.length === 0) {
    message("请选择删除名单");
    return;
  }
  handleDelFromPool("-1", true);
};

onMounted(async () => {
  await getallOrgData();
  if (orgList.value.length) {
    activeOrg.value = orgList.value[0].id;
    currentInfo.value = orgList.value[0];
    accountList.value = orgList.value[0].staff_allocation_list || [];
    if (accountList.value.length) {
      accountList.value = accountList.value.map(item => item.staff);
    }
    handleViewCustomer();
  }
  getTagOptions();
});

watch(activeOrg, () => {
  const item = orgList.value.find(item => item.id === activeOrg.value);
  accountList.value = item.staff_allocation_list || [];
  if (accountList.value.length) {
    accountList.value = accountList.value.map(item => item.staff);
  }
});

const accountListShow = ref(false);

const customerList = ref([]);
const customerTotal = ref(0);
const customerCurrentPage = ref(1);
// const customerVisiable = ref(false);

const handleViewCustomer = () => {
  customerTotal.value = 0;
  customerCurrentPage.value = 1;
  customerList.value = [];
  getCustomerData();
  // customerVisiable.value = true;
};

const getCustomerData = () => {
  customerQuery({
    condition: {
      info: {
        is_deleted: false,
        customer_tag_list:
          currentInfo.value.condition.info.customer_tag_list.map(i => ({
            tag_id: i.tag_id
          }))
      }
    },
    page: {
      limit: 10,
      offset: customerCurrentPage.value - 1
    }
  }).then(res => {
    if (res.code === 200) {
      customerList.value = res.data.customers || [];
      customerTotal.value = res.data.count || 0;
    }
  });
};

const handleChangeCustomerPage = (val: number) => {
  customerCurrentPage.value = val;
  getCustomerData();
};

const showBar = ref(false);
</script>

<template>
  <div
    class="p-4 py-1 bg-white rounded-lg flex h-[calc(100%-30px)] w-full content-start"
  >
    <div
      class="w-[260px] h-full border-r border-r-slate-100 flex flex-col gap-2 pr-2 max-phone:hidden"
    >
      <el-button
        v-if="actions.includes('CreateCustomerAction')"
        type="primary"
        bg
        text
        @click="dialogVisiable = true"
        >创建客户池</el-button
      >
      <div
        v-for="item in orgList"
        :key="item.id"
        class="rounded-md hover:bg-[#f5f7fa] p-2 w-full text-sm flex items-center"
        :class="{ 'bg-[#f5f7fa]': item.id === activeOrg }"
        @click="selOrg(item)"
      >
        {{ item.name }}
        <div class="ml-auto flex">
          <svg
            v-if="actions.includes('CreateCustomerAction')"
            class="w-4 h-4 mr-2 text-gray-400 hover:text-slate-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1024 1024"
            data-v-ea893728=""
            @click.stop="handleEdit(item)"
          >
            <path
              fill="currentColor"
              d="M832 512a32 32 0 1 1 64 0v352a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h352a32 32 0 0 1 0 64H192v640h640z"
            />
            <path
              fill="currentColor"
              d="m469.952 554.24 52.8-7.552L847.104 222.4a32 32 0 1 0-45.248-45.248L477.44 501.44l-7.552 52.8zm422.4-422.4a96 96 0 0 1 0 135.808l-331.84 331.84a32 32 0 0 1-18.112 9.088L436.8 623.68a32 32 0 0 1-36.224-36.224l15.104-105.6a32 32 0 0 1 9.024-18.112l331.904-331.84a96 96 0 0 1 135.744 0z"
            />
          </svg>
          <svg
            v-if="actions.includes('CreateCustomerAction')"
            class="w-4 h-4 text-gray-400 hover:text-slate-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1024 1024"
            data-v-ea893728=""
            @click.stop="handleDel(item.id)"
          >
            <path
              fill="currentColor"
              d="M160 256H96a32 32 0 0 1 0-64h256V95.936a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32V192h256a32 32 0 1 1 0 64h-64v672a32 32 0 0 1-32 32H192a32 32 0 0 1-32-32zm448-64v-64H416v64zM224 896h576V256H224zm192-128a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32m192 0a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32"
            />
          </svg>
        </div>
      </div>
    </div>
    <el-drawer
      v-model="showBar"
      :direction="'ltr'"
      :size="260"
      :with-header="false"
      :lock-scroll="false"
    >
      <div>
        <el-button
          v-if="actions.includes('CreateCustomerAction')"
          type="primary"
          bg
          text
          @click="dialogVisiable = true"
          >创建客户池</el-button
        >
        <div
          v-for="item in orgList"
          :key="item.id"
          class="rounded-md hover:bg-[#f5f7fa] p-2 w-full mt-2 text-sm flex items-center"
          :class="{ 'bg-[#f5f7fa]': item.id === activeOrg }"
          @click="selOrg(item)"
        >
          {{ item.name }}
          <div class="ml-auto flex">
            <svg
              v-if="actions.includes('CreateCustomerAction')"
              class="w-4 h-4 mr-2 text-gray-400 hover:text-slate-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1024 1024"
              data-v-ea893728=""
              @click.stop="handleEdit(item)"
            >
              <path
                fill="currentColor"
                d="M832 512a32 32 0 1 1 64 0v352a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h352a32 32 0 0 1 0 64H192v640h640z"
              />
              <path
                fill="currentColor"
                d="m469.952 554.24 52.8-7.552L847.104 222.4a32 32 0 1 0-45.248-45.248L477.44 501.44l-7.552 52.8zm422.4-422.4a96 96 0 0 1 0 135.808l-331.84 331.84a32 32 0 0 1-18.112 9.088L436.8 623.68a32 32 0 0 1-36.224-36.224l15.104-105.6a32 32 0 0 1 9.024-18.112l331.904-331.84a96 96 0 0 1 135.744 0z"
              />
            </svg>
            <svg
              v-if="actions.includes('CreateCustomerAction')"
              class="w-4 h-4 text-gray-400 hover:text-slate-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1024 1024"
              data-v-ea893728=""
              @click.stop="handleDel(item.id)"
            >
              <path
                fill="currentColor"
                d="M160 256H96a32 32 0 0 1 0-64h256V95.936a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32V192h256a32 32 0 1 1 0 64h-64v672a32 32 0 0 1-32 32H192a32 32 0 0 1-32-32zm448-64v-64H416v64zM224 896h576V256H224zm192-128a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32m192 0a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32"
              />
            </svg>
          </div>
        </div>
      </div>
    </el-drawer>
    <topCollapse
      class="phone:hidden absolute max-phone:ml-[-25px] top-3.5"
      @toggleClick="showBar = true"
    />
    <div class="w-[calc(100%-260px)] px-2 flex flex-col max-phone:w-full">
      <div class="flex items-center">
        <span class="border-l-[#ff922b] border-l-4 text-sm pl-1 rounded"
          >客户</span
        >

        <el-button
          type="default"
          class="w-[100px] ml-auto"
          @click="accountListShow = true"
          >客户池员工</el-button
        >
        <el-button
          v-if="actions.includes('CreateAllocationConfig')"
          type="default"
          class="w-[100px]"
          @click="handleSetRule"
          >设置领取规则</el-button
        >
      </div>
      <el-table
        :data="customerList"
        header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
        style="width: 100%"
        class="mt-2 flex-1"
      >
        <el-table-column type="expand">
          <template #default="props">
            <div
              class="ml-16 text-zinc-500 text-sm flex flex-col flex-wrap content-start gap-1"
            >
              <p>地址：{{ props.row.address }}</p>
              <p>工作地址：{{ props.row.working_address }}</p>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="客户名称" width="230">
          <template #default="props">
            <div class="flex items-center">
              <el-icon :size="24" class="mr-2" color="#393e46"
                ><Avatar
              /></el-icon>
              {{ props.row.name }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="客户标签" width="230">
          <template #default="props">
            <div
              v-if="props.row.customer_tag_list"
              class="flex items-center flex-wrap gap-2 mb-2 w-full"
            >
              <div
                v-for="item in props.row.customer_tag_list"
                :key="item.id"
                class="p-1 px-2 text-xs rounded-md bg-[#eeeeee] text-[#303841]"
              >
                {{ item.tag.name }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" width="140" label="手机" />
        <el-table-column label="添加时间" width="200">
          <template #default="props">
            {{ dayjs(props.row.created_at * 1000).format("YYYY-MM-DD HH:mm") }}
          </template>
        </el-table-column>
        <el-table-column prop="company" width="180" label="公司" />
        <el-table-column prop="wechat" label="微信" />
        <el-table-column prop="wecom" label="企业微信" />
        <el-table-column prop="qq" label="QQ" />
      </el-table>
      <div class="mt-1 justify-end flex">
        <el-pagination
          v-if="customerTotal"
          v-model:current-page="customerCurrentPage"
          class="flex-wrap gap-y-2 mt-4"
          :default-page-size="5"
          background
          layout="total, prev, pager, next, jumper"
          :total="customerTotal"
          @current-change="handleChangeCustomerPage"
        />
      </div>
    </div>

    <!-- 创建客户池子 -->
    <el-dialog
      v-model="dialogVisiable"
      :title="isEdit ? '编辑客户池' : '创建客户池'"
      width="400"
      align-center
      @closed="handleCancelCreate"
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
          <tagPop
            :checkedItems="formdData.tagOptions"
            @change="value => (formdData.tagOptions = value)"
          >
            <el-input
              v-model="tagOptionsValue"
              placeholder="请输选择客户标签"
              clearable
              readonly
            />
          </tagPop>
          <!-- <el-select
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
          </el-select> -->
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

    <el-dialog
      v-model="ruleVisiable"
      title="配置领取规则"
      width="400"
      align-center
      @closed="ruleCancel"
    >
      <el-form class="demo-form-inline">
        <el-form-item label="每次领取个数">
          <el-input-number
            v-model="ruleData.number_per_time"
            :step="1"
            :min="0"
          />
        </el-form-item>
        <el-form-item label="每天领取次数">
          <el-input-number
            v-model="ruleData.times_per_day"
            :step="1"
            :min="0"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="ruleCancel">取消</el-button>
          <el-button type="primary" @click="confirmRule"> 确认 </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="accountListShow"
      title="该客户池员工"
      width="800"
      align-center
    >
      <el-table
        header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
        :data="accountList"
        style="width: 100%"
        class="flex-1 mt-2"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
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
            <el-button
              v-if="actions.includes('CreateCustomerAction')"
              link
              type="danger"
              @click="handleDelFromPool(scope.row)"
            >
              移除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-2 flex justify-between">
        <el-button
          v-if="actions.includes('CreateCustomerAction')"
          type="primary"
          :disabled="!selMulIds.length"
          @click="hanldeMulDel"
          >批量删除</el-button
        >
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          class="flex-wrap gap-y-2"
          :page-sizes="[10, 20, 30, 40]"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-dialog>
  </div>
</template>
