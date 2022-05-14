/**
 * 生成 SQL 入口函数
 * @param json
 */
export function doGenerateSQL(json: InputJSON) {
  // 缺失入口
  if (!json?.main) {
    return null;
  }
  const sql = json.main.sql ?? json.main;
  if (!sql) {
    return null;
  }
  const initTreeNode = {
    title: "main",
    sql,
    children: [],
  };
  const rootInvokeTreeNode = { ...initTreeNode };
  const context = json;
  const resultSQL = generateSQL(
    "main",
    context,
    context.main?.params,
    rootInvokeTreeNode
  );
  return {
    resultSQL,
    invokeTree: rootInvokeTreeNode.children[0], // 取第一个作为根节点
  };
}

/**
 * 递归生成 SQL
 * @param key
 * @param context
 * @param params
 * @param invokeTreeNode
 */
function generateSQL(
  key: string,
  context: InputJSON,
  params?: Record<string, string>,
  invokeTreeNode?: InvokeTreeNode
): string {
  const currentNode = context[key];
  if (!currentNode) {
    return "";
  }
  let childInvokeTreeNode: InvokeTreeNode | undefined;
  if (invokeTreeNode) {
    childInvokeTreeNode = {
      title: key,
      sql: currentNode.sql ?? currentNode,
      params,
      children: [],
    };
    invokeTreeNode.children?.push(childInvokeTreeNode);
  }
  const result = replaceParams(
    currentNode,
    context,
    params,
    childInvokeTreeNode
  );
  const resultSQL = replaceSubSql(result, context, childInvokeTreeNode);
  if (childInvokeTreeNode) {
    childInvokeTreeNode.resultSQL = resultSQL;
  }
  return resultSQL;
}

/**
 * 参数替换（params）
 * @param currentNode
 * @param context
 * @param params 动态参数
 * @param invokeTreeNode
 */
function replaceParams(
  currentNode: InputJSONValue,
  context: InputJSON,
  params?: Record<string, string>,
  invokeTreeNode?: InvokeTreeNode
): string {
  if (currentNode == null) {
    return "";
  }
  const sql = currentNode.sql ?? currentNode;
  if (!sql) {
    return "";
  }
  // 动态、静态参数结合，且优先用静态参数
  params = { ...(params ?? {}), ...currentNode.params };
  if (invokeTreeNode) {
    invokeTreeNode.params = params;
  }
  // 无需替换
  if (!params || Object.keys(params).length < 1) {
    return sql;
  }
  let result = sql;
  for (const paramsKey in params) {
    const replacedKey = `#{${paramsKey}}`;
    // 递归解析
    // const replacement = replaceSubSql(
    //   params[paramsKey],
    //   context,
    //   invokeTreeNode
    // );
    const replacement = params[paramsKey];
    // find and replace
    result = result.replaceAll(replacedKey, replacement);
  }
  return result;
}

/**
 * 替换子 SQL（@xxx）
 * @param sql
 * @param context
 * @param invokeTreeNode
 */
function replaceSubSql(
  sql: string,
  context: InputJSON,
  invokeTreeNode?: InvokeTreeNode
): string {
  if (!sql) {
    return "";
  }
  let result = sql;
  result = String(result);
  let regExpMatchArray = matchSubQuery(result);
  // 依次替换
  while (regExpMatchArray && regExpMatchArray.length > 2) {
    // 找到结果
    const subKey = regExpMatchArray[1];
    // 可用来替换的节点
    const replacementNode = context[subKey];
    // 没有可替换的节点
    if (!replacementNode) {
      const errorMsg = `${subKey} 不存在`;
      alert(errorMsg);
      throw new Error(errorMsg);
    }
    // 获取要传递的动态参数
    // e.g. "a = b, c = d"
    let paramsStr = regExpMatchArray[2];
    if (paramsStr) {
      paramsStr = paramsStr.trim();
    }
    // e.g. ["a = b", "c = d"]
    const singleParamsStrArray = paramsStr.split("|||");
    // string => object
    const params: Record<string, string> = {};
    for (const singleParamsStr of singleParamsStrArray) {
      // 必须分成 2 段
      const keyValueArray = singleParamsStr.split("=", 2);
      if (keyValueArray.length < 2) {
        continue;
      }
      const key = keyValueArray[0].trim();
      params[key] = keyValueArray[1].trim();
    }
    // 递归解析被替换节点
    const replacement = generateSQL(subKey, context, params, invokeTreeNode);
    result = result.replace(regExpMatchArray[0], replacement);
    regExpMatchArray = matchSubQuery(result);
  }
  return result;
}

/**
 * 匹配子查询
 * @param str
 */
function matchSubQuery(str: string) {
  if (!str) {
    return null;
  }
  const regExp = /@([\u4e00-\u9fa5_a-zA-Z0-9]+)\((.*?)\)/;
  let regExpMatchArray = str.match(regExp);
  if (!regExpMatchArray || regExpMatchArray.index === undefined) {
    return null;
  }
  // @ 开始位置
  let startPos = regExpMatchArray.index;
  // 左括号右侧
  let leftParenthesisPos = startPos + regExpMatchArray[1].length + 2;
  // 遍历游标
  let currPos = leftParenthesisPos;
  // 默认匹配结束位置，需要对此结果进行修正
  let endPos = startPos + regExpMatchArray[0].length;
  // 剩余待匹配左括号数量
  let leftCount = 1;
  while (currPos < str.length) {
    const currentChar = str.charAt(currPos);
    if (currentChar === "(") {
      leftCount++;
    } else if (currentChar === ")") {
      leftCount--;
    }
    // 匹配结束
    if (leftCount == 0) {
      endPos = currPos + 1;
      break;
    }
    currPos++;
  }
  return [
    str.slice(startPos, endPos),
    regExpMatchArray[1],
    str.slice(leftParenthesisPos, endPos - 1),
  ];
}
