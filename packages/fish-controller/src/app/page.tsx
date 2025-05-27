"use client"
import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
// import { FishesComponent } from "./Fishes";
import { SimpleSlider } from "@/components/SimpleSlider";
import dynamic from "next/dynamic";

const FishesComponent = dynamic(() => import("@/components/Fishes"), {
  ssr: false,
});

const BACKGROUND_COLOR = "#444767";
const EDGE_VISUAL_COLOR = "#40F0FA";
const outerBoundsDistance = 100;

export default function Page() {
  const [boxSize, setBoxSize] = useState(3);
  const [outerBoundsForceScaling, setOuterBoundsForceScaling] = useState(1);
  const [alignmentForeScaling, setAlignmentForeScaling] = useState(6);
  const [cohesionForceScaling, setCohesionForceScaling] = useState(0.8);
  const [separationForceScaling, setSeparationForceScaling] = useState(0.1);

  return (
    <div
      style={{
        display: "flex",
        flexGrow: 1,
        background: "#312F44",
        color: "white"
      }}
    >
      <div style={{ width: 240, display: "flex", flexDirection: "column" }}>
        <SimpleSlider
          label="Box Size"
          id="box-size"
          min={0}
          max={20}
          step={1}
          value={boxSize}
          onChange={setBoxSize}
        />
        <SimpleSlider
          label="Outer Bounds Scaling"
          id="outer-bounds-scaling"
          min={0}
          max={10}
          step={0.1}
          value={outerBoundsForceScaling}
          onChange={setOuterBoundsForceScaling}
        />
        <SimpleSlider
          label="Alignment Force Scaling"
          id="alignment-force-scaling"
          min={0}
          max={10}
          step={0.1}
          value={alignmentForeScaling}
          onChange={setAlignmentForeScaling}
        />
        <SimpleSlider
          label="Cohesion Force Scaling"
          id="cohesion-force-scaling"
          min={0}
          max={1.5}
          step={0.1}
          value={cohesionForceScaling}
          onChange={setCohesionForceScaling}
        />
        <SimpleSlider
          label="Separation Force Scaling"
          id="separation-force-scaling"
          min={0.0}
          max={1.5}
          step={0.01}
          value={separationForceScaling}
          onChange={setSeparationForceScaling}
        />
      </div>
      <Canvas
        camera={{
          position: [0, 0, outerBoundsDistance * 1.1],
          near: 1,
          far: 2000
        }}
        style={{ width: "unset", flexGrow: 1 }}
        // linear
      >
        <OrbitControls autoRotate />
        <color attach="background" args={[BACKGROUND_COLOR]} />
        <Stats showPanel={0} className="stats" />
        <mesh>
          <sphereGeometry args={[outerBoundsDistance, 32, 32]} />
          <meshBasicMaterial
            color={EDGE_VISUAL_COLOR}
            transparent
            opacity={0.1}
            wireframe
          />
        </mesh>
        <FishesComponent
          boxSize={boxSize}
          outerBoundsForceScaling={outerBoundsForceScaling}
          alignmentForeScaling={alignmentForeScaling}
          cohesionForceScaling={cohesionForceScaling}
          separationForceScaling={separationForceScaling}
        />
        <pointLight position={[0, 100, 100]} intensity={0.8} color="#C5DCE0" />
        <pointLight position={[0, 100, -100]} intensity={0.1} color="#FE7558" />
        <ambientLight intensity={0.1} />
      </Canvas>
    </div>
  );
}
