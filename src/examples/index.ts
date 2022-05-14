import init from "./init.json";
import complex from "./complex.json";

const exampleMap: Record<string, any> = {
  init,
  complex,
};

export const importExample = (key: string) => {
  return JSON.stringify(exampleMap[key]);
};
