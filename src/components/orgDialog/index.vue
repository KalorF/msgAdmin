<script lang="ts" setup>
import { ref, onMounted, reactive, computed, watch } from "vue";
import dayjs from "dayjs";
import { FolderOpened, User } from "@element-plus/icons-vue";
import { getAllOrg } from "@/api/organization";
import { useUserStoreHook } from "@/store/modules/user";
import { operateCreate } from "@/api/customer";
import { FLOW_TYPE, RECORD_TYPE } from "@/types";
import { message } from "@/utils/message";
import { useNav } from "@/layout/hooks/useNav";

const userStroe = useUserStoreHook();

const props = defineProps<{ show?: boolean; title: string; info?: any }>();
const emits = defineEmits(["close"]);
const inputVal = ref("");

const dataSource = ref<any[]>([]);
const treeRef = ref<any | HTMLElement>(null);
const checkIds = ref([]);
const allStaff = ref([]);

const change = () => {
  checkIds.value = treeRef.value.getCheckedKeys();
  inputVal.value = allStaff.value
    .filter(item => checkIds.value.includes(item.id))
    .map(i => i.name)
    .join("、");
};

const getAllData = () => {
  getAllOrg().then(res => {
    if (res.data && res.data.length) {
      dataSource.value = res.data.filter(
        item => item.account_list && item.account_list.length
      );
      dataSource.value.forEach(item => {
        if (item.account_list) {
          item.children = item.account_list.filter(
            item => item.id !== userStroe.userInfo.id
          );
          allStaff.value.push(...item.children);
        }
      });
    }
  });
};

const handleConfirm = () => {
  if (!checkIds.value.length) {
    message("请选择");
    return;
  }
  const isShare = props.title.indexOf("分享") > -1;
  let data: any = {
    staff_id: userStroe.userInfo.id,
    customer_id: props.info.id,
    record_tyoe: RECORD_TYPE.LIUZHUAN,
    progress_id: props.info.progress_id
  };
  data.flow_type = isShare ? FLOW_TYPE.SHARE : FLOW_TYPE.ZUAN_RANG;
  if (isShare) {
    data.share_to_staff_list = allStaff.value
      .filter(item => checkIds.value.includes(item.id))
      .map(i => ({ id: i.id }));
  } else {
    data.transfer_to_staff_list = allStaff.value
      .filter(item => checkIds.value.includes(item.id))
      .map(i => ({ id: i.id }));
  }
  operateCreate(data)
    .then(res => {
      if (res.code === 200) {
        message("操作成功", { type: "success" });
        emits("close");
      } else {
        message("操作失败", { type: "error" });
      }
    })
    .catch(err => {
      message(err?.response?.data?.msg || "操作失败", { type: "error" });
    });
};

watch(
  () => props.show,
  () => {
    if (props.show) {
      getAllData();
      inputVal.value = "";
      checkIds.value = [];
      allStaff.value = [];
    }
  },
  { immediate: true }
);
</script>

<template>
  <el-dialog
    v-model="props.show"
    width="400"
    :title="props.title"
    :modal="false"
    @close="emits('close')"
  >
    <el-popover
      placement="bottom"
      class="!rounded-lg"
      :width="400"
      trigger="click"
    >
      <template #reference>
        <el-input placeholder="请选择" v-model="inputVal" readonly />
      </template>
      <div class="overflow-auto max-h-80">
        <el-tree
          ref="treeRef"
          style="max-width: 600px"
          :data="dataSource"
          show-checkbox
          node-key="id"
          @check="change"
          expand-on-click-node
        >
          <template #default="{ node, data }">
            <div class="flex items-center">
              <div class="flex items-center">
                <el-icon
                  ><FolderOpened v-if="data.account_list" /><User
                    v-else /></el-icon
                ><span class="ml-1">{{ data.name }}</span>
              </div>
              <!-- <span>
            <a @click="append(data)"> Append </a>
            <a style="margin-left: 8px" @click="remove(node, data)"> Delete </a>
          </span> -->
            </div>
          </template>
        </el-tree>
      </div>
    </el-popover>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="emits('close')">取消</el-button>
        <el-button type="primary" @click="handleConfirm"> 确定 </el-button>
      </div>
    </template>
  </el-dialog>
</template>
