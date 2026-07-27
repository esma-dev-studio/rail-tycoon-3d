import { useMemo } from 'react';
import { nodeWorld, edgeKey } from '../utils/grid';
import { isBridgeEdge } from '../sim/economy';
import { useGameStore } from '../store/gameStore';

function Segment({
  edge,
  color,
  bridge,
  active,
}: {
  edge: string;
  color: string;
  bridge: boolean;
  active: boolean;
}) {
  const [a, b] = edge.split('~');
  const start = nodeWorld(a);
  const end = nodeWorld(b);
  const y = bridge ? 0.16 : 0.065;
  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    y,
    (start[2] + end[2]) / 2,
  ];
  const horizontal = Math.abs(start[0] - end[0]) > 1e-6;

  return (
    <group position={midpoint} rotation={[0, horizontal ? 0 : Math.PI / 2, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[1.04, 0.045, 0.38]} />
        <meshStandardMaterial color={bridge ? '#667584' : '#737982'} roughness={0.95} />
      </mesh>

      {/* まくらぎを置き、上から見ても線路だとすぐ分かるようにする。 */}
      {[-0.4, -0.2, 0, 0.2, 0.4].map((x) => (
        <mesh key={x} position={[x, 0.038, 0]} castShadow>
          <boxGeometry args={[0.085, 0.045, 0.38]} />
          <meshStandardMaterial color={bridge ? '#bfc9d2' : '#5b4638'} roughness={0.85} />
        </mesh>
      ))}

      {bridge && (
        <>
          <mesh position={[-0.32, -0.11, 0]}>
            <boxGeometry args={[0.09, 0.22, 0.31]} />
            <meshStandardMaterial color="#586775" roughness={0.8} />
          </mesh>
          <mesh position={[0.32, -0.11, 0]}>
            <boxGeometry args={[0.09, 0.22, 0.31]} />
            <meshStandardMaterial color="#586775" roughness={0.8} />
          </mesh>
          {[0.19, -0.19].map((z) => (
            <group key={z}>
              <mesh position={[0, 0.12, z]}>
                <boxGeometry args={[1.04, 0.035, 0.025]} />
                <meshStandardMaterial color="#f09b35" metalness={0.35} roughness={0.5} />
              </mesh>
              {[-0.45, -0.15, 0.15, 0.45].map((x) => (
                <mesh key={x} position={[x, 0.075, z]}>
                  <boxGeometry args={[0.025, 0.13, 0.025]} />
                  <meshStandardMaterial color="#f09b35" metalness={0.35} roughness={0.5} />
                </mesh>
              ))}
            </group>
          ))}
        </>
      )}

      {[0.115, -0.115].map((z) => (
        <mesh key={z} position={[0, 0.078, z]} castShadow>
          <boxGeometry args={[1.04, 0.055, 0.04]} />
          <meshStandardMaterial
            color={color}
            metalness={0.82}
            roughness={0.22}
            emissive={active ? color : '#000000'}
            emissiveIntensity={active ? 0.28 : 0}
          />
        </mesh>
      ))}

      {active && (
        <mesh position={[0, 0.018, 0]}>
          <boxGeometry args={[0.94, 0.018, 0.31]} />
          <meshBasicMaterial color={color} transparent opacity={0.28} />
        </mesh>
      )}
    </group>
  );
}

export function TrackMeshes() {
  const trackEdges = useGameStore((state) => state.trackEdges);
  const lines = useGameStore((state) => state.lines);
  const selection = useGameStore((state) => state.selection);
  const terrain = useGameStore((state) => state.terrain);

  const highlighted = useMemo(() => {
    const map = new Map<string, string>();
    if (selection?.type === 'line') {
      const line = lines.find((candidate) => candidate.id === selection.id);
      if (line) {
        for (let index = 0; index < line.pathNodes.length - 1; index++) {
          map.set(edgeKey(line.pathNodes[index], line.pathNodes[index + 1]), line.color);
        }
      }
    }
    return map;
  }, [selection, lines]);

  const edges = useMemo(() => [...trackEdges], [trackEdges]);

  return (
    <group>
      {edges.map((edge) => {
        const [a, b] = edge.split('~');
        const activeColor = highlighted.get(edge);
        return (
          <Segment
            key={edge}
            edge={edge}
            color={activeColor ?? '#d6dde3'}
            active={Boolean(activeColor)}
            bridge={isBridgeEdge(a, b, terrain)}
          />
        );
      })}
    </group>
  );
}
