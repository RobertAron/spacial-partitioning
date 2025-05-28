import { createNearbyGraph } from "../build/debug.js";
import { expect, test } from "bun:test";
import { input1, input2, input3 } from "./inputs.js";

test("thing", () => {
	console.log("start thing");
	const result = createNearbyGraph(input1, 2);
	const output: { from: number; to: number }[] = [];
	for (let i = 0; i < result.length; i += 2) {
		output.push({ from: result[i], to: result[i + 1] });
	}
	expect(output).toEqual([
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

test("test2", () => {
	const result = createNearbyGraph(input2, 5);
	const output: { from: number; to: number }[] = [];
	for (let i = 0; i < result.length; i += 2) {
		output.push({ from: result[i], to: result[i + 1] });
	}
	expect(output.length).toBe(1231);
});

test("test3", () => {
	const result = createNearbyGraph(input3, 5);
	const output: { from: number; to: number }[] = [];
	for (let i = 0; i < result.length; i += 2) {
		output.push({ from: result[i], to: result[i + 1] });
	}
});
