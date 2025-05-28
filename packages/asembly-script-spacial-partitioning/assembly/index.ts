class Vec3Array {
	constructor(public data: StaticArray<f32>) {
		this.ptr = changetype<usize>(data);
	}

	private ptr: usize;

	@inline getX(index: u32): f32 {
		return load<f32>(this.ptr + <usize>index * 12);
	}

	@inline getY(index: u32): f32 {
		return load<f32>(this.ptr + <usize>index * 12 + 4);
	}

	@inline getZ(index: u32): f32 {
		return load<f32>(this.ptr + <usize>index * 12 + 8);
	}
}

const bucketValue = (value: f32, floorTo: f32): i32 =>
	floor(value / floorTo) as i32;

const bias = 1 << 20; // 1048576
function packXYZBits(x: i32, y: i32, z: i32): i64 {
	// Check that each value fits in 21 bits signed
	// const max = 1048575;
	// const min = -1048576;
	// if (x < min || x > max || y < min || y > max || z < min || z > max) {
	//   throw new Error("Bucket index out of 21-bit range");
	// }
	// Pack into a single 64-bit int: [21 bits x][21 bits y][21 bits z]
	const xInt = (x + bias) & 0x1fffff;
	const yInt = (y + bias) & 0x1fffff;
	const zInt = (z + bias) & 0x1fffff;
	return ((xInt as i64) << 42) | ((yInt as i64) << 21) | (zInt as i64);
}

function itemsToBucketKey(
	vecTuples: Vec3Array,
	offset: u32,
	floorTo: f32,
): u64 {
	const vecX = vecTuples.getX(offset);
	const vecY = vecTuples.getY(offset);
	const vecZ = vecTuples.getZ(offset);
	const bucketX = bucketValue(vecX, floorTo);
	const bucketY = bucketValue(vecY, floorTo);
	const bucketZ = bucketValue(vecZ, floorTo);
	return packXYZBits(bucketX, bucketY, bucketZ);
}
/**
 *
 * @param vecTuples
 * @param distance
 */
export function createNearbyGraph(
	vecTuples: StaticArray<f32>,
	distance: f32,
): Array<u32> {
	const vecArray = new Vec3Array(vecTuples);
	const squaredDistance = distance ** 2;
	const itemCount = floor(vecTuples.length / 3) as u32;
	const bucketedVecIndexes = new Map<u64, u32[]>();
	for (let i = 0 as u32; i < itemCount; ++i) {
		const bucketId = itemsToBucketKey(vecArray, i, distance);
		if (!bucketedVecIndexes.has(bucketId))
			bucketedVecIndexes.set(bucketId, [i]);
		else {
			const bucket = bucketedVecIndexes.get(bucketId);
			bucket.push(i);
		}
	}
	const nearbyLookup = new Array<u32>();
	const bucketedVecKeys = bucketedVecIndexes.keys();
	const idsNearishBucket = new StaticArray<u32>(itemCount);
	const nearishBucketMemStart = changetype<usize>(idsNearishBucket);
	for (
		let bucketKeyIndex = 0;
		bucketKeyIndex < bucketedVecKeys.length;
		++bucketKeyIndex
	) {
		let nearishCount = 0;
		const itemsInBucket = bucketedVecIndexes.get(
			bucketedVecKeys[bucketKeyIndex],
		);
		const sampleItemIndex = itemsInBucket[0];
		const vecX = vecArray.getX(sampleItemIndex);
		const vecY = vecArray.getY(sampleItemIndex);
		const vecZ = vecArray.getZ(sampleItemIndex);
		const bucketX = bucketValue(vecX, distance);
		const bucketY = bucketValue(vecY, distance);
		const bucketZ = bucketValue(vecZ, distance);
		for (let x = bucketX - 1; x <= bucketX + 1; x++) {
			for (let y = bucketY - 1; y <= bucketY + 1; y++) {
				for (let z = bucketZ - 1; z <= bucketZ + 1; z++) {
					const bucketKey = packXYZBits(x, y, z);
					const thingsInNearbyBucket = bucketedVecIndexes.has(bucketKey);
					if (thingsInNearbyBucket) {
						const items = bucketedVecIndexes.get(bucketKey);
						memory.copy(
							nearishBucketMemStart + nearishCount * sizeof<u32>(),
							items.dataStart,
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
			const currentVectorX = vecArray.getX(firstVectorIndex);
			const currentVectorY = vecArray.getY(firstVectorIndex);
			const currentVectorZ = vecArray.getZ(firstVectorIndex);
			for (let j = 0; j < nearishCount; j++) {
				const otherVectorIndex = idsNearishBucket[j];
				// can't be near yourself
				// mappings are bi-directional so we can cut work in half by taking advantage of the symmetry here
				if (firstVectorIndex >= otherVectorIndex) continue;
				const otherVectorX = vecArray.getX(otherVectorIndex);
				const otherVectorY = vecArray.getY(otherVectorIndex);
				const otherVectorZ = vecArray.getZ(otherVectorIndex);
				const squaredDistanceBetweenPoints =
					(otherVectorX - currentVectorX) ** 2 +
					(otherVectorY - currentVectorY) ** 2 +
					(otherVectorZ - currentVectorZ) ** 2;
				if (squaredDistanceBetweenPoints < squaredDistance) {
					nearbyLookup.push(firstVectorIndex);
					nearbyLookup.push(otherVectorIndex);
				}
			}
		}
	}
	return nearbyLookup;
}
