// ============================================================================
// 建設プレビュー — ホバータイル・敷設プレビュー経路・アンカーの可視化
// ============================================================================
import { useMemo } from 'react';
import { nodeWorld, manhattanPath, edgeKey } from '../utils/grid';
import { TRACK_COST } from '../data/config';
import { useGameStore } from '../store/gameStore';

function TileMark({ node, color, opacity = 0.35 }: { node: string; color: string; opacity?: number }) {
  const w = nodeWorld(node);
  return (
    <mesh position={[w[0], 0.03, w[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.92, 0.92]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

function PreviewSeg({ a, b, color, opacity }: { a: string; b: string; color: string; opacity: number }) {
  const wa = nodeWorld(a);
  const wb = nodeWorld(b);
  const mid: [number, number, number] = [(wa[0] + wb[0]) / 2, 0.09, (wa[2] + wb[2]) / 2];
  const horizontal = Math.abs(wa[0] - wb[0]) > 1e-6;
  const rotY = horizontal ? 0 : Math.PI / 2;
  return (
    <mesh position={mid} rotation={[0, rotY, 0]}>
      <boxGeometry args={[1.0, 0.06, 0.3]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

export function BuildOverlay() {
  const buildMode = useGameStore((s) => s.buildMode);
  const hoverNode = useGameStore((s) => s.hoverNode);
  const anchorNode = useGameStore((s) => s.anchorNode);
  const trackEdges = useGameStore((s) => s.trackEdges);
  const money = useGameStore((s) => s.money);

  const preview = useMemo(() => {
    if (buildMode !== 'track' || !anchorNode || !hoverNode || anchorNode === hoverNode) return null;
    const path = manhattanPath(anchorNode, hoverNode);
    const segs: { a: string; b: string; isNew: boolean }[] = [];
    let newCount = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const isNew = !trackEdges.has(edgeKey(path[i], path[i + 1]));
      if (isNew) newCount++;
      segs.push({ a: path[i], b: path[i + 1], isNew });
    }
    return { segs, affordable: money >= newCount * TRACK_COST };
  }, [buildMode, anchorNode, hoverNode, trackEdges, money]);

  if (buildMode !== 'track' && buildMode !== 'demolish') return null;

  const hoverColor = buildMode === 'demolish' ? '#ff3b3b' : '#ffffff';

  return (
    <group>
      {anchorNode && buildMode === 'track' && <TileMark node={anchorNode} color="#ff9f1a" opacity={0.6} />}
      {hoverNode && <TileMark node={hoverNode} color={hoverColor} opacity={0.45} />}
      {preview?.segs.map((s, i) => (
        <PreviewSeg
          key={i}
          a={s.a}
          b={s.b}
          color={preview.affordable ? '#ffd24a' : '#ff4d4d'}
          opacity={s.isNew ? 0.85 : 0.3}
        />
      ))}
    </group>
  );
}
