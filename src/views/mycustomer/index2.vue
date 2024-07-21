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
  customerView,
  customerUpte
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
  Edit,
  EditPen,
  Delete,
  ArrowDown
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
import {
  usePermissionActionStroe,
  usePermissionStoreHook
} from "@/store/modules/permission";

defineOptions({
  name: "customerlist2"
});

const guid = () => {
  let d = new Date().getTime();
  const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (c) {
      const r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
    }
  );
  return uuid;
};

const permission = usePermissionActionStroe();
const perm = usePermissionStoreHook();
const actions = computed(() => permission.value);
const isAdmin = computed(() => perm.policies.role.RoleType === "admin");

const userStore = useUserStoreHook();

const formInline = reactive({
  user: "",
  company: "",
  phone: "",
  date: "",
  call_state: ""
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
  // if (cutomerType.value) {
  cutomerType.value = "";
  currentViewData.value = null;
  getData();
  mutilTable.value.clearSelection();

  // }
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
  mutilTable.value.clearSelection();
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
  let searchInfo: any = {
    allocation: {
      staff_id: userStore.userInfo.id
    },
    info: {
      is_deleted: false,
      name: formInline.user,
      company: formInline.company,
      phone: formInline.phone,
      updated_at: formInline.date ? (formInline.date as any) / 1000 : 0,
      customer_tag_list: checkedItems.value.map(i => ({ tag_id: i.id }))
    }
  };
  // if () {
  searchInfo.allocation.call_state = { call_state: +activeValue.value };
  // }
  if (currentViewData.value) {
    searchInfo = {
      ...JSON.parse(currentViewData.value.condition_json),
      allocation: {
        staff_id: userStore.userInfo.id
      }
    };
  }
  customerQuery({
    condition: searchInfo,
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
    })
    .finally(() => {});
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

const callback = (json: any) => {
  operateCreate(json).finally(() => {
    let callLogs: any = window.localStorage.getItem("_callLogs");
    if (callLogs) {
      let json: any = JSON.parse(callLogs);
      delete json[uid];
      window.localStorage.setItem("_callLogs", JSON.stringify(json));
    } else {
      window.localStorage.setItem("_callLogs", null);
    }
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

let uid = "";

const visiableChange = () => {
  if (document.visibilityState === "hidden" && startCall.value) {
    recorderContext.start();
    startTime.value = Date.now();
    let callLogs: any = window.localStorage.getItem("_callLogs");
    uid = guid();
    if (!callLogs) {
      callLogs = {};
      callLogs[uid] = {
        call_duration: 0,
        call_at: Math.round(startTime.value / 1000),
        call_audio_url: "",
        content: "",
        customer_id: currentCustomerInfo.value.id,
        staff_id: userStore.userInfo.id,
        flow_type: FLOW_TYPE.RUKU,
        record_type: RECORD_TYPE.CALL_PHONE,
        progress_id: currentCustomerInfo.value.progress_id,
        expireTime: 1000 * 60 * 30
      };
      window.localStorage.setItem("_callLogs", JSON.stringify(callLogs));
    } else {
      callLogs = JSON.parse(callLogs);
      callLogs[uid] = {
        call_duration: 0,
        call_at: Math.round(startTime.value / 1000),
        call_audio_url: "",
        content: "",
        customer_id: currentCustomerInfo.value.id,
        staff_id: userStore.userInfo.id,
        flow_type: FLOW_TYPE.RUKU,
        record_type: RECORD_TYPE.CALL_PHONE,
        progress_id: currentCustomerInfo.value.progress_id,
        expireTime: 1000 * 60 * 30
      };
      window.localStorage.setItem("_callLogs", JSON.stringify(callLogs));
    }
  }
  if (document.visibilityState === "visible" && startTime.value) {
    callTime.value = Date.now() - startTime.value;
    // 判断是否是androids
    // if (checkAndroid()) {
    //   getCorder();
    // }
    // alert("通话完成");
    let callLogs: any = window.localStorage.getItem("_callLogs");
    let json: any = JSON.parse(callLogs)[uid];
    if (callTime.value < json.expireTime) {
      json.call_duration = callTime.value;
    } else {
      json.call_duration = json.expireTime;
    }
    callback(json);
    startTime.value = 0;
    startCall.value = false;
  }
};

let isOpen = false;

const handleCall = (item: any) => {
  if (window.innerWidth > 766) {
    message("请在移动端浏览器打开进行电话拨打");
    return;
  }
  // if (checkAndroid()) {
  //   recorderContext.open(
  //     () => {
  //       recorderContext.start();
  //       isOpen = true;
  //     },
  //     () => {
  //       isOpen = false;
  //       console.log("权限未打开");
  //     }
  //   );
  // }

  startCall.value = true;
  // if (isOpen) {
  // startCall.value = true;
  currentCustomerInfo.value = item;
  // const a = document.createElement("a");
  // a.href = `tel:${item.phone}`;
  // a.click();
  // }
  window.location.href = `tel://${item.phone}`;
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
  try {
    const check = await allocConfigCheck({ staff_id });
    if (check.data.can_alloc) {
      const res = await allocConfigAlloc({ staff_id });
      if (res.code === 200) {
        getData();
      }
    }
  } catch (e) {
    message(e?.response?.data?.msg || "领取失败", { type: "error" });
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

const handleCloseOrg = () => {
  if (orgTitle.value === "转让客户") {
    getData();
    mutilTable.value.clearSelection();
  }
  orgTitle.value = "";
  orgDialogShow.value = false;
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

const currentViewData = ref();

const getViewData = () => {
  currentViewData.value = customerOption.value.find(
    item => item.id === cutomerType.value
  );
  currentPage.value = 1;
  getData();
  mutilTable.value.clearSelection();
};

const handleClear = () => {
  currentPage.value = 1;
  currentViewData.value = null;
  getData();
  mutilTable.value.clearSelection();
};

const tagDialogVisiable = ref(false);
const tagGroup = ref("");
const tagGroupCheckitems = ref([]);

const handleTagCancel = () => {
  tagGroup.value = "";
  tagGroupCheckitems.value = [];
  tagDialogVisiable.value = false;
};

const tagGroupChange = (val: any) => {
  if (val.length) {
    tagGroupCheckitems.value = val;
    tagGroup.value = val.map(i => i.name).join("、");
  } else {
    tagGroupCheckitems.value = [];
    tagGroup.value = "";
  }
};

const handleEditTag = (item: any) => {
  currentInfo.value = item;
  if (item.customer_tag_list && item.customer_tag_list.length) {
    tagGroupCheckitems.value = item.customer_tag_list.map(i => i.tag);
    tagGroup.value = tagGroupCheckitems.value.map(i => i.name).join("、");
  }
  tagDialogVisiable.value = true;
};

const handleConfirmTag = () => {
  if (tagGroupCheckitems.value.length === 0) {
    message("请选择标签");
    return;
  }
  const data = Object.assign({}, { ...currentInfo.value });
  data.customer_tag_list = tagGroupCheckitems.value.map(i => ({
    tag_id: i.id
  }));
  customerUpte(data)
    .then(res => {
      if (res.code === 200) {
        message("设置成功", { type: "success" });
        handleTagCancel();
        getData();
      } else {
        message("设置失败", { type: "error" });
      }
    })
    .catch(err => {
      message(err?.response?.data?.msg || "设置失败", { type: "error" });
      // message("设置失败", { type: "error" });
    });
};

const customerMsgDialog = ref(false);
const customerMsgData = ref<any>({
  name: {
    label: "客户名称",
    value: "",
    type: "text"
  },
  phone: {
    label: "手机",
    value: "",
    type: "tel",
    disabled: true,
    is_require: true
  },
  company: {
    label: "公司",
    value: "",
    type: "text"
  },
  email: {
    label: "邮箱",
    value: "",
    type: "text"
  },
  wechat: {
    label: "微信",
    value: "",
    type: "text"
  },
  wecom: {
    label: "企业微信",
    value: "",
    type: "text"
  },
  qq: {
    label: "QQ",
    value: "",
    type: "text"
  },
  address: {
    label: "地址",
    value: "",
    type: "textarea"
  },
  working_address: {
    label: "工作地址",
    value: "",
    type: "textarea"
  }
});

const customerMsgCancel = () => {
  Object.values(customerMsgData.value).forEach((item: any) => {
    item.value = "";
  });
  isEdit.value = false;
  currentInfo.value = null;
  customerMsgDialog.value = false;
};

const handleEditCustomerMsg = (item: any) => {
  Object.keys(customerMsgData.value).map(key => {
    customerMsgData.value[key].value = item[key];
  });
  isEdit.value = true;
  currentInfo.value = item;
  customerMsgDialog.value = true;
};

const handleConfirmMsg = () => {
  let flag = false;
  Object.values(customerMsgData.value).some((item: any) => {
    if ((item as any).is_require && !item.value) {
      message(`请输入${item.label}`, { type: "info" });
      flag = true;
      return true;
    }
  });
  if (
    customerMsgData.value.phone.value &&
    !/^1[3456789]\d{9}$/.test(customerMsgData.value.phone.value)
  ) {
    message(`请输入正确手机号`, { type: "info" });
    flag = true;
  }
  if (
    customerMsgData.value.email.value &&
    !/^(\w*\.*)+@(\w-?)+(\.\w{2,3}){1,2}$/.test(
      customerMsgData.value.email.value
    )
  ) {
    message(`请输入正确邮箱`, { type: "info" });
    flag = true;
  }
  if (!flag) {
    const data: any = {};
    Object.keys(customerMsgData.value).forEach(key => {
      data[key] = customerMsgData.value[key].value;
    });
    // if (isEdit.value) {
    data.id = currentInfo.value.id;
    // }
    const func = customerUpte;
    const sendData = isEdit.value
      ? Object.assign(currentInfo.value, { ...data })
      : { customers: [data], force: true };
    func(sendData)
      .then(res => {
        if (res.code === 200) {
          message("编辑成功", { type: "success" });
          getData();
          customerMsgCancel();
        } else {
          message("编辑失败", { type: "error" });
        }
      })
      .catch(err => {
        if (err?.response?.data?.msg) {
          message(err?.response?.data?.msg, { type: "error" });
        } else {
          message("编辑失败", { type: "error" });
        }
      });
    // handleCancelCrete();
  }
};

const handleFangqi = (item: any) => {
  ElMessageBox.confirm("确认放弃该客户吗?", "提示", {
    confirmButtonText: "确认放弃",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      operateCreate({
        staff_id: userStore.userInfo.id,
        customer_id: item.id,
        record_tyoe: RECORD_TYPE.LIUZHUAN,
        flow_type: FLOW_TYPE.FANGQI,
        progress_id: item.progress_id
      })
        .then(res => {
          if (res.code === 200) {
            message("操作成功", { type: "success" });
            getData();
          } else {
            message("操作失败失败", { type: "error" });
          }
        })
        .catch(err => {
          message(err?.response?.data?.msg || "操作失败", { type: "error" });
        });
    })
    .catch(() => {});
};

onUnmounted(() => {
  document.removeEventListener("visibilitychange", visiableChange);
  uid = "";
  setTimeout(() => {
    const callLogs = window.localStorage.getItem("_callLogs");
    if (callLogs) {
      const jsons = JSON.parse(callLogs) || [];
      const vals = Object.values(jsons);
      if (vals && vals.length) {
        vals.map(item => {
          callback(item);
        });
      }
    }
  }, 1000);
});

const showMenu = ref(false);

const followVisibale = ref(false);
const followContent = ref("");

const followCancel = () => {
  followContent.value = "";
  followVisibale.value = false;
};

const handleFollow = (item: any) => {
  currentCustomerInfo.value = item;
  followVisibale.value = true;
};

const handleConfrimFollow = () => {
  if (!followContent.value) {
    message("请输入跟进内容", { type: "info" });
    return;
  }
  operateCreate({
    staff_id: userStore.userInfo.id,
    customer_id: currentCustomerInfo.value.id,
    record_tyoe: RECORD_TYPE.GENJIN,
    flow_type: FLOW_TYPE.RUKU,
    content: followContent.value,
    progress_id: currentCustomerInfo.value.progress_id
  })
    .then(res => {
      if (res.code === 200) {
        message("填写成功", { type: "success" });
        getData();
        followCancel();
      } else {
        message("填写失败", { type: "error" });
      }
    })
    .catch(err => {
      message(err?.response?.data?.msg || "操作失败", { type: "error" });
    });
};

// 并发请求函数
const concurrencyRequest = (fn: any, urls: any, maxNum: number) => {
  return new Promise(resolve => {
    if (urls.length === 0) {
      resolve([]);
      return;
    }
    const results = [];
    let index = 0; // 下一个请求的下标
    let count = 0; // 当前请求完成的数量

    // 发送请求
    async function request() {
      if (index === urls.length) return;
      const i = index; // 保存序号，使result和urls相对应
      const url = urls[index];
      index++;
      try {
        const resp = await fn(url);
        // resp 加入到results
        results[i] = resp;
      } catch (err) {
        // err 加入到results
        results[i] = err;
      } finally {
        count++;
        // 判断是否所有的请求都已完成
        if (count === urls.length) {
          resolve(results);
        }
        request();
      }
    }

    // maxNum和urls.length取最小进行调用
    const times = Math.min(maxNum, urls.length);
    for (let i = 0; i < times; i++) {
      request();
    }
  });
};

const selectList = ref([]);
const mutilTable = ref<any>(null);

const handleSelectionChange = (val: any) => {
  if (val.length) {
    selectList.value = val;
  } else {
    selectList.value = [];
  }
};

const handleMulDel = async () => {
  if (!selectList.value.length) {
    message("请选择要删除的客户", { type: "info" });
    return;
  }
  const urls = selectList.value.map(item => {
    return {
      staff_id: userStore.userInfo.id,
      customer_id: item.id,
      record_tyoe: RECORD_TYPE.LIUZHUAN,
      flow_type: FLOW_TYPE.FANGQI,
      progress_id: item.progress_id
    };
  });

  ElMessageBox.confirm("确认放弃选择的客户?", "提示", {
    confirmButtonText: "确认放弃",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      concurrencyRequest(operateCreate, urls, 5).then(res => {
        message("删除成功", { type: "success" });
        getData();
      });
    })
    .catch(() => {});
};

const activeValue = ref("1");
const handleChangeActive = () => {
  currentPage.value = 1;
  total.value = 0;
  getData();
};

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
  const width = window.innerWidth;
  if (width > 640) {
    showMenu.value = true;
  }
});
</script>

<template>
  <div class="p-4 bg-white rounded-lg flex flex-col h-[calc(100%-30px)]">
    <!-- <audio controls :src="audioSrc"></audio> -->
    <!-- <input type="file" accept="audio/mp3" /> -->
    <div class="flex items-center justify-between mb-4">
      <!-- <el-button type="primary" round class="w-40" @click="handleGetCustomer"
        >领取客户</el-button
      > -->
      <el-radio-group
        v-model="activeValue"
        size="small"
        fill="#ff9a00"
        @change="handleChangeActive"
      >
        <el-radio-button label="已拨打" value="1" />
        <el-radio-button label="未拨打" value="0" />
      </el-radio-group>
      <div
        class="phone:hidden max-phone:flex items-center"
        @click="showMenu = !showMenu"
      >
        <span class="mr-2">查询</span>
        <el-icon class="transition-all" :class="{ 'rotate-180': showMenu }"
          ><ArrowDown
        /></el-icon>
      </div>
    </div>
    <el-form
      v-show="showMenu"
      :inline="true"
      :model="formInline"
      class="demo-form-inline"
    >
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
      <!-- <el-form-item label="是否联系过">
        <el-select
          v-model="formInline.call_state"
          clearable
          placeholder="请选择"
          style="width: 240px"
        >
          <el-option label="是" value="1" />
          <el-option label="否" value="0" />
        </el-select>
      </el-form-item> -->
      <el-form-item label="客户视图">
        <el-select
          v-model="cutomerType"
          clearable
          placeholder="请选择"
          style="width: 240px"
          @change="getViewData"
          @clear="handleClear"
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
      ref="mutilTable"
      :data="tableData"
      header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
      style="width: 100%"
      class="flex-1"
      :row-key="
        row => {
          return row.id;
        }
      "
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" reserve-selection width="30" />
      <el-table-column type="expand">
        <template #default="props">
          <div
            class="mx-16 text-zinc-500 text-sm flex flex-wrap content-start gap-1"
          >
            <div class="flex flex-col gap-2 content-start">
              <p>地址：{{ props.row.address }}</p>
              <p>工作地址：{{ props.row.working_address }}</p>
              <!-- <div
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
              </div> -->
            </div>
            <!-- <div class="ml-10">回访记录：xxxxx</div> -->
          </div>
        </template>
      </el-table-column>
      <el-table-column
        type="index"
        width="70"
        align="center"
        :index="idx => (currentPage - 1) * pageSize + idx + 1"
        label="序号"
      />
      <el-table-column label="客户名称" width="240">
        <template #default="props">
          <div class="flex items-center">
            <div
              class="cursor-default text-sky-500 hover:text-sky-600 text-sm border-r border-neutral-300 pr-2 mr-2"
              @click="handleCall(props.row)"
            >
              拨打电话
            </div>
            <el-icon class="mr-1" :size="24" color="#393e46"
              ><UserFilled
            /></el-icon>
            {{ props.row.name }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机" width="150">
        <template #default="props">
          <div class="flex items-center">
            <el-icon class="mr-1" :size="20" color="#393e46"
              ><Cellphone
            /></el-icon>
            {{ props.row.phone.replace(/(\d{3})(\d{5})(\d{3})/, "$1*****$3") }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="客户标签" width="230">
        <template #default="props">
          <div class="flex items-center flex-wrap gap-2 mb-2 w-full">
            <el-icon
              v-if="actions.includes('UpdateCustomerAction')"
              class="!text-zinc-600 hover:!text-zinc-400"
              :size="18"
              @click="handleEditTag(props.row)"
              ><EditPen
            /></el-icon>
            <template v-if="props.row.customer_tag_list">
              <div
                v-for="item in props.row.customer_tag_list"
                :key="item.id"
                class="p-1 px-2 text-xs rounded-md bg-[#eeeeee] text-[#303841]"
                :class="{ hidden: item.tag.just_show_for_admin && !isAdmin }"
              >
                {{ item.tag.name }}
              </div>
            </template>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="company" label="公司" />
      <el-table-column prop="wechat" label="微信" />
      <el-table-column prop="wecom" label="企业微信" />
      <el-table-column prop="qq" label="QQ" />

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
      <!-- <el-table-column label="添加时间" width="200" sortable>
        <template #default="props">
          {{ dayjs(props.row.updated_at * 1000).format("YYYY-MM-DD HH:mm") }}
        </template>
      </el-table-column> -->
      <el-table-column #default="props" label="操作" fixed="right" width="80">
        <el-dropdown trigger="click">
          <el-icon :size="20"><More /></el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :icon="Cellphone" @click="handleCall(props.row)"
                >拨打电话</el-dropdown-item
              >
              <el-dropdown-item
                v-if="actions.includes('UpdateCustomerAction')"
                :icon="Edit"
                @click="handleEditCustomerMsg(props.row)"
                >编辑信息</el-dropdown-item
              >
              <el-dropdown-item
                v-if="actions.includes('UpdateCustomerAction')"
                :icon="EditPen"
                @click="handleProgress(props.row)"
                >修改进度</el-dropdown-item
              >
              <el-dropdown-item
                v-if="actions.includes('UpdateCustomerAction')"
                :icon="Edit"
                @click="handleFollow(props.row)"
                >填写记录</el-dropdown-item
              >
              <el-dropdown-item
                :icon="Memo"
                @click="handleFlowDetail(props.row)"
                >操作记录</el-dropdown-item
              >
              <el-dropdown-item
                v-if="actions.includes('UpdateCustomerAction')"
                :icon="Sort"
                @click="handleTran(props.row)"
                >转让客户</el-dropdown-item
              >
              <el-dropdown-item
                v-if="actions.includes('UpdateCustomerAction')"
                :icon="Share"
                @click="handleShare(props.row)"
                >分享客户</el-dropdown-item
              >
              <el-dropdown-item
                v-if="actions.includes('UpdateCustomerAction')"
                :icon="Delete"
                @click="handleFangqi(props.row)"
                >放弃客户</el-dropdown-item
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
    <div class="mt-4 flex justify-between">
      <el-button
        v-if="actions.includes('UpdateCustomerAction')"
        type="primary"
        :disabled="!selectList.length"
        @click="handleMulDel"
        >批量放弃</el-button
      >
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        class="flex-wrap gap-y-2"
        :page-sizes="[10, 20, 30, 40]"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog
      v-model="followVisibale"
      title="填写跟进记录"
      width="400"
      @close="followCancel"
    >
      <el-input
        v-model="followContent"
        :rows="5"
        :maxlength="1000"
        placeholder="请填写跟进记录（1000字以内）"
        type="textarea"
      />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="followCancel">取消</el-button>
          <el-button type="primary" @click="handleConfrimFollow">
            确认填写
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="dialogVisible"
      title="回访记录"
      width="400"
      align-center
      @closed="handleCancelCrete"
    >
      <el-form label-position="top" class="demo-form-inline">
        <el-form-item
          v-for="(item, key) in dialogData"
          :key="key"
          :label="item.label"
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
      align-center
      @closed="handleCancelCrete2"
    >
      <el-form label-position="top" class="demo-form-inline">
        <el-form-item
          v-for="(item, key) in dialogData2"
          :key="key"
          :label="item.label"
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
      <el-button size="small" class="mb-2" @click="dialogVisible = true"
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
        v-model:current-page="currentPage2"
        class="flex-wrap gap-y-2 mt-4"
        background
        layout="total, prev, pager, next, jumper"
        :total="total3"
        @current-change="handleCurrentChange2"
      />
    </el-dialog>

    <el-dialog v-model="dialogTableVisible2" title="访客记录" width="450">
      <el-button size="small" class="mb-2" @click="dialogVisible2 = true"
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
        v-model:current-page="currentPage3"
        class="flex-wrap gap-y-2 mt-4"
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
        v-model:current-page="currentPage3"
        class="flex-wrap gap-y-2 mt-4"
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
      :title="orgTitle"
      @close="handleCloseOrg"
    />
    <progressDialog
      :show="progressDialogShow"
      :info="currentCustomerInfo"
      :title="'修改进度'"
      @close="progressDialogShow = false"
      @confirm="handleProgressConfrim"
    />

    <el-dialog
      v-model="tagDialogVisiable"
      title="设置标签"
      width="350"
      @closed="handleTagCancel"
    >
      <el-form inline>
        <el-form-item label="标签">
          <tagPop :checkedItems="tagGroupCheckitems" @change="tagGroupChange">
            <el-input
              v-model="tagGroup"
              placeholder="请选择标签"
              clearable
              readonly
            />
          </tagPop>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleTagCancel">取消</el-button>
          <el-button type="primary" @click="handleConfirmTag"> 确认 </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="customerMsgDialog"
      :title="'客户信息'"
      width="400"
      align-center
      @closed="customerMsgCancel"
    >
      <div class="overflow-auto" style="max-height: 400px">
        <el-form label-position="right" class="demo-form-inline">
          <el-form-item
            v-for="(item, key) in customerMsgData"
            :key="key"
            :label="item.label"
          >
            <el-input
              v-model="item.value"
              :type="item.type"
              :disabled="item.disabled"
              :placeholder="'请输入' + item.label"
              clearable
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="customerMsgCancel">取消</el-button>
          <el-button type="primary" @click="handleConfirmMsg">
            确认修改
          </el-button>
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
</style>
