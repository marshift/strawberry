import { type PatchType, patchedFunctions } from "./shared";

export function unpatch(
  patchedFunction: Function,
  hookId: symbol,
  type: PatchType,
) {
  const patch = patchedFunctions.get(patchedFunction);
  if (!patch || !patch[type].delete(hookId)) return false;

  return true;
}
