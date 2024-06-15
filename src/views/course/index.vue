<script lang="ts" setup>
import {
  getGroupCourseList,
  createGroupCourse,
  postGroupCourseUpdate,
  delGroupCourse,
  createCourse,
  getCourseListByGroup,
  delCourse,
  updateCourse
} from "@/api/course";
import { postOss } from "@/api/oss";
import {
  ref,
  reactive,
  onMounted,
  nextTick,
  watch,
  defineAsyncComponent,
  computed
} from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import dayjs from "dayjs";
import {
  Plus,
  Edit,
  Delete,
  Management,
  CollectionTag,
  Collection
} from "@element-plus/icons-vue";
import Axios from "axios";
import { usePermissionActionStroe } from "@/store/modules/permission";
import topCollapse from "@/layout/components/sidebar/topCollapse.vue";

defineOptions({
  name: "courselist"
});

const permission = usePermissionActionStroe();
const actions = computed(() => permission.value);

const showParent = ref(true);
const Chapter = defineAsyncComponent(() => import("./chapter.vue"));

const container = ref<HTMLElement | null>(null);
const listHeight = ref(0);
const formInline = reactive({
  user: "",
  region: "",
  date: ""
});
const courseList = ref([]);
const dialogVisiable = ref(false);
const courseName = ref("");
const isEdit = ref(false);
const curId = ref("");
const activeItem = ref();
const list = ref([]);

const getData = () => {
  return getGroupCourseList().then(res => {
    if (res.code === 200) {
      courseList.value = res.data.groups;
    }
  });
};

const getList = () => {
  return getCourseListByGroup(activeItem.value.id).then(res => {
    if (res.code === 200 && res.data.length) {
      list.value = res.data;
    } else {
      list.value = [];
    }
  });
};

const handleCancelCourse = () => {
  dialogVisiable.value = false;
  courseName.value = "";
  isEdit.value = false;
};

const confirmCreate = () => {
  if (courseName.value === "") {
    ElMessage.info("请输入课程名称");
  } else {
    const func = isEdit.value ? postGroupCourseUpdate : createGroupCourse;
    const data = isEdit.value
      ? { name: courseName.value, id: curId.value }
      : { name: courseName.value };
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
        ElMessage.error(
          err?.response?.data?.msg || (isEdit.value ? "修改失败" : "创建失败")
        );
      });
  }
};

const handleEdit = (item: any) => {
  isEdit.value = true;
  curId.value = item.id;
  courseName.value = item.name;
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
    activeItem.value = courseList.value[0];
    // getList();
  });
});

const handleDel = (id: string) => {
  ElMessageBox.confirm("确认删除该课程分类吗?", "提示", {
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      delGroupCourse(id)
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
  ElMessageBox.confirm("确认删除该课程吗?", "提示", {
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      delCourse(id)
        .then(res => {
          if (res.code === 200) {
            ElMessage.success("删除成功");
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
  activeItem,
  () => {
    if (activeItem.value.id) {
      getList();
    }
  },
  { deep: true }
);

const uploadDialog = ref(false);
const upload = ref({ name: "", cover_url: "" });
const uploadImg = ref("");
const imageInfo = ref();
const uploadRef = ref(null);
const uploadEdit = ref(false);
const curCourseInfo = ref(null);
const exectUpload = ref(false);

const handleCloseUpload = () => {
  uploadDialog.value = false;
  upload.value.name = "";
  upload.value.cover_url = "";
  uploadImg.value = "";
  uploadEdit.value = false;
  curCourseInfo.value = null;
  exectUpload.value = false;
};

const handleEditCourse = (item: any) => {
  uploadEdit.value = true;
  curCourseInfo.value = item;
  upload.value.name = item.name;
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
    ElMessage.info("请填写课程名称");
    return;
  }
  if (!uploadImg.value) {
    ElMessage.info("请上传封面图");
    return;
  }
  if (exectUpload.value) {
    const ext = imageInfo.value.name.split(".").pop();
    const nameArr = imageInfo.value.name.split(".");
    const res = await postOss({
      content_type: "multipart/form-data",
      method: "put",
      object_key:
        nameArr.slice(0, nameArr.length - 1) + "-" + Date.now() + `.${ext}`
    });
    // console.log(imageInfo.value);
    const postUrl = res.data.url;
    await Axios({
      url: postUrl,
      method: "PUT",
      data: imageInfo.value.raw,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    upload.value.cover_url = postUrl.split("?").shift();
  }
  const func = uploadEdit.value ? updateCourse : createCourse;
  const baseData = {
    cover_url: upload.value.cover_url,
    name: upload.value.name,
    group_id: activeItem.value.id
  };
  const postData = uploadEdit.value
    ? Object.assign(baseData, { id: curCourseInfo.value.id })
    : baseData;
  func({ ...postData })
    .then(res => {
      if (res.code === 200) {
        ElMessage.success(uploadEdit.value ? "修改成功" : "上传成功");
        handleCloseUpload();
        getList();
      }
    })
    .catch(err => {
      ElMessage.error(
        err?.response?.data?.msg || uploadEdit.value ? "修改失败" : "上传失败"
      );
    });
};

const handleViewChapter = (item: any) => {
  curCourseInfo.value = item;
  showParent.value = false;
};

const onSubmit = () => {
  console.log("submit!");
};

const showBar = ref(false);
</script>

<template>
  <div
    v-if="showParent"
    class="p-4 py-1 pt-3 bg-white rounded-lg flex !h-[calc(100%-30px)]"
    ref="container"
  >
    <div class="w-[300px] h-full border-r border-r-slate-100 max-phone:hidden">
      <el-form :inline="true" :model="formInline" class="demo-form-inline">
        <el-form-item>
          <!-- <el-button type="primary" @click="onSubmit">查询</el-button> -->
          <el-button
            v-if="actions.includes('CreateCourse')"
            type="default"
            @click="dialogVisiable = true"
            >创建课程分类</el-button
          >
        </el-form-item>
      </el-form>
      <div class="overflow-hidden" :style="`height: ${listHeight}px`">
        <div class="h-full overflow-auto">
          <div
            v-for="item in courseList"
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
            <div class="p-4 pt-4 pr-2">
              <p class="text-sm text-zinc-900 flex items-center">
                <span class="mr-2">{{ item.name }}</span>
                <svg
                  v-if="actions.includes('UpdateCourse')"
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
                  v-if="actions.includes('DeleteCourse')"
                  @click.stop="handleDel(item.id)"
                  type="danger"
                  size="small"
                  text
                  >删除</el-button
                >
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <el-drawer
      :direction="'ltr'"
      :size="320"
      v-model="showBar"
      :with-header="false"
      :lock-scroll="false"
    >
      <div class="w-[300px] h-full border-r border-r-slate-100">
        <!-- <el-button type="primary" @click="onSubmit">查询</el-button> -->
        <el-button
          v-if="actions.includes('CreateCourse')"
          type="default"
          @click="dialogVisiable = true"
          >创建课程分类</el-button
        >
        <div class="overflow-hidden mt-2" :style="`height: ${listHeight}px`">
          <div class="h-full overflow-auto">
            <div
              v-for="item in courseList"
              :key="item.id"
              class="max-w-[280px] w-full shadow border border-slate-100 rounded-md overflow-hidden hover:shadow-md hover:bg-[#FFFAF0] relative mb-3"
              style="height: fit-content"
              :class="{
                'bg-[#FFFAF0]': activeItem && activeItem.id === item.id
              }"
              @click="selGroup(item)"
            >
              <div
                v-if="activeItem && activeItem.id === item.id"
                class="w-1 h-full absolute left-0 bg-[#FF9912]"
              ></div>
              <div class="p-4 pt-4 pr-2">
                <p class="text-sm text-zinc-900 flex items-center">
                  <span class="mr-2">{{ item.name }}</span>
                  <svg
                    v-if="actions.includes('UpdateCourse')"
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
                    v-if="actions.includes('DeleteCourse')"
                    @click.stop="handleDel(item.id)"
                    type="danger"
                    size="small"
                    text
                    >删除</el-button
                  >
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
    <topCollapse
      class="phone:hidden absolute max-phone:ml-[-25px] top-3.5"
      @toggleClick="showBar = true"
    />
    <div class="w-full flex-1 flex-col px-6 h-full">
      <div
        v-if="activeItem"
        class="border-l-[#F4A460] border-l-4 font-semibold pl-2 rounded flex items-center"
      >
        {{ activeItem.name }}
        <el-button
          v-if="actions.includes('CreateCourse')"
          type="primary"
          class="ml-auto"
          @click="uploadDialog = true"
          >创建课程</el-button
        >
      </div>
      <div
        class="flex-1 w-full mt-4 overflow-auto mb-4 mr-4 flex flex-wrap shrink-0 gap-5 pb-4"
        :style="`height: ${listHeight}px`"
      >
        <template v-if="list.length">
          <div
            @click="handleViewChapter(item)"
            v-for="item in list"
            :key="item.id"
            class="rounded-lg border border-slate-100 w-[260px] h-[200px] shadow-sm flex flex-col relative overflow-hidden hover:border-slate-200 hover:shadow-md transition-all"
          >
            <div
              v-if="actions.includes('UpdateCourse')"
              @click.stop="handleEditCourse(item)"
              class="absolute top-2 left-2 text-[#ffffff] hover:text-neutral-300 rounded flex justify-center items-center w-7 h-7 bg-[#00000080]"
            >
              <el-icon size="20"><Edit /></el-icon>
            </div>
            <div
              v-if="actions.includes('DeleteCourse')"
              @click.stop="handleDelCourse(item.id)"
              class="absolute top-2 right-2 text-[#ffffff] hover:text-neutral-300 rounded flex justify-center items-center w-7 h-7 bg-[#00000080]"
            >
              <el-icon size="18"><Delete /></el-icon>
            </div>
            <img
              class="w-full h-[140px] object-fill"
              :src="
                item.cover_url ||
                'https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png'
              "
              alt=""
            />
            <div class="flex items-center w-full h-[60px] px-3">
              <div class="mr-2 text-sm">{{ item.name }}</div>
              <div class="flex flex-col ml-auto items-end">
                <div class="flex items-center text-zinc-600">
                  <el-icon
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
                  <p class="text-xs ml-2">
                    {{
                      dayjs(+item.updated_at * 1000).format("YYYY-MM-DD HH:mm")
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="flex w-full justify-center mt-4">
          <el-empty
            :image-size="100"
            description="无课程，可点击创建按钮创建～～"
          />
        </div>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisiable"
      :title="isEdit ? '修改名称' : '创建课程分类'"
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
      :title="uploadEdit ? '修改信息' : '上传课程'"
      width="400"
      @closed="handleCloseUpload"
      align-center
    >
      <el-form class="demo-form-inline">
        <el-form-item label="课程名称">
          <el-input
            v-model="upload.name"
            placeholder="请输入课程名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="封面图">
          <el-upload
            v-if="uploadDialog"
            ref="uploadRef"
            class="avatar-uploader"
            action="#"
            :show-file-list="false"
            :on-change="handleAvatarSuccess"
            :on-exceed="handleExceed"
            :auto-upload="false"
            :limit="1"
            accept="image/png, image/jpeg, image/jpg"
          >
            <img v-if="uploadImg" :src="uploadImg" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleUpload">{{
            uploadEdit ? "确认修改" : "创建课程"
          }}</el-button>
          <el-button @click="handleCloseUpload">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
  <Chapter
    @back="showParent = true"
    :group-id="activeItem && activeItem.id"
    :course-id="curCourseInfo && curCourseInfo.id"
    v-else
  />
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
