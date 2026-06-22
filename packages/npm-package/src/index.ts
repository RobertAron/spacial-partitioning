import * as rustLibrary from "../../rust-spacial-partitioning-dist";

let initOutput: rustLibrary.InitOutput | null = null;
async function init() {
	if (initOutput !== null) return initOutput;
	return rustLibrary.default().then((res) => {
		initOutput = res;
		return initOutput;
	});
}

function createNearByGraph(vec_tuples: Float32Array, distance: number) {
	const rawResult = rustLibrary.create_nearby_graph(vec_tuples, distance);
	const result = new Array<{ from: number; to: number; distance: number }>();
	for (let i = 0; i < rawResult.length; i += 3) {
		const from = rawResult[i];
		const to = rawResult[i + 1];
		const distance = rawResult[i + 2];
		result.push({
			from,
			to,
			distance,
		});
	}
	return result;
}

function createCrossNearbyGraph(
	target_tuples: Float32Array,
	source_tuples: Float32Array,
	distance: number,
) {
	const rawResult = rustLibrary.create_cross_nearby_graph(
		target_tuples,
		source_tuples,
		distance,
	);
	const result = new Array<{ target: number; source: number; distance: number }>();
	for (let i = 0; i < rawResult.length; i += 3) {
		const target = rawResult[i];
		const source = rawResult[i + 1];
		const distance = rawResult[i + 2];
		result.push({
			target,
			source,
			distance,
		});
	}
	return result;
}

export { init, createCrossNearbyGraph, createNearByGraph };
