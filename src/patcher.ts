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

// These might be a bit strict, but the user can cast if needed
interface CallbackTypes<F extends (...args: any[]) => any> {
	b: (args: Parameters<F>) => Parameters<F> | void | undefined;
	i: (args: Parameters<F>, origFunc: NonNullable<F>) => ReturnType<F>;
	a: (args: Parameters<F>, ret: ReturnType<F>) => ReturnType<F> | void | undefined;
}

export const getPatchFunc =
	<T extends PatchType>(patchType: T) =>
	<P extends Record<PropertyKey, any>, N extends keyof P>(
		funcParent: P,
		funcName: N,
		callback: CallbackTypes<P[N]>[T],
		oneTime = false,
	) => {
		let origFunc: Function = funcParent[funcName];
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
				get: (target, prop, receiver) => {
					const res = Reflect.get(target, prop, receiver);
					return typeof res === "function"
						? res.bind(origFunc)
						: res;
				},
			});

			const runHook: any = (
				ctx: Function,
				args: unknown[],
				construct: boolean,
			) =>
				hook(
					replaceProxy,
					(...args: unknown[]) =>
						construct
							? Reflect.construct(origFunc, args, ctx)
							: origFunc.apply(ctx, args),
					args,
					ctx,
				);

			patchedFunctions.set(replaceProxy, funcPatch);

			if (
				!Reflect.defineProperty(funcParent, funcName, {
					value: replaceProxy,
					configurable: true,
					writable: true,
				})
			) {
				funcParent[funcName] = replaceProxy as P[N];
			}
		}

		const hookId = Symbol();

		const patchedFunc = funcParent[funcName];
		const unpatchThisPatch = () => unpatch(patchedFunc, hookId, patchType);

		if (oneTime) funcPatch.c.push(unpatchThisPatch);
		funcPatch[patchType].set(hookId, callback);

		return unpatchThisPatch;
	};

export let patchedFunctions: WeakMap<Function, Patch>;

export const before = getPatchFunc("b");
export const instead = getPatchFunc("i");
export const after = getPatchFunc("a");

export function unpatch(
	patchedFunction: Function,
	hookId: symbol,
	type: PatchType,
) {
	const patch = patchedFunctions.get(patchedFunction);
	if (!patch || !patch[type].delete(hookId)) return false;
	return true;
}

export const unpatchAll = () => !!(patchedFunctions = new WeakMap<Function, Patch>());
unpatchAll(); // HACK: Create the patchedFunctions array initially
