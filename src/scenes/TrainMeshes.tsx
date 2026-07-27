import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import type { Group } from 'three';
import { sim } from '../sim/simInstance';
import { useGameStore } from '../store/gameStore';
import type { TrainDef } from '../types/game';

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
  const trainClick = useGameStore((state) => state.trainClick);
  const selection = useGameStore((state) => state.selection);
  const selected = selection?.type === 'train' && selection.id === definition.id;

  useFrame((state) => {
    const runtime = sim.trains.get(definition.id);
    const group = ref.current;
    if (!runtime || !group) return;
    group.visible = true;
    group.position.set(runtime.x, 0.21, runtime.z);
    group.rotation.y = runtime.angle;
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
      <Car z={0.28} color={definition.color} lead />
      <Car z={-0.18} color={body} />
      <Car z={-0.64} color={body} />
      <mesh position={[0, -0.13, -0.18]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.45, 1.2]} />
        <meshBasicMaterial color={definition.color} transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

export function TrainMeshes() {
  const trainDefs = useGameStore((state) => state.trainDefs);
  return (
    <group>
      {trainDefs.map((definition) => (
        <TrainMesh key={definition.id} definition={definition} />
      ))}
    </group>
  );
}
