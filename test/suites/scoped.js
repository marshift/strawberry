import { equal as isEqual } from "node:assert/strict";
import { describe, it } from "node:test";
import { after, Patcher } from "../../dist/index.js";

describe("strawberry scoping", () => {
	it("should patch and unpatch within a scope", () => {
		const patcher = new Patcher();
		const unpatch = patcher.after(testFuncs, "simple", ([, b], ret) => ret * b);
		isEqual(testFuncs.simple(1, 2), 6);

		unpatch();
		isEqual(testFuncs.simple(1, 2), 3);
	});

	it("should distinguish scoped patches from unscoped patches", () => {
		after(testFuncs, "passthru", () => "unscoped");

		const patcher = new Patcher();
		patcher.after(testFuncs, "passthru", () => "scoped");

		patcher.unpatchAll();
		isEqual(testFuncs.passthru(), "unscoped");
	});
});
