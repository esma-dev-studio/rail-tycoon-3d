// ============================================================================
// 地面 — ベース面 + タイルグリッド + 森の装飾 + タイル選択用の当たり判定面
// ============================================================================
import { useRef } from 'react';
import { Grid } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { GRID_W, GRID_H } from '../data/config';
import { worldPos, worldToNode } from '../utils/grid';
import { useGameStore } from '../store/gameStore';

function hashKey(k: string): number {
  let h = 2166136261;
  for (let i = 0; i < k.length; i++) {
    h ^= k.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const FLOWER_COLORS = ['#ff8fb3', '#ffd24a', '#ff9f6b', '#c8a2f0'];

/** 地形の装飾 — 木(森)・岩(丘)・花(草原の一部)・川の水面 */
function Decor() {
  const terrain = useGameStore((s) => s.terrain);
  const towns = useGameStore((s) => s.towns);
  const edges = useGameStore((s) => s.trackEdges);
  const trackNodes = new Set([...edges].flatMap((edge) => edge.split('~')));
  const trees: [number, number, number][] = [];
  const rocks: [number, number, number][] = [];
  const waters: [number, number, number][] = [];
  const flowers: { p: [number, number, number]; c: string }[] = [];
  for (const [k, kind] of terrain) {
    const [xs, zs] = k.split(',');
    const p = worldPos(parseInt(xs, 10), parseInt(zs, 10));
    if (kind !== 'water' && (trackNodes.has(k) || towns.some((t) => Math.hypot(t.x - Number(xs), t.z - Number(zs)) < 1.5))) continue;
    if (kind === 'forest') trees.push(p);
    else if (kind === 'hill') rocks.push(p);
    else if (kind === 'water') waters.push(p);
    else if (hashKey(k) % 9 === 0) {
      flowers.push({ p, c: FLOWER_COLORS[hashKey(k) % FLOWER_COLORS.length] });
    }
  }
  return (
    <group>
      {/* 川 */}
      {waters.map((p, i) => (
        <mesh key={`w${i}`} position={[p[0], 0.008, p[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.0, 1.0]} />
          <meshStandardMaterial color="#7ab9bd" roughness={0.4} metalness={0.05} />
        </mesh>
      ))}
      {/* 木 */}
      {trees.map((p, i) => (
        <group key={`t${i}`} position={[p[0], 0, p[2]]}>
          <mesh position={[0, 0.14, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 0.28, 6]} />
            <meshStandardMaterial color="#6b4a30" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.42, 0]} castShadow>
            <coneGeometry args={[0.26, 0.6, 7]} />
            <meshStandardMaterial color={i % 2 ? '#739969' : '#557f61'} roughness={0.85} />
          </mesh>
        </group>
      ))}
      {/* 岩 */}
      {rocks.map((p, i) => (
        <mesh key={`r${i}`} position={[p[0], 0.09, p[2]]} scale={[1, 0.65, 1]} castShadow>
          <dodecahedronGeometry args={[0.18, 0]} />
          <meshStandardMaterial color="#9aa2ab" roughness={0.95} />
        </mesh>
      ))}
      {/* 花 */}
      {flowers.map((f, i) => (
        <mesh key={`f${i}`} position={[f.p[0] + 0.25, 0.045, f.p[2] - 0.22]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color={f.c} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export function Ground() {
  const buildMode = useGameStore((s) => s.buildMode);
  const setHover = useGameStore((s) => s.setHover);
  const tileClick = useGameStore((s) => s.tileClick);
  const clearSelection = useGameStore((s) => s.clearSelection);
  const lastHover = useRef<string | null>(null);

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    if (buildMode !== 'track' && buildMode !== 'demolish') return;
    const node = worldToNode(e.point.x, e.point.z);
    if (node !== lastHover.current) {
      lastHover.current = node;
      setHover(node);
    }
  };
  const handleOut = () => {
    lastHover.current = null;
    setHover(null);
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 5) return;
    if (buildMode === 'track' || buildMode === 'demolish') {
      const node = worldToNode(e.point.x, e.point.z);
      if (node) tileClick(node);
    } else {
      clearSelection();
    }
  };

  return (
    <group>
      {/* ベース面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[GRID_W + 2, GRID_H + 2]} />
        <meshStandardMaterial color="#a6bf88" roughness={1} />
      </mesh>

      {/* ジオラマの土台(側面が土に見える箱) */}
      <mesh position={[0, -0.63, 0]}>
        <boxGeometry args={[GRID_W + 2, 1.2, GRID_H + 2]} />
        <meshStandardMaterial color="#cbb48a" roughness={0.95} />
      </mesh>

      {/* タイルグリッド */}
      {(buildMode === 'track' || buildMode === 'demolish') && <Grid
        position={[0, 0.005, 0]}
        args={[GRID_W, GRID_H]}
        cellSize={1}
        cellThickness={0.7}
        cellColor="#4c9455"
        sectionSize={4}
        sectionThickness={1.2}
        sectionColor="#7cc487"
        fadeDistance={40}
        fadeStrength={1}
        infiniteGrid={false}
      />}

      <Decor />

      {/* タイル選択用の透明な当たり判定面 */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        onPointerMove={handleMove}
        onPointerOut={handleOut}
        onClick={handleClick}
      >
        <planeGeometry args={[GRID_W, GRID_H]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
