<script lang="ts" setup>
import {
  getpoolList,
  poolSet,
  allocSetConfig,
  poolDelStaff,
  poolDelete,
  allocConfig
} from "@/api/alloc";
import { getAllTags, getAllGroupTag } from "@/api/tag";
import {
  getAccountlistByOrg,
  getAccountByName,
  postAccountUpdate
} from "@/api/account";
import { ref, reactive, onMounted, watch, computed } from "vue";
import { ElMessageBox, ElMessage, ElLoading } from "element-plus";
import dayjs from "dayjs";
import { message } from "@/utils/message";
// import tagPop from "@/components/tagPop/index.vue";
import {
  customerQuery,
  customerGroupList,
  customerGroupUpsert,
  deleteCusomterGroup,
  customerBatchCreate,
  allocationBatchUpdate,
  customerUpte,
  batchDelCustomer
} from "@/api/customer";
import {
  Avatar,
  EditPen,
  More,
  Edit,
  Delete,
  Memo,
  Share,
  Sort
} from "@element-plus/icons-vue";
import topCollapse from "@/layout/components/sidebar/topCollapse.vue";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import tagPop from "@/components/tagPop/index.vue";
import recrodDialog from "@/components/recrodDialog/index.vue";
import {
  usePermissionActionStroe,
  usePermissionStoreHook
} from "@/store/modules/permission";

const permission = usePermissionActionStroe();
const perm = usePermissionStoreHook();
const actions = computed(() => permission.value);
const isAdmin = computed(() => perm.policies.role.RoleType === "admin");

const orgList = ref([]);
const myorg = ref();
const dialogVisiable = ref(false);
const isEdit = ref(false);
const curId = ref("");
const activeOrg = ref("");
const accountList = ref([]);
const pageSize = ref(10);
const currentPage = ref(1);
const total = ref(0);

const formdData = ref({
  name: "",
  tagOptions: [],
  description: ""
});

const tagOptionsValue = computed(() => {
  return formdData.value.tagOptions.map(item => item.name).join("、") || [];
});

const options = ref([]);
const allTags = ref([]);

const getTagOptions = async () => {
  const { data: groups = [] } = await getAllGroupTag();
  // const { data: tags = [] } = await getAllTags();
  if (groups.length) {
    groups.map(item => {
      if (item.tag_list && item.tag_list.length) {
        allTags.value.push(...item.tag_list);
      }
    });
  }
  // const temp = {};
  // if (groups.length) {
  //   groups.forEach(item => {
  //     temp[item.id] = { ...item, children: [] };
  //   });
  //   if (tags.length) {
  //     tags.forEach(tag => {
  //       const group_id = tag.group_id;
  //       temp[group_id].children.push(tag);
  //     });
  //   }
  // }
  // if (Object.keys(temp).length) {
  //   options.value =
  //     Object.values(temp).filter((item: any) => item.children.length > 0) || [];
  // } else {
  //   options.value = [];
  // }
};

const getAccountData = () => {
  getAccountlistByOrg({
    orgId: activeOrg.value,
    limit: pageSize.value,
    offset: currentPage.value - 1
  }).then(res => {
    if (res.code === 200) {
      accountList.value = res.data.accounts || [];
      total.value = accountList.value.length || 0;
    }
  });
};

const getallOrgData = () => {
  return customerGroupList().then(res => {
    if (res.code === 200) {
      orgList.value = res.data || [];
      // ruleData.value.number_per_time =
      //   res.data.allocation_config.number_per_time;
      // ruleData.value.times_per_day = res.data.allocation_config.times_per_day;
    }
  });
};

const handleCancelCreate = () => {
  dialogVisiable.value = false;
  setTimeout(() => {
    isEdit.value = false;
    formdData.value.name = "";
    formdData.value.tagOptions = [];
    formdData.value.description = "";
  }, 250);
};

const confirmCreate = () => {
  if (formdData.value.name === "") {
    message("请输入客户分组名称");
    return;
  }
  // if (formdData.value.tagOptions.length === 0) {
  //   message("请选择客户标签");
  //   return;
  // }
  const func = isEdit.value ? customerGroupUpsert : customerGroupUpsert;
  let data: any = {
    name: formdData.value.name,
    description: formdData.value.description
    // condition: {
    //   info: {
    //     customer_tag_list: formdData.value.tagOptions.map(i => ({
    //       tag_id: i.id
    //     }))
    //   }
    // }
  };
  if (isEdit.value) {
    data = Object.assign(currentInfo.value, { ...data });
  }
  func(data)
    .then(res => {
      if (res.code === 200) {
        message(isEdit.value ? "编辑成功" : "创建成功", { type: "success" });
        getallOrgData();
        handleCancelCreate();
      } else {
        message(isEdit.value ? "编辑失败" : "创建失败", { type: "error" });
      }
    })
    .catch(err => {
      message(
        err?.response?.data?.msg || (isEdit.value ? "编辑失败" : "创建失败"),
        { type: "error" }
      );
    });
};

const currentInfo = ref();

const handleEdit = (item: any) => {
  isEdit.value = true;
  curId.value = item.id;
  formdData.value.name = item.name;
  currentInfo.value = item;
  formdData.value.description = item.description;
  // const ids = item.condition.info.customer_tag_list.map(i => i.tag_id);
  // formdData.value.tagOptions = allTags.value.filter(i => ids.includes(i.id));
  dialogVisiable.value = true;
};

const handleDel = (id: string) => {
  ElMessageBox.confirm("确认删除该客户分组吗?", "提示", {
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      deleteCusomterGroup(id)
        .then(async res => {
          if (res.code === 200) {
            ElMessage.success("删除成功");
            getallOrgData();
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

const handleDelFromPool = (item: any, fromMul = false) => {
  ElMessageBox.confirm("确认将该员工从客户分组中移除吗?", "提示", {
    confirmButtonText: "确认移除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      const currentStaff = currentInfo.value.allocation_setting_list.filter(
        i =>
          fromMul
            ? !selMulIds.value.includes(i.staff.id)
            : !i.staff.id === item.id
      );
      // const data = fromMul
      //   ? { staff_id_str_list: selMulIds.value }
      //   : { staff_id_str_list: [item.id] };
      const data = {
        ...currentInfo.value,
        allocation_setting_list: currentStaff
      };
      customerGroupUpsert(data)
        .then(async res => {
          if (res.code === 200) {
            ElMessage.success("移除成功");
            await getallOrgData();
            const item = orgList.value.find(
              item => item.id === activeOrg.value
            );
            accountList.value = item.allocation_setting_list;
            total.value = accountList.value.length;
            accountListShow.value = false;
          } else {
            ElMessage.error("移除失败");
          }
        })
        .catch(err => {
          ElMessage.error(err?.response?.data?.msg || "移除失败");
        });
    })
    .catch(() => {});
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  getAccountData();
};
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  getAccountData();
};

const selOrg = item => {
  pageSize.value = 10;
  currentPage.value = 1;
  // total.value = 0;
  currentInfo.value = item;
  activeOrg.value = item.id;
  handleViewCustomer();
};

const dialogSearch = ref(false);
const accountName = ref("");
const searchData = ref(null);

const ruleVisiable = ref(false);
const ruleVisiablenew = ref(false);
const ruleData = ref({
  number_per_time: 0,
  times_per_day: 0
});

const ruleCancelnew = () => {
  ruleData.value.number_per_time = 0;
  ruleData.value.times_per_day = 0;
  ruleVisiablenew.value = false;
};

const handleSetRulenew = async () => {
  try {
    const res = await getpoolList();
    if (res && res.data) {
      ruleData.value.number_per_time =
        res.data.allocation_config.number_per_time;
      ruleData.value.times_per_day = res.data.allocation_config.times_per_day;
    }
  } catch (error) {}

  ruleVisiablenew.value = true;
};

const confirmRulenew = () => {
  if (ruleData.value.number_per_time === 0) {
    message("请设置每天领取次数");
    return;
  } else if (ruleData.value.times_per_day === 0) {
    message("请设置每次领取次数");
    return;
  }
  allocSetConfig({ ...ruleData.value })
    .then(res => {
      if (res.code === 200) {
        message("配置成功", { type: "success" });
        ruleCancelnew();
      } else {
        message("配置失败", { type: "error" });
      }
    })
    .catch(err => {
      message(err?.response?.data?.msg || "配置失败", { type: "error" });
    });
};

const ruleCancel = () => {
  // ruleData.value.number_per_time = 0;
  // ruleData.value.times_per_day = 0;
  ruleVisiable.value = false;
};

const handleSetRule = async () => {
  // try {
  //   const res = await allocConfig();
  //   if (res && res.data) {
  //     ruleData.value.number_per_time = res.data.number_per_time;
  //     ruleData.value.times_per_day = res.data.times_per_day;
  //   }
  // } catch (error) {}

  ruleVisiable.value = true;
};

const confirmRule = () => {
  if (StaffMulSelIds.value.length === 0) {
    message("请选择领取员工");
    return;
  }
  const settings = StaffMulSelIds.value.map(item => ({
    staff_id: item,
    customer_group_id: activeOrg.value
  }));
  allocationBatchUpdate({ settings })
    .then(res => {
      if (res.code === 200) {
        message("配置成功", { type: "success" });
        ruleCancel();
      } else {
        message("配置失败", { type: "error" });
      }
    })
    .catch(err => {
      message(err?.response?.data?.msg || "配置失败", { type: "error" });
    });
};

const selMulIds = ref([]);

const handleSelectionChange = (val: any) => {
  if (val.length) {
    selMulIds.value = val.map(item => item.id);
  } else {
    selMulIds.value = [];
  }
};

const hanldeMulDel = () => {
  if (selMulIds.value.length === 0) {
    message("请选择删除名单");
    return;
  }
  handleDelFromPool("-1", true);
};

onMounted(async () => {
  await getallOrgData();
  if (orgList.value.length) {
    activeOrg.value = orgList.value[0].id;
    currentInfo.value = orgList.value[0];
    accountList.value = orgList.value[0].allocation_setting_list || [];
    if (accountList.value.length) {
      accountList.value = accountList.value.map(item => item.staff);
      total.value = accountList.value.length;
    }
    handleViewCustomer();
  }
  // getTagOptions();
  getAllTagsData();
});

watch(activeOrg, () => {
  const item = orgList.value.find(item => item.id === activeOrg.value);
  accountList.value = item.allocation_setting_list || [];
  if (accountList.value.length) {
    accountList.value = accountList.value.map(item => item.staff);
    total.value = accountList.value.length;
  }
});

const accountListShow = ref(false);

const customerList = ref([]);
const customerTotal = ref(0);
const customerCurrentPage = ref(1);
// const customerVisiable = ref(false);

const handleViewCustomer = (flag = false) => {
  customerTotal.value = 0;
  if (!flag) {
    customerCurrentPage.value = 1;
    customerList.value = [];
  }

  getCustomerData();
  // customerVisiable.value = true;
};

const getCustomerData = () => {
  customerQuery({
    condition: {
      info: {
        is_deleted: false,
        customer_group: { id: currentInfo.value.id }
      }
    },
    page: {
      limit: 10,
      offset: customerCurrentPage.value - 1
    }
  }).then(res => {
    if (res.code === 200) {
      customerList.value = res.data.customers || [];
      customerTotal.value = res.data.count || 0;
    }
  });
};

const handleChangeCustomerPage = (val: number) => {
  customerCurrentPage.value = val;
  getCustomerData();
};

const showBar = ref(false);

const tagAllTags = ref([]);
const cloneAllTags = ref([]);

const getAllTagsData = () => {
  getAllGroupTag()
    .then(res => {
      if (res.code === 200) {
        cloneAllTags.value = res.data;
        const data = [];
        res.data.forEach(item => {
          data.push(...item.tag_list);
        });
        tagAllTags.value = data;
      } else {
        tagAllTags.value = [];
      }
    })
    .catch(() => {
      tagAllTags.value = [];
    });
};

const keyMap = {
  // 企业微信: "wecom",
  // 公司: "company",
  // 地址: "address",
  // 客户名称: "name",
  客户手机: "phone"
  // 工作地址: "working_address",
  // 微信: "wechat",
  // 邮箱: "email",
  // QQ: "qq"
};

const exportExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet1");
  // worksheet.getCell("A1").value = "客户名称";
  worksheet.getCell("A1").value = "客户手机";
  // worksheet.getCell("C1").value = "公司";
  // worksheet.getCell("D1").value = "邮箱";
  // worksheet.getCell("E1").value = "微信";
  // worksheet.getCell("F1").value = "企业微信";
  // worksheet.getCell("G1").value = "QQ";
  // worksheet.getCell("H1").value = "地址";
  // worksheet.getCell("I1").value = "工作地址";
  worksheet.getCell("B1").value = "客户标签";
  cloneAllTags.value.forEach((item, index) => {
    if (item.tag_list && item.tag_list.length) {
      worksheet.getCell(
        String.fromCharCode("A".charCodeAt(0) + index + 1) + "1"
      ).value = item.name;
    }
  });

  const names = cloneAllTags.value.map(item => {
    return item.tag_list && item.tag_list.length && item.tag_list[0].name;
  });

  worksheet.addRow([
    // "测试客户",
    18676186777,
    // "深圳市南山区",
    // "867932@qq.com",
    // "weixin",
    // "wecom",
    // "88888",
    // "深圳市南山区",
    // "深圳市南山区",
    ...names
  ]);

  const worksheet2 = workbook.addWorksheet("Sheet2");

  if (cloneAllTags.value.length) {
    worksheet2.getColumn("A").values = cloneAllTags.value[0].tag_list.map(
      item => item.name
    );

    const sliceData = cloneAllTags.value.slice(1);
    sliceData.map((item, index) => {
      worksheet2.getColumn(
        String.fromCharCode("A".charCodeAt(0) + index + 1)
      ).values = item.tag_list.map(i => i.name);
    });

    const col = worksheet.getColumn("B");
    col.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
      cell.dataValidation = {
        type: "list",
        allowBlank: true,
        // 多选配置
        formulae: ["=Sheet2!$A:$A"]
      };
    });

    sliceData.map((item, index) => {
      const col = worksheet.getColumn(
        String.fromCharCode("B".charCodeAt(0) + index + 1)
      );
      col.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        cell.dataValidation = {
          type: "list",
          allowBlank: true,
          // 多选配置
          formulae: [
            "=Sheet2!$" +
              String.fromCharCode("A".charCodeAt(0) + index + 1) +
              ":$" +
              String.fromCharCode("A".charCodeAt(0) + index + 1)
          ]
        };
      });
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.target = "_blank";
  link.href = url;
  link.download = `客户批量模版文件.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
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
const mulCurrentPage = ref(1);
const mulTotal = ref(0);

const handleMulCancel = () => {
  mulTableData.value = [];
  mulCurrentPage.value = 1;
  mulTotal.value = 0;
  mulDialogVisiable.value = false;
};

const visiableMul = computed(() => {
  return mulTableData.value.slice(
    (mulCurrentPage.value - 1) * 10,
    mulCurrentPage.value * 10
  );
});

const handleCurrentChangeMul = (val: number) => {
  mulCurrentPage.value = val;
};

const handleMul = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept =
    ".xls,.xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";
  input.onchange = (e: any) => {
    const fileread = new FileReader();
    // 判断文件类型
    if (!/\.xls$|\.xlsx$/.test(e.target.files[0].name.toLowerCase())) {
      message("请导入excel", { type: "info" });
      return;
    }
    fileread.onload = ev => {
      const data = new Uint8Array(ev.target.result as any);
      const workbook = XLSX.read(data, { type: "array" });
      const wsname = workbook.SheetNames[0]; // 取第一张表
      const ws = XLSX.utils.sheet_to_json(workbook.Sheets[wsname]); // 生成 JSON 格式的表格内容
      if (ws.length) {
        const data = replaceKey(ws);
        const checktExcel = data[0];
        let flag = false;
        const keys = Object.values(keyMap);
        // 交集
        // Object.keys(checktExcel).map(key => {
        //   if (!keys.includes(key)) {
        //     flag = true;
        //   }
        // });
        // if (flag) {
        //   message("请使用正确的模版文件，下载模版文件并编辑进行导入", {
        //     type: "info"
        //   });
        //   return;
        // }
        const names = cloneAllTags.value.map(item => {
          return item.tag_list && item.tag_list.length && item.name;
        });
        data.forEach(item => {
          const namesKey = names;
          if (namesKey && namesKey.length) {
            namesKey.map(key => {
              const value = item[key];
              if (value) {
                delete item[key];
                const tags = value.split(",");
                if (!item.customer_tag_list) {
                  item.customer_tag_list = [];
                }
                item.customer_tag_list.push(
                  ...tagAllTags.value.filter(tag => tags.includes(tag.name))
                );
              }
            });
          }
        });
        mulTableData.value = data;
        mulTotal.value = data.length;

        mulDialogVisiable.value = true;
      }
      document.body.removeChild(input);
    };
    fileread.readAsArrayBuffer(e.target.files[0]);
  };
  document.body.appendChild(input);
  input.click();
};

const isFrocemul = ref(true);

const handleConfirmImport = () => {
  const customers = mulTableData.value.map(item => {
    const data = Object.assign({}, item);
    if (item.customer_tag_list && item.customer_tag_list.length) {
      data.customer_tag_list = item.customer_tag_list.map(i => ({
        tag_id: i.id,
        tag: i
      }));
    } else {
      data.customer_tag_list = [];
    }
    if (activeOrg.value) {
      data.customer_group_id = activeOrg.value;
    }
    return data;
  });
  const loading = ElLoading.service({
    lock: true,
    text: "导入中...",
    background: "rgba(0, 0, 0, 0.6)"
  });
  customerBatchCreate({ customers, force: isFrocemul.value })
    .then(res => {
      if (res.code === 200) {
        message("导入成功", { type: "success" });
        handleMulCancel();
        handleViewCustomer(true);
        // mutilTable.value.clearSelection();
      } else {
        message("导入失败", { type: "error" });
      }
      loading.close();
    })
    .catch(err => {
      message("导入失败", { type: "error" });
      loading.close();
    });
};

const selectList = ref([]);
const mutilTable = ref<any>(null);

const handleTableSelChange = (val: any) => {
  if (val.length) {
    selectList.value = val;
  } else {
    selectList.value = [];
  }
};

const StaffMulSelIds = ref([]);

const handleStaffMulSel = (val: any) => {
  if (val.length) {
    StaffMulSelIds.value = val.map(item => item.id);
  } else {
    StaffMulSelIds.value = [];
  }
};

const customerdialogData = ref<any>({
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

const customerDialogVisiable = ref(false);
const customerEdit = ref(false);
const currentCustomerInfo = ref<any>();

const handleCustomerCancel = () => {
  Object.values(customerdialogData.value).forEach((item: any) => {
    item.value = "";
  });
  customerEdit.value = false;
  currentCustomerInfo.value = null;
  customerDialogVisiable.value = false;
};

const handleEditCustomer = (item: any) => {
  Object.keys(customerdialogData.value).map(key => {
    customerdialogData.value[key].value = item[key];
  });
  customerEdit.value = true;
  currentCustomerInfo.value = item;
  customerDialogVisiable.value = true;
};

const handleConfirmCustomer = () => {
  let flag = false;
  Object.values(customerdialogData.value).some((item: any) => {
    if ((item as any).is_require && !item.value) {
      message(`请输入${item.label}`, { type: "info" });
      flag = true;
      return true;
    }
  });
  if (
    customerdialogData.value.phone.value &&
    !/^1[3456789]\d{9}$/.test(customerdialogData.value.phone.value)
  ) {
    message(`请输入正确手机号`, { type: "info" });
    flag = true;
  }
  if (
    customerdialogData.value.email.value &&
    !/^(\w*\.*)+@(\w-?)+(\.\w{2,3}){1,2}$/.test(
      customerdialogData.value.email.value
    )
  ) {
    message(`请输入正确邮箱`, { type: "info" });
    flag = true;
  }
  if (!flag) {
    const data: any = {};
    Object.keys(customerdialogData.value).forEach(key => {
      data[key] = customerdialogData.value[key].value;
    });
    if (customerEdit.value) {
      data.id = currentCustomerInfo.value.id;
    }
    const func = customerEdit.value ? customerUpte : customerBatchCreate;
    const sendData = customerEdit.value
      ? Object.assign(currentCustomerInfo.value, { ...data })
      : { customers: [data], force: true };
    func(sendData)
      .then(res => {
        if (res.code === 200) {
          message(customerEdit.value ? "编辑成功" : "添加成功", {
            type: "success"
          });
          handleViewCustomer(true);
          handleCustomerCancel();
          mutilTable.value.clearSelection();
        } else {
          message(customerEdit.value ? "编辑失败" : "添加失败", {
            type: "error"
          });
        }
      })
      .catch(err => {
        if (err?.response?.data?.msg) {
          message(err?.response?.data?.msg, { type: "error" });
        } else {
          message(customerEdit.value ? "编辑失败" : "添加失败", {
            type: "error"
          });
        }
      });
  }
};

const handleDelCustomer = (item: any) => {
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
          handleViewCustomer(true);
          mutilTable.value.clearSelection();
        } else {
          message("删除失败", { type: "error" });
        }
      });
    })
    .catch(() => {});
};

const recordDialog = ref(false);
const tagGroup = ref("");
const tagGroupCheckitems = ref([]);
const tagDialogVisiable = ref(false);

const handleFlowDetail = (item: any) => {
  currentCustomerInfo.value = item;
  recordDialog.value = true;
};

const handleEditTag = (item: any) => {
  currentCustomerInfo.value = item;
  if (item.customer_tag_list && item.customer_tag_list.length) {
    tagGroupCheckitems.value = item.customer_tag_list.map(i => i.tag);
    tagGroup.value = tagGroupCheckitems.value.map(i => i.name).join("、");
  }
  tagDialogVisiable.value = true;
};

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

const handleConfirmTag = () => {
  if (tagGroupCheckitems.value.length === 0) {
    message("请选择标签");
    return;
  }
  const data = Object.assign({}, { ...currentCustomerInfo.value });
  data.customer_tag_list = tagGroupCheckitems.value.map(i => ({
    tag_id: i.id
  }));
  customerUpte(data)
    .then(res => {
      if (res.code === 200) {
        message("设置成功", { type: "success" });
        handleTagCancel();
        handleViewCustomer(true);
      } else {
        message("设置失败", { type: "error" });
      }
    })
    .catch(err => {
      message(err?.response?.data?.msg || "设置失败", { type: "error" });
      // message("设置失败", { type: "error" });
    });
};

const handleMulDel = async () => {
  if (!selectList.value.length) {
    message("请选择要删除的客户", { type: "info" });
    return;
  }
  const urls = selectList.value.map(item =>
    Object.assign(item, { is_deleted: true })
  );

  ElMessageBox.confirm("确认删除选择的客户?", "提示", {
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      batchDelCustomer({
        customer_id_str_list: urls.map(item => item.id),
        state: 1
      })
        .then(res => {
          if (res.code === 200) {
            if (!res.data.reason) {
              message("删除成功", { type: "success" });
              handleViewCustomer();
              mutilTable.value.clearSelection();
            } else {
              message(res.data.reason, { type: "error" });
            }
          }
        })
        .catch(err => {
          message(err?.response?.data?.msg || "删除失败", { type: "error" });
        });
    })
    .catch(() => {});
};

const mulNumVisiable = ref(false);
const mulNumber = ref(1);

const handleMulNumberCancel = () => {
  mulNumber.value = 1;
  mulNumVisiable.value = false;
};

const mulNumTableVisiable = ref(false);
const mulNumTableData = ref<any[]>([]);
const mutilTableref = ref<any>(null);
const selMulNum = ref([]);
const currentPageNum = ref(1);
const pageSizeNum = ref(10);
const totalNum = ref(0);
const showMulLoading = ref(false);

const mulNumTableDataVis = computed(() => {
  if (mulNumTableData.value.length) {
    return mulNumTableData.value.slice(
      (currentPageNum.value - 1) * pageSizeNum.value,
      currentPageNum.value * pageSizeNum.value
    );
  }
  return [];
});

const handleSizeChangeNum = (val: number) => {
  pageSizeNum.value = val;
};

const handleCurrentChangeNum = (val: number) => {
  currentPageNum.value = val;
};

const handleMulNumberTableCancel = () => {
  mulNumTableVisiable.value = false;
  totalNum.value = 0;
  currentPageNum.value = 1;
  pageSizeNum.value = 10;
  selMulNum.value = [];
  mulNumTableData.value = [];
};

const handleSelectionChangeMul = (val: any) => {
  if (val.length) {
    selMulNum.value = val;
  } else {
    selMulNum.value = [];
  }
};

const handleConfrimNumber = () => {
  mulNumVisiable.value = false;
  showMulLoading.value = true;
  mulNumTableVisiable.value = true;
  setTimeout(() => {
    mutilTableref.value.clearSelection();
  }, 100);

  const info: any = {
    condition: {
      info: {
        is_deleted: false,
        customer_group: { id: currentInfo.value.id }
      }
    },
    page: {
      limit: mulNumber.value,
      offset: 0
    }
  };
  customerQuery(info)
    .then(res => {
      if (res.code === 200 && res.data) {
        mulNumTableData.value = res.data.customers || [];
        if (mulNumTableData.value.length) {
          mulNumTableData.value = mulNumTableData.value.filter(
            item => !item.is_deleted
          );
          mulNumTableData.value.map(item => {
            mutilTableref.value.toggleRowSelection(item, true);
          });
        }
        totalNum.value = mulNumTableData.value.length || 0;
      } else {
        totalNum.value = 0;
        mulNumTableData.value = [];
      }
    })
    .catch(() => {
      totalNum.value = 0;
      mulNumTableData.value = [];
    })
    .finally(() => {
      showMulLoading.value = false;
    });
};

const handleMulTableDel = () => {
  ElMessageBox.confirm("确认删除选择的客户?", "提示", {
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      batchDelCustomer({
        customer_id_str_list: selMulNum.value.map(item => item.id),
        state: 1
      })
        .then(res => {
          if (res.code === 200) {
            if (!res.data.reason) {
              message("删除成功", { type: "success" });
              handleMulNumberTableCancel();
              handleViewCustomer();
              mutilTable.value.clearSelection();
            } else {
              message(res.data.reason, { type: "error" });
            }
          }
        })
        .catch(err => {
          message(err?.response?.data?.msg || "删除失败", { type: "error" });
        });
    })
    .catch(() => {});
};
</script>

<template>
  <div
    class="p-4 py-1 bg-white rounded-lg flex h-[calc(100%-30px)] w-full content-start"
  >
    <div
      class="w-[220px] h-full border-r border-r-slate-100 flex flex-col gap-2 pr-2 max-phone:hidden"
    >
      <el-button
        v-if="actions.includes('CreateCustomerAction')"
        type="primary"
        bg
        text
        @click="dialogVisiable = true"
        >创建客户分组</el-button
      >
      <div
        v-for="item in orgList"
        :key="item.id"
        class="rounded-md hover:bg-[#f5f7fa] p-2 w-full text-sm flex items-center"
        :class="{ 'bg-[#f5f7fa]': item.id === activeOrg }"
        @click="selOrg(item)"
      >
        {{ item.name }}
        <div class="ml-auto flex">
          <svg
            v-if="actions.includes('CreateCustomerAction')"
            class="w-4 h-4 mr-2 text-gray-400 hover:text-slate-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1024 1024"
            data-v-ea893728=""
            @click.stop="handleEdit(item)"
          >
            <path
              fill="currentColor"
              d="M832 512a32 32 0 1 1 64 0v352a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h352a32 32 0 0 1 0 64H192v640h640z"
            />
            <path
              fill="currentColor"
              d="m469.952 554.24 52.8-7.552L847.104 222.4a32 32 0 1 0-45.248-45.248L477.44 501.44l-7.552 52.8zm422.4-422.4a96 96 0 0 1 0 135.808l-331.84 331.84a32 32 0 0 1-18.112 9.088L436.8 623.68a32 32 0 0 1-36.224-36.224l15.104-105.6a32 32 0 0 1 9.024-18.112l331.904-331.84a96 96 0 0 1 135.744 0z"
            />
          </svg>
          <svg
            v-if="actions.includes('CreateCustomerAction')"
            class="w-4 h-4 text-gray-400 hover:text-slate-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1024 1024"
            data-v-ea893728=""
            @click.stop="handleDel(item.id)"
          >
            <path
              fill="currentColor"
              d="M160 256H96a32 32 0 0 1 0-64h256V95.936a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32V192h256a32 32 0 1 1 0 64h-64v672a32 32 0 0 1-32 32H192a32 32 0 0 1-32-32zm448-64v-64H416v64zM224 896h576V256H224zm192-128a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32m192 0a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32"
            />
          </svg>
        </div>
      </div>
    </div>
    <el-drawer
      v-model="showBar"
      :direction="'ltr'"
      :size="220"
      :with-header="false"
      :lock-scroll="false"
    >
      <div>
        <el-button
          v-if="actions.includes('CreateCustomerAction')"
          type="primary"
          bg
          text
          @click="dialogVisiable = true"
          >创建客户分组</el-button
        >
        <div
          v-for="item in orgList"
          :key="item.id"
          class="rounded-md hover:bg-[#f5f7fa] p-2 w-full mt-2 text-sm flex items-center"
          :class="{ 'bg-[#f5f7fa]': item.id === activeOrg }"
          @click="selOrg(item)"
        >
          {{ item.name }}
          <div class="ml-auto flex">
            <svg
              v-if="actions.includes('CreateCustomerAction')"
              class="w-4 h-4 mr-2 text-gray-400 hover:text-slate-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1024 1024"
              data-v-ea893728=""
              @click.stop="handleEdit(item)"
            >
              <path
                fill="currentColor"
                d="M832 512a32 32 0 1 1 64 0v352a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h352a32 32 0 0 1 0 64H192v640h640z"
              />
              <path
                fill="currentColor"
                d="m469.952 554.24 52.8-7.552L847.104 222.4a32 32 0 1 0-45.248-45.248L477.44 501.44l-7.552 52.8zm422.4-422.4a96 96 0 0 1 0 135.808l-331.84 331.84a32 32 0 0 1-18.112 9.088L436.8 623.68a32 32 0 0 1-36.224-36.224l15.104-105.6a32 32 0 0 1 9.024-18.112l331.904-331.84a96 96 0 0 1 135.744 0z"
              />
            </svg>
            <svg
              v-if="actions.includes('CreateCustomerAction')"
              class="w-4 h-4 text-gray-400 hover:text-slate-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1024 1024"
              data-v-ea893728=""
              @click.stop="handleDel(item.id)"
            >
              <path
                fill="currentColor"
                d="M160 256H96a32 32 0 0 1 0-64h256V95.936a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32V192h256a32 32 0 1 1 0 64h-64v672a32 32 0 0 1-32 32H192a32 32 0 0 1-32-32zm448-64v-64H416v64zM224 896h576V256H224zm192-128a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32m192 0a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32"
              />
            </svg>
          </div>
        </div>
      </div>
    </el-drawer>
    <topCollapse
      class="phone:hidden absolute max-phone:ml-[-25px] top-3.5"
      @toggleClick="showBar = true"
    />
    <div class="w-[calc(100%-220px)] px-2 flex flex-col max-phone:w-full">
      <div class="flex items-center">
        <span class="border-l-[#ff922b] border-l-4 text-sm pl-1 rounded"
          >客户</span
        >

        <el-button
          v-if="actions.includes('CreateCustomerAction')"
          class="ml-2"
          type="default"
          size="small"
          @click="handleMul"
          >批量导入</el-button
        >
        <div
          class="ml-2 text-sm text-sky-500 underline hover:text-cyan-700 cursor-default"
          @click="exportExcel"
        >
          模版文件
        </div>

        <el-button
          type="default"
          class="w-[100px] ml-auto"
          @click="accountListShow = true"
          >客户分组员工</el-button
        >
        <el-button
          v-if="actions.includes('CreateAllocationConfig')"
          type="default"
          class="w-[100px]"
          @click="handleSetRule"
          >配置领取员工</el-button
        >
        <el-button
          v-if="actions.includes('CreateAllocationConfig')"
          type="default"
          class="w-[100px]"
          @click="handleSetRulenew"
          >设置领取规则</el-button
        >
      </div>
      <el-table
        ref="mutilTable"
        :data="customerList"
        header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
        style="width: 100%"
        class="flex-1 mt-2"
        :row-key="
          row => {
            return row.id;
          }
        "
        @selection-change="handleTableSelChange"
      >
        <el-table-column type="selection" reserve-selection width="30" />
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
        <el-table-column label="跟进员工" width="160">
          <template #default="props">
            <template
              v-if="
                props.row.owner_pool_list && props.row.owner_pool_list.length
              "
            >
              <div class="flex items-center flex-wrap gap-2 mb-2 w-full">
                <div
                  v-for="(item, idx) in props.row.owner_pool_list"
                  :key="idx"
                  class="p-1 px-2 text-xs rounded-md bg-[#f5f5f5] text-[#303841]"
                >
                  {{ item.staff_owner.name || item.staff_owner.account }}
                </div>
              </div>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="phone" width="140" label="手机" />
        <el-table-column prop="company" width="180" label="公司" />
        <el-table-column prop="wechat" label="微信" />
        <el-table-column prop="wecom" label="企业微信" />
        <el-table-column prop="qq" label="QQ" />
        <el-table-column label="创建时间" width="200" sortable>
          <template #default="props">
            {{ dayjs(props.row.created_at * 1000).format("YYYY-MM-DD HH:mm") }}
          </template>
        </el-table-column>
        <el-table-column #default="props" label="操作" fixed="right" width="80">
          <el-dropdown trigger="click">
            <el-icon :size="20"><More /></el-icon>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-if="actions.includes('UpdateCustomerAction')"
                  :icon="Edit"
                  @click="handleEditCustomer(props.row)"
                  >编辑</el-dropdown-item
                >
                <el-dropdown-item
                  :icon="Memo"
                  @click="handleFlowDetail(props.row)"
                  >操作记录</el-dropdown-item
                >
                <el-dropdown-item
                  v-if="actions.includes('CreateCustomerAction')"
                  :icon="Delete"
                  @click="handleDelCustomer(props.row)"
                  >删除</el-dropdown-item
                >
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-table-column>
      </el-table>
      <div class="mt-1 justify-between flex">
        <div class="flex items-center">
          <el-button
            v-if="actions.includes('CreateCustomerAction')"
            type="primary"
            :disabled="!selectList.length"
            @click="handleMulDel"
            >批量删除</el-button
          >
          <div
            class="text-amber-500 hover:text-amber-400 cursor-default ml-2 text-sm"
            @click="mulNumVisiable = true"
          >
            按数量删除
          </div>
        </div>
        <el-pagination
          v-if="customerTotal"
          v-model:current-page="customerCurrentPage"
          class="flex-wrap gap-y-2 mt-4"
          :default-page-size="10"
          background
          layout="total, prev, pager, next, jumper"
          :total="customerTotal"
          @current-change="handleChangeCustomerPage"
        />
      </div>
    </div>

    <!-- 创建客户分组子 -->
    <el-dialog
      v-model="dialogVisiable"
      :title="isEdit ? '编辑客户分组' : '创建客户分组'"
      width="400"
      align-center
      @closed="handleCancelCreate"
    >
      <el-form class="demo-form-inline">
        <el-form-item label="客户分组名称">
          <el-input
            v-model="formdData.name"
            placeholder="请输入客户分组名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="分组描述">
          <el-input
            v-model="formdData.description"
            placeholder="请输入分组描述"
            clearable
          />
          <!-- <el-select
            v-model="formdData.tagOptions"
            multiple
            placeholder="请选择"
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="3"
            filterable
            style="width: 240px"
          >
            <el-option-group
              v-for="group in options"
              :key="group.id"
              :label="group.name"
            >
              <el-option
                v-for="item in group.children"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-option-group>
          </el-select> -->
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancelCreate">取消</el-button>
          <el-button type="primary" @click="confirmCreate">
            {{ isEdit ? "确认修改" : "确认创建" }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="ruleVisiable"
      title="配置领取员工"
      width="800"
      align-center
      @closed="ruleCancel"
    >
      <el-table
        header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
        :data="accountList"
        style="width: 100%; max-height: 400px"
        class="flex-1 mt-2"
        @selection-change="handleStaffMulSel"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="account" label="账号" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="phone" label="手机" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column label="创建时间">
          <template #default="scope">
            {{ dayjs(+scope.row.created_at * 1000).format("YYYY-MM-DD HH:mm") }}
          </template>
        </el-table-column>
        <!-- <el-table-column label="操作">
          <template #default="scope">
            <el-button
              v-if="actions.includes('CreateCustomerAction')"
              link
              type="danger"
              @click="handleDelFromPool(scope.row)"
            >
              移除</el-button
            >
          </template>
        </el-table-column> -->
      </el-table>
      <!-- <div class="mt-2 flex justify-between">
        <el-button
          v-if="actions.includes('CreateCustomerAction')"
          type="primary"
          :disabled="!selMulIds.length"
          @click="hanldeMulDel"
          >批量删除</el-button
        >
      </div> -->
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="ruleCancel">取消</el-button>
          <el-button type="primary" @click="confirmRule"> 确认配置 </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="accountListShow"
      title="该客户分组员工"
      width="800"
      align-center
    >
      <el-table
        header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
        :data="accountList"
        style="width: 100%; max-height: 400px"
        class="flex-1 mt-2"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="account" label="账号" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="phone" label="手机" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column label="创建时间">
          <template #default="scope">
            {{ dayjs(+scope.row.created_at * 1000).format("YYYY-MM-DD HH:mm") }}
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button
              v-if="actions.includes('CreateCustomerAction')"
              link
              type="danger"
              @click="handleDelFromPool(scope.row)"
            >
              移除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-2 flex justify-between">
        <el-button
          v-if="actions.includes('CreateCustomerAction')"
          type="primary"
          :disabled="!selMulIds.length"
          @click="hanldeMulDel"
          >批量删除</el-button
        >
        <!-- <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          class="flex-wrap gap-y-2"
          :page-sizes="[10, 20, 30, 40]"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        /> -->
      </div>
    </el-dialog>

    <el-dialog
      v-model="mulDialogVisiable"
      title="批量导入"
      width="700"
      @closed="handleMulCancel"
    >
      <el-table
        header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
        max-height="320"
        :data="visiableMul"
      >
        <el-table-column
          prop="name"
          fixed="left"
          label="客户名称"
          width="120"
        />
        <el-table-column label="客户标签" width="160">
          <template #default="props">
            <div class="flex items-center flex-wrap gap-2 mb-2 w-full">
              <template v-if="props.row.customer_tag_list">
                <div
                  v-for="item in props.row.customer_tag_list"
                  :key="item.id"
                  class="p-1 px-2 text-xs rounded-md bg-[#eeeeee] text-[#303841]"
                  :class="{ hidden: item.just_show_for_admin && !isAdmin }"
                >
                  {{ item.name }}
                </div>
              </template>
            </div>
          </template>
        </el-table-column>
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
          <el-pagination
            v-model:current-page="mulCurrentPage"
            class="flex-wrap gap-y-2 mt-4"
            background
            layout="total, prev, pager, next, jumper"
            :total="mulTotal"
            @current-change="handleCurrentChangeMul"
          />
          <el-checkbox v-model="isFrocemul" class="!mr-2">是否覆盖</el-checkbox>
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
      width="350"
      @closed="handleTagCancel"
    >
      <el-form inline>
        <el-form-item label="标签">
          <tagPop :checkedItems="tagGroupCheckitems" @change="tagGroupChange">
            <el-input
              v-model="tagGroup"
              style="width: 280px"
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

    <recrodDialog
      :show="recordDialog"
      :info="currentCustomerInfo"
      @close="recordDialog = false"
    />

    <el-dialog
      v-model="customerDialogVisiable"
      :title="customerEdit ? '客户信息' : '添加客户'"
      width="400"
      align-center
      @closed="handleCustomerCancel"
    >
      <div class="overflow-auto" style="max-height: 400px">
        <el-form label-position="right" class="demo-form-inline">
          <el-form-item
            v-for="(item, key) in customerdialogData"
            :key="key"
            :label="item.label"
          >
            <el-input
              v-model="item.value"
              :type="item.type"
              :disabled="item.disabled && customerEdit"
              :placeholder="'请输入' + item.label"
              clearable
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCustomerCancel">取消</el-button>
          <el-button type="primary" @click="handleConfirmCustomer">
            {{ customerEdit ? "确认修改" : "添加客户" }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="mulNumVisiable"
      title="按数量批量删除"
      width="350"
      @closed="handleMulNumberCancel"
    >
      <div class="flex flex-col">
        <div class="mb-2">请输入删除前多少条数据:</div>
        <el-input-number
          v-model="mulNumber"
          style="width: 200px"
          placeholder="请输入"
        />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleMulNumberCancel">取消</el-button>
          <el-button type="primary" @click="handleConfrimNumber">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="mulNumTableVisiable"
      title="客户数据"
      width="700"
      @closed="handleMulNumberTableCancel"
    >
      <el-button
        class="mb-2"
        type="primary"
        :disabled="!selMulNum.length"
        @click="handleMulTableDel"
        >确认删除</el-button
      >
      <el-table
        ref="mutilTableref"
        v-loading="showMulLoading"
        :data="mulNumTableDataVis"
        header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
        style="width: 100%"
        :height="400"
        class="flex-1"
        :row-key="
          row => {
            return row.id;
          }
        "
        @selection-change="handleSelectionChangeMul"
      >
        <el-table-column type="selection" reserve-selection width="30" />
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
              <!-- <el-icon
                v-if="actions.includes('UpdateCustomerAction')"
                class="!text-zinc-600 hover:!text-zinc-400"
                :size="18"
                @click="handleEditTag(props.row)"
                ><EditPen
              /></el-icon> -->
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
        <el-table-column label="跟进员工" width="160">
          <template #default="props">
            <template
              v-if="
                props.row.owner_pool_list && props.row.owner_pool_list.length
              "
            >
              <div class="flex items-center flex-wrap gap-2 mb-2 w-full">
                <div
                  v-for="(item, idx) in props.row.owner_pool_list"
                  :key="idx"
                  class="p-1 px-2 text-xs rounded-md bg-[#f5f5f5] text-[#303841]"
                >
                  {{ item.staff_owner.name || item.staff_owner.account }}
                </div>
              </div>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="phone" width="140" label="手机" />
        <el-table-column prop="company" width="180" label="公司" />
        <el-table-column prop="wechat" label="微信" />
        <el-table-column prop="wecom" label="企业微信" />
        <el-table-column prop="qq" label="QQ" />
        <el-table-column label="创建时间" width="200" sortable>
          <template #default="props">
            {{ dayjs(props.row.created_at * 1000).format("YYYY-MM-DD HH:mm") }}
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-4">
        <el-pagination
          v-if="totalNum"
          v-model:current-page="currentPageNum"
          v-model:page-size="pageSizeNum"
          class="flex-wrap gap-y-2"
          :page-sizes="[10, 20, 30, 40]"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalNum"
          @size-change="handleSizeChangeNum"
          @current-change="handleCurrentChangeNum"
        />
      </div>
    </el-dialog>

    <el-dialog
      v-model="ruleVisiablenew"
      title="配置领取规则"
      width="400"
      align-center
      @closed="ruleCancelnew"
    >
      <el-form class="demo-form-inline">
        <el-form-item label="每次领取个数">
          <el-input-number
            v-model="ruleData.number_per_time"
            :step="1"
            :min="0"
          />
        </el-form-item>
        <el-form-item label="每天领取次数">
          <el-input-number
            v-model="ruleData.times_per_day"
            :step="1"
            :min="0"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="ruleCancelnew">取消</el-button>
          <el-button type="primary" @click="confirmRulenew"> 确认 </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
