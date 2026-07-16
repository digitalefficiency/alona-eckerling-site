"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { ProgressRef } from "@/components/three/Scene3D";

const GOLD = "#c8a45c";
const GOLD_SOFT = "#f3e8cf";

// Slow navy-gold dust drifting through the depth — restrained, ~500 motes.
function Dust() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const N = 500;
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
    }
    return arr;
  }, []);

  useFrame((_, dt) => {
    const p = ref.current;
    if (!p) return;
    p.rotation.y += dt * 0.02;
    const arr = p.geometry.attributes.position.array as Float32Array;
    for (let i = 1; i < arr.length; i += 3) {
      arr[i] += dt * 0.06;
      if (arr[i] > 5) arr[i] = -5;
    }
    p.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color={GOLD}
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// Scroll-driven camera dolly + gentle lateral drift (the "corridor" feel).
function Rig({ progressRef }: { progressRef: ProgressRef }) {
  useFrame((state) => {
    const p = progressRef.current ?? 0;
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, 6 - p * 3.2, 0.06);
    state.camera.position.x = THREE.MathUtils.lerp(
      state.camera.position.x,
      Math.sin(p * Math.PI) * 0.7,
      0.06
    );
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export function StoryScene({ progressRef }: { progressRef: ProgressRef }) {
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6], fov: 50 }}
    >
      <fog attach="fog" args={["#0a1e3f", 6, 16]} />
      <ambientLight intensity={0.45} />
      <spotLight position={[3, 5, 4]} angle={0.5} penumbra={1} intensity={45} color={GOLD_SOFT} />
      <directionalLight position={[-3, 2, 5]} intensity={1.1} color={GOLD} />
      <Dust />
      <Rig progressRef={progressRef} />
    </Canvas>
  );
}
