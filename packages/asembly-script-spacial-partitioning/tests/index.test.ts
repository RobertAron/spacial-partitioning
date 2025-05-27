import { createNearbyGraph } from "../build/debug.js";
import { test } from "bun:test";

// test("2 + 2", () => {
// 	expect(add(2, 2)).toBe(4);
// });

test("thing", () => {
	console.log("start thing");
	const result = createNearbyGraph(
		// biome-ignore format: tuples
		new Float32Array([
      1, 4, 10,
      1, 4, 11,
      1, 4, 49,
      1, 4, 50.5
    ]),
		2,
	);
	console.log({ result });
});
