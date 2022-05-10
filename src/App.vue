<script setup lang="ts">
import {doGenerateSQL} from "./generator";
import {onMounted, ref, toRaw} from "vue";
import * as monaco from "monaco-editor";
import IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
import {format} from "sql-formatter";

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

// @ts-ignore
(self as any).MonacoEnvironment = {
  getWorker(_: any, label: any) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  }
}

const inputEditor = ref<IStandaloneCodeEditor>();
const outputEditor = ref<IStandaloneCodeEditor>();
const inputContainer = ref<HTMLElement>();
const outputContainer = ref<HTMLElement>();

const getSQL = () => {
  if (inputEditor.value && outputEditor.value) {
    const inputJSON = JSON.parse(toRaw(inputEditor.value).getValue());
    let result = format(doGenerateSQL(inputJSON));
    // 针对执行引擎，处理自动格式化的问题
    result = result.replaceAll("{ {", "{{")
    result = result.replaceAll("} }", "}}")
    toRaw(outputEditor.value).setValue(result);
  }
}

const getInvokeTree = () => {

}

const initJSONValue = "{\n" +
    "    \"main\": {\n" +
    "        \"sql\": \"select * from @union_all_layer(分区 = 2021) where 分区 = #{分区}\",\n" +
    "        \"params\": {\n" +
    "            \"分区\": 2022\n" +
    "        }\n" +
    "    },\n" +
    "    \"union_all_layer\": {\n" +
    "        \"sql\": \"select * from xx where 分区 = #{分区}\"\n" +
    "    }\n" +
    "}";

onMounted(() => {
  if (inputContainer.value) {
    inputEditor.value = monaco.editor.create(inputContainer.value, {
      value: localStorage.getItem('draft') ?? initJSONValue,
      language: 'json',
      theme: 'vs-dark',
      formatOnPaste: true,
      fontSize: 16,
      minimap: {
        enabled: false,
      },
    });
    setInterval(() => {
      if (inputEditor.value) {
        localStorage.setItem('draft', toRaw(inputEditor.value).getValue());
      }
    }, 3000)
  }
  if (outputContainer.value) {
    outputEditor.value = monaco.editor.create(outputContainer.value, {
      value: "",
      language: 'sql',
      theme: 'vs-dark',
      formatOnPaste: true,
      fontSize: 16,
      minimap: {
        enabled: false,
      },
    });
    getSQL();
  }
});

</script>

<template>
  <h1>
    SQL 生成器 - 用 JSON 来写 SQL
    <div style="float: right">
      <t-button size="large" theme="primary" @click="getSQL" > 生成 SQL</t-button>
      <t-divider theme="vertical" />
      <t-button size="large" theme="default" @click="getInvokeTree"> 查看调用树</t-button>
    </div>
    <t-tree :data="[]" activable hover />
  </h1>
  <t-row :gutter="24">
    <t-col :xs="12" :sm="6">
      <div id="inputContainer" ref="inputContainer" style="height: 80vh; max-width: 100%"/>
    </t-col>
    <t-col :xs="12" :sm="6">
      <div id="outputContainer" ref="outputContainer" style="height: 80vh; max-width: 100%"/>
    </t-col>
  </t-row>
  <br/>
  <div>
    yupi：你能体会手写 1500 行 SQL、牵一发而动全身的恐惧么？
  </div>
</template>

<style>
#app {
  padding: 0 25px;
}

</style>
