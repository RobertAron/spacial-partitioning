import * as THREE from "three";
import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { createNearbyGraph as assemblyCreateNearbyGraph} from "asembly-script-spacial-partitioning";

import { Mesh } from "three";

import {
	alignmentForces,
	applySeparationForces,
	cohesionForces,
	createFishSquare,
	createNearbyGraph,
	outerBoundsReturn,
} from "./FishLogic";
import { OBJLoader } from "three/examples/jsm/Addons.js";

const tempColor = new THREE.Color();

const maxSpeed = 10;
const tempAppliedForces = new THREE.Vector3();
const tempPositionOffset = new THREE.Vector3();
const tempLookA = new THREE.Vector3();
const ABSOLUTE_MAX_INSTANCE_COUNT = 100_000;
type BoxesProps = {
	boxSize: number;
	outerBoundsForceScaling: number;
	alignmentForeScaling: number;
	cohesionForceScaling: number;
	separationForceScaling: number;
};
console.log("HI")
	const result = assemblyCreateNearbyGraph(
		// biome-ignore format: tuples
		new Float32Array([
      1, 4, 10,
      1, 4, 11,
      1, 4, 49,
      1, 4, 50.5
    ]),
		2,
	);

function FishesComponent({
	boxSize,
	outerBoundsForceScaling,
	alignmentForeScaling,
	cohesionForceScaling,
	separationForceScaling,
}: BoxesProps) {
	const fishes = useMemo(() => createFishSquare(boxSize), [boxSize]);
	const fishObj = useLoader(
		OBJLoader,
		`${process.env.PUBLIC_URL ?? ""}/LowPolyFish.obj`,
	);
	const geometry = useMemo(() => {
		const mesh = fishObj.children.find(
			(ele): ele is Mesh => ele instanceof Mesh,
		);
		return mesh?.geometry;
	}, [fishObj]);
	const colorArray = useMemo(
		() =>
			Float32Array.from(
				fishes.flatMap(({ color }) => tempColor.set(color).toArray()),
			),
		[fishes],
	);
	const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
	// Apply colors
	useEffect(() => {
		if (instancedMeshRef.current == null) return;
		for (let i = 0; i < fishes.length; i++) {
			instancedMeshRef.current.setColorAt(
				i,
				tempColor.set(fishes[i].color).clone(),
			);
		}
		if (instancedMeshRef.current.instanceColor == null) return;
		instancedMeshRef.current.instanceColor.needsUpdate = true;
	}, [fishes]);
	// Run movement.
	useFrame(function frameLoop(_, delta) {
		if (instancedMeshRef.current === null) return;
		// delta is the time since the last frame.
		// If you tab out, then back in this number could be large.
		// don't render as if more than .5 seconds has passed in this scenario.
		const cappedDelta = Math.min(delta, 0.5);
		const nearbyGraph = createNearbyGraph(fishes, 5);
		for (let fishIndex = 0; fishIndex < fishes.length; fishIndex++) {
			const fish = fishes[fishIndex];
			// Calculate force
			tempAppliedForces.set(0, 0, 0);
			const nearbyFish = nearbyGraph[fishIndex].map(
				(fishIndex) => fishes[fishIndex],
			);

			outerBoundsReturn(tempAppliedForces, fish, outerBoundsForceScaling);
			alignmentForces(tempAppliedForces, nearbyFish, alignmentForeScaling);
			cohesionForces(tempAppliedForces, fish, nearbyFish, cohesionForceScaling);
			applySeparationForces(
				tempAppliedForces,
				fish,
				nearbyFish,
				separationForceScaling,
			);
			// // apply force to the velocity
			tempAppliedForces.multiplyScalar(cappedDelta * 10);
			fish.velocity.add(tempAppliedForces);
			fish.velocity.clampLength(-maxSpeed, maxSpeed);
		}
		// // apply velocity to the position
		// // update rotation
		for (let i = 0; i < fishes.length; i++) {
			const fish = fishes[i];
			tempPositionOffset.copy(fish.velocity);
			fish.threeObj.position.add(
				tempPositionOffset.multiplyScalar(cappedDelta),
			);
			tempLookA.copy(fish.threeObj.position).sub(fish.velocity);
			fish.threeObj.lookAt(tempLookA);
			fish.threeObj.updateMatrix();
			instancedMeshRef.current.setMatrixAt(i, fish.threeObj.matrix);
		}
		instancedMeshRef.current.count = fishes.length;
		instancedMeshRef.current.instanceMatrix.needsUpdate = true;
	});

	if (geometry === undefined) return null;
	return (
		<instancedMesh
			ref={instancedMeshRef}
			args={[undefined, undefined, ABSOLUTE_MAX_INSTANCE_COUNT]}
		>
			<primitive object={geometry}>
				<instancedBufferAttribute
					attach="attributesColor"
					args={[colorArray, 3]}
				/>
			</primitive>
		</instancedMesh>
	);
}

export { FishesComponent };
export default FishesComponent
