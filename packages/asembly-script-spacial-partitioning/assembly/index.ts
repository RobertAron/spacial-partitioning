class Vec3 {
	x: f32;
	y: f32;
	z: f32;
	constructor(x: f32, y: f32, z: f32) {
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

const bucketValue = (value: f32, floorTo: f32): f32 =>
	floor(value / floorTo) as f32;

const bias = 1 << 20; // 1048576
function packXYZBits(x: f32, y: f32, z: f32): i64 {
	// Check that each value fits in 21 bits signed
	// const max = 1048575;
	// const min = -1048576;
	// if (xi < min || xi > max || yi < min || yi > max || zi < min || zi > max) {
	//   throw new Error("Bucket index out of 21-bit range");
	// }

	// Pack into a single 64-bit int: [21 bits x][21 bits y][21 bits z]
	const xInt = ((x as i32) + bias) & 0x1fffff;
	const yInt = ((y as i32) + bias) & 0x1fffff;
	const zInt = ((z as i32) + bias) & 0x1fffff;
	return ((xInt as i64) << 42) | ((yInt as i64) << 21) | (zInt as i64);
}

function packIndexPairBits(a: u32, b: u32): u64 {
	return ((a as u64) << 32) | (b as u64);
}

function itemsToBucketKey(
	vecTuples: StaticArray<f32>,
	offset: u32,
	floorTo: f32,
): u64 {
	const x = bucketValue(vecTuples[offset * 3], floorTo);
	const y = bucketValue(vecTuples[offset * 3 + 1], floorTo);
	const z = bucketValue(vecTuples[offset * 3 + 2], floorTo);
	return packXYZBits(x, y, z);
}

// function itemsToTuples(vecTuples: StaticArray<f32>, offset: u32) {
// 	const result = new StaticArray(3);
// 	result[0] = vecTuples[offset * 3];
// 	result[1] = vecTuples[offset * 3 + 1];
// 	result[2] = vecTuples[offset * 3 + 2];
// 	return result;
// }

/**
 *
 * @param vecTuples
 * @param distance
 */
export function createNearbyGraph(
	vecTuples: StaticArray<f32>,
	distance: f32,
): StaticArray<u32> {
	const squaredDistance = distance ** 2;
	const itemCount = floor(vecTuples.length / 3) as u32;
	const bucketedVecIndexes = new Map<u64, u32[]>();
	for (let i = 0 as u32; i < itemCount; ++i) {
		const bucketId = itemsToBucketKey(vecTuples, i, distance);
		if (!bucketedVecIndexes.has(bucketId))
			bucketedVecIndexes.set(bucketId, [i]);
		else {
			const bucket = bucketedVecIndexes.get(bucketId);
			bucket.push(i);
		}
	}
	const bucketKeys = bucketedVecIndexes.keys();
	const bucketedVecStatic = new Map<u64, StaticArray<u32>>();
	for (let i = 0; i < bucketKeys.length; ++i) {
		const key = bucketKeys[i];
		const values = bucketedVecIndexes.get(key);
		const staticValues = StaticArray.fromArray(values);
		bucketedVecStatic.set(key, staticValues);
	}

	const nearbyLookup = new Array<NodePair>();
	// const completedCalculations = new Set<u64>();
	const bucketedVecKeys = bucketedVecStatic.keys();
	const idsNearishBucket = new StaticArray<u32>(itemCount);
	for (
		let bucketKeyIndex = 0;
		bucketKeyIndex < bucketedVecKeys.length;
		++bucketKeyIndex
	) {
		let nearishCount = 0;
		const itemsInBucket = bucketedVecStatic.get(
			bucketedVecKeys[bucketKeyIndex],
		);
		const sampleItemIndex = itemsInBucket[0];
		const bucketX = bucketValue(vecTuples[sampleItemIndex * 3], distance);
		const bucketY = bucketValue(vecTuples[sampleItemIndex * 3 + 1], distance);
		const bucketZ = bucketValue(vecTuples[sampleItemIndex * 3 + 2], distance);
		for (let x = bucketX - 1; x <= bucketX + 1; x++) {
			for (let y = bucketY - 1; y <= bucketY + 1; y++) {
				for (let z = bucketZ - 1; z <= bucketZ + 1; z++) {
					const bucketKey = packXYZBits(x, y, z);
					const thingsInNearbyBucket = bucketedVecStatic.has(bucketKey);
					if (thingsInNearbyBucket) {
						const items = bucketedVecStatic.get(bucketKey);
						memory.copy(
							changetype<usize>(idsNearishBucket) +
								nearishCount * sizeof<u32>(),
							changetype<usize>(items),
							items.length * sizeof<u32>(),
						);
						nearishCount += items.length;
					}
				}
			}
		}
		// Go through all the nearish indexes and do the actual calculation
		for (let i = 0; i < itemsInBucket.length; i++) {
			const firstVectorIndex = itemsInBucket[i];
			const currentVectorX = vecTuples[firstVectorIndex * 3];
			const currentVectorY = vecTuples[firstVectorIndex * 3 + 1];
			const currentVectorZ = vecTuples[firstVectorIndex * 3 + 2];
			for (let j = 0; j < nearishCount; j++) {
				// can't be near yourself
				if (i === j) continue;
				const otherVectorIndex = idsNearishBucket[j];
				const otherVectorX = vecTuples[otherVectorIndex * 3];
				const otherVectorY = vecTuples[otherVectorIndex * 3 + 1];
				const otherVectorZ = vecTuples[otherVectorIndex * 3 + 2];
				const low =
					firstVectorIndex < otherVectorIndex
						? firstVectorIndex
						: otherVectorIndex;
				const high =
					firstVectorIndex > otherVectorIndex
						? firstVectorIndex
						: otherVectorIndex;
				// const workId = packIndexPairBits(low,high)
				// if (completedCalculations.has(workId)) continue;
				// completedCalculations.add(workId);
				const squaredDistanceBetweenPoints =
					(otherVectorX - currentVectorX) ** 2 +
					(otherVectorY - currentVectorY) ** 2 +
					(otherVectorZ - currentVectorZ) ** 2;
				if (squaredDistanceBetweenPoints < squaredDistance) {
					const idDistance = new NodePair(firstVectorIndex, otherVectorIndex);
					nearbyLookup.push(idDistance);
				}
			}
		}
	}
	const result = new StaticArray<u32>(nearbyLookup.length * 2);
	for (let i = 0; i < nearbyLookup.length; i++) {
		const pair = nearbyLookup[i];
		result[i * 2] = pair.from;
		result[i * 2 + 1] = pair.to;
	}
	return result;
}
