// ============================================================================
// 列車 — sim.trains を毎フレーム参照して位置/向きを更新(React再描画なし)。
// 機関車 + 2両の客車。クリックで選択。
// ============================================================================
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import type { Group } from 'three';
import { sim } from '../sim/simInstance';
import { useGameStore } from '../store/gameStore';
import type { TrainDef } from '../types/game';

function shade(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  const n = parseInt(c, 16);
  let r = (n >> 16) & 0xff;
  let g = (n >> 8) & 0xff;
  let b = n & 0xff;
  r = Math.max(0, Math.min(255, Math.round(r + amount)));
  g = Math.max(0, Math.min(255, Math.round(g + amount)));
  b = Math.max(0, Math.min(255, Math.round(b + amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function Car({ z, color, loco }: { z: number; color: string; loco?: boolean }) {
  return (
    <group position={[0, 0, z]}>
      <mesh castShadow>
        <boxGeometry args={[0.34, loco ? 0.22 : 0.2, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* 窓 */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.35, 0.07, 0.24]} />
        <meshStandardMaterial color="#1c2330" metalness={0.2} roughness={0.3} />
      </mesh>
      {loco && (
        <mesh position={[0, 0.16, -0.02]} castShadow>
          <boxGeometry args={[0.28, 0.1, 0.2]} />
          <meshStandardMaterial color={shade(color, -40)} metalness={0.3} roughness={0.5} />
        </mesh>
      )}
    </group>
  );
}

function TrainMesh({ def }: { def: TrainDef }) {
  const ref = useRef<Group>(null);
  const trainClick = useGameStore((s) => s.trainClick);
  const selection = useGameStore((s) => s.selection);
  const selected = selection?.type === 'train' && selection.id === def.id;

  useFrame(() => {
    const tr = sim.trains.get(def.id);
    const g = ref.current;
    if (!tr || !g) return;
    g.visible = true;
    g.position.set(tr.x, 0.18, tr.z);
    g.rotation.y = tr.angle;
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 5) return;
    e.stopPropagation();
    trainClick(def.id);
  };
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  };
  const onOut = () => {
    document.body.style.cursor = 'auto';
  };

  const body = shade(def.color, 18);
  return (
    <group ref={ref} visible={false} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      {selected && (
        <mesh position={[0, 0.34, -0.18]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color="#ffd24a" emissive="#ffb300" emissiveIntensity={0.9} />
        </mesh>
      )}
      <Car z={0.2} color={def.color} loco />
      <Car z={-0.16} color={body} />
      <Car z={-0.52} color={body} />
    </group>
  );
}

export function TrainMeshes() {
  const trainDefs = useGameStore((s) => s.trainDefs);
  return (
    <group>
      {trainDefs.map((d) => (
        <TrainMesh key={d.id} def={d} />
      ))}
    </group>
  );
}
