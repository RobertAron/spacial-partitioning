import { createNearbyGraph } from "../build/debug.js";
import { expect, test } from "bun:test";

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
	const output: { from: number; to: number }[] = [];
	for (let i = 0; i < result.length; i += 2) {
		output.push({ from: result[i], to: result[i + 1] });
	}
	// expect(output).toEqual([
	// 	{
	// 		from: 0,
	// 		to: 1,
	// 	},
	// 	{
	// 		from: 2,
	// 		to: 3,
	// 	},
	// ]);
});
