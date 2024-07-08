<script lang="ts" setup>
import { ref, onMounted, reactive, computed, watch } from "vue";
import { FolderOpened, User } from "@element-plus/icons-vue";
import { useUserStoreHook } from "@/store/modules/user";
import {
  getpolicy,
  getPolicyByUserId,
  policyUpsert,
  roleUpsert
} from "@/api/user";
import { message } from "@/utils/message";
import { useNav } from "@/layout/hooks/useNav";

const props = defineProps<{ show?: boolean; title?: string; info?: any }>();
const emits = defineEmits(["close", "confirm"]);
const selected = ref("");
const selectOption = ref([]);
const customerRole = ref([]);

const userStroe = useUserStoreHook();
const nav = useNav();

const getPolicyList = () => {
  return getpolicy().then(res => {
    if (res.code === 200) {
      customerRole.value = res.data.custom_roles;
      selectOption.value = res.data.custom_roles.map(item => {
        return {
          id: item.id,
          name: item.name,
          description: item.description
        };
      });
    }
  });
};

const getCurrentPolicy = () => {
  getPolicyByUserId({
    uid_list: [props.info.id]
  }).then(res => {
    if (res.code === 200 && Object.keys(res.data.policies).length) {
      const policy: any = Object.values(res.data.policies)[0];
      selected.value = policy.role.RoleType;
    } else {
      selected.value = "";
    }
  });
};

const handleConfirm = () => {
  const curRole = customerRole.value.find(item => item.name === selected.value);
  policyUpsert({
    policy: {
      effect: "Allow",
      role: {
        roleType: selected.value
      },
      resources: curRole.role_resource_list.map(item => ({
        name: item.resource_name
      })),
      actions: curRole.role_action_list.map(item => ({
        name: item.action_name
      }))
    },
    uid: props.info.id
  })
    .then(res => {
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
    })
    .catch(err => {
      message(err?.response?.data?.msg || "设置失败", { type: "error" });
    });
};

watch(
  () => props.show,
  async () => {
    if (props.show) {
      await getPolicyList();
      getCurrentPolicy();
    }
  }
);
</script>

<template>
  <el-dialog
    v-model="props.show"
    width="400"
    title="设置角色"
    :modal="true"
    @close="emits('close')"
  >
    <el-select v-model="selected">
      <el-option
        v-for="item in selectOption"
        :key="item.id"
        :label="item.description"
        :value="item.name"
      />
    </el-select>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="emits('close')">取消</el-button>
        <el-button type="primary" @click="handleConfirm"> 确定 </el-button>
      </div>
    </template>
  </el-dialog>
</template>
