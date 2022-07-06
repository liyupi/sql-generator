<script setup lang="ts">
import { doGenerateSQL } from "./generator";
import { importExample } from "./examples";
import { onMounted, ref, toRaw } from "vue";
import * as monaco from "monaco-editor";
import { format } from "sql-formatter";
import { GithubOutlined } from "@ant-design/icons-vue";

import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import CssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import HtmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import TsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
// eslint-disable-next-line no-undef
import IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
import SearchableTree from "./components/SearchableTree.vue";

(self as any).MonacoEnvironment = {
  getWorker(_: any, label: any) {
    if (label === "json") {
      return new JsonWorker();
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new CssWorker();
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new HtmlWorker();
    }
    if (label === "typescript" || label === "javascript") {
      return new TsWorker();
    }
    return new EditorWorker();
  },
};

const inputEditor = ref<IStandaloneCodeEditor>();
const outputEditor = ref<IStandaloneCodeEditor>();
const inputContainer = ref<HTMLElement>();
const outputContainer = ref<HTMLElement>();
const invokeTree = ref<InvokeTree>();
const drawerVisible = ref(false);

const getSQL = () => {
  if (!inputEditor.value || !outputEditor.value) {
    return;
  }
  const inputJSON = JSON.parse(toRaw(inputEditor.value).getValue());
  const generateResult = doGenerateSQL(inputJSON);
  if (!generateResult) {
    return;
  }
  let result = format(generateResult.resultSQL);
  // 针对执行引擎，处理自动格式化的问题
  result = result.replaceAll("{ {", "{{");
  result = result.replaceAll("} }", "}}");
  toRaw(outputEditor.value).setValue(result);
  // 获取调用树
  invokeTree.value = [generateResult.invokeTree];
  console.log(invokeTree.value);
};

const importExampleAndCal = () => {
  if (inputEditor.value) {
    const exampleJSON = importExample("complex");
    toRaw(inputEditor.value).setValue(exampleJSON);
    inputEditor.value.getAction("editor.action.formatDocument").run();
  }
};

const showInvokeTree = () => {
  if (!invokeTree.value) {
    getSQL();
  }
  drawerVisible.value = true;
};

const initJSONValue = importExample("init");

onMounted(() => {
  if (inputContainer.value) {
    const initValue = localStorage.getItem("draft") ?? initJSONValue;
    inputEditor.value = monaco.editor.create(inputContainer.value, {
      value: initValue,
      language: "json",
      theme: "vs-dark",
      formatOnPaste: true,
      automaticLayout: true,
      fontSize: 16,
      minimap: {
        enabled: false,
      },
    });
    setTimeout(() => {
      if (inputEditor.value) {
        inputEditor.value.getAction("editor.action.formatDocument").run();
      }
    }, 500);
    setInterval(() => {
      if (inputEditor.value) {
        localStorage.setItem("draft", toRaw(inputEditor.value).getValue());
      }
    }, 3000);
  }
  if (outputContainer.value) {
    outputEditor.value = monaco.editor.create(outputContainer.value, {
      value: "",
      language: "sql",
      theme: "vs-dark",
      formatOnPaste: true,
      automaticLayout: true,
      fontSize: 16,
      minimap: {
        enabled: false,
      },
    });
  }
});
</script>

<template>
  <div>
    <a-row justify="space-between" align="middle" :gutter="[0, 16]">
      <h1 style="margin-bottom: 0">🔨 结构化 SQL 生成器</h1>
      <a href="https://github.com/liyupi/sql-generator" target="_blank">
        使用 JSON 来编写 SQL，告别重复代码，点击查看文档
      </a>
      <a-space size="large">
        <a-button size="large" type="primary" @click="getSQL">
          生成 SQL
        </a-button>
        <a-button size="large" type="primary" ghost @click="showInvokeTree">
          查看调用树
        </a-button>
        <a-button size="large" type="default" @click="importExampleAndCal">
          导入例子
        </a-button>
      </a-space>
    </a-row>
    <div style="margin-top: 16px" />
    <a-row :gutter="[16, 16]">
      <a-col :sm="24" :md="12">
        <div
          id="inputContainer"
          ref="inputContainer"
          style="height: 80vh; max-width: 100%"
        />
      </a-col>
      <a-col :sm="24" :md="12">
        <div
          id="outputContainer"
          ref="outputContainer"
          style="height: 80vh; max-width: 100%"
        />
      </a-col>
    </a-row>
    <br />
    <div style="margin-bottom: 16px">
      yupi：你能体会手写一句 3000 行的 SQL、牵一发而动全身的恐惧么？
    </div>
    <a-row justify="center">
      <a-space>
        作者：<a href="https://github.com/liyupi" target="_blank">鱼皮</a>
        <a-divider type="vertical" />
        <a href="https://github.com/liyupi/sql-generator" target="_blank">
          <github-outlined />
          项目已开源，欢迎 star
        </a>
      </a-space>
    </a-row>
    <a-drawer
      v-model:visible="drawerVisible"
      title="调用树"
      placement="right"
      :body-style="{ width: '50vw' }"
    >
      <SearchableTree :tree="invokeTree" />
    </a-drawer>
  </div>
</template>

<style>
#app {
  padding: 20px;
}

.ant-drawer-content-wrapper {
  width: auto !important;
}
</style>
