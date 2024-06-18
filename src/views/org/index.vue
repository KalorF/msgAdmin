<script lang="ts" setup>
import {
  getAllOrg,
  createOrg,
  updateOrg,
  delOrg,
  orgGet
} from "@/api/organization";
import {
  getAccountlistByOrg,
  getAccountByName,
  postAccountUpdate
} from "@/api/account";
import {
  poolList,
  staffConfigGet,
  staffConfigUpsert,
  getpoolList,
  poolSetStaff
} from "@/api/alloc";
import { ref, reactive, onMounted, watch, computed } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import dayjs from "dayjs";
import policyDialog from "@/components/policy/index.vue";
import { getUserChapterList } from "@/api/chapter";
import examDialog from "@/components/examDialog/index.vue";
import { usePermissionActionStroe } from "@/store/modules/permission";
import topCollapse from "@/layout/components/sidebar/topCollapse.vue";
import { Plus } from "@element-plus/icons-vue";

const orgList = ref([]);
const myorg = ref();
const dialogVisiable = ref(false);
const isEdit = ref(false);
const orgName = ref("");
const curId = ref("");
const activeOrg = ref("");
const accountList = ref([]);
const pageSize = ref(10);
const currentPage = ref(1);
const total = ref(0);
const pool = ref([]);
const allStaffList = ref([]);

const permission = usePermissionActionStroe();
const actions = computed(() => permission.value);

const getpoolListPost = () => {
  getpoolList()
    .then(res => {
      if (res.code === 200) {
        if (
          res.data &&
          res.data.allocation_pool_list &&
          res.data.allocation_pool_list.length
        ) {
          pool.value = res.data.allocation_pool_list;
          const list = [];
          res.data.allocation_pool_list.map(item => {
            list.push(...item.staff_allocation_list);
          });
          allStaffList.value = list;
        } else {
          pool.value = [];
        }
      }
    })
    .catch(() => (pool.value = []));
};

const getAccountData = () => {
  getAccountlistByOrg({
    orgId: activeOrg.value,
    limit: pageSize.value,
    offset: currentPage.value - 1
  }).then(res => {
    if (res.code === 200) {
      accountList.value = res.data.accounts || [];
      total.value = res.data.count || 0;
    }
  });
};

const getallOrgData = () => {
  return getAllOrg().then(res => {
    if (res.code === 200) {
      const orgdata = res.data.filter(item => !item.is_deleted);
      // 梳妆结构
      const tree = (data: any, pid: string, pendding = 0) => {
        return data
          .filter((item: any) => item.parent_id === pid)
          .map((item: any) => {
            item.pendding = pendding;
            const children = tree(data, item.id, pendding + 1);
            if (children.length) {
              item.children = children;
            }
            return item;
          });
      };
      const treeData = tree(orgdata, "0");
      // 扁平化树并体现层级结构
      const flat = (data: any, level = 0) => {
        return data.reduce((prev: any, item: any) => {
          prev.push({ ...item, level });
          if (item.children) {
            prev.push(...flat(item.children, level + 1));
          }
          return prev;
        }, []);
      };
      orgList.value = flat(treeData);
    }
  });
};

// const isSub = ref(false);

const handleCancelCreate = () => {
  dialogVisiable.value = false;
  setTimeout(() => {
    selSubId.value = "";
    isEdit.value = false;
    orgName.value = "";
  }, 250);
};

const confirmCreate = () => {
  if (orgName.value === "") {
    ElMessage.info("请输入组织名称");
  } else {
    const func = isEdit.value ? updateOrg : createOrg;
    const data = isEdit.value
      ? { name: orgName.value, id: curId.value, parent_id: myorg.value.id }
      : {
          name: orgName.value,
          parent_id: selSubId.value || myorg.value.id
        };
    func({ ...data })
      .then(res => {
        if (res.code === 200) {
          ElMessage.success(isEdit.value ? "修改成功" : "创建成功");
          handleCancelCreate();
          getallOrgData();
        } else {
          ElMessage.error(isEdit.value ? "修改失败" : "创建失败");
        }
      })
      .catch(err => {
        ElMessage.error(err?.response?.data?.msg || "操作失败");
        // ElMessage.error(err.msg);
      });
  }
};

const handleEdit = (item: any) => {
  isEdit.value = true;
  curId.value = item.id;
  orgName.value = item.name;
  dialogVisiable.value = true;
};

const handleDel = (id: string) => {
  ElMessageBox.confirm("确认删除该组织吗?", "提示", {
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      delOrg(id)
        .then(res => {
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

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  getAccountData();
};
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  getAccountData();
};

const selOrg = (id: string) => {
  pageSize.value = 10;
  currentPage.value = 1;
  total.value = 0;
  activeOrg.value = id;
};

const dialogSearch = ref(false);
const accountName = ref("");
const searchData = ref<any>(null);

const handleCancelSearch = () => {
  dialogSearch.value = false;
  accountName.value = "";
  searchData.value = null;
};

const handleSearch = () => {
  if (accountName.value === "") {
    ElMessage.info("请输入账号姓名");
  } else {
    getAccountByName(accountName.value)
      .then(res => {
        if (res.code === 200 && res.data) {
          searchData.value = res.data;
        } else {
          searchData.value = null;
        }
      })
      .catch(() => {
        searchData.value = null;
      });
  }
};

const noSearchData = computed(() => {
  return (
    searchData.value !== null ||
    (searchData.value && searchData.value.id === "0")
  );
});

const addAccount = () => {
  const data = Object.assign(searchData.value, {
    organization_id: activeOrg.value
  });
  data.organization.id = data.organization_id;
  delete data.password;
  postAccountUpdate(data)
    .then(res => {
      if (res.code === 200) {
        ElMessage.success("添加成功");
        handleCancelSearch();
        getAccountData();
      } else {
        ElMessage.error("添加失败");
      }
    })
    .catch(err => {
      ElMessage.error(err?.response?.data?.msg || "添加失败");
    });
};

const currentInfo = ref();
const policyShow = ref(false);

const handleEditAuth = (item: any) => {
  currentInfo.value = item;
  policyShow.value = true;
  // ElMessage({
  //   message: "功能开发中",
  //   type: "info",
  //   customClass: "pure-message"
  // });
};

const poolVisible = ref(false);
const isPoolEdit = ref(false);
const currentStaff = ref();
const poolSelect = ref();

const cancelPool = () => {
  isPoolEdit.value = false;
  poolVisible.value = false;
  currentStaff.value = null;
};

const handleAlloc = async (item: any) => {
  // const res = await staffConfigGet(item.id);
  // if (res.data) {
  //   poolSelect.value = res.data.condition_pool_id;
  // }
  const findItem = allStaffList.value.find(i => i.staff_id === item.id);
  if (findItem) {
    poolSelect.value = findItem.allocation_pool_id;
  } else {
    poolSelect.value = "";
  }
  currentStaff.value = item;
  poolVisible.value = true;
};

const handlePool = () => {
  // const edit = isPoolEdit.value;
  poolSetStaff({
    staff_id_str_list: [currentStaff.value.id],
    allocation_pool_id: poolSelect.value
  })
    .then(res => {
      if (res.code == 200) {
        ElMessage.success("操作成功");
        getpoolList();
        cancelPool();
      } else {
        ElMessage.error("操作失败");
      }
    })
    .catch(err => {
      ElMessage.error(err?.response?.data?.msg || "操作失败");
      // ElMessage.error("操作失败");
    });
};

onMounted(async () => {
  await getallOrgData();
  getpoolListPost();
  orgGet().then(res => {
    myorg.value = res.data;
  });
  activeOrg.value = orgList.value[0].id;
});

watch(activeOrg, () => {
  getAccountData();
});

const studyVisible = ref(false);
const studyInfo = ref(null);

const genStudyData = (data: any) => {
  const list = {};
  data.map((item: any) => {
    const course = item.Chapter.Course;
    const chapter = item.Chapter;
    delete chapter.Course;
    if (!list[course.id]) {
      list[course.id] = {
        course: course,
        chapter: [{ ...chapter, status: item.status }]
      };
    } else {
      list[course.id].chapter.push({ ...chapter, status: item.status });
    }
  });
  Object.values(list).forEach((item: any) => {
    item.progress =
      item.chapter.filter(i => i.status === 1).length / item.chapter.length;
  });
  return list;
};

const getStudyInfo = () => {
  getUserChapterList({
    uid: currentInfo.value.id,
    chapter_id_list: []
  })
    .then(res => {
      if (res.code === 200) {
        studyInfo.value = genStudyData(res.data);
      } else {
        studyInfo.value = null;
      }
    })
    .catch(() => {
      studyInfo.value = null;
    });
};

const cancelStudy = () => {
  studyInfo.value = null;
  studyVisible.value = false;
};

const handleViewStudy = (item: any) => {
  currentInfo.value = item;
  getStudyInfo();
  studyVisible.value = true;
};

const progressformat = (prg: any) => {
  const percentage = +(prg * 100).toFixed(0);
  return percentage === 100 ? "100%" : (`${percentage}%` as any);
};

const selSubId = ref("");

const handleSubAdd = (item: any) => {
  selSubId.value = item.id;
  // isSub.value = true;
  dialogVisiable.value = true;
};

const showExamDialog = ref(false);

const handleViewExam = (item: any) => {
  currentInfo.value = item;
  showExamDialog.value = true;
};

const showBar = ref(false);
</script>

<template>
  <div class="p-4 py-1 bg-white rounded-lg flex h-[calc(100%-30px)] w-full">
    <div
      class="w-[300px] h-full border-r border-r-slate-100 flex flex-col gap-2 pr-2 max-phone:hidden"
    >
      <el-button
        v-if="actions.includes('CreateOrganization')"
        type="primary"
        bg
        text
        @click="dialogVisiable = true"
        >创建组织</el-button
      >
      <div
        v-for="item in orgList"
        :key="item.id"
        class="rounded-md hover:bg-[#f5f7fa] p-2 w-full text-sm flex items-center"
        :class="{ 'bg-[#f5f7fa]': item.id === activeOrg }"
        :style="{ paddingLeft: `${(item.level + 1) * 8}px` }"
        @click="selOrg(item.id)"
      >
        {{ item.name }}
        <div class="ml-auto flex">
          <el-icon
            :size="16"
            class="!text-gray-400 hover:!text-slate-500 mr-2"
            @click.stop="handleSubAdd(item)"
            ><Plus
          /></el-icon>
          <svg
            v-if="actions.includes('UpdateOrganization')"
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
            v-if="actions.includes('DeleteOrganization')"
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
      :size="300"
      :with-header="false"
      :lock-scroll="false"
    >
      <el-button
        v-if="actions.includes('CreateOrganization')"
        type="primary"
        bg
        text
        @click="dialogVisiable = true"
        >创建组织</el-button
      >
      <div
        v-for="item in orgList"
        :key="item.id"
        class="rounded-md hover:bg-[#f5f7fa] p-2 w-full text-sm flex items-center mt-2"
        :class="{ 'bg-[#f5f7fa]': item.id === activeOrg }"
        :style="{ paddingLeft: `${(item.level + 1) * 8}px` }"
        @click="selOrg(item.id)"
      >
        {{ item.name }}
        <div class="ml-auto flex">
          <el-icon
            :size="16"
            class="!text-gray-400 hover:!text-slate-500 mr-2"
            @click.stop="handleSubAdd(item)"
            ><Plus
          /></el-icon>
          <svg
            v-if="actions.includes('UpdateOrganization')"
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
            v-if="actions.includes('DeleteOrganization')"
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
    </el-drawer>
    <topCollapse
      class="phone:hidden absolute max-phone:ml-[-25px] top-3.5"
      @toggleClick="showBar = true"
    />
    <div class="w-full px-2 flex flex-col">
      <div class="flex items-center">
        <span class="border-l-[#ff922b] border-l-4 text-sm pl-1 rounded"
          >组织成员</span
        >
        <el-button
          v-if="actions.includes('UpdateOrganization')"
          type="default"
          class="w-[100px] ml-auto"
          @click="dialogSearch = true"
          >添加账号</el-button
        >
      </div>
      <el-table
        header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
        :data="accountList"
        style="width: 100%"
        class="flex-1 mt-2"
      >
        <el-table-column prop="account" label="账号" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="phone" label="手机" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column label="学习情况">
          <template #default="scope">
            <el-button size="small" @click="handleViewStudy(scope.row)"
              >查看</el-button
            >
          </template>
        </el-table-column>
        <el-table-column label="考试情况">
          <template #default="scope">
            <el-button size="small" @click="handleViewExam(scope.row)"
              >查看</el-button
            >
          </template>
        </el-table-column>
        <el-table-column label="创建时间">
          <template #default="scope">
            {{ dayjs(+scope.row.created_at * 1000).format("YYYY-MM-DD HH:mm") }}
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button
              v-if="actions.includes('UpdateAccount')"
              link
              type="primary"
              @click="handleEditAuth(scope.row)"
            >
              编辑权限</el-button
            >
            <el-button
              v-if="actions.includes('CreateCustomerAction')"
              link
              type="info"
              @click="handleAlloc(scope.row)"
            >
              分配客户</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-2 flex justify-end">
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
    </div>

    <!-- 创建组织 -->
    <el-dialog
      v-model="dialogVisiable"
      :title="isEdit ? '修改组织名称' : '创建组织'"
      width="400"
      align-center
      @closed="handleCancelCreate"
    >
      <el-form class="demo-form-inline">
        <el-form-item label="组织名称">
          <el-input v-model="orgName" placeholder="请输入组织名称" clearable />
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

    <!-- 搜索弹窗 -->
    <el-dialog
      v-model="dialogSearch"
      title="添加账号"
      width="400"
      align-center
      @closed="handleCancelSearch"
    >
      <p class="text-gray-400 text-xs mb-2">*输入账号名称搜索后添加</p>
      <el-form inline class="demo-form-inline">
        <el-form-item label="姓名">
          <div class="flex">
            <el-input v-model="accountName" placeholder="请输入账号姓名" />
            <el-button class="ml-4" type="primary" @click="handleSearch"
              >搜索</el-button
            >
          </div>
        </el-form-item>
      </el-form>
      <div class="mt-1">
        <p v-if="noSearchData" class="text-zinc-400 text-xs">未找到用户</p>
        <div v-if="searchData && searchData.id !== '0'">
          <div
            class="w-full shadow h-20 border border-slate-100 rounded-md overflow-hidden hover:shadow-md flex"
          >
            <div class="h-full w-1 bg-[#ff922b]" />
            <div class="flex w-full">
              <div class="ml-4 pt-2 text-sm text-zinc-800">
                <p>姓名：{{ searchData.name }}</p>
                <p>账号：{{ searchData.account }}</p>
                <p>邮箱：{{ searchData.email }}</p>
              </div>
              <div
                class="ml-auto text-xs text-zinc-800 pr-2 pt-2 flex flex-col h-full"
              >
                <p class="flex items-center">
                  <svg
                    class="w-4 h-4 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1024 1024"
                    data-v-ea893728=""
                  >
                    <path
                      fill="currentColor"
                      d="M199.232 125.568 90.624 379.008a32 32 0 0 0 6.784 35.2l512.384 512.384a32 32 0 0 0 35.2 6.784l253.44-108.608a32 32 0 0 0 10.048-52.032L769.6 633.92a32 32 0 0 0-36.928-5.952l-130.176 65.088-271.488-271.552 65.024-130.176a32 32 0 0 0-5.952-36.928L251.2 115.52a32 32 0 0 0-51.968 10.048z"
                    />
                  </svg>
                  {{ searchData.phone }}
                </p>
                <el-button
                  type="primary"
                  class="mt-auto mb-3"
                  round
                  size="small"
                  @click="addAccount"
                  >添加账号</el-button
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 选择客户池 -->
    <el-dialog
      v-model="poolVisible"
      :title="isPoolEdit ? '编辑客户' : '分配客户'"
      width="400"
      align-center
      @closed="cancelPool"
    >
      <el-form class="demo-form-inline">
        <el-form-item label="客户池">
          <el-select
            v-model="poolSelect"
            placeholder="请选择"
            style="width: 240px"
          >
            <el-option
              v-for="item in pool"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelPool">取消</el-button>
          <el-button type="primary" @click="handlePool">
            {{ isPoolEdit ? "确认修改" : "确认创建" }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="studyVisible"
      :title="'学习情况'"
      width="600"
      align-center
      @closed="cancelStudy"
    >
      <div style="max-height: 500px" class="overflow-y-auto pb-2">
        <div v-for="(item, key) in studyInfo" :key="key" class="mb-4">
          <div
            class="flex items-center border-l-4 rounded border-[#FF9912] pl-2 content-start w-full study-progress"
          >
            {{ item.course.name }}
            <el-progress
              :text-inside="false"
              :stroke-width="7"
              :percentage="+(item.progress * 100).toFixed(0)"
              color="#62d2a2"
            />
          </div>
          <div class="mt-2 flex flex-wrap gap-4 content-start">
            <div
              v-for="c in item.chapter"
              :key="c.id"
              class="shadow w-[260px] bg-[#f5f5f5] hover:shadow-lg rounded-md px-4 flex items-center text-sm justify-between py-2"
              style="min-height: 40px"
            >
              <p class="flex-1 mr-2">
                {{ c.title }}
              </p>
              <p
                class="text-xs"
                :class="{
                  'text-[#f73859]': !c.status,
                  'text-[#32CD32]': c.status
                }"
              >
                {{ c.status ? "完成" : "未完成" }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
    <policyDialog
      :show="policyShow"
      :info="currentInfo"
      @close="policyShow = false"
    />
    <examDialog
      :info="currentInfo"
      :show="showExamDialog"
      @close="showExamDialog = false"
    />
  </div>
</template>

<style lang="scss">
.study-progress .el-progress--line {
  width: 200px;
  margin-left: 10px;
}
</style>
