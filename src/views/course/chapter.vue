<script lang="ts" setup>
import {
  getChapterList,
  createChapter,
  updateChapter,
  delChapter
} from "@/api/chapter";
import { postOss } from "@/api/oss";
import {
  ArrowLeft,
  Delete,
  Edit,
  Document,
  VideoPlay
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ref, nextTick, onMounted } from "vue";
import Axios from "axios";
import PDF from "pdf-vue3";
// import VuePdfApp from "vue3-pdf-app";
// import "vue3-pdf-app/dist/icons/main.css";
import dayjs from "dayjs";

const emits = defineEmits(["back"]);

const props = defineProps<{
  groupId?: string;
  courseId?: string | null;
}>();

const list = ref([]);
const container = ref<HTMLElement | null>(null);
const listHeight = ref(0);

const uploadDialog = ref(false);
const upload = ref({ name: "", cover_url: "", content: "" });
const uploadImg = ref("");
const imageInfo = ref();
const uploadRef = ref(null);
const uploadEdit = ref(false);
const curCourseInfo = ref(null);
const exectUpload = ref(false);
const fileList = ref([]);

const getList = () => {
  if (props.courseId) {
    getChapterList(props.courseId)
      .then(res => {
        if (res.code === 200) {
          if (res.data.length) {
            list.value = res.data;
          } else {
            list.value = [];
          }
        } else {
          list.value = [];
        }
      })
      .catch(err => {
        list.value = [];
      });
  }
};

const handleCloseUpload = () => {
  uploadDialog.value = false;
  upload.value.name = "";
  upload.value.cover_url = "";
  uploadImg.value = "";
  uploadEdit.value = false;
  curCourseInfo.value = null;
  exectUpload.value = false;
  upload.value.content = "";
  fileList.value = [];
};

const handleDel = (id: string) => {
  ElMessageBox.confirm("确认删除该章节吗?", "提示", {
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      delChapter(id)
        .then(res => {
          if (res.code === 200) {
            ElMessage.success("删除成功");
            getList();
          } else {
            ElMessage.error("删除失败");
          }
        })
        .catch(err => {
          ElMessage.error(err?.response?.data?.message || "删除失败");
        });
    })
    .catch(() => {});
};

const handleEdit = (item: any) => {
  if (item.image_url) {
    upload.value.cover_url = item.image_url;
  } else if (item.video_url) {
    upload.value.cover_url = item.video_url;
  } else if (item.pdf_url) {
    upload.value.cover_url = item.pdf_url;
  }
  uploadEdit.value = true;
  curCourseInfo.value = item;
  upload.value.name = item.title;
  uploadImg.value = upload.value.cover_url;
  upload.value.content = item.content;
  fileList.value = [
    {
      name: decodeURIComponent(upload.value.cover_url.split("/").pop()),
      url: upload.value.cover_url
    }
  ];
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
    ElMessage.info("请上传文件");
    return;
  }
  if (!upload.value.content) {
    ElMessage.info("请填写章节介绍");
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
  const ext = upload.value.cover_url.split(".").pop();
  let mapUrl = { image_url: "", pdf_url: "", video_url: "" };
  if (ext.indexOf("pdf") > -1) {
    mapUrl.pdf_url = upload.value.cover_url;
  } else if (ext.indexOf("mp4") > -1) {
    mapUrl.video_url = upload.value.cover_url;
  } else {
    mapUrl.image_url = upload.value.cover_url;
  }
  const func = uploadEdit.value ? updateChapter : createChapter;
  const baseData = {
    course_id: props.courseId,
    title: upload.value.name,
    content: upload.value.content,
    parent_id: props.groupId,
    ...mapUrl
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
        err?.response?.data?.message ||
          (uploadEdit.value ? "修改失败" : "上传失败")
      );
    });
};

const contentDialog = ref(false);
const contentItem = ref();

const viewDetail = (item: any) => {
  contentItem.value = item;
  contentDialog.value = true;
};

const handleContentClose = () => {
  contentItem.value = null;
  contentDialog.value = false;
};

onMounted(() => {
  nextTick(async () => {
    const cntel = container.value;
    if (cntel) {
      const { height } = cntel.getBoundingClientRect();
      listHeight.value = height - 80;
    }
    await getList();
  });
});
</script>

<template>
  <div
    ref="container"
    class="p-4 py-1 pt-3 bg-white rounded-lg w-full !h-[calc(100%-30px)] flex flex-col"
  >
    <div class="flex w-full justify-between">
      <el-button round :icon="ArrowLeft" @click="emits('back')">返回</el-button>
      <el-button round type="primary" class="mr-4" @click="uploadDialog = true"
        >创建章节</el-button
      >
    </div>
    <div
      v-if="list.length"
      class="w-full mt-4 overflow-auto flex flex-wrap shrink-0 pb-4"
      :style="`height: ${listHeight}px`"
    >
      <div
        v-for="item in list"
        :key="item.id"
        @click="viewDetail(item)"
        class="rounded-lg border mb-4 mr-4 border-slate-100 w-[260px] h-[210px] shadow-sm flex flex-col relative overflow-hidden hover:border-slate-200 hover:shadow-md transition-all"
      >
        <div
          @click.stop="handleEdit(item)"
          class="absolute top-2 left-2 text-[#ffffff] hover:text-neutral-300 rounded flex justify-center items-center w-7 h-7 bg-[#00000080] z-10"
        >
          <el-icon size="20"><Edit /></el-icon>
        </div>
        <div
          @click.stop="handleDel(item.id)"
          class="absolute top-2 right-2 text-[#ffffff] hover:text-neutral-300 rounded flex justify-center items-center w-7 h-7 bg-[#00000080] z-10"
        >
          <el-icon size="18"><Delete /></el-icon>
        </div>
        <img
          v-if="item.image_url"
          class="w-full h-[140px] object-fill"
          :src="item.image_url"
          alt=""
        />
        <div
          v-else-if="item.video_url"
          class="w-full h-[140px] relative overflow-hidden"
        >
          <div
            class="text-[#ffffff] hover:text-neutral-300 rounded-full flex justify-center items-center w-8 h-8 bg-[#00000066] z-10 absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%]"
          >
            <el-icon size="32"><VideoPlay /></el-icon>
          </div>
          <video
            muted
            preload="true"
            class="object-content w-full h-full"
            :src="item.video_url"
          ></video>
        </div>
        <div
          v-if="item.pdf_url"
          class="w-full h-[140px] relative bg-[#FFFAF0] border-b text-neutral-400 border-neutral-100 flex items-center justify-center flex-col"
        >
          <el-icon size="40"><Document /></el-icon>
          PDF
        </div>
        <div class="flex flex-col w-full h-[70px] px-3 relative justify-center">
          <div class="mr-2 text-sm text-ellipsis">{{ item.title }}</div>
          <p class="text-xs text-zinc-400 text-ellipsis line-clamp-2">
            {{ item.content }}
          </p>
          <!-- <div
            class="flex items-center text-zinc-600 absolute top-2 right-1 transform scale-90"
          >
            <el-icon
              ><svg
                class="w-4 h-4"
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
              {{ dayjs(+134 * 1000).format("YYYY-MM-DD HH:mm") }}
            </p>
          </div> -->
        </div>
      </div>
    </div>
    <div v-else class="flex w-full justify-center mt-4">
      <el-empty
        :image-size="100"
        description="无章节，可点击创建按钮创建～～"
      />
    </div>

    <el-dialog
      v-model="uploadDialog"
      :title="uploadEdit ? '修改信息' : '上传章节'"
      width="400"
      @closed="handleCloseUpload"
      align-center
    >
      <el-form class="demo-form-inline">
        <el-form-item label="章节名称">
          <el-input
            v-model="upload.name"
            placeholder="请输入章节名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="章节介绍">
          <el-input
            v-model="upload.content"
            type="textarea"
            placeholder="请输入章节介绍"
            clearable
          />
        </el-form-item>
        <el-form-item label="上传文件">
          <el-upload
            v-if="uploadDialog"
            v-model:file-list="fileList"
            ref="uploadRef"
            class="upload-demo"
            action="#"
            :on-change="handleAvatarSuccess"
            :on-exceed="handleExceed"
            :auto-upload="false"
            :limit="1"
            accept="image/png, image/jpeg, image/jpg, video/mp4, application/pdf"
          >
            <template #trigger>
              <el-button type="primary">选择文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                请上传 .mp4, .pdf、.png、.jpeg, .jpg文件
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleUpload">{{
            uploadEdit ? "确认修改" : "创建章节"
          }}</el-button>
          <el-button @click="handleCloseUpload">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="contentDialog"
      title="章节内容"
      fullscreen
      @closed="handleContentClose"
      align-center
    >
      <div class="flex w-full flex-col items-center" v-if="contentItem">
        <p class="text-2xl font-semibold">{{ contentItem.title }}</p>
        <p class="mt-2">{{ contentItem.content }}</p>
        <div class="mt-5">
          <img v-if="contentItem.image_url" :src="contentItem.image_url" />
          <video
            v-else-if="contentItem.video_url"
            controls
            playinline
            :src="contentItem.video_url"
          ></video>
          <div
            class="w-full h-[550px] border border-slate-100 rounded-sm"
            v-if="contentItem.pdf_url"
          >
            <PDF :src="contentItem.pdf_url" />
            <!-- <VuePdfApp class="w-full h-full" :pdf="contentItem.pdf_url" /> -->
            <!-- <iframe :src="contentItem.pdf_url" class="w-full h-full" /> -->
            <!-- <pdf :src="contentItem.pdf_url" /> -->
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss">
.el-upload-list__item-name {
  width: 300px !important;
  .el-upload-list__item-file-name {
    width: 250px !important;
    text-align: left !important;
  }
}
</style>
