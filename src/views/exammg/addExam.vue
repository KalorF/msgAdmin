<script lang="ts" setup>
import { nextTick, onMounted, ref } from "vue";
import { ArrowLeft } from "@element-plus/icons-vue";

const emits = defineEmits(["back"]);

function guid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const container = ref<null | HTMLElement>(null);
const listHeight = ref(0);

const examTmpl = {
  select: {
    title: "",
    options: [
      { label: "A", value: "" },
      { label: "B", value: "" },
      { label: "C", value: "" },
      { label: "D", value: "" }
    ],
    answer: {
      options: [
        { label: "A", value: "A" },
        { label: "B", value: "B" },
        { label: "C", value: "C" },
        { label: "D", value: "D" }
      ],
      value: ""
    }
  },
  checked: {
    title: "",
    options: [
      { label: "正确", value: "yes" },
      { label: "错误", value: "no" }
    ],
    answer: {
      options: [
        { label: "正确", value: "yes" },
        { label: "错误", value: "no" }
      ],
      value: ""
    }
  }
};

const examList = ref([
  {
    type: "select",
    id: guid(),
    body: examTmpl["select"]
  }
]);

const examTitle = ref("");

const changeType = (item: any, index: number) => {
  const type = item.type;
  item.body = examTmpl[type];
};

const addtopic = () => {
  const tmp = {
    type: "select",
    id: guid(),
    body: examTmpl["select"]
  };
  examList.value.push(tmp);
};

const handleDel = (index: number) => {
  examList.value.splice(index, 1);
};

onMounted(async () => {
  nextTick(async () => {
    const cntel = container.value;
    if (cntel) {
      const { height } = cntel.getBoundingClientRect();
      listHeight.value = height - 80;
    }
  });
});
</script>

<template>
  <div
    ref="container"
    class="p-4 bg-white rounded-lg flex flex-col h-[calc(100%-30px)]"
  >
    <div class="flex justify-between items-center mb-4">
      <div>
        <el-button
          round
          :icon="ArrowLeft"
          @click="emits('back')"
          class="w-[80px]"
          >返回</el-button
        >
        <el-button round @click="addtopic">添加题目</el-button>
      </div>

      <el-button round type="primary">提交考卷</el-button>
    </div>
    <div class="w-full overflow-auto" :style="`height: ${listHeight}px`">
      <div class="flex items-center px-4 mb-4">
        考卷标题：<el-input
          v-model="examTitle"
          style="width: 300px"
          placeholder="请输入标题"
        />
      </div>
      <div
        class="mb-6 px-4 text-sm"
        v-for="(item, index) in examList"
        :key="item.id"
      >
        <div class="flex items-center">
          <div class="flex items-center">
            <p>{{ index + 1 }}. 题目类型：</p>
            <el-radio-group
              v-model="item.type"
              @change="changeType(item, index)"
            >
              <el-radio value="select">选择题</el-radio>
              <el-radio value="checked">判断题</el-radio>
            </el-radio-group>
          </div>
          <el-button link class="ml-6" type="danger" @click="handleDel(index)"
            >删除</el-button
          >
        </div>
        <div class="flex flex-col gap-2 content-start mt-2">
          <div class="flex items-center">
            题目：{{ index + 1 }}：
            <el-input
              v-model="item.body.title"
              style="width: 300px"
              placeholder="请输入题目"
            />
          </div>
          <div class="flex mt-2" v-if="item.type === 'select'">
            <p>选项：</p>
            <div class="ml-1">
              <div
                class="mb-2 flex items-center"
                v-for="option in item.body.options"
                :key="option.label"
              >
                {{ option.label }}、
                <el-input
                  v-model="option.value"
                  style="width: 300px"
                  placeholder="请输入选项"
                />
              </div>
            </div>
          </div>
          <div class="flex items-center">
            <p>答案：</p>
            <el-radio-group v-model="item.body.answer.value">
              <el-radio
                :value="a.value"
                v-for="a in item.body.answer.options"
                :key="a.value"
                >{{ a.label }}</el-radio
              >
            </el-radio-group>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
