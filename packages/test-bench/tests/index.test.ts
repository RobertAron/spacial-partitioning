import { createNearbyGraph as createNearbyGraphAssembly } from "assemblyscript-spacial-partitioning";
import {
	init,
	createNearByGraph as createNearbyGraphRust,
} from "@robertaron/spacial-partitioning";
import { createNearbyGraph as createNearbyGraphTypescript } from "typescript-spacial-partitioning";
import { describe, expect, test } from "vitest";
import { input1, input2, input3 } from "../inputs";

await init();

function orderResults(
	output: { from: number; to: number; distance: number }[],
) {
	return output.sort((a, b) => {
		if (a.from !== b.from) return a.from - b.from;
		return a.to - b.to;
	});
}

function convertResult(result: ArrayLike<number>) {
	const output: { from: number; to: number; distance: number }[] = [];
	for (let i = 0; i < result.length; i += 3) {
		output.push({
			from: result[i],
			to: result[i + 1],
			distance: result[i + 2],
		});
	}
	return orderResults(output);
}

function resultsAreEqual(
	a: { from: number; to: number; distance: number }[],
	b: { from: number; to: number; distance: number }[],
	tolerance = 0.0001,
) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i].from !== b[i].from || a[i].to !== b[i].to) return false;
		if (Math.abs(a[i].distance - b[i].distance) > tolerance) return false;
	}
	return true;
}

describe("Assembly Script Tests", () => {
	test("Input 1", () => {
		const result = createNearbyGraphAssembly(input1, 2);
		expect(convertResult(result)).toEqual([
			{
				from: 0,
				to: 1,
				distance: 1,
			},
			{
				from: 2,
				to: 3,
				distance: 1.5,
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
		const result = createNearbyGraphRust(input1, 2);
		expect(result).toEqual([
			{
				from: 0,
				to: 1,
				distance: 1,
			},
			{
				from: 2,
				to: 3,
				distance: 1.5,
			},
		]);
	});

	test("Input 2", () => {
		const result = createNearbyGraphRust(input2, 5);
		expect(result.length).toBe(1231);
	});

	test("Input 3", () => {
		const result = createNearbyGraphRust(input3, 5);
		expect(result.length).toBe(38877);
	});
});

describe("TypeScript Tests", () => {
	test("Input 1", () => {
		const result = createNearbyGraphTypescript(input1, 2);
		expect(convertResult(result)).toEqual([
			{
				from: 0,
				to: 1,
				distance: 1,
			},
			{
				from: 2,
				to: 3,
				distance: 1.5,
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

		expect(result).toEqual([0, 1, 0]); // Should only return one pair with distance 0
	});
});

describe("Same Results", () => {
	test("Input 1", () => {
		const resAssembly = convertResult(createNearbyGraphAssembly(input1, 2));
		const resRust = orderResults(createNearbyGraphRust(input1, 2));
		const resTypescript = convertResult(createNearbyGraphTypescript(input1, 2));
		expect(resultsAreEqual(resAssembly, resRust)).toBe(true);
		expect(resultsAreEqual(resAssembly, resTypescript)).toBe(true);
	});
	test("Input 2", () => {
		const resAssembly = convertResult(createNearbyGraphAssembly(input2, 2));
		const resRust = orderResults(createNearbyGraphRust(input2, 2));
		const resTypescript = convertResult(createNearbyGraphTypescript(input2, 2));
		expect(resultsAreEqual(resAssembly, resRust)).toBe(true);
		expect(resultsAreEqual(resAssembly, resTypescript)).toBe(true);
	});
	test("Input 3", () => {
		const resAssembly = convertResult(createNearbyGraphAssembly(input3, 2));
		const resRust = orderResults(createNearbyGraphRust(input3, 2));
		const resTypescript = convertResult(createNearbyGraphTypescript(input3, 2));
		expect(resultsAreEqual(resAssembly, resRust)).toBe(true);
		expect(resultsAreEqual(resAssembly, resTypescript)).toBe(true);
	});
});
