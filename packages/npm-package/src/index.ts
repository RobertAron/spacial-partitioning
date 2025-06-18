import * as rustLibrary from "../../rust-spacial-partitioning-dist";

let ready = false;
async function init() {
	return rustLibrary.default().then((res) => {
		ready = true;
		return res;
	});
}

function createNearByGraph(vec_tuples: Float32Array, distance: number) {
	const size = vec_tuples.length / 3;
	const rawResult = rustLibrary.create_nearby_graph(vec_tuples, distance);
	const result = new Array(size).fill(null).map((): number[] => []);
	for (let i = 0; i < rawResult.length; i += 2) {
		const from = rawResult[i];
		const to = rawResult[i + 1];
		result[from].push(to);
		result[to].push(from);
	}
	return result;
}

export { init, createNearByGraph };
