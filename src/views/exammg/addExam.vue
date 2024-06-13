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
        <el-button round @click="addtopic('select')">添加选择题</el-button>
        <el-button round @click="addtopic('multiSelect')">添加多选题</el-button>
        <el-button round @click="addtopic('checked')">添加判断题</el-button>
        <el-button round @click="addtopic('fillBlank')">添加填空题</el-button>
      </div>

      <el-button round type="primary" @click="submitExam">提交考卷</el-button>
    </div>
    <div class="w-full overflow-auto" :style="`height: ${listHeight}px`">
      <div class="flex items-center px-4 mb-4">
        考卷标题：<el-input
          v-model="examTitle"
          style="width: 300px"
          placeholder="请输入标题"
        />
      </div>

      <div class="flex items-center px-4 mb-4">
        考试时间：<el-input-number
          v-model="limitTime"
          style="width: 200px"
          placeholder="请输入考试时间"
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
            <el-radio-group v-model="item.type" @change="changeType(item)">
              <el-radio value="select">选择题</el-radio>
              <el-radio value="multiSelect">多选题</el-radio>
              <el-radio value="checked">判断题</el-radio>
              <el-radio value="fillBlank">填空题</el-radio>
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
          <div class="flex items-center">
            分数：
            <el-input-number
              :min="1"
              v-model="item.body.score"
              style="width: 150px"
              placeholder="请输入分数"
            />
          </div>
          <div
            class="flex mt-2"
            v-if="item.type === 'select' || item.type === 'multiSelect'"
          >
            <p>选项：</p>
            <div class="ml-1">
              <div
                class="mb-2 flex items-center"
                v-for="(option, optionIndex) in item.body.options"
                :key="option.label"
              >
                {{ option.label }}、
                <el-input
                  v-model="option.value"
                  style="width: 300px"
                  placeholder="请输入选项"
                />
                <el-button
                  class="ml-3"
                  size="small"
                  type="danger"
                  @click="removeOption(item, optionIndex)"
                  :icon="Minus"
                  >删除</el-button
                >
              </div>
              <el-button round @click="addOption(item)"> 添加选项 </el-button>
            </div>
          </div>
          <div class="flex items-center" v-if="item.type === 'fillBlank'">
            <p>答案：</p>
            <div class="ml-1">
              <div
                class="mb-2 flex items-center"
                v-for="(answer, answerIndex) in item.body.answer"
                :key="answerIndex"
              >
                <el-input
                  v-model="answer.value"
                  style="width: 300px"
                  placeholder="请输入答案"
                />
                <el-button
                  class="ml-3"
                  size="small"
                  type="danger"
                  @click="removeAnswer(item, answerIndex)"
                  :icon="Minus"
                  >删除</el-button
                >
              </div>
              <el-button round @click="addAnswer(item)"> 添加答案 </el-button>
            </div>
          </div>
          <div class="flex items-center" v-if="item.type !== 'fillBlank'">
            <p>答案：</p>
            <template v-if="item.type === 'multiSelect'">
              <el-checkbox-group v-model="item.body.answer.value">
                <el-checkbox
                  :label="a.label"
                  v-for="a in item.body.answer.options"
                  :key="a.value"
                  :value="a.value"
                />
              </el-checkbox-group>
            </template>
            <template v-else>
              <el-radio-group v-model="item.body.answer.value">
                <el-radio
                  :value="a.value"
                  v-for="a in item.body.answer.options"
                  :key="a.value"
                  >{{ a.label }}</el-radio
                >
              </el-radio-group>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, ref } from "vue";
import { ArrowLeft, Minus } from "@element-plus/icons-vue";
import { createExam, getExamDetail, updateExam } from "@/api/exam";
import { ElMessageBox, ElMessage } from "element-plus";

const emits = defineEmits(["back"]);
const props = defineProps<{
  id?: string;
}>();

const container = ref<null | HTMLElement>(null);
const listHeight = ref(0);

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

const examTmpl = {
  select: {
    title: "",
    score: "", // 添加分数属性
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
  multiSelect: {
    title: "",
    score: "", // 添加分数属性
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
      value: []
    }
  },
  checked: {
    title: "",
    score: "", // 添加分数属性
    answer: {
      options: [
        { label: "正确", value: "yes" },
        { label: "错误", value: "no" }
      ],
      value: ""
    }
  },
  fillBlank: {
    title: "",
    score: "", // 添加分数属性
    answer: [{ value: "" }]
  }
};

const examList = ref([
  {
    type: "select",
    id: guid(),
    body: JSON.parse(JSON.stringify(examTmpl["select"]))
  }
]);

const examTitle = ref("");
const limitTime = ref(90);

const changeType = (item: any) => {
  item.body = JSON.parse(JSON.stringify(examTmpl[item.type]));
};

const addtopic = (type: string) => {
  const tmp = {
    type: type,
    id: guid(),
    body: JSON.parse(JSON.stringify(examTmpl[type]))
  };
  examList.value.push(tmp);
};

const handleDel = (index: number) => {
  examList.value.splice(index, 1);
};

const addOption = (item: any) => {
  const lastOptionLabel =
    item.body.options[item.body.options.length - 1]?.label;
  const newOptionLabel = lastOptionLabel
    ? String.fromCharCode(lastOptionLabel.charCodeAt(0) + 1)
    : "A";

  item.body.options.push({ label: newOptionLabel, value: "" });

  if (item.body.answer && item.body.answer.options) {
    item.body.answer.options.push({
      label: newOptionLabel,
      value: newOptionLabel
    });
  }
};

const removeOption = (item: any, index: number) => {
  item.body.options.splice(index, 1);

  if (item.body.answer && item.body.answer.options) {
    item.body.answer.options.splice(index, 1);
  }
};

const addAnswer = (item: any) => {
  item.body.answer.push({ value: "" });
};

const removeAnswer = (item: any, index: number) => {
  item.body.answer.splice(index, 1);
};

const getDetail = () => {
  getExamDetail(props.id).then(res => {
    if (res.code === 200) {
      const data = res.data;
      examTitle.value = data.title;
      limitTime.value = data.limitTime;
      examList.value = [];
      if (data && data.single_list.length) {
        data.single_list.forEach((item: any) => {
          examList.value.push({
            type: "select",
            id: item.id,
            body: {
              title: item.choices[0].question,
              score: item.score,
              options: item.choices.map((choice: any, index: number) => ({
                label: String.fromCharCode(65 + index),
                value: choice.question
              })),
              answer: {
                options: item.choices.map((choice: any, index: number) => ({
                  label: String.fromCharCode(65 + index),
                  value: String.fromCharCode(65 + index)
                })),
                value: String.fromCharCode(65 + item.answer.answer)
              }
            }
          });
        });
      }
      if (data && data.multi_list.length) {
        data.multi_list.forEach((item: any) => {
          examList.value.push({
            type: "multiSelect",
            id: item.id,
            body: {
              title: item.multi_choice[0].question,
              score: item.score,
              options: item.multi_choice.map((choice: any, index: number) => ({
                label: String.fromCharCode(65 + index),
                value: choice.question
              })),
              answer: {
                options: item.multi_choice.map(
                  (choice: any, index: number) => ({
                    label: String.fromCharCode(65 + index),
                    value: String.fromCharCode(65 + index)
                  })
                ),
                value: item.multi_answer.answers.map((ans: number) =>
                  String.fromCharCode(65 + ans)
                )
              }
            }
          });
        });
      }
      if (data && data.judge_list.length) {
        data.judge_list.forEach((item: any) => {
          examList.value.push({
            type: "checked",
            id: item.id,
            body: {
              title: item.questions[0].question,
              score: item.score,
              answer: {
                options: [
                  { label: "正确", value: "yes" },
                  { label: "错误", value: "no" }
                ],
                value: item.answer.answers[0] ? "yes" : "no"
              }
            }
          });
        });
      }
      if (data && data.cloze_list.length) {
        data.cloze_list.forEach((item: any) => {
          examList.value.push({
            type: "fillBlank",
            id: item.id,
            body: {
              title: item.question,
              score: item.score,
              answer: item.answer.answer.split(", ").map((ans: string) => ({
                value: ans
              }))
            }
          });
        });
      }
    }
  });
};

onMounted(async () => {
  nextTick(async () => {
    const cntel = container.value;
    if (cntel) {
      const { height } = cntel.getBoundingClientRect();
      listHeight.value = height - 80;
    }
  });
  if (props.id) {
    getDetail();
  }
});

const submitExam = () => {
  const formattedData = {
    cloze_list: [],
    judge_list: [],
    limitTime: 90,
    multi_list: [],
    single_list: [],
    title: examTitle.value,
    exam_json: "1",
    id: "0"
  };

  let singleIdCounter = 1;
  let multiIdCounter = 1;
  examList.value.forEach((item, index) => {
    switch (item.type) {
      case "select":
        formattedData.single_list.push({
          // id: guid(),
          // id: singleIdCounter.toString(),
          answer: { answer: item.body.answer.value.charCodeAt(0) - 64 },
          choices: item.body.options.map(option => ({
            question: option.value
          })),
          score: parseInt(item.body.score)
        });
        singleIdCounter++;
        break;
      case "multiSelect":
        formattedData.multi_list.push({
          // id: guid(),
          // id: multiIdCounter.toString(),
          multi_answer: {
            answers: item.body.answer.value.map(ans => ans.charCodeAt(0) - 64)
          },
          multi_choice: item.body.options.map(option => ({
            question: option.value
          })),
          score: parseInt(item.body.score)
        });
        multiIdCounter++;
        break;
      case "checked":
        formattedData.judge_list.push({
          // id: guid(),
          // id: (index + 1).toString(),
          answer: {
            answers: [item.body.answer.value === "yes" ? true : false]
          },
          questions: [{ question: item.body.title }],
          score: parseInt(item.body.score)
        });
        break;
      case "fillBlank":
        formattedData.cloze_list.push({
          // id: guid(),
          // id: (index + 1).toString(),
          answer: { answer: item.body.answer.map(ans => ans.value).join(", ") },
          question: item.body.title,
          score: parseInt(item.body.score)
        });
        break;
    }
  });

  const data = JSON.stringify(formattedData);
  console.log("格式化后的数据:", data);
  createExam(data)
    .then(res => {
      if (res.code === 200) {
        ElMessage.success("试卷添加成功");
        emits("back");
      } else {
        ElMessage.error("添加失败");
      }
    })
    .catch(err => {
      ElMessage.error(err?.response?.data?.msg || "添加失败");
    });
};
</script>

<style lang="scss" scoped></style>
