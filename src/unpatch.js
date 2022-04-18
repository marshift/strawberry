import { patchedObjects, patches } from "./shared.js";

export function unpatch(patchId, hookId, type) {
  const patch = patches.get(patchId);

  if (!patch) return false;

  const hooks = patch.hooks;

  if (!hooks[type].has(hookId)) return false;

  hooks[type].delete(hookId);

  const patchIdMap = patchedObjects.get(patch.functionParent);

  // If there are no more hooks for every type, remove the patch
  const types = Object.keys(hooks);
  if (types.every((type) => hooks[type].size == 0)) {
    try {
      Object.defineProperty(patch.functionParent, patch.functionName, {
        value: patch.originalFunction,
        writable: true,
        configurable: true,
      });
    } catch {
      patch.functionParent[patch.functionName] = patch.originalFunction;
    }

    patchIdMap.delete(patch.functionName);
    patches.delete(patchId);
  }

  if (patchIdMap.size == 0) patchedObjects.delete(patch.functionParent);

  return true;
}

export function unpatchAll() {
  for (const [patch, patchHook] of patches.entries())
    for (const type in patchHook.hooks) {
      if (!patches.has(patch)) continue;

      const hooks = patches.get(patch)?.hooks[type];

      for (const hook of hooks.keys()) unpatch(patch, hook, type);
    }
}
