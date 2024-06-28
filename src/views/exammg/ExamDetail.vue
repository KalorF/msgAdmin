<template>
  <div class="p-4 bg-white rounded-lg h-[calc(100%-30px)]">
    <div class="flex items-center gap-3">
      <el-button round :icon="ArrowLeft" type="primary" @click="emits('back')"
        >返回</el-button
      >
    </div>
    <p v-if="props.exam" class="ml-2 text-xl font-semibold text-rose-500">
      考试分数: {{ props.exam.score }}
    </p>
    <h1 class="mt-4">{{ examData.title }}</h1>
    <div v-if="examData.limitTime">
      <p>限时：{{ examData.limitTime }} 分钟</p>
    </div>

    <div v-if="examData.single_list.length > 0">
      <h2>单选题</h2>
      <div v-for="(single, index) in examData.single_list" :key="single.id">
        <p>{{ index + 1 }}. {{ single.base_info.question }}</p>
        <el-radio-group
          v-model="answers.single[single.id]"
          :disabled="disabled"
        >
          <el-radio
            v-for="(choice, choiceIndex) in single.choices"
            :key="choiceIndex"
            :label="choiceIndex"
          >
            {{ choice.question }}
          </el-radio>
        </el-radio-group>
      </div>
    </div>

    <div v-if="examData.multi_list.length > 0">
      <h2>多选题</h2>
      <div v-for="(multi, index) in examData.multi_list" :key="multi.id">
        <p>{{ index + 1 }}. {{ multi.base_info.question }}</p>
        <el-checkbox-group
          v-model="answers.multi[multi.id]"
          :disabled="disabled"
        >
          <el-checkbox
            v-for="(choice, choiceIndex) in multi.multi_choice"
            :key="choiceIndex"
            :label="choiceIndex"
          >
            {{ choice.question }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
    </div>

    <div v-if="examData.judge_list.length > 0">
      <h2>判断题</h2>
      <div v-for="(judge, index) in examData.judge_list" :key="judge.id">
        <p>{{ index + 1 }}. {{ judge.questions[0].question }}</p>
        <el-radio-group v-model="answers.judge[judge.id]" :disabled="disabled">
          <el-radio :label="true">正确</el-radio>
          <el-radio :label="false">错误</el-radio>
        </el-radio-group>
      </div>
    </div>

    <div v-if="examData.cloze_list.length > 0">
      <h2>填空题</h2>
      <div v-for="(cloze, index) in examData.cloze_list" :key="cloze.id">
        <p>{{ index + 1 }}. {{ cloze.question }}</p>
        <el-input
          v-for="(item, index) in cloze.answer.answer.split(',')"
          :key="index"
          v-model="answers.cloze[cloze.id][index]"
          :disabled="disabled"
          placeholder="请输入答案"
        />
      </div>
    </div>

    <el-button
      v-if="!disabled"
      type="primary"
      class="my-6"
      round
      @click="submitAnswers"
      >提交答案</el-button
    >
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { getExamDetail, createUserExam } from "@/api/exam";
import { ArrowLeft, Minus } from "@element-plus/icons-vue";
import { useUserStoreHook } from "@/store/modules/user";

const emits = defineEmits(["back"]);
const props = defineProps<{
  id?: string;
  exam?: any;
}>();

const disabled = computed(() => {
  return props.exam ? true : false;
});

const userStore = useUserStoreHook();
const cloneExamData = ref({});

const examData = ref({
  title: "",
  limitTime: 0,
  multi_list: [],
  single_list: [],
  cloze_list: [],
  judge_list: []
});
const answers = ref({
  single: {},
  multi: {},
  judge: {},
  cloze: {}
});

const fetchExamDetail = async id => {
  try {
    // console.log("examId:", id);
    const res = await getExamDetail(id);
    if (res.code === 200) {
      examData.value = res.data;
      cloneExamData.value = res.data;
      initializeAnswers();
    } else {
      throw new Error(res.msg);
    }
  } catch (error) {
    console.error("Fetch error:", error);
    ElMessage.error("无法获取考试详情");
  }
};

const initializeAnswers = () => {
  examData.value.single_list.forEach(single => {
    answers.value.single[single.id] = props.exam ? single.answer.answer : null;
  });
  examData.value.multi_list.forEach(multi => {
    answers.value.multi[multi.id] = props.exam
      ? multi.multi_answer.answers
      : [];
  });
  examData.value.judge_list.forEach(judge => {
    answers.value.judge[judge.id] = props.exam ? judge.answer.Answers[0] : null;
  });
  examData.value.cloze_list.forEach(cloze => {
    answers.value.cloze[cloze.id] = props.exam
      ? cloze.answer.answer.split(",")
      : [];
  });
};

const submitAnswers = () => {
  const answerData = {
    ...answers.value.single,
    ...answers.value.multi,
    ...answers.value.judge,
    ...answers.value.cloze
  };
  const answerDataJson = JSON.parse(JSON.stringify(cloneExamData.value));
  answerDataJson.single_list.forEach(single => {
    const id = single.id;
    const answer = answerData[id];
    single.answer = { answer: answer };
  });
  answerDataJson.multi_list.forEach(multi => {
    const id = multi.id;
    const answer = answerData[id];
    multi.multi_answer = { answers: answer };
  });
  answerDataJson.judge_list.forEach(judge => {
    const id = judge.id;
    const answer = answerData[id];
    judge.answer = { answers: [answer] };
  });
  answerDataJson.cloze_list.forEach(cloze => {
    const id = cloze.id;
    const answer = answerData[id];
    cloze.answer = { answer: answer.join(",") };
  });
  createUserExam({
    exam_id: props.id,
    exam: cloneExamData.value,
    uid: userStore.userInfo.id,
    answer_exam: answerDataJson
  })
    .then(res => {
      if (res.code === 200) {
        ElMessage.success("提交成功");
        emits("back");
      } else {
        ElMessage.error("提交失败");
      }
    })
    .catch(err => ElMessage.error(err?.response?.data?.msg || "提交失败"));
};

onMounted(() => {
  if (props.id) {
    fetchExamDetail(props.id);
  }
  if (props.exam) {
    examData.value = props.exam.answer_exam;
    initializeAnswers();
    // console.log("examData:", examData.value);
  }
});
</script>

<style scoped>
h1 {
  font-size: 24px;
  margin-bottom: 16px;
}
h2 {
  font-size: 18px;
  margin-top: 32px;
}
p {
  margin: 8px 0;
}
</style>
