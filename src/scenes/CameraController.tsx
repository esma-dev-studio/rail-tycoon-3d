// ============================================================================
// カメラ操作 — 俯瞰視点の OrbitControls + 起動時のゆっくりズームイン演出
// ============================================================================
import { useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

const INTRO_FROM = new Vector3(19, 25, 29);
const INTRO_TO = new Vector3(11, 15, 17);
const INTRO_SECONDS = 1.6;

export function CameraController() {
  const controls = useRef<OrbitControlsImpl>(null);
  const t = useRef(0);
  const { camera } = useThree();

  useFrame((_, dt) => {
    if (t.current >= 1) return;
    t.current = Math.min(1, t.current + dt / INTRO_SECONDS);
    const e = 1 - Math.pow(1 - t.current, 3); // ease-out
    camera.position.lerpVectors(INTRO_FROM, INTRO_TO, e);
    camera.lookAt(0, 0, 0);
    if (controls.current) controls.current.enabled = t.current >= 1;
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      target={[0, 0, 0]}
      minDistance={6}
      maxDistance={34}
      maxPolarAngle={1.45}
      enablePan
    />
  );
}
