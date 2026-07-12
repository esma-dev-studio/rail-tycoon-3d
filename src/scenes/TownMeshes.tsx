// ============================================================================
// 町(駅) — 台座 + 建物クラスタ + 名称/待ち人数ラベル。クリックで選択/駅指定。
// ============================================================================
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { key, worldPos } from '../utils/grid';
import { useGameStore } from '../store/gameStore';
import { sim } from '../sim/simInstance';
import { townWaiting } from '../sim/simulation';
import type { Town } from '../types/game';

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface Building {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
}

function buildingsFor(t: Town): Building[] {
  let seed = hash(t.id);
  const rng = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), seed | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  const count = t.size + 2;
  const palette = ['#d7dbe2', '#c3ccd8', '#e3e6ec', '#b9c2d0'];
  const out: Building[] = [];
  for (let i = 0; i < count; i++) {
    const ang = rng() * Math.PI * 2;
    const rad = 0.12 + rng() * 0.26;
    out.push({
      x: Math.cos(ang) * rad,
      z: Math.sin(ang) * rad,
      w: 0.14 + rng() * 0.14,
      d: 0.14 + rng() * 0.14,
      h: 0.25 + rng() * (0.2 + t.size * 0.18),
      color: palette[Math.floor(rng() * palette.length)],
    });
  }
  return out;
}

const PEOPLE_COLORS = ['#e6484d', '#3bb0f2', '#f2a13b', '#57c98a', '#b07fe6', '#f25fa0', '#4dd0c0', '#5a6acf'];
const MAX_VISIBLE_PEOPLE = 8;

/** 待っているお客さんのミニ人形(人数ぶん、最大8人) */
function WaitingPeople({ count }: { count: number }) {
  const n = Math.min(count, MAX_VISIBLE_PEOPLE);
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const ang = 1.1 + i * 0.55;
        const r = 0.5 + (i % 2) * 0.09;
        const x = Math.cos(ang) * r;
        const z = Math.sin(ang) * r;
        const color = PEOPLE_COLORS[i % PEOPLE_COLORS.length];
        return (
          <group key={i} position={[x, 0.06, z]}>
            <mesh position={[0, 0.055, 0]} castShadow>
              <cylinderGeometry args={[0.032, 0.042, 0.11, 8]} />
              <meshStandardMaterial color={color} roughness={0.7} />
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

function TownItem({ town }: { town: Town }) {
  const buildMode = useGameStore((s) => s.buildMode);
  const tileClick = useGameStore((s) => s.tileClick);
  const townClick = useGameStore((s) => s.townClick);
  const selection = useGameStore((s) => s.selection);
  const lineAnchorTown = useGameStore((s) => s.lineAnchorTown);
  useGameStore((s) => s.revision); // 待ち人数のライブ更新のため revision を購読

  const p = worldPos(town.x, town.z);
  const buildings = buildingsFor(town);
  const selected = selection?.type === 'town' && selection.id === town.id;
  const isAnchor = lineAnchorTown === town.id;
  const highlight = selected || isAnchor;
  const waiting = townWaiting(sim, town.id);

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 5) return;
    e.stopPropagation();
    if (buildMode === 'track' || buildMode === 'demolish') tileClick(key(town.x, town.z));
    else townClick(town.id);
  };
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  };
  const onOut = () => {
    document.body.style.cursor = 'auto';
  };

  return (
    <group position={[p[0], 0, p[2]]} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      {/* 台座 */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[0.62, 0.66, 0.06, 24]} />
        <meshStandardMaterial
          color={town.color}
          emissive={highlight ? town.color : '#000000'}
          emissiveIntensity={highlight ? 0.6 : 0}
          roughness={0.7}
        />
      </mesh>
      {/* 建物 */}
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, 0.06 + b.h / 2, b.z]} castShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color={b.color} roughness={0.6} metalness={0.05} />
        </mesh>
      ))}
      {/* 待っているお客さん */}
      <WaitingPeople count={waiting} />
      {/* ラベル(wrapperClass でクリックを遮らないようにする) */}
      <Html
        position={[0, 0.95, 0]}
        center
        distanceFactor={12}
        zIndexRange={[12, 0]}
        wrapperClass="html-pass-through"
      >
        <div className={`town-label${highlight ? ' is-active' : ''}`}>
          <span className="town-label__name">{town.name}</span>
          {waiting > 0 && <span className="town-label__wait">🧍{waiting}人</span>}
        </div>
      </Html>
    </group>
  );
}

export function TownMeshes() {
  const towns = useGameStore((s) => s.towns);
  return (
    <group>
      {towns.map((t) => (
        <TownItem key={t.id} town={t} />
      ))}
    </group>
  );
}
