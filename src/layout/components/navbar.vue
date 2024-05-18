<script setup lang="ts">
import Search from "./search/index.vue";
import Notice from "./notice/index.vue";
import mixNav from "./sidebar/mixNav.vue";
import { useNav } from "@/layout/hooks/useNav";
import FullScreen from "./sidebar/fullScreen.vue";
import Breadcrumb from "./sidebar/breadCrumb.vue";
import topCollapse from "./sidebar/topCollapse.vue";
import LogoutCircleRLine from "@iconify-icons/ri/logout-circle-r-line";
import Setting from "@iconify-icons/ri/settings-3-line";
import { EditPen } from "@element-plus/icons-vue";
import { ref } from "vue";
import { postAccountUpdateMyPassword } from "@/api/account";
import { message } from "@/utils/message";

const {
  layout,
  device,
  logout,
  onPanel,
  pureApp,
  username,
  userAvatar,
  avatarsStyle,
  toggleSideBar
} = useNav();

const pwdDialog = ref(false);
const pwdValue = ref("");
const odlPwdValue = ref("");

const handleCancelPwd = () => {
  pwdDialog.value = false;
  pwdValue.value = "";
  odlPwdValue.value = "";
};

const confrimModifyPwd = () => {
  if (odlPwdValue.value === "") {
    message("请输入旧密码");
  } else if (pwdValue.value === "") {
    message("请输入新密码");
  } else {
    postAccountUpdateMyPassword({
      new_password: pwdValue.value,
      old_password: odlPwdValue.value
    })
      .then(res => {
        if (res.code === 200) {
          message("修改成功，请重新登陆", { type: "success" });
          setTimeout(() => {
            logout();
          }, 250);
          handleCancelPwd();
        } else {
          message("修改失败", { type: "error" });
        }
      })
      .catch(() => {
        message("修改失败，旧密码错误", { type: "error" });
      });
  }
};

const handlePwd = (id: string) => {
  pwdDialog.value = true;
};
</script>

<template>
  <div class="navbar bg-[#fff] shadow-sm shadow-[rgba(0,21,41,0.08)]">
    <topCollapse
      v-if="device === 'mobile'"
      class="hamburger-container"
      :is-active="pureApp.sidebar.opened"
      @toggleClick="toggleSideBar"
    />

    <Breadcrumb
      v-if="layout !== 'mix' && device !== 'mobile'"
      class="breadcrumb-container"
    />

    <mixNav v-if="layout === 'mix'" />

    <div v-if="layout === 'vertical'" class="vertical-header-right">
      <!-- 菜单搜索 -->
      <Search id="header-search" />
      <!-- 全屏 -->
      <FullScreen id="full-screen" />
      <!-- 消息通知 -->
      <!-- <Notice id="header-notice" /> -->
      <!-- 退出登录 -->
      <el-dropdown trigger="click">
        <span class="el-dropdown-link navbar-bg-hover select-none">
          <img :src="userAvatar" :style="avatarsStyle" />
          <p v-if="username" class="dark:text-white">{{ username }}</p>
        </span>
        <template #dropdown>
          <el-dropdown-menu class="logout">
            <el-dropdown-item @click="logout">
              <IconifyIconOffline
                :icon="LogoutCircleRLine"
                style="margin: 5px"
              />
              退出系统
            </el-dropdown-item>
            <el-dropdown-item @click="handlePwd">
              <el-icon :size="16"><EditPen /></el-icon>
              修改密码
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <!-- <span
        class="set-icon navbar-bg-hover"
        title="打开项目配置"
        @click="onPanel"
      >
        <IconifyIconOffline :icon="Setting" />
      </span> -->
    </div>

    <el-dialog
      v-model="pwdDialog"
      title="修改密码"
      width="400"
      @closed="handleCancelPwd"
      align-center
    >
      <el-form class="demo-form-inline">
        <el-form-item label="旧密码">
          <el-input
            v-model="odlPwdValue"
            placeholder="请输入新密码"
            clearable
          />
        </el-form-item>
      </el-form>
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
  </div>
</template>

<style lang="scss" scoped>
.navbar {
  width: 100%;
  height: 48px;
  overflow: hidden;

  .hamburger-container {
    float: left;
    height: 100%;
    line-height: 48px;
    cursor: pointer;
  }

  .vertical-header-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 280px;
    height: 48px;
    color: #000000d9;

    .el-dropdown-link {
      display: flex;
      align-items: center;
      justify-content: space-around;
      height: 48px;
      padding: 10px;
      color: #000000d9;
      cursor: pointer;

      p {
        font-size: 14px;
      }

      img {
        width: 22px;
        height: 22px;
        border-radius: 50%;
      }
    }
  }

  .breadcrumb-container {
    float: left;
    margin-left: 16px;
  }
}

.logout {
  width: 120px;

  ::v-deep(.el-dropdown-menu__item) {
    display: inline-flex;
    flex-wrap: wrap;
    min-width: 100%;
  }
}
</style>
