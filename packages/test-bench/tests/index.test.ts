import { createNearbyGraph as createNearbyGraphAssembly } from "assemblyscript-spacial-partitioning";
import {
	init,
	createNearByGraph as create_nearby_graph,
} from "@robertaron/spacial-partitioning";
import { createNearbyGraph as createNearbyGraphTypescript } from "typescript-spacial-partitioning";
import { describe, expect, test } from "vitest";
import { input1, input2, input3 } from "../inputs";

await init();

function convertResult(result: ArrayLike<number>) {
	const output: { from: number; to: number; distance: number }[] = [];
	for (let i = 0; i < result.length; i += 3) {
		output.push({
			from: result[i],
			to: result[i + 1],
			distance: result[i + 2],
		});
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
		expect(convertResult(result.flat())).toEqual([
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
		expect(convertResult(result.flat()).length).toBe(1231);
	});

	test("Input 3", () => {
		const result = create_nearby_graph(input3, 5);
		expect(convertResult(result.flat()).length).toBe(38877);
	});
});

describe("TypeScript Tests", () => {
	test("Input 1", () => {
		const result = createNearbyGraphTypescript(input1, 2);
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
		const result = createNearbyGraphTypescript(input2, 5);
		expect(convertResult(result).length).toBe(1231);
	});

	test("Input 3", () => {
		const result = createNearbyGraphTypescript(input3, 5);
		expect(convertResult(result).length).toBe(38877);
	});

	test("Duplicate check — adjacent buckets", () => {
		const result = createNearbyGraphTypescript(
			[
				5.647883892059326, 12.110956192016602, -9.209344863891602,
				5.647883892059326, 12.110956192016602, -9.209344863891602,
			],
			5,
		);

		expect(result).toEqual([0, 1]); // Should only return one pair
	});
});

describe("Same Results", () => {
	test("Input 1", () => {
		const resAssembly = convertResult(createNearbyGraphAssembly(input1, 2));
		const resRust = convertResult(createNearbyGraphAssembly(input1, 2));
		const resTypescript = convertResult(createNearbyGraphAssembly(input1, 2));
		expect(resAssembly).toEqual(resRust);
		expect(resAssembly).toEqual(resTypescript);
	});
	test("Input 2", () => {
		const resAssembly = convertResult(createNearbyGraphAssembly(input2, 2));
		const resRust = convertResult(createNearbyGraphAssembly(input2, 2));
		const resTypescript = convertResult(createNearbyGraphAssembly(input2, 2));
		expect(resAssembly).toEqual(resRust);
		expect(resAssembly).toEqual(resTypescript);
	});
	test("Input 3", () => {
		const resAssembly = convertResult(createNearbyGraphAssembly(input3, 2));
		const resRust = convertResult(createNearbyGraphAssembly(input3, 2));
		const resTypescript = convertResult(createNearbyGraphAssembly(input3, 2));
		expect(resAssembly).toEqual(resRust);
		expect(resAssembly).toEqual(resTypescript);
	});
});
