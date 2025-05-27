import * as THREE from "three";
import { createNearbyGraph as createNearbyGraphAssemblyRaw } from "asembly-script-spacial-partitioning";

type Fish = {
	color: string;
	velocity: THREE.Vector3;
	threeObj: THREE.Object3D;
};
const colorPallete = [
	// "#444767",
	// "#443D70",
	"#18F6C4",
	// "#1F7450",
	"#40F0FA",
	"#C5DCE0",
	"#FD26DE",
	"#FD26DE",
	"#FE7558",
];
function createFishSquare(length: number): Fish[] {
	const totalCount = length ** 3;
	const maxSpeed = 10;
	const hardOffset = -length / 2;
	const fishes = Array.from({ length: totalCount }, (_, index) => {
		const obj = new THREE.Object3D();
		obj.position.set(
			(index % length) + hardOffset,
			(Math.floor(index / length) % length) + hardOffset,
			(Math.floor(index / length ** 2) % length) + hardOffset,
		);
		return {
			color: colorPallete[Math.floor(Math.random() * colorPallete.length)],
			velocity: new THREE.Vector3(
				Math.random() - 0.5,
				Math.random() - 0.5,
				Math.random() - 0.5,
			)
				.normalize()
				.multiplyScalar(maxSpeed),
			threeObj: obj,
		};
	});
	return fishes;
}

const outerBoundsVec3 = new THREE.Vector3();
/**
Mutates a vector. Add a force the keeps fish within a bounds.
 */
function outerBoundsReturn(
	inVec: THREE.Vector3,
	fish: Fish,
	forceScaling = 1,
	maxDistanceAllowed = 100,
) {
	const distanceFromCenter = fish.threeObj.position.length();
	// How close to the edge are we? We don't want a number <=0
	const distanceFromEdge = Math.max(
		maxDistanceAllowed - distanceFromCenter,
		Number.EPSILON,
	);
	// invert it so when we are very close, the force is very large.
	const forceMagnitude = 1.5 / distanceFromEdge;
	// vector pointing from the fish, directly towards the center of the circle
	outerBoundsVec3.copy(fish.threeObj.position).multiplyScalar(-1).normalize();
	// force to apply
	outerBoundsVec3.multiplyScalar(forceMagnitude * forceScaling);
	inVec.add(outerBoundsVec3);
}

const tempAlignmentDirection = new THREE.Vector3();
/**
Mutates a vector. Add forces that align with other forces.
 */
function alignmentForces(
	inVec: THREE.Vector3,
	nearbyFish: Fish[],
	forceScaling = 6,
) {
	tempAlignmentDirection.set(0, 0, 0);
	for (const otherFish of nearbyFish) {
		tempAlignmentDirection.add(otherFish.velocity);
	}
	tempAlignmentDirection.normalize();
	inVec.add(tempAlignmentDirection.multiplyScalar(forceScaling));
}

const tempCohesion = new THREE.Vector3(0, 0, 0);
/**
Mutates a vector. Applies a force that pushes fish together.
*/
function cohesionForces(
	inVec: THREE.Vector3,
	fish: Fish,
	nearbyFish: Fish[],
	centerOfMassForceScaling = 0.8,
) {
	if (nearbyFish.length === 0) return;
	// combined locations
	tempCohesion.set(0, 0, 0);
	for (const otherFish of nearbyFish) {
		tempCohesion.add(otherFish.velocity);
	}
	// average location
	tempCohesion.multiplyScalar(1 / nearbyFish.length);
	// vector to center of mass
	tempCohesion.sub(fish.threeObj.position).normalize();
	// applied scaling
	tempCohesion.multiplyScalar(centerOfMassForceScaling);
	inVec.add(tempCohesion);
}

const tempSeparation = new THREE.Vector3(0, 0, 0);
const tempSeparationSum = new THREE.Vector3();
/**
Mutates a vector. Applies a force that pushes fish away from each other.
 */
function applySeparationForces(
	inVec: THREE.Vector3,
	fish: Fish,
	nearbyFish: Fish[],
	separationScaling = 0.1,
) {
	tempSeparationSum.set(0, 0, 0);
	for (const otherFish of nearbyFish) {
		// vector pointing from other fish towards main fish
		tempSeparation
			.copy(fish.threeObj.position)
			.sub(otherFish.threeObj.position);
		// when distance is small, this number gets really high
		const inverseDistance = 1 / tempSeparation.length();
		// direction of force
		// tempSeparation.normalize();
		// applied force
		tempSeparation.multiplyScalar(inverseDistance * separationScaling);
		tempSeparationSum.add(tempSeparation);
	}
	inVec.add(tempSeparationSum);
}

/**
Fast create nearby graph
 */
// function createNearbyGraph(allFish:Fish[], distance = 5){
//   const nearbyGraph: boolean[][] = new Array(allFish.length).fill(null).map(()=> new Array(allFish.length).fill(false));
//   for(let i=0;i<allFish.length;i++){
//     for(let j=0;j<i;j++){
//       const fish1 = allFish[i]
//       const fish2 = allFish[j]
//       if(fish1.threeObj.position.distanceTo(fish2.threeObj.position)<distance) nearbyGraph[i][j] = true
//     }
//   }
//   return nearbyGraph
// }

const bucketValue = (value: number, floorTo: number) =>
	Math.floor(value / floorTo);

/**
Use Spacial Partitioning to find which fish are near each other
 */
function createNearbyGraph(allFish: Fish[], distance: number) {
	// Maps are slightly faster for iterating through all members
	const bucketedFish = new Map<string, number[]>();
	// Put all fish into their buckets
	for (let i = 0; i < allFish.length; i++) {
		const fish = allFish[i];
		const group = fish.threeObj.position
			.toArray()
			.map((positionComponent) => bucketValue(positionComponent, distance))
			.join(":");
		if (!bucketedFish.has(group)) bucketedFish.set(group, [i]);
		else bucketedFish.get(group)?.push(i);
	}

	// this is the end goal. return a 2d array. 1st index is the fish id which returns a list of fish(index) that are nearby
	const nearbyLookup: number[][] = Array.from(Array(allFish.length), () => []);

	for (const fishInCurrentBucket of bucketedFish.values()) {
		// Make a list of all fish within this bucket, and adjacent buckets
		const fishesIndexWithinAdjacentBuckets: number[] = [];
		const bucketIndexes = allFish[fishInCurrentBucket[0]].threeObj.position
			.toArray()
			.map((component) => bucketValue(component, distance));
		for (let x = bucketIndexes[0] - 1; x <= bucketIndexes[0] + 1; x++) {
			for (let y = bucketIndexes[1] - 1; y <= bucketIndexes[1] + 1; y++) {
				for (let z = bucketIndexes[2] - 1; z <= bucketIndexes[2] + 1; z++) {
					const bucketKey = `${x}:${y}:${z}`;
					const bucketValues = bucketedFish.get(bucketKey) ?? [];
					fishesIndexWithinAdjacentBuckets.push(...bucketValues);
				}
			}
		}

		// For the current fish, go through all fish that are potentially nearby.
		// If they are within the distance, add them to the list of nearby fish.
		for (const currentFishIndex of fishInCurrentBucket) {
			const currentFish = allFish[currentFishIndex];
			for (const potentiallyNearbyFishIndex of fishesIndexWithinAdjacentBuckets) {
				// can't be near yourself
				if (currentFishIndex === potentiallyNearbyFishIndex) continue;
				const otherFish = allFish[potentiallyNearbyFishIndex];
				const isNearby =
					currentFish.threeObj.position.distanceTo(
						otherFish.threeObj.position,
					) < distance;
				if (isNearby)
					nearbyLookup[currentFishIndex].push(potentiallyNearbyFishIndex);
			}
		}
	}
	return nearbyLookup;
}

function createNearbyGraphAssembly(
	allFish: Fish[],
	distance: number,
): number[][] {
	const inputParam = new Float32Array(allFish.length * 3);
	for (let i = 0; i < allFish.length; i++) {
		const fish = allFish[i];
		fish.threeObj.position.toArray(inputParam, i * 3);
	}
	console.log(inputParam);
	const rawResult = createNearbyGraphAssemblyRaw(inputParam, distance);
	const nearbyMapping: { from: number; to: number }[] = [];
	for (let i = 0; i < rawResult.length; i += 2) {
		nearbyMapping.push({ from: rawResult[i], to: rawResult[i + 1] });
	}
	const result = new Array(allFish.length).fill(null).map((): number[] => []);
	for (const output of nearbyMapping) {
		result[output.from].push(output.to);
		result[output.to].push(output.from);
	}
	return result;
}

export {
	createFishSquare,
	outerBoundsReturn,
	alignmentForces,
	cohesionForces,
	applySeparationForces,
	createNearbyGraph,
	createNearbyGraphAssembly,
};
