import { equal as isEqual } from "node:assert/strict";
import { describe, it } from "node:test";
import { after, before, instead, unpatchAll } from "../../dist/index.js";

describe("strawberry unpatches", () => {
	it("should be able to unpatch the most recent on a given func", () => {
		after(testFuncs, "passthru", ([], ret) => ret + "a");
		const unpatch = after(testFuncs, "passthru", ([], ret) => ret + "b");

		unpatch();
		isEqual(testFuncs.passthru("x_"), "x_a");
	});

	it("should be able to unpatch the first on a given func", () => {
		const unpatch = after(testFuncs, "passthru", ([], ret) => ret + "a");
		after(testFuncs, "passthru", ([], ret) => ret + "b");

		unpatch();
		isEqual(testFuncs.passthru("x_"), "x_b");
	});

	it("should be able to unpatch an in-between on a given func", () => {
		after(testFuncs, "passthru", ([], ret) => ret + "a");
		const unpatch = after(testFuncs, "passthru", ([], ret) => ret + "b");
		after(testFuncs, "passthru", ([], ret) => ret + "c");

		unpatch();
		isEqual(testFuncs.passthru("x_"), "x_ac");
	});

	it("should be able to completely unpatch", () => {
		before(testFuncs, "simple", ([a, b]) => [a + 1, b + 1]);
		after(testFuncs, "simple", ([], ret) => ret / 2);

		after(testFuncs, "passthru", ([], ret) => ret + "_patched");

		instead(testFuncs, "contextual", ([a], orig) => orig.call({ x: 1, y: 1, z: "a" }, a - 4));

		unpatchAll();

		const ctx = { x: 17, y: 5, z: "test" };

		isEqual(testFuncs.simple(1, 2), 3);
		isEqual(testFuncs.contextual.call(ctx, 1), "3.2test");
		isEqual(testFuncs.passthru("x"), "x");
	});
});
