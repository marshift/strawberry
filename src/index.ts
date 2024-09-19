import { getPatchFunc, unpatchAll } from "./patcher";

const before = getPatchFunc("b");
const instead = getPatchFunc("i");
const after = getPatchFunc("a");

export { after, before, instead, unpatchAll };
