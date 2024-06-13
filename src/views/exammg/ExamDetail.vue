<template>
  <div class="p-4 bg-white rounded-lg h-[calc(100%-30px)]">
    <el-button round :icon="ArrowLeft" type="primary" @click="goBack"
      >返回</el-button
    >
    <h1 class="mt-4">{{ examData.title }}</h1>
    <div v-if="examData.limitTime">
      <p>限时：{{ examData.limitTime }} 分钟</p>
    </div>

    <div v-if="examData.single_list.length > 0">
      <h2>单选题</h2>
      <div v-for="(single, index) in examData.single_list" :key="single.id">
        <p>{{ index + 1 }}. {{ single.choices[0].question }}</p>
        <el-radio-group v-model="answers.single[single.id]">
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
        <p>{{ index + 1 }}. {{ multi.multi_choice[0].question }}</p>
        <el-checkbox-group v-model="answers.multi[multi.id]">
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
        <el-radio-group v-model="answers.judge[judge.id]">
          <el-radio :label="true">正确</el-radio>
          <el-radio :label="false">错误</el-radio>
        </el-radio-group>
      </div>
    </div>

    <div v-if="examData.cloze_list.length > 0">
      <h2>填空题</h2>
      <div v-for="(cloze, index) in examData.cloze_list" :key="cloze.id">
        <p>{{ index + 1 }}. {{ cloze.question }}</p>
        <el-input v-model="answers.cloze[cloze.id]" placeholder="请输入答案" />
      </div>
    </div>

    <el-button type="primary" class="my-6" round @click="submitAnswers"
      >提交答案</el-button
    >
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { getExamDetail } from "@/api/exam";
import { ArrowLeft, Minus } from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter(); // 添加这行来正确导入 router
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
    console.log("examId:", id);
    const res = await getExamDetail(id);
    if (res.code === 200) {
      examData.value = res.data;
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
    answers.value.single[single.id] = null;
  });
  examData.value.multi_list.forEach(multi => {
    answers.value.multi[multi.id] = [];
  });
  examData.value.judge_list.forEach(judge => {
    answers.value.judge[judge.id] = null;
  });
  examData.value.cloze_list.forEach(cloze => {
    answers.value.cloze[cloze.id] = "";
  });
};

const submitAnswers = () => {
  console.log("提交答案:", answers.value);
  // 提交答案的逻辑
};

const goBack = () => {
  router.go(-1); // 返回上一页
};

onMounted(() => {
  const id = route.params.id;
  fetchExamDetail(id);
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
