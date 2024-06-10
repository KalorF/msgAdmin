<script lang="ts" setup>
import {
  getAccountlist,
  createAccount,
  delAccount,
  recoverAccount,
  postAccountUpdate,
  getAccountByAccount,
  postAccountUpdateStaffPwd
} from "@/api/account";
import { getAllOrg } from "@/api/organization";
import { ref, reactive, onMounted } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import dayjs from "dayjs";
import policyDialog from "@/components/policy/index.vue";

defineOptions({
  name: "accountlist"
});

const orgList = ref([]);

const getallOrgData = () => {
  return getAllOrg().then(res => {
    if (res.code === 200) {
      orgList.value = res.data.filter(item => !item.is_deleted);
    }
  });
};

const isEdit = ref(false);

const formInline = reactive({
  id: "",
  account: ""
});

const dialogData = ref({
  account: "",
  name: "",
  email: "",
  password: "",
  phone: "",
  organization_id: ""
});

const dialogVisible = ref(false);
const tableData = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const onSearch = () => {
  if (formInline.account === "") {
    ElMessage.info("请输入需要查询的账号");
    return;
  }
  getAccountByAccount(formInline.account)
    .then(res => {
      if (res.code === 200) {
        if (res.data) {
          currentPage.value = 1;
          total.value = 1;
          tableData.value = [res.data];
        }
      }
    })
    .catch(err => {
      ElMessage.error("账号不存在");
    });
};

const onReset = () => {
  getlistData();
};

const handledel = (id: string) => {
  ElMessageBox.confirm("确认删除该账号吗?", "提示", {
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      delAccount(id)
        .then(res => {
          if (res.code === 200) {
            ElMessage.success("删除成功");
            getlistData();
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

const handdleRecover = (id: string) => {
  recoverAccount(id)
    .then(res => {
      if (res.code === 200) {
        ElMessage.success("恢复成功");
        getlistData();
      } else {
        ElMessage.error("恢复失败");
      }
    })
    .catch(err => {
      ElMessage.error(err?.response?.data?.msg || "恢复失败");
    });
};

const getlistData = () => {
  getAccountlist({ limit: pageSize.value, offset: currentPage.value - 1 })
    .then(res => {
      tableData.value = res.data.accounts;
      total.value = res.data.count;
    })
    .catch(err => {
      console.error(err);
    });
};

const handleCancelCrete = () => {
  dialogVisible.value = false;
  isEdit.value = false;
  Object.keys(dialogData.value).forEach(key => {
    dialogData.value[key] = "";
  });
};

const handleCreateAccount = () => {
  const cloneData = Object.assign({}, dialogData.value);
  if (cloneData.account === "") {
    ElMessage("请填写账号");
    return;
  } else if (!cloneData.name) {
    ElMessage("请填写名称");
    return;
  } else if (!cloneData.phone) {
    ElMessage("请填写手机");
    return;
  } else if (!cloneData.email) {
    ElMessage("请填写邮箱");
    return;
  } else if (!cloneData.password && !isEdit.value) {
    ElMessage("请填写密码");
    return;
  }
  if (cloneData.phone && !/^1[3456789]\d{9}$/.test(cloneData.phone)) {
    ElMessage("请填写正确手机");
    return;
  }
  if (
    cloneData.email &&
    !/^(\w*\.*)+@(\w-?)+(\.\w{2,3}){1,2}$/.test(cloneData.email)
  ) {
    ElMessage("请填写正确邮箱");
    return;
  }
  const flag = isEdit.value;
  const func = flag ? postAccountUpdate : createAccount;
  let data: any = Object.assign({}, dialogData.value);
  if (data.organization_id) {
    data.organization.id = data.organization_id;
  }
  if (flag) delete data.password;
  func({ ...data })
    .then(res => {
      if (res.code === 200) {
        ElMessage.success(flag ? "修改成功" : "创建成功");
        currentPage.value = 1;
        handleCancelCrete();
        getlistData();
      } else {
        ElMessage.error(flag ? "修改失败" : "创建失败");
      }
    })
    .catch(err => {
      ElMessage.error(
        err?.response?.data?.msg || (flag ? "修改失败" : "创建失败")
      );
    });
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  getlistData();
};
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  getlistData();
};

const handleEdit = (item: any) => {
  Object.keys(item).forEach(key => {
    dialogData.value[key] = item[key] === "0" ? "" : item[key];
  });
  isEdit.value = true;
  dialogVisible.value = true;
};

const handleUnlock = (item: any) => {
  Object.keys(item).forEach(key => {
    dialogData.value[key] = item[key] === "0" ? "" : item[key];
  });
  let data = Object.assign({}, dialogData.value);
  delete data.password;
  postAccountUpdate({ ...data, is_lock: false })
    .then(res => {
      if (res.code === 200) {
        ElMessage.success("解锁成功");
        getlistData();
      } else {
        ElMessage.error("解锁失败");
      }
    })
    .catch(err => {
      ElMessage.error(err?.response?.data?.msg || "解锁失败");
    });
};

const pwdDialog = ref(false);
const pwdValue = ref("");
const modifyID = ref("");

const handleCancelPwd = () => {
  pwdDialog.value = false;
  pwdValue.value = "";
};

const handlePwd = (id: string) => {
  pwdDialog.value = true;
  modifyID.value = id;
};

const confrimModifyPwd = () => {
  if (pwdValue.value === "") {
    ElMessage.info("请输入新密码");
  } else {
    postAccountUpdateStaffPwd({
      new_password: pwdValue.value,
      uid: modifyID.value
    })
      .then(res => {
        if (res.code === 200) {
          ElMessage.success("修改成功");
          handleCancelPwd();
          getlistData();
        } else {
          ElMessage.error("修改失败");
        }
      })
      .catch(err => {
        ElMessage.error(err?.response?.data?.msg || "修改失败");
      });
  }
};

const currentInfo = ref();
const policyShow = ref(false);

const handleViewPolicy = (item: any) => {
  currentInfo.value = item;
  policyShow.value = true;
};

onMounted(() => {
  getlistData();
  getallOrgData();
});
</script>

<template>
  <div class="p-4 bg-white rounded-lg flex flex-col h-[calc(100%-30px)]">
    <div class="flex items-center">
      <el-form :inline="true" class="demo-form-inline">
        <!-- <el-form-item label="账号ID">
        <el-input
          v-model="formInline.id"
          placeholder="请输入账号ID"
          clearable
        />
      </el-form-item> -->
        <el-form-item label="查询账号">
          <el-input
            v-model="formInline.account"
            placeholder="请输入账号名称"
            clearable
            @clear="onReset"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button type="default" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
      <el-button
        class="ml-auto mb-5"
        type="default"
        @click="dialogVisible = true"
        >创建账号</el-button
      >
    </div>
    <el-table
      header-cell-class-name="!bg-[#f5f5f5] text-zinc-600"
      :data="tableData"
      style="width: 100%"
      class="flex-1"
    >
      <el-table-column prop="account" label="账号" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="phone" label="手机" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column label="帐号是否被锁">
        <template #default="scope">
          {{ scope.row.is_lock ? "是" : "否" }}
          <el-button
            class="ml-1"
            @click="handleUnlock(scope.rwo)"
            type="warning"
            link
            v-if="scope.row.is_lock"
            >解锁</el-button
          >
        </template>
      </el-table-column>
      <el-table-column label="创建时间">
        <template #default="scope">
          {{ dayjs(+scope.row.created_at * 1000).format("YYYY-MM-DD HH:mm") }}
        </template>
      </el-table-column>
      <el-table-column label="权限" align="center">
        <template #default="scope">
          <el-button
            size="small"
            text
            type="primary"
            @click="handleViewPolicy(scope.row)"
            >编辑权限</el-button
          >
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240">
        <template #default="scope">
          <el-button
            size="small"
            text
            bg
            type="info"
            @click="handleEdit(scope.row)"
            >修改信息</el-button
          >
          <el-button
            v-if="!scope.row.is_deleted"
            size="small"
            text
            bg
            type="danger"
            @click="handledel(scope.row.id)"
            >删除</el-button
          >
          <el-button
            v-else
            size="small"
            text
            bg
            type="success"
            @click="handdleRecover(scope.row.id)"
            >恢复</el-button
          >
          <el-button
            size="small"
            text
            type="success"
            @click="handlePwd(scope.row.id)"
            >修改密码</el-button
          >
        </template>
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
    <!-- 账号弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '账号信息' : '创建账号'"
      width="400"
      @closed="handleCancelCrete"
      align-center
    >
      <el-form
        label-position="right"
        :model="dialogData"
        class="demo-form-inline"
      >
        <el-form-item label="账号">
          <el-input
            :disabled="isEdit"
            v-model="dialogData.account"
            placeholder="请输入账号"
            clearable
          />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input
            v-model="dialogData.name"
            placeholder="请输入姓名"
            clearable
          />
        </el-form-item>
        <el-form-item label="手机">
          <el-input
            v-model="dialogData.phone"
            placeholder="请输入手机号码"
            clearable
          />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input
            v-model="dialogData.email"
            type="email"
            placeholder="请输入邮箱"
            clearable
          />
        </el-form-item>
        <el-form-item label="密码" v-if="!isEdit">
          <el-input
            v-model="dialogData.password"
            placeholder="请输入密码"
            clearable
          />
        </el-form-item>
        <el-form-item label="组织">
          <el-select
            v-model="dialogData.organization_id"
            placeholder="请选择"
            style="width: 240px"
          >
            <el-option
              v-for="item in orgList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancelCrete">取消</el-button>
          <el-button type="primary" @click="handleCreateAccount">
            {{ isEdit ? "确认修改" : "创建账号" }}
          </el-button>
        </div>
      </template>
    </el-dialog>
    <el-dialog
      v-model="pwdDialog"
      title="修改密码"
      width="400"
      @closed="handleCancelPwd"
      align-center
    >
      <el-form class="demo-form-inline">
        <el-form-item label="新密码">
          <el-input v-model="pwdValue" placeholder="请输入新密码" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancelPwd">取消</el-button>
          <el-button type="primary" @click="confrimModifyPwd">
            确认修改
          </el-button>
        </div>
      </template>
    </el-dialog>
    <policyDialog
      :show="policyShow"
      :info="currentInfo"
      @close="policyShow = false"
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
