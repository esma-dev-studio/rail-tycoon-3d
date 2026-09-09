import { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { OrthographicCamera } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useGameStore } from '../store/gameStore';

export function CameraController() {
  const controls = useRef<OrbitControlsImpl>(null);
  const reset = useGameStore((s) => s.cameraReset);
  const { camera, size } = useThree();
  useEffect(() => {
    if (!(camera instanceof OrthographicCamera)) return;
    camera.position.set(14, 20, 17);
    camera.zoom = Math.min(size.width / 25, size.height / 21) * .96;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    controls.current?.target.set(0, 0, 0);
    controls.current?.update();
  }, [camera, size.width, size.height, reset]);
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.09}
    target={[0, 0, 0]} minZoom={8} maxZoom={95} minPolarAngle={.25} maxPolarAngle={1.22} enablePan={false} />;
}
