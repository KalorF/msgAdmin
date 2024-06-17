<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import { getpolicy, getPolicyByUserId, policyUpsert } from "@/api/user";
import { useUserStore } from "@/store/modules/user";
import { message } from "@/utils/message";
import { useNav } from "@/layout/hooks/useNav";
import { useUserStoreHook } from "@/store/modules/user";


const userStroe = useUserStoreHook();

const roleMap: any = {
  admin: "系统管理员",
  staff: "员工",
  organization_manager: "组织管理员"
};

const resourceMap = {
  SimpleBI: "数据概览",
  AccountManager: "账号管理",
  CustomerTagManager: "客户标签管理",
  CustomerActionManager: "客户管理",
  SimpleCustomer: "我的客户",
  OrganizationManager: "组织管理",
  BankManager: "银行卡白名单",
  CourseManager: "课程管理",
  SimpleCourse: "我的学习",
  ProgressManager: "进度设置管理",
  ResourceSimpleExam: "我的考试",
  ResourceExamManager: "考试系统"
};

const actionMap = {
  CreateAccount: "创建账号",
  UpdateAccount: "编辑账号",
  DeleteAccount: "删除账号",
  CreateOrganization: "创建组织",
  UpdateOrganization: "编辑组织",
  DeleteOrganization: "删除组织",
  CreateCourse: "创建课程",
  UpdateCourse: "编辑课程",
  DeleteCourse: "删除课程",
  CreateTagGroup: "创建标签组",
  UpdateTagGroup: "编辑标签组",
  DeleteTagGroup: "删除标签组",
  CreateCustomerTag: "创建客户标签",
  UpdateCustomerTag: "更新客户标签",
  DeleteCustomerTag: "删除客户标签",
  CreateCustomerAction: "创建客户",
  UpdateCustomerAction: "编辑客户信息",
  DeleteCustomerAction: "删除客户",
  CreateAllocationConfig: "客户分配规则",
  CreateProgress: "创建进度配置",
  UpdateProgress: "编辑进度配置",
  DeleteProgress: "删除进度配置",
  CreateBank: "创建银行",
  // UpdateBank: "编辑银行",
  DeleteBank: "删除银行",
  CreateBankProject: "创建银行产品",
  // UpdateBankProject: "编辑银行产品",
  DeleteBankProject: "删除银行产品",
  ActionCreateExam: "创建考卷",
  ActionUpdateExam: "更新考卷",
  ActionDeleteExam: "删除考卷"
}

const nav = useNav()

const props = defineProps<{ show?: boolean; info?: any }>();
const emits = defineEmits(["close", "confirm"]);
const actions = ref([]);
const resources = ref([]);
const rolesList = ref<any[]>([]);
const role = ref("");
const resourceCheckList = ref([]);
const actionCheckList = ref([]);

const genRoleListData = (data: any) => {
  const list = [];
  data.map(item => {
    list.push({ label: roleMap[item.RoleType], value: item.RoleType });
  });
  [list[1], list[2]] = [list[2], list[1]];

  return list;
};

const genResource = (data: any) => {
  const list = [];
  data.map(item => {
    if (resourceMap[item.name]) {
      list.push({ label: resourceMap[item.name], value: item.name });
    }
  });
  return list;
};

const genAction = (data: any) => {
  const list = [];
  data.map(item => {
    if (actionMap[item.name]) {
      list.push({ label: actionMap[item.name], value: item.name });
    }
  });
  return list;
};

const handleConfirm = () => {
  policyUpsert({
    policy: {
      effect: "Allow",
      role: {
          roleType: role.value
      },
      resources: resourceCheckList.value.map(item => ({ name: item })),
      actions: actionCheckList.value.map(item => ({ name: item }))
    },
    uid: props.info.id
  }).then(res => {
    if (res.code === 200) {
       if (props.info.id === userStroe.userInfo.id) {
          message("设置成功, 登陆后生效", { type: "success" });
          nav.logout();
        } else {
          message("设置成功", { type: "success" });
        }
      emits("close");
      emits("confirm");
    }
  }).catch(err => {
    message(err?.response?.data?.msg || "设置失败", { type: "error" });
  });
};

const handleCancel = () => {
  emits("close");
};

const getCurrentPolicy = () => {
  getPolicyByUserId({
    uid_list: [props.info.id]
  }).then(res => {
    if (res.code === 200 && Object.keys(res.data.policies).length) {
      const policy: any = Object.values(res.data.policies)[0];
      role.value = policy.role.RoleType;
      resourceCheckList.value = policy.resources && policy.resources.map(item => item.name) || [];
      actionCheckList.value = policy.actions && policy.actions.map(item => item.name) || [];
    } else {
      role.value = rolesList.value[2].value;
      resourceCheckList.value = [];
      actionCheckList.value = [];
    }
  })
}

const getPolicyList = () => {
  return getpolicy().then(res => {
    if (res.code === 200) {
      actions.value = genAction(res.data.actions);
      rolesList.value = genRoleListData(res.data.roles);
      resources.value = genResource(res.data.resources);
    }
  });
};

watch(
  () => props.show,
  async (val) => {
    if (val) {
      await getPolicyList();
      getCurrentPolicy();
    }
  },
  { immediate: true }
);
</script>

<template>
  <el-dialog
    v-model="props.show"
    width="700"
    title="权限设置"
    @close="emits('close')"
  >
    <div class="mb-4">
      <p class="font-semibold text-base flex items-center"><div class="w-1 h-4 rounded-sm bg-amber-400 mr-2"></div>账号角色</p>
      <el-radio-group v-model="role">
        <el-radio v-for="item in rolesList" :value="item.value">{{
          item.label
        }}</el-radio>
      </el-radio-group>
    </div>
    <div class="mb-4">
      <p class="font-semibold text-base flex items-center"><div class="w-1 h-4 rounded-sm bg-amber-400 mr-2"></div>菜单</p>
      <el-checkbox-group v-model="resourceCheckList">
        <el-checkbox
          v-for="item in resources"
          :label="item.label"
          :value="item.value"
          :key="item.value"
        />
      </el-checkbox-group>
    </div>
    <div class="mb-0">
      <p class="font-semibold text-base flex items-center"><div class="w-1 h-4 rounded-sm bg-amber-400 mr-2"></div>操作</p>
      <el-checkbox-group v-model="actionCheckList">
        <el-checkbox
          v-for="item in actions"
          :label="item.label"
          :value="item.value"
          :key="item.value"
        />
        </el-checkbox-group>  
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm"> 确认 </el-button>
      </div>
    </template>
  </el-dialog>
</template>
