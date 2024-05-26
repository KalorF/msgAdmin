<script lang="ts" setup>
import {
  createCustomer,
  customerUpdate,
  customerList,
  deleteCustomer,
  getCustomerByTagId,
  customerSelect,
  recordListByCustomer,
  visitListByCustomer,
  batchUpsert,
  recordUpdate,
  createCustomerRecoed,
  visitCreate,
  visitUpdate,
  delVisit,
  recordDel,
  customerQuery,
  customerUpte,
  customerBatchCreate
} from "@/api/customer";
import { getAllTags, getAllGroupTag, customerTagUpsert } from "@/api/tag";
import { getCallListByCustomer } from "@/api/call";
import { message } from "@/utils/message";
import { ref, reactive } from "vue";
import { Avatar, EditPen } from "@element-plus/icons-vue";
import { onMounted, nextTick, computed } from "vue";
import { ElMessageBox } from "element-plus";
import dayjs from "dayjs";
import DelList from "./delList.vue";
import { useUserStoreHook } from "@/store/modules/user";
import * as XLSX from "xlsx";
import tagPop from "@/components/tagPop/index.vue";

defineOptions({
  name: "customerlist"
});

const userStore = useUserStoreHook();

const formInline = reactive({
  user: "",
  company: "",
  phone: "",
  date: ""
});

const onSubmit = async () => {
  currentPage.value = 1;
  pageSize.value = 10;
  getDataNew();
  // if (valueGroup.value.length) {
  //   const res = await getCustomerByTagId({ tag_id_list: valueGroup.value });
  //   tableData.value = res.data || [];
  // } else {
  //   pageSize.value = 10;
  //   currentPage.value = 1;
  //   const res = await customerSelect({
  //     customer_condition: {
  //       is_deleted: false,
  //       name: formInline.user,
  //       company: formInline.company,
  //       phone: formInline.phone,
  //       created_at: +formInline.date / 1000
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
  getDataNew();
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

const getDataNew = () => {
  customerQuery({
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

const getData = () => {
  customerList({
    is_deleted: false,
    limit: pageSize.value,
    offset: currentPage.value - 1
  })
    .then(res => {
      if (res.code === 200 && res.data) {
        tableData.value = res.data.customers || [];
        total.value = res.data.total || 0;
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
  console.log(options);
};

const dialogVisible = ref(false);
const dialogData = ref({
  name: {
    label: "客户名称",
    value: "",
    type: "text"
  },
  phone: {
    label: "手机",
    value: "",
    type: "tel"
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

const dialogVisible2 = ref(false);
const dialogData2 = ref({
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

const dialogVisible3 = ref(false);
const dialogData3 = ref({
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

const isEdit = ref(false);
const currentRecordInfo = ref(null);

const handleCancelCrete2 = () => {
  Object.values(dialogData2.value).forEach(item => {
    item.value = "";
  });
  isEdit.value = false;
  currentRecordInfo.value = null;
  dialogVisible2.value = false;
};

const handleCancelCrete3 = () => {
  Object.values(dialogData3.value).forEach(item => {
    item.value = "";
  });
  isEdit.value = false;
  currentRecordInfo.value = null;
  dialogVisible3.value = false;
};

const handleEdit2 = (item: any) => {
  Object.keys(dialogData2.value).map(key => {
    dialogData2.value[key].value = item[key];
    if (key === "follow_at") {
      (dialogData2.value[key].value as any) = item[key] * 1000;
    }
  });
  isEdit.value = true;
  currentRecordInfo.value = item;
  dialogVisible2.value = true;
};

const handleEdit3 = (item: any) => {
  Object.keys(dialogData3.value).map(key => {
    dialogData3.value[key].value = item[key];
    if (key === "visit_at") {
      (dialogData3.value[key].value as any) = item[key] * 1000;
    }
  });
  isEdit.value = true;
  currentRecordInfo.value = item;
  dialogVisible3.value = true;
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
      if (key === "follow_at") {
        data[key] = (dialogData2.value[key].value as any) / 1000;
      } else {
        data[key] = dialogData2.value[key].value;
      }
    });
    if (isEdit.value) {
      data.id = currentRecordInfo.value.id;
    }
    data.customer_id = currentInfo.value.id;
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

  handleCancelCrete2();
};

const handleConfirm3 = () => {
  let flag = false;
  Object.values(dialogData3.value).some(item => {
    if (!item.value) {
      message(`请输入${item.label}`, { type: "info" });
      flag = true;
      return true;
    }
  });
  if (!flag) {
    const data: any = {};
    Object.keys(dialogData3.value).forEach(key => {
      if (key === "visit_at") {
        data[key] = (dialogData3.value[key].value as any) / 1000;
        data.to_visit_at = (dialogData3.value[key].value as any) / 1000;
      } else {
        data[key] = dialogData3.value[key].value;
      }
    });
    if (isEdit.value) {
      data.id = currentRecordInfo.value.id;
    }
    data.customer_id = currentInfo.value.id;
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

  handleCancelCrete3();
};

const handleDel2 = (item: any) => {
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

const handleDel3 = (item: any) => {
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

const handleCancelCrete = () => {
  Object.values(dialogData.value).forEach(item => {
    item.value = "";
  });
  isEdit.value = false;
  currentInfo.value = null;
  dialogVisible.value = false;
};

const handleEdit = (item: any) => {
  Object.keys(dialogData.value).map(key => {
    dialogData.value[key].value = item[key];
  });
  isEdit.value = true;
  currentInfo.value = item;
  dialogVisible.value = true;
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
  if (
    dialogData.value.phone.value &&
    !/^1[3456789]\d{9}$/.test(dialogData.value.phone.value)
  ) {
    message(`请输入正确手机号`, { type: "info" });
    flag = true;
  }
  if (
    dialogData.value.email.value &&
    !/^(\w*\.*)+@(\w-?)+(\.\w{2,3}){1,2}$/.test(dialogData.value.email.value)
  ) {
    message(`请输入正确邮箱`, { type: "info" });
    flag = true;
  }
  if (!flag) {
    const data: any = {};
    Object.keys(dialogData.value).forEach(key => {
      data[key] = dialogData.value[key].value;
    });
    if (isEdit.value) {
      data.id = currentInfo.value.id;
    }
    const func = isEdit.value ? customerUpte : customerBatchCreate;
    const sendData = isEdit.value
      ? Object.assign(currentInfo.value, { ...data })
      : { customers: [data], force: true };
    func(sendData)
      .then(res => {
        if (res.code === 200) {
          message(isEdit.value ? "编辑成功" : "添加成功", { type: "success" });
          getDataNew();
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
    // handleCancelCrete();
  }
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  getDataNew();
};
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  getDataNew();
};

const handleDel = (item: any) => {
  ElMessageBox.confirm("确认删除该客户吗?", "提示", {
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      const data = Object.assign(item, { is_deleted: true });
      customerUpte(data).then(res => {
        if (res.code === 200) {
          message("删除成功", { type: "success" });
          getDataNew();
        } else {
          message("删除失败", { type: "error" });
        }
      });
    })
    .catch(() => {});
};

const activeValue = ref("has");

const handleChangeActive = () => {
  if (activeValue.value === "has") {
    getDataNew();
  }
};

const dialogTableVisible = ref(false);
const currentPage2 = ref(1);
const total2 = ref(0);
const dialogTableData = ref([]);

const dialogTableVisible2 = ref(false);
const dialogTableData2 = ref([]);
const currentPage3 = ref(1);
const total3 = ref(0);

const getRecord = () => {
  return recordListByCustomer({
    customer_id: currentInfo.value.id,
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
    customer_id: currentInfo.value.id,
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

const handleViewVisit = (item: any) => {
  currentInfo.value = item;
  currentPage2.value = 1;
  total2.value = 0;
  getRecord();
  dialogTableVisible.value = true;
};

const handleViewVisit2 = (item: any) => {
  currentInfo.value = item;
  currentPage3.value = 1;
  total3.value = 0;
  getVisit();
  dialogTableVisible2.value = true;
};

const handleCurrentChange2 = (value: number) => {
  currentPage2.value = value;
  getRecord();
};

const handleCurrentChange3 = (value: number) => {
  currentPage3.value = value;
  getVisit();
};

const keyMap = {
  企业微信: "wecom",
  公司: "company",
  地址: "address",
  客户名称: "name",
  客户手机: "phone",
  工作地址: "working_address",
  微信: "wechat",
  邮箱: "email"
};

function replaceKey(array: any) {
  for (let i = 0; i < array.length; i++) {
    const obj = array[i];
    for (var key in obj) {
      var newKey = keyMap[key];
      if (newKey) {
        obj[newKey] = obj[key] + "";
        delete obj[key];
      }
    }
  }
  return array;
}

const mulTableData = ref([]);
const mulDialogVisiable = ref(false);

const handleMulCancel = () => {
  mulTableData.value = [];
  mulDialogVisiable.value = false;
};

const handleMul = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept =
    ".xls,.xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";
  input.onchange = (e: any) => {
    const fileread = new FileReader();
    fileread.onload = ev => {
      const data = new Uint8Array(ev.target.result as any);
      const workbook = XLSX.read(data, { type: "array" });
      const wsname = workbook.SheetNames[0]; // 取第一张表
      const ws = XLSX.utils.sheet_to_json(workbook.Sheets[wsname]); // 生成 JSON 格式的表格内容
      if (ws.length) {
        const data = replaceKey(ws);
        mulTableData.value = data;
        mulDialogVisiable.value = true;
      }
      document.body.removeChild(input);
    };
    fileread.readAsArrayBuffer(e.target.files[0]);
  };
  document.body.appendChild(input);
  input.click();
};

const handleConfirmImport = () => {
  customerBatchCreate({ customers: mulTableData.value, force: true })
    .then(res => {
      if (res.code === 200) {
        message("导入成功", { type: "success" });
        handleMulCancel();
        getDataNew();
      } else {
        message("导入失败", { type: "error" });
      }
    })
    .catch(err => {
      message("导入失败", { type: "error" });
    });
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
        getDataNew();
      } else {
        message("设置失败", { type: "error" });
      }
    })
    .catch(err => {
      message("设置失败", { type: "error" });
    });
};

const callialogVisiable = ref(false);
const callTableData = ref([]);
const callTtoal = ref(0);
const callCurrentPage = ref(1);

const getCallData = () => {
  return getCallListByCustomer({
    customer_id: currentInfo.value.id,
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
  currentInfo.value = item;
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

onMounted(() => {
  // getData();
  // getTagOptions();
  getDataNew();
});
</script>

<template>
  <div class="p-4 bg-white rounded-lg flex flex-col h-[calc(100%-30px)]">
    <div class="flex items-center mb-4">
      <el-radio-group
        v-model="activeValue"
        size="small"
        fill="#ff9a00"
        @change="handleChangeActive"
      >
        <el-radio-button label="已有客户" value="has" />
        <el-radio-button label="被删除客户" value="del" />
      </el-radio-group>
      <div
        class="ml-auto flex flex-wrap gap-1 relative"
        v-if="activeValue === 'has'"
      >
        <el-button class="" type="default" @click="dialogVisible = true"
          >添加客户</el-button
        >
        <div class="relative">
          <el-button class="ml-auto" type="default" @click="handleMul"
            >批量导入</el-button
          >
        </div>
        <a
          class="absolute top-9 right-4 text-sm text-sky-500 underline hover:text-cyan-700"
          href="https://abynn.oss-cn-shenzhen.aliyuncs.com/%E6%89%B9%E9%87%8F%E5%AE%A2%E6%88%B7-1715698399574.xlsx"
          download="模版文件.xlsx"
          target="view_window"
        >
          模版文件
        </a>
      </div>
    </div>
    <template v-if="activeValue === 'has'">
      <div class="flex">
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
          <el-form-item>
            <el-button type="primary" @click="onSubmit">查询</el-button>
            <el-button type="default" @click="onReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <el-table
        :data="tableData"
        header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
        style="width: 100%"
        class="flex-1"
      >
        <el-table-column type="expand">
          <template #default="props">
            <div
              class="ml-16 text-zinc-500 text-sm flex flex-col flex-wrap content-start gap-1"
            >
              <p>地址：{{ props.row.address }}</p>
              <p>工作地址：{{ props.row.working_address }}</p>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="客户名称" width="150">
          <template #default="props">
            <div class="flex items-center">
              <el-icon :size="24" class="mr-2" color="#393e46"
                ><Avatar
              /></el-icon>
              {{ props.row.name }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="客户标签" width="230">
          <template #default="props">
            <div class="flex items-center flex-wrap gap-2 mb-2 w-full">
              <el-icon
                @click="handleEditTag(props.row)"
                class="!text-zinc-600 hover:!text-zinc-400"
                :size="18"
                ><EditPen
              /></el-icon>
              <div
                v-if="props.row.customer_tag_list"
                class="p-1 px-2 text-xs rounded-md bg-[#eeeeee] text-[#303841]"
                v-for="item in props.row.customer_tag_list"
                :key="item.id"
              >
                {{ item.tag.name }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" width="140" label="手机" />
        <el-table-column prop="company" width="180" label="公司" />
        <el-table-column prop="wechat" label="微信" />
        <el-table-column prop="wecom" label="企业微信" />
        <el-table-column prop="qq" label="QQ" />
        <el-table-column label="添加时间" width="200" sortable>
          <template #default="props">
            {{ dayjs(props.row.created_at * 1000).format("YYYY-MM-DD HH:mm") }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          fixed="right"
          width="220"
          #default="props"
        >
          <div class="flex flex-wrap content-start gap-y-1 gap-x-2">
            <el-button link type="info" @click="handleEdit(props.row)"
              >编辑</el-button
            >
            <!-- <el-button
              class="!ml-0"
              link
              type="primary"
              @click="handleViewVisit(props.row)"
              >回访记录</el-button
            >
            <el-button class="!ml-0" link @click="handleViewVisit2(props.row)"
              >访客记录</el-button
            >
            <div
              class="text-cyan-600 hover:text-cyan-300 cursor-default mr-2"
              @click="viewCall(props.row)"
            >
              通话记录
            </div> -->
            <el-button
              class="!ml-0"
              link
              type="danger"
              @click="handleDel(props.row)"
              >删除</el-button
            >
          </div>
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
    </template>
    <DelList v-else />

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '客户信息' : '添加客户'"
      width="400"
      @closed="handleCancelCrete"
      align-center
    >
      <el-form label-position="right" class="demo-form-inline">
        <el-form-item
          :label="item.label"
          v-for="(item, key) in dialogData"
          :key="key"
        >
          <el-input
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
            {{ isEdit ? "确认修改" : "添加客户" }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogTableVisible" title="回访记录" width="500">
      <el-button size="small" @click="dialogVisible2 = true" class="mb-2"
        >添加记录</el-button
      >
      <el-table
        header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
        :data="dialogTableData"
      >
        <el-table-column
          prop="content"
          label="回访内容"
          fixed="left"
          width="180"
        />
        <el-table-column label="回访员工" width="100">
          <template #default="props">
            {{ props.row.staff?.name }}
          </template>
        </el-table-column>
        <el-table-column label="跟进时间" width="100">
          <template #default="props">
            {{ dayjs(props.row.follow_at * 1000).format("YYYY-MM-DD HH:mm") }}
          </template>
        </el-table-column>
        <el-table-column label="员工电话" width="100">
          <template #default="props">
            {{ props.row.staff?.phone }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="props">
            <el-button link @click="handleEdit2(props.row)">编辑</el-button>
            <el-button link type="danger" @click="handleDel2(props.row)"
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
        :total="total2"
        @current-change="handleCurrentChange2"
      />
    </el-dialog>

    <el-dialog v-model="dialogTableVisible2" title="访客记录" width="500">
      <el-button size="small" @click="dialogVisible3 = true" class="mb-2"
        >添加记录</el-button
      >
      <el-table
        header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
        :data="dialogTableData2"
      >
        <el-table-column
          prop="visit_content"
          fixed="left"
          label="内容"
          width="200"
        />
        <el-table-column label="来访时间" width="100">
          <template #default="props">
            {{ dayjs(props.row.visit_at * 1000).format("YYYY-MM-DD HH:mm") }}
          </template>
        </el-table-column>
        <el-table-column label="接待员工" width="100">
          <template #default="props">
            {{ props.row.reception_staff?.name }}
          </template>
        </el-table-column>
        <el-table-column label="员工电话" width="100">
          <template #default="props">
            {{ props.row.reception_staff?.phone }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="props">
            <el-button link @click="handleEdit3(props.row)">编辑</el-button>
            <el-button link type="danger" @click="handleDel3(props.row)"
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
        :total="total3"
        @current-change="handleCurrentChange3"
      />
    </el-dialog>

    <el-dialog
      v-model="mulDialogVisiable"
      @closed="handleMulCancel"
      title="批量导入"
      width="500"
    >
      <el-table
        header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
        max-height="320"
        :data="mulTableData"
      >
        <el-table-column
          prop="name"
          fixed="left"
          label="客户名称"
          width="120"
        />
        <el-table-column prop="phone" label="客户手机" width="100" />
        <el-table-column prop="company" label="公司" width="120" />
        <el-table-column prop="wechat" label="微信" width="100" />
        <el-table-column prop="wecom" label="wecom" width="100" />
        <el-table-column prop="email" label="邮箱" width="150" />
        <el-table-column prop="address" label="地址" width="120" />
        <el-table-column prop="working_address" label="工作地址" width="120" />
      </el-table>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleMulCancel">取消</el-button>
          <el-button type="primary" @click="handleConfirmImport">
            确认导入
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="tagDialogVisiable"
      title="设置标签"
      @closed="handleTagCancel"
      width="350"
    >
      <el-form inline>
        <el-form-item label="标签">
          <tagPop :checkedItems="tagGroupCheckitems" @change="tagGroupChange">
            <el-input
              placeholder="请选择标签"
              v-model="tagGroup"
              clearable
              readonly
            ></el-input>
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
      v-model="dialogVisible2"
      title="回访记录"
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

    <el-dialog
      v-model="dialogVisible3"
      title="访客记录"
      width="400"
      @closed="handleCancelCrete3"
      align-center
    >
      <el-form label-position="top" class="demo-form-inline">
        <el-form-item
          :label="item.label"
          v-for="(item, key) in dialogData3"
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
          <el-button @click="handleCancelCrete3">取消</el-button>
          <el-button type="primary" @click="handleConfirm3">
            {{ isEdit ? "确认修改" : "添加记录" }}
          </el-button>
        </div>
      </template>
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
        <el-table-column label="拨打时间" width="150">
          <template #default="props">
            {{ dayjs(props.row.call_at * 1000).format("YYYY-MM-DD HH:mm") }}
          </template>
        </el-table-column>
        <el-table-column label="通话员工">
          <template #default="props">
            {{ props.row.staff?.name }}
          </template>
        </el-table-column>
        <el-table-column label="员工手机">
          <template #default="props">
            {{ props.row.staff?.phone }}
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
