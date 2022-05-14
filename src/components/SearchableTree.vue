<template>
  <div>
    <a-input-search
      v-model:value="searchValue"
      size="large"
      style="margin-bottom: 16px"
      placeholder="输入规则名搜索"
      enter-button
    />
    <a-tree
      :expanded-keys="expandedKeys"
      :auto-expand-parent="autoExpandParent"
      :tree-data="tree"
      @expand="onExpand"
    >
      <template #title="{ title }">
        <span v-if="title.indexOf(searchValue) > -1">
          {{ title.substr(0, title.indexOf(searchValue)) }}
          <span style="color: #f50">{{ searchValue }}</span>
          {{ title.substr(title.indexOf(searchValue) + searchValue.length) }}
        </span>
        <span v-else>{{ title }}</span>
      </template>
    </a-tree>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{ tree: InvokeTree }>();

const tree = ref(props.tree);
if (!tree.value) {
  tree.value = [];
}

const expandedKeys = ref<string[]>([]);
const searchValue = ref<string>("");
const autoExpandParent = ref<boolean>(true);

const getParentKey = (
  key: string | undefined,
  tree: InvokeTree
): string | number | undefined => {
  let parentKey;
  for (let i = 0; i < tree.length; i++) {
    const node = tree[i];
    if (node.children) {
      if (node.children.some((item) => item.key === key)) {
        parentKey = node.key;
      } else if (getParentKey(key, node.children)) {
        parentKey = getParentKey(key, node.children);
      }
    }
  }
  return parentKey;
};

const onExpand = (keys: string[]) => {
  expandedKeys.value = keys;
  autoExpandParent.value = false;
};

const dataList: InvokeTreeNode[] = [];
const generateList = (data: InvokeTreeNode[], preKey: string) => {
  for (let i = 0; i < data.length; i++) {
    const node = data[i];
    // 给 tree 每个节点添加唯一的 key
    const key = preKey + "-" + i;
    node.key = key;
    dataList.push(node);
    if (node.children) {
      generateList(node.children, key);
    }
  }
};
generateList(tree.value, "");

watch(searchValue, (value) => {
  expandedKeys.value = dataList
    .map((item: InvokeTreeNode) => {
      if (item.title.indexOf(value) > -1) {
        return getParentKey(item.key, tree.value);
      }
      return null;
    })
    .filter((item, i, self) => item && self.indexOf(item) === i) as any;
  searchValue.value = value;
  autoExpandParent.value = true;
});
</script>
