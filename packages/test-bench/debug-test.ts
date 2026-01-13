import { createNearbyGraph as createNearbyGraphTypescript } from "typescript-spacial-partitioning";

const input1 = new Float32Array([
	1, 4, 10, 1, 4, 11, 1, 4, 49, 1, 4, 50.5
]);

const result = createNearbyGraphTypescript(input1, 2);
console.log("Raw result:", Array.from(result));
console.log("Result length:", result.length);
