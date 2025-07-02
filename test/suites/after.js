import { equal as isEqual } from "node:assert/strict";
import { describe, it } from "node:test";
import { after } from "../../dist/index.js";

describe("strawberry after patches", () => {
	it("should patch a simple func", () => {
		after(testFuncs, "simple", ([, b], ret) => ret * b);

		isEqual(testFuncs.simple(1, 2), 6);
	});

	it("should be unpatchable", () => {
		const unpatch = after(testFuncs, "simple", () => 0);

		unpatch();

		isEqual(testFuncs.simple(1, 2), 3);
	});

	it("should maintain context", () => {
		after(testFuncs, "contextual", function() {
			isEqual(this?.x, 17);
			isEqual(this.y, 5);
			isEqual(this.z, "test");
		});

		const ctx = { x: 17, y: 5, z: "test" };

		isEqual(testFuncs.contextual.call(ctx, 1), "3.2test");
	});
});
