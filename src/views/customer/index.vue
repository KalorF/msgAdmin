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
  customerBatchCreate,
  batchDelCustomer,
  customerGroupList
} from "@/api/customer";
import { getAllTags, getAllGroupTag, customerTagUpsert } from "@/api/tag";
import { getCallListByCustomer } from "@/api/call";
import { message } from "@/utils/message";
import { ref, reactive } from "vue";
import {
  Avatar,
  EditPen,
  More,
  Edit,
  Delete,
  Memo,
  Share,
  Sort,
  FolderOpened,
  User
} from "@element-plus/icons-vue";
import { onMounted, nextTick, computed } from "vue";
import { ElMessageBox, ElLoading } from "element-plus";
import dayjs from "dayjs";
import DelList from "./delList.vue";
import { useUserStoreHook } from "@/store/modules/user";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import tagPop from "@/components/tagPop/index.vue";
import recrodDialog from "@/components/recrodDialog/index.vue";
import orgDialog from "@/components/orgDialog/index.vue";
import queryViewDialog from "@/components/queryViewDialog/index.vue";
import {
  usePermissionActionStroe,
  usePermissionStoreHook
} from "@/store/modules/permission";
import { getAllOrg } from "@/api/organization";

defineOptions({
  name: "customerlist"
});

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
  create_at: "",
  range: []
});

const onSubmit = async () => {
  currentPage.value = 1;
  pageSize.value = 10;
  getDataNew();
  mutilTable.value.clearSelection();
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

const getDataNew = () => {
  const info: any = {
    condition: {
      // allocation: {
      //   staff_str_id_list: checkIds.value.map(i => ({ owner_id: i }))
      // },
      info: {
        is_deleted: false,
        name: formInline.user,
        company: formInline.company,
        phone: formInline.phone,
        updated_at: formInline.date ? (formInline.date as any) / 1000 : 0,
        // created_at: formInline.create_at
        //   ? (formInline.create_at as any) / 1000
        //   : 0,
        customer_tag_list: checkedItems.value.map(i => ({ tag_id: i.id })),
        owner_pool_list: checkIds.value.map(i => ({ owner_id: i })),
        customer_group: customerGroupVal.value
          ? { id: customerGroupVal.value }
          : null
      }
    },
    page: {
      limit: pageSize.value,
      offset: currentPage.value - 1
    }
  };
  if (formInline?.range?.length) {
    info.condition.created_at_begin = formInline.range[0] / 1000;
    info.condition.created_at_end = Math.floor(
      (formInline.range[1] + 86399999) / 1000
    );
  }
  customerQuery(info)
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
const isEdit = ref(false);

const dialogData = ref<any>({
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

const handleCancelCrete = () => {
  Object.values(dialogData.value).forEach((item: any) => {
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
  Object.values(dialogData.value).some((item: any) => {
    if ((item as any).is_require && !item.value) {
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
          mutilTable.value.clearSelection();
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
          mutilTable.value.clearSelection();
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

const keyMap = {
  企业微信: "wecom",
  公司: "company",
  地址: "address",
  客户名称: "name",
  客户手机: "phone",
  工作地址: "working_address",
  微信: "wechat",
  邮箱: "email",
  QQ: "qq"
};

const exportExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet1");
  worksheet.getCell("A1").value = "客户名称";
  worksheet.getCell("B1").value = "客户手机";
  worksheet.getCell("C1").value = "公司";
  worksheet.getCell("D1").value = "邮箱";
  worksheet.getCell("E1").value = "微信";
  worksheet.getCell("F1").value = "企业微信";
  worksheet.getCell("G1").value = "QQ";
  worksheet.getCell("H1").value = "地址";
  worksheet.getCell("I1").value = "工作地址";
  // worksheet.getCell("J1").value = "客户标签";
  cloneAllTags.value.forEach((item, index) => {
    if (item.tag_list && item.tag_list.length) {
      worksheet.getCell(
        String.fromCharCode("I".charCodeAt(0) + index + 1) + "1"
      ).value = item.name;
    }
  });

  const names = cloneAllTags.value.map(item => {
    return item.tag_list && item.tag_list.length && item.tag_list[0].name;
  });

  worksheet.addRow([
    "测试客户",
    18676186777,
    "深圳市南山区",
    "867932@qq.com",
    "weixin",
    "wecom",
    "88888",
    "深圳市南山区",
    "深圳市南山区",
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

    const col = worksheet.getColumn("J");
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
        String.fromCharCode("J".charCodeAt(0) + index + 1)
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
        keys.some(key => {
          const checkKey = Object.keys(checktExcel).includes(key);
          if (checkKey) {
            flag = true;
            return true;
          }
        });
        if (!flag) {
          message("请使用正确的模版文件，下载模版文件并编辑进行导入", {
            type: "info"
          });
          return;
        }
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

const isFrocemul = ref(false);

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
        getDataNew();
        mutilTable.value.clearSelection();
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
      message(err?.response?.data?.msg || "设置失败", { type: "error" });
      // message("设置失败", { type: "error" });
    });
};

const recordDialog = ref(false);
const orgDialogShow = ref(false);
const orgTitle = ref("");

const handleTran = (item: any) => {
  currentInfo.value = item;
  orgDialogShow.value = true;
  orgTitle.value = "转让客户";
};
const handleShare = (item: any) => {
  currentInfo.value = item;
  orgDialogShow.value = true;
  orgTitle.value = "分享客户";
};

const handleFlowDetail = (item: any) => {
  currentInfo.value = item;
  recordDialog.value = true;
};

const queryViewDialogShow = ref(false);

const dataSource = ref<any[]>([]);
const treeRef = ref<any | HTMLElement>(null);
const checkIds = ref([]);
const allStaff = ref([]);
const staffInputs = ref("");

const treeChange = () => {
  checkIds.value = treeRef.value.getCheckedKeys();
  staffInputs.value = allStaff.value
    .filter(item => checkIds.value.includes(item.id))
    .map(i => i.name || i.account)
    .join("、");
};

const getOrgStaffData = () => {
  getAllOrg().then(res => {
    if (res.data && res.data.length) {
      dataSource.value = res.data.filter(
        item => item.account_list && item.account_list.length
      );
      dataSource.value.forEach(item => {
        if (item.account_list) {
          item.children = item.account_list || [];
          allStaff.value.push(...item.children);
        }
      });
    }
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
              getDataNew();
              mutilTable.value.clearSelection();
            } else {
              message(res.data.reason, { type: "error" });
            }
          }
        })
        .catch(err => {
          message(err?.response?.data?.msg || "删除失败", { type: "error" });
        });
      // concurrencyRequest(customerUpte, urls, 5).then(res => {
      //   message("删除成功", { type: "success" });
      //   getDataNew();
      // });
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
        name: formInline.user,
        company: formInline.company,
        phone: formInline.phone,
        updated_at: formInline.date ? (formInline.date as any) / 1000 : 0,
        customer_tag_list: checkedItems.value.map(i => ({ tag_id: i.id })),
        owner_pool_list: checkIds.value.map(i => ({ owner_id: i }))
      }
    },
    page: {
      limit: mulNumber.value,
      offset: 0
    }
  };
  if (formInline?.range?.length) {
    info.condition.created_at_begin = formInline.range[0] / 1000;
    info.condition.created_at_end = Math.floor(
      (formInline.range[1] + 86399999) / 1000
    );
  }
  customerQuery(info)
    .then(res => {
      if (res.code === 200 && res.data) {
        mulNumTableData.value = res.data.customers || [];
        if (tableData.value.length) {
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
              getDataNew();
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

const customerGroupOptions = ref([]);
const customerGroupVal = ref("");

const getCustomerGroupList = () => {
  customerGroupList().then(res => {
    if (res.code === 200) {
      customerGroupOptions.value = res.data;
    }
  });
};

onMounted(() => {
  // getData();
  // getTagOptions();
  getDataNew();
  getAllTagsData();
  getOrgStaffData();
  getCustomerGroupList();
});
</script>

<template>
  <div class="p-4 bg-white rounded-lg flex flex-col h-[calc(100%-30px)]">
    <div class="flex items-center mb-4 max-phone:block">
      <!-- <el-button type="primary" @click="exportExcel">导出</el-button> -->
      <el-radio-group
        v-model="activeValue"
        size="small"
        fill="#ff9a00"
        @change="handleChangeActive"
      >
        <el-radio-button label="已有客户" value="has" />
        <el-radio-button label="被删除客户" value="del" />
      </el-radio-group>
      <el-button
        v-if="actions.includes('CreateCustomerAction') && activeValue === 'has'"
        class="ml-4"
        type="primary"
        size="small"
        text
        bg
        @click="queryViewDialogShow = true"
        >配置客户视图查询</el-button
      >
      <div
        v-if="activeValue === 'has'"
        class="ml-auto flex flex-wrap gap-1 relative max-phone:mt-2"
      >
        <el-button
          v-if="actions.includes('CreateCustomerAction')"
          class=""
          type="default"
          @click="dialogVisible = true"
          >添加客户</el-button
        >
        <div class="relative">
          <el-button
            v-if="actions.includes('CreateCustomerAction')"
            class="ml-auto"
            type="default"
            @click="handleMul"
            >批量导入</el-button
          >
        </div>
        <div
          class="absolute top-9 right-4 text-sm text-sky-500 underline hover:text-cyan-700 cursor-default"
          @click="exportExcel"
        >
          模版文件
        </div>
        <!-- <a
          v-if="actions.includes('CreateCustomerAction')"
          class="absolute top-9 right-4 text-sm text-sky-500 underline hover:text-cyan-700"
          href="https://abynn.oss-cn-shenzhen.aliyuncs.com/%E6%89%B9%E9%87%8F%E5%AE%A2%E6%88%B7-1715698399574.xlsx"
          download="模版文件.xlsx"
          target="view_window"
        >
          模版文件
        </a> -->
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
          <el-form-item label="客户分组">
            <el-select
              v-model="customerGroupVal"
              placeholder="请选择"
              clearable
              style="width: 200px"
            >
              <el-option
                v-for="item in customerGroupOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="跟进员工">
            <el-popover
              placement="bottom"
              class="!rounded-lg"
              :width="400"
              trigger="click"
            >
              <template #reference>
                <el-input v-model="staffInputs" placeholder="请选择" readonly />
              </template>
              <div class="overflow-auto max-h-80">
                <el-tree
                  ref="treeRef"
                  style="max-width: 600px"
                  :data="dataSource"
                  show-checkbox
                  node-key="id"
                  expand-on-click-node
                  @check="treeChange"
                >
                  <template #default="{ data }">
                    <div class="flex items-center">
                      <div class="flex items-center">
                        <el-icon
                          ><FolderOpened v-if="data.account_list" /><User
                            v-else /></el-icon
                        ><span class="ml-1">{{
                          data.name || data.account
                        }}</span>
                      </div>
                    </div>
                  </template>
                </el-tree>
              </div>
            </el-popover>
          </el-form-item>
          <!-- <el-form-item label="创建时间">
            <el-date-picker
              v-model="formInline.create_at"
              type="date"
              placeholder="请选择"
              value-format="x"
              clearable
            />
          </el-form-item> -->
          <el-form-item label="创建日期">
            <el-date-picker
              v-model="formInline.range"
              type="daterange"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="x"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSubmit">查询</el-button>
            <el-button type="default" @click="onReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
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
                  @click="handleEdit(props.row)"
                  >编辑</el-dropdown-item
                >
                <el-dropdown-item
                  :icon="Memo"
                  @click="handleFlowDetail(props.row)"
                  >操作记录</el-dropdown-item
                >
                <!-- <el-dropdown-item
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
                > -->
                <el-dropdown-item
                  v-if="actions.includes('CreateCustomerAction')"
                  :icon="Delete"
                  @click="handleDel(props.row)"
                  >删除</el-dropdown-item
                >
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <!-- <div class="flex flex-wrap content-start gap-y-1 gap-x-2">
            <el-button link type="info" @click="handleEdit(props.row)"
              >编辑</el-button
            > -->
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
          <!-- <div
              class="text-cyan-600 hover:text-cyan-300 cursor-default mr-2"
              @click="recordDialog = true"
            >
              跟进记录
            </div>
            <el-button
              class="!ml-0"
              link
              type="danger"
              @click="handleDel(props.row)"
              >删除</el-button
            >
          </div> -->
        </el-table-column>
      </el-table>
      <div class="mt-4 flex justify-between">
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
    </template>
    <DelList v-else />

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '客户信息' : '添加客户'"
      width="400"
      align-center
      @closed="handleCancelCrete"
    >
      <div class="overflow-auto" style="max-height: 400px">
        <el-form label-position="right" class="demo-form-inline">
          <el-form-item
            v-for="(item, key) in dialogData"
            :key="key"
            :label="item.label"
          >
            <el-input
              v-model="item.value"
              :type="item.type"
              :disabled="item.disabled && isEdit"
              :placeholder="'请输入' + item.label"
              clearable
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancelCrete">取消</el-button>
          <el-button type="primary" @click="handleConfirm">
            {{ isEdit ? "确认修改" : "添加客户" }}
          </el-button>
        </div>
      </template>
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

    <recrodDialog
      :show="recordDialog"
      :info="currentInfo"
      @close="recordDialog = false"
    />
    <orgDialog
      :show="orgDialogShow"
      :info="currentInfo"
      :title="orgTitle"
      @close="orgDialogShow = false"
    />
    <queryViewDialog
      :show="queryViewDialogShow"
      @close="queryViewDialogShow = false"
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
