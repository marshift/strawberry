// curried - getPatchFunc("before")(...)
// allows us to apply an argument while leaving the rest open much cleaner.
// functional programming strikes again! -- sink

import hook from "./hook.ts";
import { patchedObjects, PatchType } from "./shared.ts";
import { unpatch } from "./unpatch.ts";

// creates a hook if needed, else just adds one to the patches array
export default <CallbackType extends Function>(patchType: PatchType) =>
  (
    funcName: string,
    funcParent: any,
    callback: CallbackType,
    oneTime = false
  ) => {
    if (typeof funcParent[funcName] !== "function")
      throw new Error(
        `${funcName} is not a function in ${funcParent.constructor.name}`
      );

    if (!patchedObjects.has(funcParent)) patchedObjects.set(funcParent, {});

    const parentInjections = patchedObjects.get(funcParent);

    // @ts-expect-error
    if (!parentInjections[funcName]) {
      const origFunc = funcParent[funcName];

      // note to future me optimising for size: extracting new Map() to a func increases size --sink
      // @ts-expect-error
      parentInjections[funcName] = {
        o: origFunc,
        b: new Map(),
        i: new Map(),
        a: new Map(),
      };

      const runHook = (ctxt: unknown, args: unknown[], construct: boolean) => {
        const ret = hook(funcName, funcParent, args, ctxt, construct);
        if (oneTime) unpatchThisPatch();
        return ret;
      };

      const replaceProxy = new Proxy(origFunc, {
        apply: (_, ctxt, args) => runHook(ctxt, args, false),
        construct: (_, args) => runHook(origFunc, args, true),

        get: (target, prop, receiver) =>
          prop == "toString"
            ? origFunc.toString.bind(origFunc)
            : Reflect.get(target, prop, receiver),
      });

      // this works around breaking some async find implementation which listens for assigns via proxy
      // see comment in unpatch.ts
      const success = Reflect.defineProperty(funcParent, funcName, {
        value: replaceProxy,
        configurable: true,
        writable: true,
      });

      if (!success) funcParent[funcName] = replaceProxy;
    }

    const hookId = Symbol();
    const unpatchThisPatch = () =>
      unpatch(funcParent, funcName, hookId, patchType);

    // @ts-expect-error
    parentInjections[funcName][patchType].set(hookId, callback);

    return unpatchThisPatch;
  };
