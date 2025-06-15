const bucketValue = (value: number, floorTo: number) =>
	Math.floor(value / floorTo);

const bias = 1 << 20; // 1048576
function packXYZBits(x: number, y: number, z: number): bigint {
	// Check that each value fits in 21 bits signed
	// const max = 1048575;
	// const min = -1048576;
	// if (x < min || x > max || y < min || y > max || z < min || z > max) {
	//   throw new Error("Bucket index out of 21-bit range");
	// }
	// Pack into a single 64-bit int: [21 bits x][21 bits y][21 bits z]
	const xInt = BigInt((x + bias) & 0x1fffff);
	const yInt = BigInt((y + bias) & 0x1fffff);
	const zInt = BigInt((z + bias) & 0x1fffff);
	return (xInt << 42n) | (yInt << 21n) | zInt;
}

type Vec3 = { x: number; y: number; z: number };
function itemsToBucketKey(vecTuples: Vec3, floorTo: number): bigint {
	const { x, y, z } = vecTuples;
	const bucketX = bucketValue(x, floorTo);
	const bucketY = bucketValue(y, floorTo);
	const bucketZ = bucketValue(z, floorTo);
	return packXYZBits(bucketX, bucketY, bucketZ);
}

/**
Use Spacial Partitioning to find which fish are near each other
 */
export function createNearbyGraph(
	flattened: ArrayLike<number>,
	distance: number,
) {
	const allPoints: Vec3[] = [];
	for (let i = 0; i < flattened.length; i += 3) {
		allPoints.push({
			x: flattened[i],
			y: flattened[i + 1],
			z: flattened[i + 2],
		});
	}
	// Maps are slightly faster for iterating through all members
	const bucketedVecIndexes = new Map<bigint, number[]>();
	const maxDistanceSquared = distance ** 2;
	// Put all fish into their buckets
	for (let i = 0; i < allPoints.length; i++) {
		const point = allPoints[i];
		const packValue = itemsToBucketKey(point, distance);
		if (!bucketedVecIndexes.has(packValue))
			bucketedVecIndexes.set(packValue, [i]);
		else bucketedVecIndexes.get(packValue)?.push(i);
	}

	// this is the end goal. pairing of indexes of items near each other.
	const nearbyLookup: number[] = [];
	for (const pointsInCurrentBucket of bucketedVecIndexes.values()) {
		// Make a list of all fish within this bucket, and adjacent buckets
		const nearishItemIndexes: number[] = [];
		const sampleIndex = pointsInCurrentBucket[0];
		const point = allPoints[sampleIndex];
		const bx = bucketValue(point.x, distance);
		const by = bucketValue(point.y, distance);
		const bz = bucketValue(point.z, distance);
		for (let x = bx - 1; x <= bx + 1; x++) {
			for (let y = by - 1; y <= by + 1; y++) {
				for (let z = bz - 1; z <= bz + 1; z++) {
					const bucketKey = packXYZBits(x, y, z);
					const bucketValues = bucketedVecIndexes.get(bucketKey) ?? [];
					nearishItemIndexes.push(...bucketValues);
				}
			}
		}

		// For the current fish, go through all fish that are potentially nearby.
		// If they are within the distance, add them to the list of nearby fish.
		for (const i of pointsInCurrentBucket) {
			const { x: xi, y: yi, z: zi } = allPoints[i];
			for (const j of nearishItemIndexes) {
				// can't be near yourself
				if (i >= j) continue;
				const { x: xj, y: yj, z: zj } = allPoints[j];
				const distanceSquared =
					(xi - xj) ** 2 + (yi - yj) ** 2 + (zi - zj) ** 2;
				const isNearby = distanceSquared < maxDistanceSquared;
				if (isNearby) nearbyLookup.push(i, j);
			}
		}
	}
	return nearbyLookup;
}
