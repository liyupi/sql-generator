/**
 * 输入 JSON
 */
interface InputJSON extends Record<string, InputJSONValue> {
    // 入口文件
    main: InputJSONValue;
}

/**
 * 输入 JSON Value
 */
interface InputJSONValue {
    // sql 语句
    sql: string;
    // 静态参数
    params?: Record<string, string>;
}
