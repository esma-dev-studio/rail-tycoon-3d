// ============================================================================
// 線路 — 敷設済みエッジごとにバラスト+2本のレールを描画。
// 選択中の路線のレールはその路線色でハイライト。
// ============================================================================
import { useMemo } from 'react';
import { nodeWorld, edgeKey } from '../utils/grid';
import { useGameStore } from '../store/gameStore';

function Segment({
  ek,
  color,
}: {
  ek: string;
  color: string;
}) {
  const [a, b] = ek.split('~');
  const wa = nodeWorld(a);
  const wb = nodeWorld(b);
  const mid: [number, number, number] = [(wa[0] + wb[0]) / 2, 0.06, (wa[2] + wb[2]) / 2];
  const horizontal = Math.abs(wa[0] - wb[0]) > 1e-6;
  const rotY = horizontal ? 0 : Math.PI / 2;
  return (
    <group position={mid} rotation={[0, rotY, 0]}>
      <mesh>
        <boxGeometry args={[1.02, 0.04, 0.34]} />
        <meshStandardMaterial color="#4b4b54" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.04, 0.12]}>
        <boxGeometry args={[1.02, 0.05, 0.05]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.04, -0.12]}>
        <boxGeometry args={[1.02, 0.05, 0.05]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  );
}

export function TrackMeshes() {
  const trackEdges = useGameStore((s) => s.trackEdges);
  const lines = useGameStore((s) => s.lines);
  const selection = useGameStore((s) => s.selection);

  const highlighted = useMemo(() => {
    const map = new Map<string, string>();
    if (selection?.type === 'line') {
      const line = lines.find((l) => l.id === selection.id);
      if (line) {
        for (let i = 0; i < line.pathNodes.length - 1; i++) {
          map.set(edgeKey(line.pathNodes[i], line.pathNodes[i + 1]), line.color);
        }
      }
    }
    return map;
  }, [selection, lines]);

  const edges = useMemo(() => [...trackEdges], [trackEdges]);

  return (
    <group>
      {edges.map((ek) => (
        <Segment key={ek} ek={ek} color={highlighted.get(ek) ?? '#aeb4be'} />
      ))}
    </group>
  );
}
