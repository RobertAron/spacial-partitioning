import { createNearbyGraph as createNearbyGraphAssembly } from "asembly-script-spacial-partitioning";
import init, { create_nearby_graph } from "rust-spacial-partitioning";
import { describe, expect, test } from "bun:test";
import { input1, input2, input3 } from "../inputs";

await init();

function convertResult(result: ArrayLike<number>) {
	const output: { from: number; to: number }[] = [];
	for (let i = 0; i < result.length; i += 2) {
		output.push({ from: result[i], to: result[i + 1] });
	}
	return output.sort((a, b) => {
		if (a.from !== b.from) return a.from - b.from;
		return a.to - b.to;
	});
}

describe("Assembly Script Tests", () => {
	test("Input 1", () => {
		const result = createNearbyGraphAssembly(input1, 2);
		expect(convertResult(result)).toEqual([
			{
				from: 0,
				to: 1,
			},
			{
				from: 2,
				to: 3,
			},
		]);
	});

	test("Input 2", () => {
		const result = createNearbyGraphAssembly(input2, 5);
		expect(convertResult(result).length).toBe(1231);
	});

	test("Input 3", () => {
		const result = createNearbyGraphAssembly(input3, 5);
		expect(convertResult(result).length).toBe(38877);
	});
});

describe("Rust Script Tests", () => {
	test("Input 1", () => {
		const result = create_nearby_graph(input1, 2);
		expect(convertResult(result)).toEqual([
			{
				from: 0,
				to: 1,
			},
			{
				from: 2,
				to: 3,
			},
		]);
	});

	test("Input 2", () => {
		const result = create_nearby_graph(input2, 5);
		expect(convertResult(result).length).toBe(1231);
	});

	test("Input 3", () => {
		const result = create_nearby_graph(input3, 5);
		expect(convertResult(result).length).toBe(38877);
	});
});

describe("Same Results", () => {
	test("Input 1", () => {
		expect(convertResult(createNearbyGraphAssembly(input1, 2))).toEqual(
			convertResult(create_nearby_graph(input1, 2)),
		);
	});
	test("Input 2", () => {
		expect(convertResult(createNearbyGraphAssembly(input2, 2))).toEqual(
			convertResult(create_nearby_graph(input2, 2)),
		);
	});
	test("Input 2", () => {
		expect(convertResult(createNearbyGraphAssembly(input3, 2))).toEqual(
			convertResult(create_nearby_graph(input3, 2)),
		);
	});
});
