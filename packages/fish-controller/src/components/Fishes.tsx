import * as THREE from "three";
import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
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
  mode: "rust" | "assemblyscript" | "typescript";
};

function FishesComponent({
  boxSize,
  outerBoundsForceScaling,
  alignmentForeScaling,
  cohesionForceScaling,
  separationForceScaling,
  mode,
}: BoxesProps) {
  const fishes = useMemo(() => createFishSquare(boxSize), [boxSize]);
  const fishObj = useLoader(
    OBJLoader,
    `${process.env.PUBLIC_URL ?? ""}/LowPolyFish.obj`
  );
  const geometry = useMemo(() => {
    const mesh = fishObj.children.find(
      (ele): ele is Mesh => ele instanceof Mesh
    );
    return mesh?.geometry;
  }, [fishObj]);
  const colorArray = useMemo(
    () =>
      Float32Array.from(
        fishes.flatMap(({ color }) => tempColor.set(color).toArray())
      ),
    [fishes]
  );
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  // Run movement.
  useFrame(function frameLoop(_, delta) {
    if (instancedMeshRef.current === null) return;
    // delta is the time since the last frame.
    // If you tab out, then back in this number could be large.
    // don't render as if more than .5 seconds has passed in this scenario.
    const cappedDelta = Math.min(delta, 0.5);
    // const nearbyGraph = createNearbyGraph(fishes, 5);
    // const nearbyGraph = createNearbyGraphAssemblyScript(fishes,5)
    const nearbyGraph = createNearbyGraph(fishes, 5, mode);
    for (let fishIndex = 0; fishIndex < fishes.length; fishIndex++) {
      const fish = fishes[fishIndex];
      // Calculate force
      tempAppliedForces.set(0, 0, 0);
      const nearbyFish = nearbyGraph[fishIndex].map(
        (fishIndex) => fishes[fishIndex]
      );

      outerBoundsReturn(tempAppliedForces, fish, outerBoundsForceScaling);
      alignmentForces(tempAppliedForces, nearbyFish, alignmentForeScaling);
      cohesionForces(tempAppliedForces, fish, nearbyFish, cohesionForceScaling);
      applySeparationForces(
        tempAppliedForces,
        fish,
        nearbyFish,
        separationForceScaling
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
        tempPositionOffset.multiplyScalar(cappedDelta)
      );
      tempLookA.copy(fish.threeObj.position).sub(fish.velocity);
      fish.threeObj.lookAt(tempLookA);
      fish.threeObj.updateMatrix();
      instancedMeshRef.current.setMatrixAt(i, fish.threeObj.matrix);
    }
    instancedMeshRef.current.count = fishes.length;
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  });
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.5,
        metalness: 0.2,
      }),
    []
  );

  if (geometry === undefined) return null;
  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[undefined, undefined, ABSOLUTE_MAX_INSTANCE_COUNT]}
      material={mat}
    >
      <primitive object={geometry}>
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colorArray, 3]}
        />
      </primitive>
    </instancedMesh>
  );
}

export { FishesComponent };
export default FishesComponent;
