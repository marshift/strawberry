import hook from "./hook";

type PatchType = "b" | "i" | "a";

interface Patch {
	// Before hooks
	b: Map<symbol, Function>;
	// Instead hooks
	i: Map<symbol, Function>;
	// After hooks
	a: Map<symbol, Function>;
	// Cleanups
	c: Function[];
}

// These types are about as accurate as I can get, if a little redundant
interface CallbackTypes<F extends (...args: any[]) => any> {
	b: (args: Parameters<F> | any) => Parameters<F> | any;
	i: (args: Parameters<F>, origFunc: NonNullable<F>) => ReturnType<F> | any;
	a: (args: Parameters<F>, ret: ReturnType<F>) => ReturnType<F> | any;
}

export const getPatchFunc = <T extends PatchType>(patchType: T) =>
<P extends Record<any, any>, N extends keyof P>(
	funcParent: P,
	funcName: N,
	callback: CallbackTypes<P[N]>[T],
	oneTime = false,
) => {
	let origFunc = funcParent[funcName];

	if (typeof origFunc !== "function") {
		throw new Error(
			`${String(funcName)} is not a function in ${funcParent.constructor.name}`,
		);
	}

	let funcPatch = patchedFunctions.get(origFunc);

	if (!funcPatch) {
		funcPatch = {
			b: new Map(),
			i: new Map(),
			a: new Map(),
			c: [],
		};

		const replaceProxy = new Proxy(origFunc, {
			apply: (_, ctx, args) => runHook(ctx, args, false),
			construct: (_, args) => runHook(origFunc, args, true),

			get: (target, prop, receiver) =>
				prop == "toString"
					? origFunc.toString.bind(origFunc)
					: Reflect.get(target, prop, receiver),
		});

		const runHook: any = (
			ctx: unknown,
			args: unknown[],
			construct: boolean,
		) => hook(replaceProxy, origFunc, args, ctx, construct);

		patchedFunctions.set(replaceProxy, funcPatch);

		if (
			!Reflect.defineProperty(funcParent, funcName, {
				value: replaceProxy,
				configurable: true,
				writable: true,
			})
		) {
			funcParent[funcName] = replaceProxy;
		}
	}

	const hookId = Symbol();

	const patchedFunc = funcParent[funcName];
	const unpatchThisPatch = () => unpatch(patchedFunc, hookId, patchType);

	if (oneTime) funcPatch.c.push(unpatchThisPatch);
	funcPatch[patchType].set(hookId, callback);

	return unpatchThisPatch;
};

export function unpatch(
	patchedFunction: Function,
	hookId: symbol,
	type: PatchType,
) {
	const patch = patchedFunctions.get(patchedFunction);
	if (!patch || !patch[type].delete(hookId)) return false;

	return true;
}

export let patchedFunctions: WeakMap<Function, Patch>;
export const unpatchAll = () => (patchedFunctions = new WeakMap<Function, Patch>());
unpatchAll(); // HACK: Create the patchedFunctions array initially
