import { useMemo } from 'react';
import { TOWNS_BY_ID } from '../data/world';
import { nodeWorld, manhattanPath, edgeKey, key } from '../utils/grid';
import { trackEdgeCost } from '../sim/economy';
import { useGameStore } from '../store/gameStore';

function TileMark({
  node,
  color,
  opacity = 0.35,
}: {
  node: string;
  color: string;
  opacity?: number;
}) {
  const world = nodeWorld(node);
  return (
    <group position={[world[0], 0.04, world[2]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.36, 0.5, 32]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <circleGeometry args={[0.31, 32]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.28} depthWrite={false} />
      </mesh>
    </group>
  );
}

function PreviewSegment({
  a,
  b,
  color,
  opacity,
}: {
  a: string;
  b: string;
  color: string;
  opacity: number;
}) {
  const start = nodeWorld(a);
  const end = nodeWorld(b);
  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    0.11,
    (start[2] + end[2]) / 2,
  ];
  const horizontal = Math.abs(start[0] - end[0]) > 1e-6;
  return (
    <group position={midpoint} rotation={[0, horizontal ? 0 : Math.PI / 2, 0]}>
      <mesh>
        <boxGeometry args={[1, 0.055, 0.26]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.28} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.035, 0]}>
        <boxGeometry args={[0.84, 0.035, 0.08]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function BuildOverlay() {
  const buildMode = useGameStore((state) => state.buildMode);
  const hoverNode = useGameStore((state) => state.hoverNode);
  const anchorNode = useGameStore((state) => state.anchorNode);
  const routeStartTown = useGameStore((state) => state.routeStartTown);
  const routeEndTown = useGameStore((state) => state.routeEndTown);
  const trackEdges = useGameStore((state) => state.trackEdges);
  const terrain = useGameStore((state) => state.terrain);
  const money = useGameStore((state) => state.money);

  const preview = useMemo(() => {
    let from: string | null = null;
    let to: string | null = null;
    if (buildMode === 'track' && anchorNode && hoverNode && anchorNode !== hoverNode) {
      from = anchorNode;
      to = hoverNode;
    }
    if (buildMode === 'route' && routeStartTown && routeEndTown) {
      const start = TOWNS_BY_ID.get(routeStartTown);
      const end = TOWNS_BY_ID.get(routeEndTown);
      if (start && end) {
        from = key(start.x, start.z);
        to = key(end.x, end.z);
      }
    }
    if (!from || !to) return null;

    const path = manhattanPath(from, to);
    const segments: { a: string; b: string; isNew: boolean }[] = [];
    let cost = buildMode === 'route' ? 5000 : 0;
    for (let index = 0; index < path.length - 1; index++) {
      const isNew = !trackEdges.has(edgeKey(path[index], path[index + 1]));
      if (isNew) cost += trackEdgeCost(path[index], path[index + 1], terrain);
      segments.push({ a: path[index], b: path[index + 1], isNew });
    }
    return { segments, affordable: money >= cost, from, to };
  }, [
    buildMode,
    anchorNode,
    hoverNode,
    routeStartTown,
    routeEndTown,
    trackEdges,
    terrain,
    money,
  ]);

  if (buildMode !== 'track' && buildMode !== 'demolish' && buildMode !== 'route') return null;
  const previewColor = preview?.affordable ? '#21e6c1' : '#ff5f6d';

  return (
    <group>
      {anchorNode && buildMode === 'track' && <TileMark node={anchorNode} color="#ffb636" opacity={0.75} />}
      {hoverNode && buildMode !== 'route' && (
        <TileMark node={hoverNode} color={buildMode === 'demolish' ? '#ff4d5a' : '#ffffff'} opacity={0.55} />
      )}
      {preview && (
        <>
          <TileMark node={preview.from} color="#21e6c1" opacity={0.85} />
          <TileMark node={preview.to} color="#ffb636" opacity={0.85} />
          {preview.segments.map((segment, index) => (
            <PreviewSegment
              key={`${segment.a}-${segment.b}-${index}`}
              a={segment.a}
              b={segment.b}
              color={previewColor}
              opacity={segment.isNew ? 0.95 : 0.42}
            />
          ))}
        </>
      )}
    </group>
  );
}
