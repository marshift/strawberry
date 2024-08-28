import getPatchFunc from "./getPatchFunc";

type BeforeCallback = (args: any[]) => void | undefined | any[];
type InsteadCallback = (args: any[], origFunc: Function) => any;
type AfterCallback = (args: any[], ret: any) => void | undefined | any;

const before = getPatchFunc<BeforeCallback>("b");
const instead = getPatchFunc<InsteadCallback>("i");
const after = getPatchFunc<AfterCallback>("a");

export { after, before, instead };
export { resetPatches as unpatchAll } from "./shared";
