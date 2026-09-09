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
  return <Canvas shadows orthographic dpr={[1, 1.5]} gl={{ antialias: true }}
    camera={{ position: [14, 20, 17], zoom: 28, near: .1, far: 100 }}
    fallback={<div className="empty-state"><p>このブラウザでは 3Dを 表示できないようです。<br />Chromeや Edgeで ひらいてみてね。</p></div>}
    onPointerMissed={clearSelection}>
    <color attach="background" args={['#e8eee5']} />
    <hemisphereLight intensity={1.15} color="#fffaf0" groundColor="#a7bba0" />
    <ambientLight intensity={.5} />
    <directionalLight position={[-5, 18, 10]} intensity={1.7} color="#fff1d4" castShadow
      shadow-mapSize={[2048, 2048]} shadow-camera-near={1} shadow-camera-far={50}
      shadow-camera-left={-17} shadow-camera-right={17} shadow-camera-top={17}
      shadow-camera-bottom={-17} shadow-bias={-.0004} />
    <CameraController /><SimulationDriver />
    <Ground /><TrackMeshes /><TownMeshes /><TrainMeshes /><BuildOverlay /><FareFloats />
    <ContactShadows position={[0, -1.25, 0]} opacity={.25} scale={32} blur={2.7} far={4} frames={1} />
  </Canvas>;
}
