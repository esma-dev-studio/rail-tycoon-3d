import { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { OrthographicCamera } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useGameStore } from '../store/gameStore';
import { isFirstJourney } from '../data/playGuide';
import { worldPos } from '../utils/grid';

export function CameraController() {
  const controls = useRef<OrbitControlsImpl>(null);
  const reset = useGameStore((s) => s.cameraReset);
  const intro = useGameStore(isFirstJourney);
  const { camera, size } = useThree();
  useEffect(() => {
    if (!(camera instanceof OrthographicCamera)) return;
    const focus = intro ? worldPos(5, 5.5) : [0, 0, 0];
    camera.position.set(focus[0] + 2, 24, focus[2] + 17);
    camera.zoom = Math.min(size.width / (intro ? 14 : 20.5), size.height / (intro ? 11 : 16.5)) * .91;
    camera.lookAt(focus[0], 0, focus[2]);
    camera.updateProjectionMatrix();
    controls.current?.target.set(focus[0], 0, focus[2]);
    controls.current?.update();
  }, [camera, size.width, size.height, reset, intro]);
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.09}
    target={[0, 0, 0]} minZoom={8} maxZoom={95} enableRotate={false} enableZoom={false} enablePan={false} />;
}
