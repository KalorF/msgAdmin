<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import { upsertProgress, progressList } from "@/api/progress";
import { message } from "@/utils/message";
import { Delete, Edit } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
import { usePermissionActionStroe } from "@/store/modules/permission";

const permission = usePermissionActionStroe();
const actions = computed(() => permission.value);

const visiable = ref(false);
const progressVal = ref("");
const list = ref([]);
const isEdit = ref(false);
const currentItem = ref();

const handleEdit = (item: any) => {
  progressVal.value = item.name;
  currentItem.value = item;
  isEdit.value = true;
  visiable.value = true;
};

const handleCancel = () => {
  progressVal.value = "";
  currentItem.value = "";
  visiable.value = false;
};

const handleConfrim = () => {
  if (progressVal.value === "") {
    message("请输入进度名称");
    return;
  }
  const data = isEdit.value
    ? { ...currentItem.value, name: progressVal.value }
    : { name: progressVal.value };
  upsertProgress(data)
    .then(res => {
      if (res.code === 200) {
        message("设置成功", { type: "success" });
        getList();
        handleCancel();
      } else {
        message("设置失败", { type: "error" });
      }
    })
    .catch(err => {
      message(err?.response?.data?.message || "设置失败", { type: "error" });
    });
};

const getList = () => {
  progressList()
    .then(res => {
      if (res.code === 200) {
        const data = res.data || [];
        list.value = data.filter(item => !item.is_deleted);
      } else {
        list.value = [];
      }
    })
    .catch(() => {
      list.value = [];
    });
};

const handleDel = (item: any) => {
  ElMessageBox.confirm("确认删除该进度吗?", "提示", {
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      upsertProgress({ ...item, is_deleted: true })
        .then(async res => {
          if (res.code === 200) {
            message("删除成功", { type: "success" });
            getList();
          } else {
            message("删除失败", { type: "error" });
          }
        })
        .catch(err => {
          message(err?.response?.data?.message || "删除失败", {
            type: "error"
          });
        });
    })
    .catch(() => {});
};

onMounted(() => {
  getList();
});
</script>

<template>
  <div class="p-4 py-1 pt-3 bg-white rounded-lg !h-[calc(100%-30px)]">
    <div class="font-semibold pl-2 rounded flex items-center">
      进度设置
      <el-button
        v-if="actions.includes('CreateProgress')"
        class="ml-auto"
        @click="visiable = true"
        >添加进度设置</el-button
      >
    </div>

    <div class="flex flex-wrap gap-4 content-start overflow-auto mt-4 pb-6">
      <div
        v-for="item in list"
        :key="item.id"
        class="border-l-[#ff9a3c] shadow border-l-4 h-[40px] w-[260px] bg-[#f5f5f5] hover:shadow-lg rounded-md px-4 flex items-center text-sm"
      >
        {{ item.name }}
        <div class="ml-auto flex items-center cursor-pointer">
          <el-icon
            v-if="actions.includes('UpdateProgress')"
            class="hover:text-stone-500"
            @click="handleEdit(item)"
            ><Edit
          /></el-icon>
          <el-icon
            v-if="actions.includes('DeleteProgress')"
            class="ml-2 hover:text-stone-500"
            @click="handleDel(item)"
            ><Delete
          /></el-icon>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="visiable"
      :title="isEdit ? '修改进度' : '创建进度'"
      width="400"
      @closed="handleCancel"
      align-center
    >
      <el-form class="demo-form-inline">
        <el-form-item label="进度名称">
          <el-input
            v-model="progressVal"
            placeholder="请输入进度名称"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleConfrim">确认</el-button>
          <el-button @click="handleCancel">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
