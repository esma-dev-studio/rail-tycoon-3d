// ============================================================================
// カメラ操作 — 俯瞰視点の OrbitControls(回転・パン・ズーム)
// ============================================================================
import { OrbitControls } from '@react-three/drei';

export function CameraController() {
  return (
    <OrbitControls
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
