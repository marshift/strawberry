// Calls relevant patches and returns the final result
import { patchedFunctions } from "./patcher";

export default (
	patchedFunc: Function,
	origFunc: Function,
	args: unknown[],
	// The value of `this` to apply
	ctx: any,
) => {
	const patch = patchedFunctions.get(patchedFunc);
	if (!patch) return origFunc(...args);

	// Before patches
	for (const hook of patch.b.values()) {
		const maybeArgs = hook.call(ctx, args);
		if (Array.isArray(maybeArgs)) args = maybeArgs;
	}

	// Instead patches
	let workingRetVal = [...patch.i.values()].reduce(
		(prev, current) => (...args: unknown[]) => current.call(ctx, args, prev),
		origFunc,
	)(...args);

	// After patches
	for (const hook of patch.a.values()) {
		workingRetVal = hook.call(ctx, args, workingRetVal) ?? workingRetVal;
	}

	// Cleanups (one-times)
	for (const cleanup of patch.c) cleanup();
	patch.c = [];

	return workingRetVal;
};
