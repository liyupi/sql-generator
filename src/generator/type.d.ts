/**
 * 输入 JSON Value
 */
interface InputJSONValue {
  // sql 语句
  sql: string;
  // 静态参数
  params?: Record<string, string>;
}

/**
 * 调用树节点
 */
interface InvokeTreeNode {
  title: string;
  sql: string;
  key?: string;
  params?: Record<string, string>;
  resultSQL?: string;
  children?: InvokeTreeNode[];
}

/**
 * 调用树
 */
type InvokeTree = InvokeTreeNode[];

/**
 * 输入 JSON
 */
interface InputJSON extends Record<string, InputJSONValue> {
  // 入口文件
  main: InputJSONValue;
}
