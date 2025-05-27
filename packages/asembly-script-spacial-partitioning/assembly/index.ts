class Vec3 {
	x: number;
	y: number;
	z: number;
	constructor(x: number, y: number, z: number) {
		this.x = x;
		this.y = y;
		this.z = z;
	}
	toString(): string {
		return `${this.x.toString()}:${this.y.toString()}:${this.z.toString()}`;
	}
}

class NodePair {
	from: u32;
	to: u32;
	constructor(id: u32, to: u32) {
		this.from = id;
		this.to = to;
	}
	toString(): string {
		return `{from:${this.from},to:${this.to}}`;
	}
}

@inline
const bucketValue = (value: number, floorTo: number): number =>
	floor(value / floorTo);

@inline
function vec3ToVecBucket(vec3: Vec3, bucket: number): Vec3 {
	const x = bucketValue(vec3.x, bucket);
	const y = bucketValue(vec3.y, bucket);
	const z = bucketValue(vec3.z, bucket);
	return new Vec3(x, y, z);
}

/**
 *
 * @param vecTuples Float32Array of vec3 positions (flattened)
 * @param distance
 */
export function createNearbyGraph(
	vecTuples: Float32Array,
	distance: f32,
): Uint32Array {
	const vecs = new Array<Vec3>(vecTuples.length / 3);
	for (let i = 0; i < vecTuples.length; i += 3) {
		vecs[i / 3] = new Vec3(vecTuples[i], vecTuples[i + 1], vecTuples[i + 2]);
	}
	const bucketedVecIndexes = new Map<string, u32[]>();
	for (let i = 0; i < vecs.length; ++i) {
		const vec = vecs[i];
		const bucketKey = vec3ToVecBucket(vec, distance).toString();
		if (!bucketedVecIndexes.has(bucketKey))
			bucketedVecIndexes.set(bucketKey, [i]);
		else {
			const bucket = bucketedVecIndexes.get(bucketKey);
			bucket.push(i);
		}
	}
	
	const nearbyLookup = new Array<NodePair>();
	const completedCalculations = new Set<string>();
	const bucketedVecValues = bucketedVecIndexes.values();
	for (let i = 0; i < bucketedVecValues.length; ++i) {
		const vectorIndexes = bucketedVecValues[i];
		const sampleVec = vecs[vectorIndexes[0]];
		const bucketIndexes = vec3ToVecBucket(sampleVec, distance);
		let nearishVectorIndexes = new Array<u32>();
		for (let x = bucketIndexes.x - 1; x <= bucketIndexes.x + 1; x++) {
			for (let y = bucketIndexes.y - 1; y <= bucketIndexes.y + 1; y++) {
				for (let z = bucketIndexes.z - 1; z <= bucketIndexes.z + 1; z++) {
					const nearbyBucketKey = new Vec3(x, y, z).toString();
					const thingsInNearbyBucket = bucketedVecIndexes.has(nearbyBucketKey);
					if (thingsInNearbyBucket) {
						const hmm = nearishVectorIndexes.concat(
							bucketedVecIndexes.get(nearbyBucketKey),
						);
						nearishVectorIndexes = hmm;
					}
				}
			}
		}
		// Go through all the nearish indexes and do the actual calculation
		for (let i = 0; i < nearishVectorIndexes.length; i++) {
			const firstVectorIndex = nearishVectorIndexes[i];
			const currentVector = vecs[nearishVectorIndexes[i]];
			for (let j = 0; j < nearishVectorIndexes.length; j++) {
				// can't be near yourself
				if (i === j) continue;
				const otherVectorIndex = nearishVectorIndexes[j];
				const otherVector = vecs[nearishVectorIndexes[j]];
				const low =
					firstVectorIndex < otherVectorIndex
						? firstVectorIndex
						: otherVectorIndex;
				const high =
					firstVectorIndex > otherVectorIndex
						? firstVectorIndex
						: otherVectorIndex;
				const workId = `${low}:${high}`;
				if (completedCalculations.has(workId)) continue;
				completedCalculations.add(workId);
				const distanceBetweenPoints = Math.sqrt(
					(otherVector.x - currentVector.x) ** 2 +
						(otherVector.y - currentVector.y) ** 2 +
						(otherVector.z - currentVector.z) ** 2,
				);
				if (distanceBetweenPoints < distance) {
					const idDistance = new NodePair(firstVectorIndex, otherVectorIndex);
					nearbyLookup.push(idDistance);
				}
			}
		}
	}
	const result = new Uint32Array(nearbyLookup.length * 2);
	for (let i = 0; i < nearbyLookup.length; i++) {
		const pair = nearbyLookup[i];
		result[i * 2] = pair.from;
		result[i * 2 + 1] = pair.to;
	}
	return result;
	// return new Uint32Array(0)
}
