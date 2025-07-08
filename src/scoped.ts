import { after, before, instead } from "./patcher";

export class Patcher {
	#unpatches = new Set<() => boolean>();
	#wrapPatchFunc = <T extends (...args: any[]) => () => boolean>(func: T) =>
		((...args) => {
			const unpatch = func.apply(func, args);
			this.#unpatches.add(unpatch);
			return () => {
				this.#unpatches.delete(unpatch);
				return unpatch();
			};
		}) as T;

	before = this.#wrapPatchFunc(before);
	after = this.#wrapPatchFunc(after);
	instead = this.#wrapPatchFunc(instead);
	unpatchAll = () => {
		this.#unpatches.forEach((p) => p());
		return true;
	};
}
