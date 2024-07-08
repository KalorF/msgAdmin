<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import { getAllGroupTag } from "@/api/tag";
// import { useUserStoreHook } from "@/store/modules/user";
import { usePermissionStoreHook } from "@/store/modules/permission";

const permission = usePermissionStoreHook();
const isAdmin = computed(() => permission.policies.role.RoleType === "admin");

const tagList = ref([]);

const emits = defineEmits(["change"]);

const props = defineProps<{ checkedItems?: any[] }>();

const checkIds = computed(() => {
  return props.checkedItems.map(item => item.id) || [];
});

const getData = () => {
  return getAllGroupTag()
    .then(res => {
      if (res.code === 200) {
        tagList.value = res.data;
      } else {
        tagList.value = [];
      }
    })
    .catch(err => {
      tagList.value = [];
    });
};

const handleChange = (type: any, tag: any, list: any) => {
  const hasCheckedItems = props.checkedItems;
  if (type === 1) {
    if (checkIds.value.includes(tag.id)) {
      const index = checkIds.value.findIndex(i => i === tag.id);
      // checkIds.value.splice(index, 1);
      hasCheckedItems.splice(index, 1);
    } else {
      // checkIds.value.push(tag.id);
      hasCheckedItems.push(tag);
    }
    emits("change", hasCheckedItems);
  } else if (type === 0) {
    const findFirstIndex = checkIds.value.findIndex(t => t === tag.id);
    if (findFirstIndex > -1) {
      // checkIds.value.splice(findFirstIndex, 1);
      hasCheckedItems.splice(findFirstIndex, 1);
      emits("change", hasCheckedItems);
      return;
    }
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const index = checkIds.value.findIndex(t => t === item.id);
      if (index > -1) {
        // checkIds.value.splice(index, 1);
        hasCheckedItems.splice(index, 1);
      }
    }
    // checkIds.value.push(tag.id);
    hasCheckedItems.push(tag);
    emits("change", hasCheckedItems);
  }
};

onMounted(() => {
  getData();
});
</script>

<template>
  <el-popover
    placement="bottom"
    class="!rounded-lg"
    :width="500"
    trigger="click"
  >
    <template #reference>
      <slot />
    </template>
    <div class="p-2 overflow-auto max-h-60">
      <div
        v-for="item in tagList"
        :key="item.id"
        class="mb-4"
        :class="{ hidden: item.just_show_for_admin && !isAdmin }"
      >
        <p
          class="mb-2 text-sm text-zinc-800 border-l-4 border-amber-500 pl-2"
          :class="{ hidden: item.just_show_for_admin && !isAdmin }"
        >
          {{ item.name }}
        </p>
        <div class="flex flex-wrap content-start gap-3">
          <el-check-tag
            v-for="tag in item.tag_list"
            :key="tag.id"
            type="success"
            :checked="checkIds.includes(tag.id)"
            :class="{ hidden: tag.just_show_for_admin && !isAdmin }"
            @change="handleChange(item.tag_group_type, tag, item.tag_list)"
          >
            {{ tag.name }}
          </el-check-tag>
        </div>
      </div>
    </div>
  </el-popover>
</template>
<style>
.el-check-tag {
  border-radius: 20px;
  font-size: 13px;
}
</style>
