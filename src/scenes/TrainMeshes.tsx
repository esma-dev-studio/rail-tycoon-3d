import { useRef } from 'react';
import { RoundedBox, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import type { Group } from 'three';
import { sim } from '../sim/simInstance';
import { useGameStore } from '../store/gameStore';
import type { TrainDef } from '../types/game';
import { lineCapacityLevel } from '../data/lineUpgrades';
import { nodeWorld } from '../utils/grid';
import { isFirstJourney } from '../data/playGuide';
import { TOWNS_BY_ID } from '../data/world';
import { Reading } from '../components/Reading';
import { RailIcon } from '../components/RailIcon';
import { nextTrainStopTownId } from '../sim/simulation';

function shade(hex: string, amount: number): string {
  const color = hex.replace('#', '');
  const value = parseInt(color, 16);
  const red = Math.max(0, Math.min(255, Math.round(((value >> 16) & 0xff) + amount)));
  const green = Math.max(0, Math.min(255, Math.round(((value >> 8) & 0xff) + amount)));
  const blue = Math.max(0, Math.min(255, Math.round((value & 0xff) + amount)));
  return `#${((red << 16) | (green << 8) | blue).toString(16).padStart(6, '0')}`;
}

function Wheels() {
  return (
    <group>
      {[
        [0.16, 0.12],
        [0.16, -0.12],
        [-0.16, 0.12],
        [-0.16, -0.12],
      ].map(([x, z], index) => (
        <mesh key={index} position={[x, -0.12, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.052, 0.052, 0.03, 14]} />
          <meshStandardMaterial color="#17212c" metalness={0.7} roughness={0.32} />
        </mesh>
      ))}
    </group>
  );
}

function WindowBand() {
  return (
    <>
      {[-0.196, 0.196].map((x) => (
        <mesh key={x} position={[x, 0.035, -0.02]}>
          <boxGeometry args={[0.018, 0.09, 0.3]} />
          <meshStandardMaterial
            color="#123249"
            emissive="#35d8e8"
            emissiveIntensity={0.2}
            metalness={0.55}
            roughness={0.18}
          />
        </mesh>
      ))}
    </>
  );
}

function Car({
  z,
  color,
  lead = false,
}: {
  z: number;
  color: string;
  lead?: boolean;
}) {
  return (
    <group position={[0, 0, z]}>
      <RoundedBox args={[0.38, 0.25, 0.43]} radius={0.065} smoothness={4} castShadow>
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
      </RoundedBox>
      <WindowBand />
      <mesh position={[0, 0.145, -0.025]} castShadow>
        <boxGeometry args={[0.29, 0.035, 0.28]} />
        <meshStandardMaterial color="#d9e4ec" metalness={0.62} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.09, 0]}>
        <boxGeometry args={[0.29, 0.055, 0.35]} />
        <meshStandardMaterial color="#1b2733" metalness={0.55} roughness={0.38} />
      </mesh>
      {lead && (
        <>
          <mesh position={[0, -0.005, 0.205]} scale={[1, 0.72, 0.62]}>
            <sphereGeometry args={[0.2, 18, 14]} />
            <meshStandardMaterial color={color} metalness={0.52} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.045, 0.33]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.115, 20]} />
            <meshStandardMaterial
              color="#143248"
              emissive="#4de3ed"
              emissiveIntensity={0.28}
              metalness={0.5}
              roughness={0.18}
            />
          </mesh>
          {[-0.105, 0.105].map((x) => (
            <mesh key={x} position={[x, -0.045, 0.36]}>
              <sphereGeometry args={[0.032, 12, 12]} />
              <meshStandardMaterial color="#fff3ad" emissive="#ffe572" emissiveIntensity={1.2} />
            </mesh>
          ))}
        </>
      )}
      <Wheels />
    </group>
  );
}

function TrainMesh({ definition }: { definition: TrainDef }) {
  const ref = useRef<Group>(null);
  const cars = useRef<(Group | null)[]>([]);
  const line = useGameStore((s) => s.lines.find((l) => l.id === definition.lineId));
  const carCount = line ? lineCapacityLevel(line) + 2 : 3;
  const trainClick = useGameStore((state) => state.trainClick);
  const selection = useGameStore((state) => state.selection);
  const selected = selection?.type === 'train' && selection.id === definition.id;

  useFrame((state) => {
    const runtime = sim.trains.get(definition.id);
    const group = ref.current;
    if (!runtime || !group) return;
    group.visible = true;
    group.position.set(runtime.x, 0.21, runtime.z);
    group.rotation.y = 0;
    cars.current.forEach((car, i) => {
      if (!car) return;
      const at = runtime.segIndex + runtime.dir * runtime.segT + runtime.dir * (.28 - i * .46);
      const segment = Math.max(0, Math.min(runtime.pathNodes.length - 2, Math.floor(at)));
      const a = nodeWorld(runtime.pathNodes[segment]);
      const b = nodeWorld(runtime.pathNodes[segment + 1]);
      const t = at - segment;
      car.position.set(a[0] + (b[0] - a[0]) * t - runtime.x, 0, a[2] + (b[2] - a[2]) * t - runtime.z);
      car.rotation.y = Math.atan2((b[0] - a[0]) * runtime.dir, (b[2] - a[2]) * runtime.dir);
    });
    if (selected) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.06;
      group.scale.setScalar(pulse);
    } else {
      group.scale.setScalar(1);
    }
  });

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 5) return;
    event.stopPropagation();
    trainClick(definition.id);
  };

  const body = shade(definition.color, 22);
  return (
    <group
      ref={ref}
      visible={false}
      onClick={onClick}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {selected && (
        <mesh position={[0, -0.145, -0.16]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.38, 28]} />
          <meshBasicMaterial color="#35f0cc" transparent opacity={0.75} />
        </mesh>
      )}
      {Array.from({ length: carCount }, (_, i) => <group key={i} ref={(node) => { cars.current[i] = node; }}><Car z={0} color={i === 0 ? definition.color : body} lead={i === 0} /></group>)}
    </group>
  );
}

export function TrainMeshes() {
  const trainDefs = useGameStore((state) => state.trainDefs);
  return (
    <group>
      {trainDefs.map((definition) => (
        <group key={definition.id}><TrainMesh definition={definition} /><PassengerBadge definition={definition} /></group>
      ))}
    </group>
  );
}

function PassengerBadge({definition}:{definition:TrainDef}) {
  const ref=useRef<Group>(null);
  const intro=useGameStore(isFirstJourney);
  const selection=useGameStore(s=>s.selection);
  useGameStore(s=>s.revision);
  const train=sim.trains.get(definition.id);
  const selected=(selection?.type==='train'&&selection.id===definition.id)||(selection?.type==='line'&&selection.id===definition.lineId);
  useFrame(()=>{const t=sim.trains.get(definition.id);if(t&&ref.current)ref.current.position.set(t.x,1.65,t.z);});
  if(!train||(!intro&&!selected)||train.dwell>0||train.load.length===0)return null;
  const dest=TOWNS_BY_ID.get(nextTrainStopTownId(train)??'');
  return <group ref={ref}><Html center zIndexRange={[15,0]} wrapperClass="html-pass-through"><div className="train-passenger-badge"><RailIcon name="people"/>{train.load.length}人<small>→ <Reading text={dest?.name??''}/></small></div></Html></group>;
}
