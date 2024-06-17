<script lang="ts" setup>
import { ref, onMounted, watch, computed, reactive } from "vue";
import {
  deleteQueryView,
  customerView,
  customerViewList
} from "@/api/customer";
import tagPop from "@/components/tagPop/index.vue";
import { Delete, Edit } from "@element-plus/icons-vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { progressList } from "@/api/progress";

const emits = defineEmits(["close", "confirm"]);
const props = defineProps<{ show?: boolean }>();

const viewList = ref([]);
const isEdit = ref(false);
const currentId = ref("");
const dialogShow = ref(false);

const dialogCancel = () => {
  Object.keys(querViewInfo).forEach(key => {
    if (key === "tag") {
      querViewInfo[key] = [];
    } else {
      querViewInfo[key] = "";
    }
  });
  isEdit.value = false;
  dialogShow.value = false;
};

const handleConfirm = () => {
  if (!querViewInfo.name) {
    message("请输入视图名称", { type: "warning" });
    return;
  }
  if (
    !querViewInfo.customerName &&
    !querViewInfo.company &&
    querViewInfo.tag.length === 0 &&
    !querViewInfo.phone &&
    !querViewInfo.progress_id
  ) {
    message("请输入至少一个客户查询条件", { type: "warning" });
    return;
  }
  const func = customerView;
  const data: any = {
    condition: {
      info: {
        company: querViewInfo.company,
        name: querViewInfo.customerName,
        phone: querViewInfo.phone,
        customer_tag_list: querViewInfo.tag.map(item => ({
          customer_id: "0",
          tag_id: item.id,
          tag: item
        })),
        progress: options.value.find(i => i.id === querViewInfo.progress_id),
        progress_id: querViewInfo.progress_id
      }
    },
    name: querViewInfo.name
  };
  if (isEdit.value) {
    data.id = currentId.value;
  }
  func({ ...data })
    .then(res => {
      if (res.code === 200) {
        message(isEdit.value ? "编辑成功" : "添加成功", { type: "success" });
        dialogCancel();
        getList();
      }
    })
    .catch(err => {
      message(
        err?.response?.data?.msg || (isEdit.value ? "编辑失败" : "添加失败"),
        { type: "error" }
      );
    });
};

const querViewInfo = reactive({
  name: "",
  customerName: "",
  company: "",
  phone: "",
  progress_id: "",
  tag: []
});

const tagLabel = computed(() => {
  return querViewInfo.tag.map(item => item.name).join("、");
});

const handleEdit = (item: any) => {
  const info = JSON.parse(item.condition_json);
  currentId.value = item.id;
  querViewInfo.name = item.name;
  querViewInfo.customerName = info.info.name;
  querViewInfo.company = info.info.company;
  querViewInfo.phone = info.info.phone;
  querViewInfo.progress_id = info.info.progress_id;
  querViewInfo.tag = info.info.customer_tag_list.map(item => item.tag);
  isEdit.value = true;
  dialogShow.value = true;
};

const handleDel = (item: any) => {
  ElMessageBox.confirm("确认删除该客户视图吗?", "提示", {
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      deleteQueryView({ id_str_list: [item.id] })
        .then(res => {
          if (res.code === 200) {
            message("删除成功", { type: "success" });
            getList();
          }
        })
        .catch(err => {
          message(err?.response?.data?.msg || "删除失败", { type: "error" });
        });
    })
    .catch(() => {});
};

const options = ref([]);

const getProgressList = () => {
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

const getList = () => {
  customerViewList().then(res => {
    if (res.code === 200) {
      viewList.value = res.data;
    }
  });
};

watch(
  () => props.show,
  val => {
    if (val) {
      getList();
      getProgressList();
    }
  }
);
</script>

<template>
  <div v-if="props.show">
    <el-dialog
      title="客户视图配置"
      v-model="props.show"
      width="600"
      @close="emits('close')"
    >
      <el-button size="small" @click="dialogShow = true">添加视图</el-button>
      <div
        v-if="viewList.length"
        class="flex flex-wrap gap-4 content-start max-h-70 overflow-auto mt-4 pb-6"
      >
        <div
          v-for="item in viewList"
          :key="item.id"
          class="border-l-[#ff9a3c] shadow border-l-4 h-[40px] w-[260px] bg-[#f5f5f5] hover:shadow-lg rounded-md px-4 flex items-center text-sm"
        >
          {{ item.name }}
          <div class="ml-auto flex items-center cursor-pointer">
            <el-icon class="hover:text-stone-500" @click="handleEdit(item)"
              ><Edit
            /></el-icon>
            <el-icon class="ml-2 hover:text-stone-500" @click="handleDel(item)"
              ><Delete
            /></el-icon>
          </div>
        </div>
      </div>
      <div v-else>
        <p class="text-center text-gray-400 mt-2">
          --- 暂无数据, 点击添加按钮创建 ---
        </p>
      </div>
    </el-dialog>
    <el-dialog
      :title="isEdit ? '编辑视图' : '新建视图'"
      v-model="dialogShow"
      width="400"
      @closed="dialogCancel"
    >
      <el-form>
        <el-form-item label="视图名称">
          <el-input placeholder="请输入视图名称" v-model="querViewInfo.name" />
        </el-form-item>
        <el-form-item label="客户标签">
          <tagPop
            :checkedItems="querViewInfo.tag"
            @change="value => (querViewInfo.tag = value)"
          >
            <el-input
              v-model="tagLabel"
              placeholder="请选择标签"
              clearable
              readonly
              style="width: 300px"
            />
          </tagPop>
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input
            placeholder="请输入客户名称"
            v-model="querViewInfo.customerName"
          />
        </el-form-item>
        <el-form-item label="客户公司">
          <el-input
            placeholder="请输入客户公司"
            v-model="querViewInfo.company"
          />
        </el-form-item>
        <el-form-item label="客户手机号">
          <el-input
            placeholder="请输入客户手机号"
            v-model="querViewInfo.phone"
          />
        </el-form-item>
        <el-form-item label="客户进度">
          <el-select
            v-model="querViewInfo.progress_id"
            placeholder="请选择"
            style="width: 240px"
          >
            <el-option
              v-for="item in options"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="flex justify-end mt-4">
        <el-button type="primary" @click="handleConfirm">确定</el-button>
        <el-button @click="dialogCancel">取消</el-button>
      </div>
    </el-dialog>
  </div>
</template>
