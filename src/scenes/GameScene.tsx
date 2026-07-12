// ============================================================================
// 3Dシーン — Canvas・ライト・影・全メッシュ・シミュレーション駆動をまとめる
// ============================================================================
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { CameraController } from './CameraController';
import { Ground } from './Ground';
import { TrackMeshes } from './TrackMeshes';
import { TownMeshes } from './TownMeshes';
import { TrainMeshes } from './TrainMeshes';
import { BuildOverlay } from './BuildOverlay';
import { FareFloats } from './FareFloats';
import { SimulationDriver } from './SimulationDriver';
import { useGameStore } from '../store/gameStore';

export function GameScene() {
  const clearSelection = useGameStore((s) => s.clearSelection);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true }}
      camera={{ position: [11, 15, 17], fov: 42 }}
      onPointerMissed={() => clearSelection()}
    >
      {/* 明るい昼の空(子ども向け) */}
      <color attach="background" args={['#8fd3ff']} />
      <fog attach="fog" args={['#8fd3ff', 34, 70]} />

      <hemisphereLight intensity={0.75} color="#ffffff" groundColor="#9adf9f" />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[9, 15, 6]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={44}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-bias={-0.0004}
      />

      <CameraController />
      <SimulationDriver />

      <Ground />
      <TrackMeshes />
      <TownMeshes />
      <TrainMeshes />
      <BuildOverlay />
      <FareFloats />

      <ContactShadows position={[0, 0.015, 0]} opacity={0.3} scale={26} blur={2.4} far={7} />
    </Canvas>
  );
}
