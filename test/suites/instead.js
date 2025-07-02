import { equal as isEqual } from "node:assert/strict";
import { describe, it } from "node:test";
import { instead } from "../../dist/index.js";

describe("strawberry instead patches", () => {
	it("should patch a simple func", () => {
		instead(testFuncs, "simple", ([a, b], orig) => orig(a + b, b - a) * b);

		isEqual(testFuncs.simple(1, 2), 8);
	});

	it("should be unpatchable", () => {
		const unpatch = instead(testFuncs, "simple", () => 0);

		unpatch();

		isEqual(testFuncs.simple(1, 2), 3);
	});

	it("should maintain context", () => {
		instead(testFuncs, "contextual", function(args, orig) {
			isEqual(this?.x, 17);
			isEqual(this.y, 5);
			isEqual(this.z, "test");

			return orig.apply(this, args);
		});

		const ctx = { x: 17, y: 5, z: "test" };

		isEqual(testFuncs.contextual.call(ctx, 1), "3.2test");
	});
});
