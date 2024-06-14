<script lang="ts" setup>
import {
  getAllGroupTag,
  getAllTags,
  createGroupTag,
  createTag,
  delTag,
  deleteGroupTag,
  updateGroupTag,
  updateTag
} from "@/api/tag";
import { ref, reactive, onMounted, nextTick, watch, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import dayjs from "dayjs";
import {
  PriceTag,
  Edit,
  Delete,
  Management,
  CollectionTag,
  Collection
} from "@element-plus/icons-vue";
import Axios from "axios";
import { usePermissionActionStroe } from "@/store/modules/permission";

defineOptions({
  name: "taglist"
});

const permission = usePermissionActionStroe();
const actions = computed(() => permission.value);

const showParent = ref(true);

const container = ref<HTMLElement | null>(null);
const listHeight = ref(0);
const formInline = reactive({
  user: "",
  region: "",
  date: ""
});
const tagList = ref([]);
const dialogVisiable = ref(false);
const courseName = ref("");
const courseRadio = ref(0);
const courseShowAdmin = ref(false);
const isEdit = ref(false);
const curId = ref("");
const activeItem = ref();
const list = ref([]);
const allList = ref([]);

const getData = () => {
  return getAllGroupTag().then(res => {
    if (res.code === 200) {
      tagList.value = res.data;
    }
  });
};

const getList = () => {
  const item = tagList.value.find(i => i.id === activeItem.value.id);
  activeItem.value = item;
  list.value = item.tag_list;
  // return getAllTags().then(res => {
  //   if (res.code === 200 && res.data && res.data.length) {
  //     // list.value = res.data;
  //     allList.value = res.data;
  //   } else {
  //     allList.value = [];
  //   }
  //   if (allList.value.length) {
  //     list.value =
  //       allList.value.filter(item => item.group_id === activeItem.value.id) ||
  //       [];
  //   }
  // });
};

const handleCancelCourse = () => {
  setTimeout(() => {
    dialogVisiable.value = false;
    courseName.value = "";
    courseRadio.value = 0;
    isEdit.value = false;
  }, 34);
};

const confirmCreate = () => {
  if (courseName.value === "") {
    ElMessage.info("请输入分类名称");
  } else {
    const func = isEdit.value ? updateGroupTag : createGroupTag;
    const data = isEdit.value
      ? {
          name: courseName.value,
          tag_group_type: courseRadio.value,
          just_show_for_admin: courseShowAdmin.value,
          id: curId.value
        }
      : { name: courseName.value, tag_group_type: courseRadio.value };
    func({ ...data })
      .then(res => {
        if (res.code === 200) {
          ElMessage.success(isEdit.value ? "修改成功" : "创建成功");
          handleCancelCourse();
          getData();
        } else {
          ElMessage.error(isEdit.value ? "修改失败" : "创建失败");
        }
      })
      .catch(err => {
        ElMessage.error(err?.response?.data?.msg);
      });
  }
};

const handleEdit = (item: any) => {
  isEdit.value = true;
  curId.value = item.id;
  courseName.value = item.name;
  courseRadio.value = item.tag_group_type;
  courseShowAdmin.value = item.just_show_for_admin;
  dialogVisiable.value = true;
};

onMounted(() => {
  nextTick(async () => {
    const cntel = container.value;
    if (cntel) {
      const { height } = cntel.getBoundingClientRect();
      listHeight.value = height - 80;
    }
    await getData();
    activeItem.value = tagList.value[0];
    getList();
  });
});

const handleDel = (id: string) => {
  ElMessageBox.confirm("确认删除该标签分类吗?", "提示", {
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      deleteGroupTag(id)
        .then(res => {
          if (res.code === 200) {
            ElMessage.success("删除成功");
            getData();
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

const handleDelCourse = (id: string) => {
  ElMessageBox.confirm("确认删除该标签吗?", "提示", {
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      delTag(id)
        .then(async res => {
          if (res.code === 200) {
            ElMessage.success("删除成功");
            await getData();
            getList();
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

const selGroup = (item: any) => {
  activeItem.value = item;
};

watch(
  tagList,
  () => {
    if (activeItem.value) {
      const item = tagList.value.find(i => i.id === activeItem.value.id);
      activeItem.value = item;
      list.value = item.tag_list;
    }
  },
  { deep: true }
);

watch(
  activeItem,
  () => {
    if (activeItem.value.id) {
      const item = tagList.value.find(i => i.id === activeItem.value.id);
      activeItem.value = item;
      list.value = item.tag_list;
    }
  },
  { deep: true }
);

const uploadDialog = ref(false);
const upload = ref({ name: "", cover_url: "", just_show_for_admin: false });
const uploadImg = ref("");
const imageInfo = ref();
const uploadRef = ref(null);
const uploadEdit = ref(false);
const curCourseInfo = ref(null);
const exectUpload = ref(false);

const handleCloseUpload = () => {
  uploadDialog.value = false;
  setTimeout(() => {
    upload.value.name = "";
    upload.value.cover_url = "";
    uploadImg.value = "";
    uploadEdit.value = false;
    curCourseInfo.value = null;
    exectUpload.value = false;
  }, 34);
};

const handleEditCourse = (item: any) => {
  uploadEdit.value = true;
  curCourseInfo.value = item;
  upload.value.name = item.name;
  upload.value.just_show_for_admin = item.just_show_for_admin;
  upload.value.cover_url = item.cover_url;
  uploadImg.value = item.cover_url;
  uploadDialog.value = true;
};

const handleExceed = (files: any) => {
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
  nextTick(() => {
    uploadRef.value.handleStart(files[0]);
  });
};

const handleAvatarSuccess = (response: any, uploadFile: any) => {
  exectUpload.value = true;
  imageInfo.value = response;
  uploadImg.value = URL.createObjectURL(response.raw!);
};

const handleUpload = async () => {
  if (upload.value.name === "") {
    ElMessage.info("请填写标签名称");
    return;
  }
  const func = uploadEdit.value ? updateTag : createTag;
  const baseData = {
    name: upload.value.name,
    just_show_for_admin: upload.value.just_show_for_admin,
    group_id: activeItem.value.id
  };
  const postData = uploadEdit.value
    ? Object.assign(baseData, { id: curCourseInfo.value.id })
    : baseData;
  func({ ...postData })
    .then(async res => {
      if (res.code === 200) {
        ElMessage.success(uploadEdit.value ? "修改成功" : "创建成功");
        handleCloseUpload();
        await getData();
        getList();
      }
    })
    .catch(err => {
      ElMessage.error(
        err?.response?.data?.msg || (uploadEdit.value ? "修改失败" : "创建失败")
      );
    });
};
</script>

<template>
  <div
    v-if="showParent"
    class="p-4 py-1 pt-3 bg-white rounded-lg flex !h-[calc(100%-30px)]"
    ref="container"
  >
    <div class="w-[300px] h-full border-r border-r-slate-100">
      <el-form :inline="true" :model="formInline" class="demo-form-inline">
        <el-form-item>
          <!-- <el-button type="primary" @click="onSubmit">查询</el-button> -->
          <el-button
            v-if="actions.includes('CreateTagGroup')"
            ype="default"
            @click="dialogVisiable = true"
            >创建标签分类</el-button
          >
        </el-form-item>
      </el-form>
      <div class="overflow-hidden" :style="`height: ${listHeight}px`">
        <div class="h-full overflow-auto">
          <div
            v-for="item in tagList"
            :key="item.id"
            class="max-w-[280px] w-full shadow border border-slate-100 rounded-md overflow-hidden hover:shadow-md hover:bg-[#FFFAF0] relative mb-3"
            style="height: fit-content"
            :class="{ 'bg-[#FFFAF0]': activeItem && activeItem.id === item.id }"
            @click="selGroup(item)"
          >
            <div
              v-if="activeItem && activeItem.id === item.id"
              class="w-1 h-full absolute left-0 bg-[#FF9912]"
            ></div>
            <!-- <el-icon
              class="!absolute top-0.5 left-2"
              size="16"
              :color="'#FF9912'"
              ><Collection
            /></el-icon> -->
            <div class="p-4 pt-4 pr-2">
              <p class="text-sm text-zinc-900 flex items-center">
                <span class="mr-2">{{ item.name }}</span>
                <svg
                  v-if="actions.includes('UpdateTagGroup')"
                  @click.stop="handleEdit(item)"
                  class="ml-auto w-4 h-4 cursor-pointer"
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
                <el-button
                  v-if="actions.includes('DeleteTagGroup')"
                  @click.stop="handleDel(item.id)"
                  type="danger"
                  size="small"
                  text
                  >删除</el-button
                >
              </p>
              <!-- <div class="flex mt-2 items-center"> -->
              <!-- <el-icon
                  ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1024 1024"
                    data-v-ea893728=""
                  >
                    <path
                      fill="currentColor"
                      d="M128 384v512h768V192H768v32a32 32 0 1 1-64 0v-32H320v32a32 32 0 0 1-64 0v-32H128v128h768v64zm192-256h384V96a32 32 0 1 1 64 0v32h160a32 32 0 0 1 32 32v768a32 32 0 0 1-32 32H96a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h160V96a32 32 0 0 1 64 0zm-32 384h64a32 32 0 0 1 0 64h-64a32 32 0 0 1 0-64m0 192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64m192-192h64a32 32 0 0 1 0 64h-64a32 32 0 0 1 0-64m0 192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64m192-192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64m0 192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64"
                    ></path></svg
                ></el-icon>
                <p class="text-xs ml-2 text-zinc-700">
                  {{
                    dayjs(+item.created_at * 1000).format("YYYY-MM-DD HH:mm")
                  }}
                </p> -->

              <!-- </div> -->
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="w-full flex-1 flex-col px-6 h-full">
      <div
        v-if="activeItem"
        class="border-l-[#F4A460] border-l-4 font-semibold pl-2 rounded flex items-center"
      >
        {{ activeItem.name }}
        <el-button
          v-if="actions.includes('CreateCustomerTag')"
          type="primary"
          class="ml-auto"
          @click="uploadDialog = true"
          >创建标签</el-button
        >
      </div>
      <div
        class="flex-1 w-full mt-4 overflow-auto flex flex-wrap flex-shrink-0 gap-5 pb-4 content-start"
        :style="`height: ${listHeight}px`"
      >
        <template v-if="list.length">
          <div
            v-for="item in list"
            :key="item.id"
            class="rounded-lg border border-orange-100 w-[260px] h-[100px] shadow-sm shadow-orange-100 flex flex-col overflow-hidden hover:shadow-orange-200 hover:shadow-md transition-all"
          >
            <div class="flex items-center w-full mt-2 px-3">
              <el-icon size="18" class="!text-amber-500"><PriceTag /></el-icon>
              <div class="flex flex-col ml-auto items-end">
                <div class="flex items-center text-zinc-500 transform scale-90">
                  <el-icon
                    ><svg
                      class="!w-3.5 !h-3.5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 1024 1024"
                      data-v-ea893728=""
                    >
                      <path
                        fill="currentColor"
                        d="M128 384v512h768V192H768v32a32 32 0 1 1-64 0v-32H320v32a32 32 0 0 1-64 0v-32H128v128h768v64zm192-256h384V96a32 32 0 1 1 64 0v32h160a32 32 0 0 1 32 32v768a32 32 0 0 1-32 32H96a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h160V96a32 32 0 0 1 64 0zm-32 384h64a32 32 0 0 1 0 64h-64a32 32 0 0 1 0-64m0 192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64m192-192h64a32 32 0 0 1 0 64h-64a32 32 0 0 1 0-64m0 192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64m192-192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64m0 192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64"
                      ></path></svg
                  ></el-icon>
                  <p class="text-xs ml-1">
                    {{
                      dayjs(+item.updated_at * 1000).format("YYYY-MM-DD HH:mm")
                    }}
                  </p>
                </div>
              </div>
            </div>
            <div class="mt-2 px-3 text-zinc-700">{{ item.name }}</div>
            <div class="mt-2 flex justify-end cursor-pointer pr-3">
              <el-icon
                v-if="actions.includes('UpdateCustomerTag')"
                size="16"
                class="!text-neutral-700 hover:!text-neutral-500"
                @click.stop="handleEditCourse(item)"
                ><Edit
              /></el-icon>
              <el-icon
                v-if="actions.includes('DeleteCustomerTag')"
                size="16"
                class="ml-2 !text-red-400 hover:!text-red-300"
                @click.stop="handleDelCourse(item.id)"
                ><Delete
              /></el-icon>
            </div>
          </div>
        </template>
        <div v-else class="flex w-full justify-center mt-4">
          <el-empty
            :image-size="100"
            description="无标签，可点击创建按钮创建～～"
          />
        </div>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisiable"
      :title="isEdit ? '修改名称' : '创建标签分类'"
      width="400"
      @closed="handleCancelCourse"
      align-center
    >
      <el-form class="demo-form-inline">
        <el-form-item label="分类名称">
          <el-input
            v-model="courseName"
            placeholder="请输入分类名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="标签选项选择" class="flex items-center">
          <el-radio-group v-model="courseRadio">
            <el-radio :value="0" size="large">单选</el-radio>
            <el-radio :value="1" size="large">多选</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否管理员可见" class="flex items-center">
          <el-radio-group v-model="courseShowAdmin">
            <el-radio :value="false" size="large">否</el-radio>
            <el-radio :value="true" size="large">是</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancelCourse">取消</el-button>
          <el-button type="primary" @click="confirmCreate">
            {{ isEdit ? "确认修改" : "确认创建" }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="uploadDialog"
      :title="uploadEdit ? '修改信息' : '创建标签'"
      width="400"
      @closed="handleCloseUpload"
      align-center
    >
      <el-form class="demo-form-inline">
        <el-form-item label="标签名称">
          <el-input
            v-model="upload.name"
            placeholder="请输入标签名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="是否管理员可见" class="flex items-center">
          <el-radio-group v-model="upload.just_show_for_admin">
            <el-radio :value="false" size="large">否</el-radio>
            <el-radio :value="true" size="large">是</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleUpload">{{
            uploadEdit ? "确认修改" : "创建标签"
          }}</el-button>
          <el-button @click="handleCloseUpload">取消</el-button>
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
.avatar-uploader .avatar {
  width: 178px;
  height: 178px;
  display: block;
}
</style>

<style>
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}
</style>
