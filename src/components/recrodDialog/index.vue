<script lang="ts" setup>
import { ref, onMounted, reactive, computed, watch } from "vue";
import dayjs from "dayjs";
import {
  Avatar,
  EditPen,
  UserFilled,
  Cellphone,
  MoreFilled
} from "@element-plus/icons-vue";
import { getOperateByCustomerId } from "@/api/customer";

const props = defineProps<{ show?: boolean; info?: any }>();
const emits = defineEmits(["close"]);

const showDialog = computed(() => props.show);

const activities = ref([]);

const LIUZHUAN = {
  0: "入库",
  1: "重新入库",
  2: "分配",
  3: "放弃客户",
  4: "分享客户",
  5: "转让客户",
  6: "删除客户"
};

const OTHERS = {
  1: "跟进",
  2: "修改客户信息",
  3: "修改标签",
  4: "修改进度",
  5: "拨打电话"
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

watch(
  () => props.show,
  () => {
    if (props.show) {
      getOperateByCustomerId(props.info.id).then(res => {
        if (res.code === 200) {
          const data = res.data.records || [];
          data.reverse().forEach(item => {
            (item.timestamp = dayjs(item.created_at * 1000).format(
              "YYYY-MM-DD HH:mm"
            )),
              (item.color = "#0bbd87");
          });
          activities.value = data;
        }
      });
    }
  },
  { immediate: true }
);
</script>

<template>
  <el-dialog
    v-model="showDialog"
    width="800"
    title="操作记录"
    :modal="false"
    @close="emits('close')"
  >
    <div class="flex flex-wrap content-start overflow-auto">
      <div class="flex-1 flex flex-col content-start max-w-90">
        <div class="flex items-center justify-between">
          <p class="flex items-center">
            <el-icon :size="25" color="#444f5a" class="mr-1"
              ><UserFilled /></el-icon
            >{{ props.info.name }}
          </p>
          <p class="flex items-center">
            <el-icon :size="20" color="#444f5a" class="mr-1"
              ><Cellphone /></el-icon
            >{{ props.info.phone }}
          </p>
        </div>
        <div
          class="mt-4 flex items-center rounded text-sm font-semibold text-zinc-700"
        >
          <div class="w-2.5 h-2.5 bg-cyan-600 rounded-full mr-1" />
          进度：{{ props.info.progress?.name }}
        </div>
        <div class="mt-4 flex gap-2 flex-wrap">
          <!-- <el-icon class="!text-zinc-600 hover:!text-zinc-400" :size="18"
            ><EditPen
          /></el-icon> -->
          标签:
          <div
            v-for="item in props.info.customer_tag_list"
            :key="item.id"
            class="p-1 px-2 text-xs rounded-md bg-[#eeeeee] text-[#303841]"
          >
            {{ item.tag.name }}
          </div>
        </div>
        <div class="mt-2">微信：{{ props.info.wechat }}</div>
        <div class="mt-2">企业微信：{{ props.info.wecom }}</div>
        <div class="mt-2">QQ：{{ props.info.qq }}</div>
        <div class="mt-2">地址：{{ props.info.address }}</div>
        <div class="mt-2">工作地址：{{ props.info.working_address }}</div>
      </div>
      <div class="flex-1 pl-6 overflow-auto" style="max-height: 430px">
        <el-timeline style="max-width: 600px">
          <el-timeline-item
            v-for="(item, index) in activities"
            :key="index"
            :color="item.color"
            :timestamp="item.timestamp"
            placement="top"
          >
            <div
              v-if="item.record_type === 0"
              class="bg-[#f6f6f6] rounded-md px-4 py-2 text-sm"
            >
              {{ LIUZHUAN[item.flow_type] }}
            </div>
            <div v-else class="bg-[#f6f6f6] rounded-md px-4 py-2 text-sm">
              {{ OTHERS[item.record_type] }}
              <div
                v-if="item.record_type === 2"
                class="mt-2 text-zinc-500 text-sm flex flex-col gap-2"
              >
                <p>修改信息：{{ item.modified_field_name }}</p>
                <p>修改前：{{ item.modified_before }}</p>
                <p>修改后：{{ item.modified_after }}</p>
              </div>
              <div v-if="item.record_type === 3" class="mt-2 text-gray-600">
                <div class="flex gap-1 flex-wrap text-sm">
                  修改前:
                  <template v-if="item.before_tag_name_list.split(',').length">
                    <div
                      v-for="(tag, idx) in item.before_tag_name_list
                        .split(',')
                        .filter(Boolean)"
                      :key="idx"
                      class="p-1 px-2 text-xs rounded-md bg-[#eaeaea] mr-1 text-[#303841]"
                    >
                      {{ tag }}
                    </div>
                  </template>
                </div>
                <div class="flex gap-1 flex-wrap text-sm mt-2">
                  修改后:
                  <template v-if="item.after_tag_name_list.split(',').length">
                    <div
                      v-for="(tag, idx) in item.after_tag_name_list
                        .split(',')
                        .filter(Boolean)"
                      :key="idx"
                      class="p-1 px-2 text-xs rounded-md bg-[#eaeaea] mr-1 text-[#303841]"
                    >
                      {{ tag }}
                    </div>
                  </template>
                </div>
              </div>
              <div
                v-if="item.record_type === 5"
                class="mt-1 text-xs text-[#444f5a] flex flex-col gap-1"
              >
                <p>
                  拨打时间：{{
                    dayjs(item.call_at * 1000).format("YYYY-MM-DD HH:mm")
                  }}
                </p>
                <p>拨打时长： {{ msToTime(item.call_duration) }}</p>
              </div>
            </div>
            <div class="text-zinc-400 text-xs mt-1">
              操作者：{{ item.staff.name || item.staff.account }}
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </div>
  </el-dialog>
</template>
