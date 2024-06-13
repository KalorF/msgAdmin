<script lang="ts" setup>
import { ref, onMounted, reactive, computed, watch } from "vue";
import dayjs from "dayjs";
import { FolderOpened, User } from "@element-plus/icons-vue";
import { getAllOrg } from "@/api/organization";
import { useUserStoreHook } from "@/store/modules/user";
import { customerUpte, operateCreate } from "@/api/customer";
import { FLOW_TYPE, RECORD_TYPE } from "@/types";
import { message } from "@/utils/message";
import { progressList } from "@/api/progress";

const userStroe = useUserStoreHook();

const props = defineProps<{ show?: boolean; title: string; info?: any }>();
const emits = defineEmits(["close", "confirm"]);
const select = ref("");

const options = ref([]);

const getData = () => {
  progressList()
    .then(res => {
      if (res.code === 200) {
        options.value = res.data.filter(i => !i.is_deleted) || [];
      } else {
        options.value = [];
      }
    })
    .catch(err => {
      options.value = [];
    });
};

const handleConfrim = () => {
  if (!select.value) {
    message("请选择");
    return;
  }
  customerUpte({
    ...props.info,
    progress_id: select.value,
    progress: options.value.find(i => i.id === select.value)
  })
    .then(res => {
      if (res.code === 200) {
        message("操作成功", { type: "success" });
        emits("close");
        emits("confirm");
      } else {
        message("操作失败", { type: "error" });
      }
    })
    .catch(err => {
      message(err?.response?.data?.message || "操作失败", { type: "error" });
    });
  // let data: any = {
  //   staff_id: userStroe.userInfo.id,
  //   customer_id: props.info.id,
  //   record_tyoe: RECORD_TYPE.XIUGAI_JINDU,
  //   progress_id: select.value
  // };
  // data.flow_type = FLOW_TYPE.RE_RUKU;
  // operateCreate(data)
  //   .then(res => {
  //     if (res.code === 200) {
  //       message("操作成功", { type: "success" });
  //       emits("close");
  //       emits("confirm");
  //     } else {
  //       message("操作失败", { type: "error" });
  //     }
  //   })
  //   .catch(err => {
  //     message(err?.response?.data?.message || "操作失败", { type: "error" });
  //   });
};

watch(
  () => props.show,
  async () => {
    if (props.show) {
      await getData();
      select.value = props.info?.progress?.id || "";
    }
  }
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
    <el-form class="demo-form-inline">
      <el-form-item label="客户进度">
        <el-select v-model="select" placeholder="请选择" style="width: 240px">
          <el-option
            v-for="item in options"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="emits('close')">取消</el-button>
        <el-button type="primary" @click="handleConfrim"> 确认 </el-button>
      </div>
    </template>
  </el-dialog>
</template>
