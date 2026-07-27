import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { key, worldPos } from '../utils/grid';
import { useGameStore } from '../store/gameStore';
import { sim } from '../sim/simInstance';
import { townWaiting } from '../sim/simulation';
import type { Town } from '../types/game';

function hash(str: string): number {
  let value = 2166136261;
  for (let i = 0; i < str.length; i++) {
    value ^= str.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

interface Building {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
}

function buildingsFor(town: Town, level: number): Building[] {
  let seed = hash(town.id);
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), seed | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const count = town.size + 2 + (level - 1) * 2;
  const palette = ['#fff2c7', '#dceeff', '#ffd9df', '#d9f3de', '#e9ddff', '#ffffff'];
  const buildings: Building[] = [];
  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2;
    const radius = 0.13 + random() * (0.24 + level * 0.025);
    buildings.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      w: 0.13 + random() * 0.13,
      d: 0.13 + random() * 0.13,
      h: 0.24 + random() * (0.18 + town.size * 0.12 + level * 0.08),
      color: palette[Math.floor(random() * palette.length)],
    });
  }
  return buildings;
}

const PEOPLE_COLORS = ['#e6484d', '#3bb0f2', '#f2a13b', '#57c98a', '#b07fe6', '#f25fa0'];
const MAX_VISIBLE_PEOPLE = 8;

function WaitingPeople({ count }: { count: number }) {
  return (
    <group>
      {Array.from({ length: Math.min(count, MAX_VISIBLE_PEOPLE) }, (_, index) => {
        const angle = 1.1 + index * 0.55;
        const radius = 0.52 + (index % 2) * 0.09;
        return (
          <group
            key={index}
            position={[Math.cos(angle) * radius, 0.06, Math.sin(angle) * radius]}
          >
            <mesh position={[0, 0.055, 0]} castShadow>
              <cylinderGeometry args={[0.032, 0.042, 0.11, 8]} />
              <meshStandardMaterial color={PEOPLE_COLORS[index % PEOPLE_COLORS.length]} roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.14, 0]} castShadow>
              <sphereGeometry args={[0.038, 10, 10]} />
              <meshStandardMaterial color="#ffdcb8" roughness={0.7} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function GrowthDecor({ level, color }: { level: number; color: string }) {
  return (
    <group>
      {/* 町が育つほど、目で見て分かるランドマークが増える。 */}
      {level >= 2 && (
        <group position={[0.48, 0, -0.3]}>
          <mesh position={[0, 0.34, 0]} castShadow>
            <cylinderGeometry args={[0.018, 0.022, 0.68, 8]} />
            <meshStandardMaterial color="#f8f3df" />
          </mesh>
          <mesh position={[0.1, 0.58, 0]} castShadow>
            <boxGeometry args={[0.2, 0.13, 0.025]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.12} />
          </mesh>
        </group>
      )}
      {level >= 3 && (
        <group position={[-0.46, 0, 0.28]}>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.17, 0.2, 0.1, 20]} />
            <meshStandardMaterial color="#eaf7ff" />
          </mesh>
          <mesh position={[0, 0.11, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.035, 20]} />
            <meshStandardMaterial color="#55bdf1" metalness={0.15} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#dff7ff" emissive="#78d9ff" emissiveIntensity={0.25} />
          </mesh>
        </group>
      )}
      {level >= 4 && (
        <group position={[0.05, 0, 0.02]}>
          <mesh position={[0, 0.82, 0]} castShadow>
            <boxGeometry args={[0.25, 1.05, 0.25]} />
            <meshStandardMaterial color="#fff5c4" roughness={0.45} />
          </mesh>
          <mesh position={[0, 1.4, 0]} castShadow>
            <coneGeometry args={[0.22, 0.25, 4]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.1} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function TownItem({ town }: { town: Town }) {
  const buildMode = useGameStore((s) => s.buildMode);
  const tileClick = useGameStore((s) => s.tileClick);
  const townClick = useGameStore((s) => s.townClick);
  const selection = useGameStore((s) => s.selection);
  const lineAnchorTown = useGameStore((s) => s.lineAnchorTown);
  const progress = useGameStore((s) => s.townProgress[town.id] ?? { delivered: 0, level: 1 });
  useGameStore((s) => s.revision);

  const position = worldPos(town.x, town.z);
  const buildings = buildingsFor(town, progress.level);
  const selected = selection?.type === 'town' && selection.id === town.id;
  const isAnchor = lineAnchorTown === town.id;
  const highlight = selected || isAnchor;
  const waiting = townWaiting(sim, town.id);

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 5) return;
    event.stopPropagation();
    if (buildMode === 'track' || buildMode === 'demolish') tileClick(key(town.x, town.z));
    else townClick(town.id);
  };

  return (
    <group
      position={[position[0], 0, position[2]]}
      onClick={onClick}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[0.61 + progress.level * 0.035, 0.66 + progress.level * 0.035, 0.07, 28]} />
        <meshStandardMaterial
          color={town.color}
          emissive={highlight ? town.color : '#000000'}
          emissiveIntensity={highlight ? 0.65 : 0}
          roughness={0.7}
        />
      </mesh>

      {/* 小さな駅。線路を町につなぐ場所が見つけやすくなる。 */}
      <group position={[0, 0, -0.52]}>
        <mesh position={[0, 0.13, 0]} castShadow>
          <boxGeometry args={[0.34, 0.22, 0.22]} />
          <meshStandardMaterial color="#fffdf5" roughness={0.65} />
        </mesh>
        <mesh position={[0, 0.27, 0]} castShadow rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.23, 0.23, 0.23]} />
          <meshStandardMaterial color={town.color} roughness={0.7} />
        </mesh>
      </group>

      {buildings.map((building, index) => (
        <mesh
          key={index}
          position={[building.x, 0.07 + building.h / 2, building.z]}
          castShadow
        >
          <boxGeometry args={[building.w, building.h, building.d]} />
          <meshStandardMaterial color={building.color} roughness={0.58} metalness={0.03} />
        </mesh>
      ))}
      <GrowthDecor level={progress.level} color={town.color} />
      <WaitingPeople count={waiting} />

      <Html
        position={[0, progress.level >= 4 ? 1.75 : 1.05, 0]}
        center
        distanceFactor={12}
        zIndexRange={[12, 0]}
        wrapperClass="html-pass-through"
      >
        <div className={`town-label${highlight ? ' is-active' : ''}`}>
          <span className="town-label__name">{town.name}</span>
          <span className="town-label__level">⭐ Lv.{progress.level}</span>
          {waiting > 0 && <span className="town-label__wait">🧍 {waiting}人</span>}
        </div>
      </Html>
    </group>
  );
}

export function TownMeshes() {
  const towns = useGameStore((s) => s.towns);
  return (
    <group>
      {towns.map((town) => (
        <TownItem key={town.id} town={town} />
      ))}
    </group>
  );
}
