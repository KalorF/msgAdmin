<script lang="ts" setup>
import {
  createCustomer,
  customerUpdate,
  customerList,
  deleteCustomer,
  customerRecover,
  getCustomerByTagId,
  customerSelect,
  createCustomerRecoed,
  recordUpdate,
  recordListByCustomer,
  recordDel,
  recordListByCustomerAndStaff,
  visitCreate,
  visitListByCustomer,
  visitUpdate,
  delVisit,
  customerQuery,
  operateCreate,
  customerViewList,
  customerView
} from "@/api/customer";
import { getAllTags, getAllGroupTag } from "@/api/tag";
import {
  checkAllocByStaff,
  allocStaffREason,
  allocrecord,
  lastAllocRecord,
  allocConfigAlloc,
  allocConfigCheck
} from "@/api/alloc";
import { createCall, getCallListByCustomer } from "@/api/call";
import { message } from "@/utils/message";
import { ref, reactive } from "vue";
import {
  Avatar,
  Cellphone,
  UserFilled,
  Memo,
  Share,
  Sort,
  More,
  Edit
} from "@element-plus/icons-vue";
import { onMounted, nextTick, onUnmounted, computed } from "vue";
import { ElMessageBox } from "element-plus";
import dayjs from "dayjs";
import { useUserStoreHook } from "@/store/modules/user";
import Recorder from "recorder-core";
import "recorder-core/src/engine/mp3";
import "recorder-core/src/engine/mp3-engine";
import { localForage } from "@/utils/localforage";
import { FLOW_TYPE, RECORD_TYPE } from "@/types";
import tagPop from "@/components/tagPop/index.vue";
import recrodDialog from "@/components/recrodDialog/index.vue";
import orgDialog from "@/components/orgDialog/index.vue";
import progressDialog from "@/components/progress/index.vue";

defineOptions({
  name: "customerlist2"
});

const userStore = useUserStoreHook();

const formInline = reactive({
  user: "",
  company: "",
  phone: "",
  date: ""
});

let recorderContext: any = null;

const initCorder = () => {
  recorderContext = Recorder({
    type: "mp3", //录音格式，可以换成wav等其他格式
    sampleRate: 16000, //录音的采样率，越大细节越丰富越细腻
    bitRate: 16 //录音的比特率，越大音质越好
  });
};

const getAllocData = () => {
  const staff_id = userStore.userInfo.id;
  lastAllocRecord(staff_id).then(res => {
    if (res.code === 200) {
      console.log(res.data);
    }
  });
  allocrecord({ staff_id, limit: 10, offset: 0 }).then(res => {
    if (res.code === 0) {
      console.log(res.data);
    }
  });
};

const onSubmit = async () => {
  currentPage.value = 1;
  pageSize.value = 10;
  if (cutomerType.value) {
    getViewData();
  } else {
    getData();
  }
  // getData();
  // if (valueGroup.value.length) {
  //   const res = await getCustomerByTagId({ tag_id_list: valueGroup.value });
  //   tableData.value = res.data || [];
  // } else {
  //   pageSize.value = 10;
  //   currentPage.value = 1;
  //   const res = await customerSelect({
  //     customer_condition: {
  //       is_deleted: true,
  //       name: formInline.user,
  //       company: formInline.company,
  //       phone: formInline.phone,
  //       created_at: +formInline.date / 1000 + ""
  //     },
  //     limit: pageSize.value,
  //     offset: currentPage.value - 1
  //   });
  //   if (res.code === 200 && res.data) {
  //     tableData.value = res.data.customers || [];
  //     total.value = res.data.total || 0;
  //   } else {
  //     total.value = 0;
  //     tableData.value = [];
  //   }
  // }
};

const onReset = () => {
  Object.keys(formInline).forEach(key => {
    formInline[key] = "";
  });
  checkedItems.value = [];
  valueGroup.value = [];
  currentPage.value = 1;
  pageSize.value = 10;
  cutomerType.value = "";
  getData();
};

const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const checkedItems = ref([]);

const checkedItemsValue = computed(() => {
  return checkedItems.value.map(item => item.name).join("、") || [];
});

const tableData = ref([]);
const currentInfo = ref();
const currentCustomerInfo = ref();

const getRecord = () => {
  return recordListByCustomerAndStaff({
    customer_id: currentCustomerInfo.value.id,
    staff_id: userStore.userInfo.id,
    limit: 5,
    offset: currentPage2.value - 1
  })
    .then(res => {
      if (res.code === 200) {
        dialogTableData.value = res.data.records || [];
        total2.value = res.data.count || 0;
      }
    })
    .catch(() => {
      dialogTableData.value = [];
      total2.value = 0;
    });
};

const getVisit = () => {
  return visitListByCustomer({
    customer_id: currentCustomerInfo.value.id,
    limit: 5,
    offset: currentPage2.value - 1
  })
    .then(res => {
      if (res.code === 200) {
        dialogTableData2.value = res.data.records || [];
        total3.value = res.data.total || 0;
      }
    })
    .catch(() => {
      dialogTableData2.value = [];
      total3.value = 0;
    });
};

const getData = () => {
  customerQuery({
    allocation: {
      staff_id: userStore.userInfo.id
    },
    condition: {
      info: {
        is_deleted: false,
        name: formInline.user,
        company: formInline.company,
        phone: formInline.phone,
        updated_at: formInline.date ? (formInline.date as any) / 1000 : 0,
        customer_tag_list: checkedItems.value.map(i => ({ tag_id: i.id }))
      }
    },
    page: {
      limit: pageSize.value,
      offset: currentPage.value - 1
    }
  })
    .then(res => {
      if (res.code === 200 && res.data) {
        tableData.value = res.data.customers || [];
        if (tableData.value.length) {
          tableData.value = tableData.value.filter(item => !item.is_deleted);
        }
        total.value = res.data.count || 0;
      } else {
        total.value = 0;
        tableData.value = [];
      }
    })
    .catch(() => {
      total.value = 0;
      tableData.value = [];
    });
};

const valueGroup = ref([]);

const options = ref([]);

const getTagOptions = async () => {
  const { data: groups = [] } = await getAllGroupTag();
  const { data: tags = [] } = await getAllTags();
  const temp = {};
  if (groups.length) {
    groups.forEach(item => {
      temp[item.id] = { ...item, children: [] };
    });
    if (tags.length) {
      tags.forEach(tag => {
        const group_id = tag.group_id;
        temp[group_id].children.push(tag);
      });
    }
  }
  if (Object.keys(temp).length) {
    options.value =
      Object.values(temp).filter((item: any) => item.children.length > 0) || [];
  } else {
    options.value = [];
  }
};

const dialogVisible = ref(false);
const dialogData = ref({
  content: {
    label: "回访记录：",
    value: "",
    type: "textarea"
  },
  follow_at: {
    label: "跟进时间：",
    value: "",
    type: "datetime"
  }
});

const dialogVisible2 = ref(false);
const dialogData2 = ref({
  visit_content: {
    label: "访客记录：",
    value: "",
    type: "textarea"
  },
  visit_at: {
    label: "来访时间：",
    value: "",
    type: "datetime"
  }
});

const dialogTableVisible = ref(false);
const dialogTableData = ref([]);
const currentPage2 = ref(1);
const total2 = ref(0);

const dialogTableVisible2 = ref(false);
const dialogTableData2 = ref([]);
const currentPage3 = ref(1);
const total3 = ref(0);

const isEdit = ref(false);

const handleCancelCrete = () => {
  Object.values(dialogData.value).forEach(item => {
    item.value = "";
  });
  isEdit.value = false;
  // currentInfo.value = null;
  dialogVisible.value = false;
};

const handleCancelCrete2 = () => {
  Object.values(dialogData2.value).forEach(item => {
    item.value = "";
  });
  isEdit.value = false;
  // currentInfo.value = null;
  dialogVisible2.value = false;
};

const handleEdit = (item: any) => {
  Object.keys(dialogData.value).map(key => {
    dialogData.value[key].value = item[key];
    if (key === "follow_at") {
      (dialogData.value[key].value as any) = item[key] * 1000;
    }
  });
  isEdit.value = true;
  currentInfo.value = item;
  dialogVisible.value = true;
};

const handleEdit2 = (item: any) => {
  Object.keys(dialogData2.value).map(key => {
    dialogData2.value[key].value = item[key];
    if (key === "visit_at") {
      (dialogData2.value[key].value as any) = item[key] * 1000;
    }
  });
  isEdit.value = true;
  currentInfo.value = item;
  dialogVisible2.value = true;
};

const handleConfirm = () => {
  let flag = false;
  Object.values(dialogData.value).some(item => {
    if (!item.value) {
      message(`请输入${item.label}`, { type: "info" });
      flag = true;
      return true;
    }
  });
  if (!flag) {
    const data: any = {};
    Object.keys(dialogData.value).forEach(key => {
      if (key === "follow_at") {
        data[key] = (dialogData.value[key].value as any) / 1000;
      } else {
        data[key] = dialogData.value[key].value;
      }
    });
    if (isEdit.value) {
      data.id = currentInfo.value.id;
    }
    data.customer_id = currentCustomerInfo.value.id;
    data.staff_id = userStore.userInfo.id;
    const func = isEdit.value ? recordUpdate : createCustomerRecoed;
    func({ ...data })
      .then(res => {
        if (res.code === 200) {
          message(isEdit.value ? "编辑成功" : "添加成功", { type: "success" });
          getRecord();
          handleCancelCrete();
        } else {
          message(isEdit.value ? "编辑失败" : "添加失败", { type: "error" });
        }
      })
      .catch(err => {
        if (err?.response?.data?.msg) {
          message(err?.response?.data?.msg, { type: "error" });
        } else {
          message(isEdit.value ? "编辑失败" : "添加失败", { type: "error" });
        }
      });
  }

  handleCancelCrete();
};

const handleConfirm2 = () => {
  let flag = false;
  Object.values(dialogData2.value).some(item => {
    if (!item.value) {
      message(`请输入${item.label}`, { type: "info" });
      flag = true;
      return true;
    }
  });
  if (!flag) {
    const data: any = {};
    Object.keys(dialogData2.value).forEach(key => {
      if (key === "visit_at") {
        data[key] = (dialogData2.value[key].value as any) / 1000;
        data.to_visit_at = (dialogData2.value[key].value as any) / 1000;
      } else {
        data[key] = dialogData2.value[key].value;
      }
    });
    if (isEdit.value) {
      data.id = currentInfo.value.id;
    }
    data.customer_id = currentCustomerInfo.value.id;
    data.reception_staff_id = userStore.userInfo.id;
    const func = isEdit.value ? visitUpdate : visitCreate;
    func({ ...data })
      .then(res => {
        if (res.code === 200) {
          message(isEdit.value ? "编辑成功" : "添加成功", { type: "success" });
          getVisit();
          handleCancelCrete2();
        } else {
          message(isEdit.value ? "编辑失败" : "添加失败", { type: "error" });
        }
      })
      .catch(err => {
        if (err?.response?.data?.msg) {
          message(err?.response?.data?.msg, { type: "error" });
        } else {
          message(isEdit.value ? "编辑失败" : "添加失败", { type: "error" });
        }
      });
  }

  handleCancelCrete2();
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  getData();
};
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  getData();
};

const handleDel = (item: any) => {
  ElMessageBox.confirm("确认删除该记录吗?", "提示", {
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      recordDel(item.id).then(res => {
        if (res.code === 200) {
          message("删除成功", { type: "success" });
          getRecord();
        } else {
          message("删除失败", { type: "error" });
        }
      });
    })
    .catch(() => {});
};

const handleDel2 = (item: any) => {
  ElMessageBox.confirm("确认删除该记录吗?", "提示", {
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      delVisit(item.id).then(res => {
        if (res.code === 200) {
          message("删除成功", { type: "success" });
          getVisit();
        } else {
          message("删除失败", { type: "error" });
        }
      });
    })
    .catch(() => {});
};

const handleEditVisit = (item: any) => {
  currentCustomerInfo.value = item;
  currentPage2.value = 1;
  total2.value = 0;
  getRecord();
  dialogTableVisible.value = true;
};

const handleEditVisit2 = (item: any) => {
  currentCustomerInfo.value = item;
  currentPage3.value = 1;
  total3.value = 0;
  getVisit();
  dialogTableVisible2.value = true;
};

const startTime = ref(0);
const callTime = ref(0);
const startCall = ref(false);

const callback = () => {
  operateCreate({
    call_duration: callTime.value,
    call_at: Math.round(startTime.value / 1000),
    call_audio_url: "",
    content: "",
    customer_id: currentCustomerInfo.value.id,
    staff_id: userStore.userInfo.id,
    flow_type: FLOW_TYPE.RUKU,
    record_type: RECORD_TYPE.CALL_PHONE,
    progress_id: currentCustomerInfo.value.progress_id
  });
  // createCall({
  //   call_long: callTime.value,
  //   call_at: Math.round(startTime.value / 1000),
  //   call_content: "1",
  //   staff_id: userStore.userInfo.id,
  //   customer_id: currentCustomerInfo.value.id
  // });
};

const audioSrc = ref("");
let tempBlob;

const getCorder = () => {
  recorderContext.stop(
    async (blob, duration) => {
      const localUrl = (window.URL || webkitURL).createObjectURL(blob);
      audioSrc.value = localUrl;
      tempBlob = blob;
      await localForage().setItem("audiobool", tempBlob);
      recorderContext.close();
    },
    err => {
      alert(err);
      console.error("结束录音出错：" + err);
      recorderContext.close(); //关闭录音，释放录音资源，当然可以不释放，后面可以连续调用start
    }
  );
};

const checkAndroid = () => {
  const u = navigator.userAgent;
  const isAndroid = u.indexOf("Android") > -1 || u.indexOf("Adr") > -1;
  return isAndroid;
};

window.addEventListener("beforeunload", async () => {
  if (tempBlob) {
    await localForage().setItem("audiobool", tempBlob);
  }
});

const visiableChange = () => {
  if (document.visibilityState === "hidden" && startCall.value) {
    recorderContext.start();
    startTime.value = Date.now();
  }
  if (document.visibilityState === "visible" && startTime.value) {
    callTime.value = Date.now() - startTime.value;
    // 判断是否是androids
    if (checkAndroid()) {
      getCorder();
    }
    // alert("通话完成");
    callback();
    startTime.value = 0;
    startCall.value = false;
  }
};

let isOpen = false;

const handleCall = (item: any) => {
  // if (window.innerWidth > 766) {
  //   message("请在移动端浏览器打开进行电话拨打");
  //   return;
  // }
  if (checkAndroid()) {
    recorderContext.open(
      () => {
        recorderContext.start();
        isOpen = true;
      },
      () => {
        isOpen = false;
        console.log("权限未打开");
      }
    );
  }

  startCall.value = true;
  // if (isOpen) {
  // startCall.value = true;
  currentCustomerInfo.value = item;
  const a = document.createElement("a");
  a.href = `tel:${item.phone}`;
  a.click();
  // }
};

const callialogVisiable = ref(false);
const callTableData = ref([]);
const callTtoal = ref(0);
const callCurrentPage = ref(1);

const getCallData = () => {
  return getCallListByCustomer({
    customer_id: currentCustomerInfo.value.id,
    limit: 5,
    offset: callCurrentPage.value - 1
  })
    .then(res => {
      if (res.code === 200) {
        callTableData.value = res.data.records || [];
        callTtoal.value = res.data.total;
      } else {
        callTableData.value = [];
        callTtoal.value = 0;
      }
    })
    .catch(() => {
      callTableData.value = [];
      callTtoal.value = 0;
    });
};

const viewCall = async (item: any) => {
  currentCustomerInfo.value = item;
  await getCallData();
  callialogVisiable.value = true;
};

const msToTime = duration => {
  // const milliseconds = parseInt((duration % 1000) / 100);
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  let text = "";
  if (hours) {
    text += hours + " 小时";
  }
  if (minutes) {
    text += minutes + " 分";
  }
  if (seconds) {
    text += seconds + " 秒";
  }

  return text;
};

const handleCurrentChangeCall = (val: number) => {
  callCurrentPage.value = val;
  getCallData();
};

const handleCurrentChange2 = (value: number) => {
  currentPage2.value = value;
  getRecord();
};

const handleCurrentChange3 = (value: number) => {
  currentPage3.value = value;
  getVisit();
};

const handleGetCustomer = async () => {
  const staff_id = userStore.userInfo.id;
  const check = await allocConfigCheck({ staff_id });
  if (check.data.can_alloc) {
    const res = await allocConfigAlloc({ staff_id });
    if (res.code === 200) {
      getData();
    }
  }
};

const recordDialog = ref(false);
const orgDialogShow = ref(false);
const progressDialogShow = ref(false);
const orgTitle = ref("");

const handleProgress = (item: any) => {
  currentCustomerInfo.value = item;
  progressDialogShow.value = true;
};

const handleProgressConfrim = () => {
  getData();
};

const handleTran = (item: any) => {
  currentCustomerInfo.value = item;
  orgDialogShow.value = true;
  orgTitle.value = "转让客户";
};
const handleShare = (item: any) => {
  currentCustomerInfo.value = item;
  orgDialogShow.value = true;
  orgTitle.value = "分享客户";
};

const handleFlowDetail = (item: any) => {
  currentCustomerInfo.value = item;
  recordDialog.value = true;
};

const cutomerType = ref("");
const customerOption = ref([]);

const getViewList = () => {
  customerViewList().then(res => {
    customerOption.value = res.data || [];
  });
};

const getViewData = () => {
  const data = customerOption.value.find(item => item.id === cutomerType.value);
  customerView(data).then(res => {
    console.log(res);
  });
};

onUnmounted(() => {
  document.removeEventListener("visibilitychange", visiableChange);
});

onMounted(async () => {
  initCorder();
  getData();
  getViewList();
  // getTagOptions();
  const url = await (localForage().getItem("audiobool") as any);
  if (url) {
    audioSrc.value = (window.URL || webkitURL).createObjectURL(url);
  }
  document.addEventListener("visibilitychange", visiableChange);
});
</script>

<template>
  <div class="p-4 bg-white rounded-lg flex flex-col h-[calc(100%-30px)]">
    <!-- <audio controls :src="audioSrc"></audio> -->
    <!-- <input type="file" accept="audio/*" capture="microphone" /> -->
    <el-button type="primary" round class="w-40 mb-4" @click="handleGetCustomer"
      >领取客户</el-button
    >
    <el-form :inline="true" :model="formInline" class="demo-form-inline">
      <el-form-item label="客户名称">
        <el-input
          v-model="formInline.user"
          placeholder="请输入客户名称"
          clearable
        />
      </el-form-item>
      <el-form-item label="公司">
        <el-input
          v-model="formInline.company"
          placeholder="请输入公司名称"
          clearable
        />
      </el-form-item>
      <el-form-item label="手机">
        <el-input
          v-model="formInline.phone"
          placeholder="请输入手机"
          clearable
        />
      </el-form-item>
      <el-form-item label="最近更新时间">
        <el-date-picker
          v-model="formInline.date"
          type="date"
          placeholder="请选择"
          value-format="x"
          clearable
        />
      </el-form-item>
      <el-form-item label="标签">
        <tagPop
          :checkedItems="checkedItems"
          @change="value => (checkedItems = value)"
        >
          <el-input
            v-model="checkedItemsValue"
            placeholder="请选择标签"
            clearable
            readonly
          />
        </tagPop>
      </el-form-item>
      <el-form-item label="客户类型">
        <el-select
          v-model="cutomerType"
          placeholder="请选择"
          style="width: 240px"
        >
          <el-option
            v-for="item in customerOption"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">查询</el-button>
        <el-button type="default" @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>
    <el-table
      :data="tableData"
      header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
      style="width: 100%"
      class="flex-1"
    >
      <el-table-column type="expand">
        <template #default="props">
          <div
            class="mx-16 text-zinc-500 text-sm flex flex-wrap content-start gap-1"
          >
            <div class="flex flex-col gap-2 content-start">
              <p>地址：{{ props.row.address }}</p>
              <p>工作地址：{{ props.row.working_address }}</p>
              <div
                v-if="props.row.customer_tag_list"
                class="flex items-center flex-wrap gap-2 mb-2"
              >
                标签：
                <div
                  class="p-1 px-4 rounded-md bg-[#eeeeee] text-[#303841]"
                  v-for="item in props.row.customer_tag_list"
                  :key="item.id"
                >
                  {{ item.tag.name }}
                </div>
              </div>
            </div>
            <!-- <div class="ml-10">回访记录：xxxxx</div> -->
          </div>
        </template>
      </el-table-column>
      <el-table-column label="客户名称">
        <template #default="props">
          <div class="flex items-center">
            <el-icon class="mr-1" :size="24" color="#393e46"
              ><UserFilled
            /></el-icon>
            {{ props.row.name }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机">
        <template #default="props">
          <div class="flex items-center">
            <el-icon class="mr-1" :size="20" color="#393e46"
              ><Cellphone
            /></el-icon>
            {{ props.row.phone }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="company" label="公司" />
      <el-table-column prop="wechat" label="微信" />
      <el-table-column prop="wecom" label="wecom" />
      <!-- <el-table-column label="通话记录">
        <template #default="props">
          <div
            class="text-cyan-500 hover:opacity-60 cursor-default"
            @click="viewCall(props.row)"
          >
            查看
          </div>
        </template>
      </el-table-column> -->
      <el-table-column label="添加时间" sortable>
        <template #default="props">
          {{ dayjs(props.row.updated_at * 1000).format("YYYY-MM-DD HH:mm") }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="80" #default="props">
        <el-dropdown trigger="click">
          <el-icon :size="20"><More /></el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :icon="Cellphone" @click="handleCall(props.row)"
                >拨打电话</el-dropdown-item
              >
              <el-dropdown-item :icon="Edit" @click="handleProgress(props.row)"
                >修改进度</el-dropdown-item
              >
              <el-dropdown-item
                :icon="Memo"
                @click="handleFlowDetail(props.row)"
                >操作记录</el-dropdown-item
              >
              <el-dropdown-item :icon="Sort" @click="handleTran(props.row)"
                >转让客户</el-dropdown-item
              >
              <el-dropdown-item :icon="Share" @click="handleShare(props.row)"
                >分享客户</el-dropdown-item
              >
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <!-- <div class="flex flex-wrap items-start">
            <el-button link type="success" @click="handleCall(props.row)"
              >拨打电话</el-button
            >
            <el-button
              link
              class="!ml-0"
              type="warning"
              @click="handleEditVisit(props.row)"
              >回访记录</el-button
            >
            <el-button link class="!ml-0" @click="handleEditVisit2(props.row)"
              >访客记录</el-button
            >
          </div> -->
      </el-table-column>
    </el-table>
    <div class="mt-4 flex justify-end">
      <el-pagination
        class="flex-wrap gap-y-2"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 30, 40]"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="回访记录"
      width="400"
      @closed="handleCancelCrete"
      align-center
    >
      <el-form label-position="top" class="demo-form-inline">
        <el-form-item
          :label="item.label"
          v-for="(item, key) in dialogData"
          :key="key"
        >
          <el-date-picker
            v-if="item.type === 'datetime'"
            v-model="item.value"
            type="datetime"
            value-format="x"
            placeholder="请选择时间"
          />
          <el-input
            v-else
            v-model="item.value"
            :type="item.type"
            :placeholder="'请输入' + item.label"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancelCrete">取消</el-button>
          <el-button type="primary" @click="handleConfirm">
            {{ isEdit ? "确认修改" : "添加记录" }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="dialogVisible2"
      title="访客记录"
      width="400"
      @closed="handleCancelCrete2"
      align-center
    >
      <el-form label-position="top" class="demo-form-inline">
        <el-form-item
          :label="item.label"
          v-for="(item, key) in dialogData2"
          :key="key"
        >
          <el-date-picker
            v-if="item.type === 'datetime'"
            v-model="item.value"
            type="datetime"
            value-format="x"
            placeholder="请选择时间"
          />
          <el-input
            v-else
            v-model="item.value"
            :type="item.type"
            :placeholder="'请输入' + item.label"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancelCrete2">取消</el-button>
          <el-button type="primary" @click="handleConfirm2">
            {{ isEdit ? "确认修改" : "添加记录" }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogTableVisible" title="回访记录" width="450">
      <el-button size="small" @click="dialogVisible = true" class="mb-2"
        >添加记录</el-button
      >
      <el-table
        header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
        :data="dialogTableData"
      >
        <el-table-column prop="content" label="内容" width="200" />
        <el-table-column label="跟进时间" width="100">
          <template #default="props">
            {{ dayjs(props.row.follow_at * 1000).format("YYYY-MM-DD HH:mm") }}
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="props">
            <el-button link @click="handleEdit(props.row)">编辑</el-button>
            <el-button link type="danger" @click="handleDel(props.row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-if="total2"
        class="flex-wrap gap-y-2 mt-4"
        v-model:current-page="currentPage2"
        background
        layout="total, prev, pager, next, jumper"
        :total="total3"
        @current-change="handleCurrentChange2"
      />
    </el-dialog>

    <el-dialog v-model="dialogTableVisible2" title="访客记录" width="450">
      <el-button size="small" @click="dialogVisible2 = true" class="mb-2"
        >添加记录</el-button
      >
      <el-table
        header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
        :data="dialogTableData2"
      >
        <el-table-column prop="visit_content" label="内容" width="200" />
        <el-table-column label="来访时间" width="100">
          <template #default="props">
            {{ dayjs(props.row.visit_at * 1000).format("YYYY-MM-DD HH:mm") }}
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="props">
            <el-button link @click="handleEdit2(props.row)">编辑</el-button>
            <el-button link type="danger" @click="handleDel2(props.row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-if="total3"
        class="flex-wrap gap-y-2 mt-4"
        v-model:current-page="currentPage3"
        background
        layout="total, prev, pager, next, jumper"
        :total="total2"
        @current-change="handleCurrentChange3"
      />
    </el-dialog>

    <el-dialog v-model="callialogVisiable" title="访客记录" width="450">
      <el-table
        header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
        :data="callTableData"
      >
        <el-table-column prop="call_long" label="拨打时长">
          <template #default="props">
            {{
              // dayjs.duration(props.row.call_long, "seconds").format("HH:mm:ss")
              msToTime(props.row.call_long)
            }}
          </template>
        </el-table-column>
        <el-table-column label="拨打时间">
          <template #default="props">
            {{ dayjs(props.row.call_at * 1000).format("YYYY-MM-DD HH:mm") }}
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-if="callTtoal"
        class="flex-wrap gap-y-2 mt-4"
        v-model:current-page="currentPage3"
        background
        layout="total, prev, pager, next, jumper"
        :total="callTtoal"
        @current-change="handleCurrentChangeCall"
      />
    </el-dialog>

    <recrodDialog
      :show="recordDialog"
      :info="currentCustomerInfo"
      @close="recordDialog = false"
    />
    <orgDialog
      :show="orgDialogShow"
      :info="currentCustomerInfo"
      @close="orgDialogShow = false"
      :title="orgTitle"
    />
    <progressDialog
      :show="progressDialogShow"
      :info="currentCustomerInfo"
      @close="progressDialogShow = false"
      @confirm="handleProgressConfrim"
      :title="'修改进度'"
    />
  </div>
</template>

<style lang="scss" scoped>
.demo-form-inline .el-input {
  --el-input-width: 210px;
}
.demo-form-inline .el-select {
  --el-select-width: 210px;
}
</style>
