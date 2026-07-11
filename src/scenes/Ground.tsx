// ============================================================================
// 地面 — ベース面 + タイルグリッド + 森の装飾 + タイル選択用の当たり判定面
// ============================================================================
import { useRef } from 'react';
import { Grid } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { GRID_W, GRID_H } from '../data/config';
import { worldPos, worldToNode } from '../utils/grid';
import { useGameStore } from '../store/gameStore';

function Trees() {
  const terrain = useGameStore((s) => s.terrain);
  const spots: [number, number, number][] = [];
  for (const [k, kind] of terrain) {
    if (kind !== 'forest') continue;
    const [xs, zs] = k.split(',');
    spots.push(worldPos(parseInt(xs, 10), parseInt(zs, 10)));
  }
  return (
    <group>
      {spots.map((p, i) => (
        <group key={i} position={[p[0], 0, p[2]]}>
          <mesh position={[0, 0.14, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 0.28, 6]} />
            <meshStandardMaterial color="#6b4a30" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.42, 0]} castShadow>
            <coneGeometry args={[0.26, 0.6, 7]} />
            <meshStandardMaterial color="#3f7a45" roughness={0.85} />
          </mesh>
        </group>
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
        <meshStandardMaterial color="#39533a" roughness={1} />
      </mesh>

      {/* タイルグリッド */}
      <Grid
        position={[0, 0.005, 0]}
        args={[GRID_W, GRID_H]}
        cellSize={1}
        cellThickness={0.7}
        cellColor="#2c4630"
        sectionSize={4}
        sectionThickness={1.2}
        sectionColor="#4a6a4e"
        fadeDistance={40}
        fadeStrength={1}
        infiniteGrid={false}
      />

      <Trees />

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
