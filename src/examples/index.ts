import init from "./init.json";

const exampleMap: Record<string, any> = {
  init,
};

export const importExample = (key: string) => {
  return JSON.stringify(exampleMap[key]);
};
