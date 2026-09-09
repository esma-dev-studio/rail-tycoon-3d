import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { DECORATIONS, type DecorationKind } from '../data/decorations';
import { TOWNS_BY_ID } from '../data/world';
import { key, worldPos } from '../utils/grid';
import { useGameStore } from '../store/gameStore';
import { sim } from '../sim/simInstance';
import { findTownRoute, townLineCount } from '../sim/network';
import { townTransferWaiting, townWaiting } from '../sim/simulation';
import type { Town } from '../types/game';
import { TOWN_PROJECTS } from '../data/development';
import { ProjectLandmark } from './ProjectLandmark';
import { Reading } from '../components/Reading';

function hash(str: string): number {
  let value = 2166136261;
  for (let index = 0; index < str.length; index++) {
    value ^= str.charCodeAt(index);
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
  for (let index = 0; index < count; index++) {
    const angle = index * 2.39996;
    const radius = 0.4 + random() * (0.24 + level * 0.04);
    buildings.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      w: 0.22 + random() * 0.14,
      d: 0.22 + random() * 0.14,
      h: 0.3 + random() * (0.18 + town.size * 0.13 + level * 0.09),
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
      {level >= 5 && (
        <group position={[-0.54, 0, -0.38]}>
          {[-0.12, 0.12].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <mesh position={[0, 0.13, 0]} castShadow>
                <cylinderGeometry args={[0.025, 0.035, 0.26, 8]} />
                <meshStandardMaterial color="#8b5a35" />
              </mesh>
              <mesh position={[0, 0.34, 0]} castShadow>
                <sphereGeometry args={[0.13, 12, 12]} />
                <meshStandardMaterial color="#53bd72" />
              </mesh>
            </group>
          ))}
        </group>
      )}
      {level >= 6 && (
        <group position={[0.32, 0, 0.38]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.035, 1, 8]} />
            <meshStandardMaterial color="#f8f3df" />
          </mesh>
          <mesh position={[0, 1.02, 0]} castShadow rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.22, 0.32, 5]} />
            <meshStandardMaterial
              color="#ffd84a"
              emissive="#ffb82e"
              emissiveIntensity={0.24}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

function TownGift({ kind, color }: { kind: DecorationKind; color: string }) {
  if (kind === 'flowers') {
    const colors = ['#ff6d9f', '#ffd34e', '#8f7cff', '#ff9657', '#fff6df'];
    return (
      <group position={[-0.53, 0, -0.25]}>
        <mesh position={[0, 0.025, 0]}>
          <cylinderGeometry args={[0.27, 0.3, 0.05, 20]} />
          <meshStandardMaterial color="#4f9f55" />
        </mesh>
        {colors.map((flowerColor, index) => {
          const angle = (Math.PI * 2 * index) / colors.length;
          return (
            <group key={flowerColor} position={[Math.cos(angle) * 0.17, 0.1, Math.sin(angle) * 0.17]}>
              <mesh position={[0, -0.04, 0]}>
                <cylinderGeometry args={[0.008, 0.01, 0.12, 6]} />
                <meshStandardMaterial color="#3b8746" />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.055, 8, 8]} />
                <meshStandardMaterial color={flowerColor} emissive={flowerColor} emissiveIntensity={0.15} />
              </mesh>
            </group>
          );
        })}
      </group>
    );
  }

  if (kind === 'clock') {
    return (
      <group position={[0.5, 0, 0.3]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.04, 0.6, 10]} />
          <meshStandardMaterial color="#32485c" metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.63, 0]} castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.19, 0.19, 0.07, 24]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, 0.63, 0.041]}>
          <circleGeometry args={[0.145, 24]} />
          <meshStandardMaterial color="#fffdf0" />
        </mesh>
        <mesh position={[0, 0.67, 0.08]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[0.015, 0.1, 0.012]} />
          <meshBasicMaterial color="#173047" />
        </mesh>
      </group>
    );
  }

  if (kind === 'fountain') {
    return (
      <group position={[-0.5, 0, 0.33]}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.25, 0.29, 0.1, 28]} />
          <meshStandardMaterial color="#eaf7ff" />
        </mesh>
        <mesh position={[0, 0.11, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.045, 28]} />
          <meshStandardMaterial color="#53c9ed" metalness={0.1} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.27, 0]}>
          <cylinderGeometry args={[0.018, 0.035, 0.32, 10]} />
          <meshStandardMaterial color="#8be7ff" emissive="#4ad8ff" emissiveIntensity={0.45} />
        </mesh>
        <mesh position={[0, 0.46, 0]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#d9faff" emissive="#72e6ff" emissiveIntensity={0.65} />
        </mesh>
      </group>
    );
  }

  if (kind === 'wheel') {
    return (
      <group position={[0.5, 0, 0.23]}>
        <mesh position={[0, 0.47, 0]} castShadow>
          <torusGeometry args={[0.31, 0.035, 10, 28]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.22} />
        </mesh>
        {[0, Math.PI / 3, (Math.PI * 2) / 3].map((angle) => (
          <mesh key={angle} position={[0, 0.47, 0]} rotation={[0, 0, angle]}>
            <boxGeometry args={[0.59, 0.018, 0.018]} />
            <meshStandardMaterial color="#fff7df" />
          </mesh>
        ))}
        <mesh position={[-0.17, 0.18, 0]} rotation={[0, 0, -0.34]}>
          <boxGeometry args={[0.035, 0.45, 0.05]} />
          <meshStandardMaterial color="#40566d" />
        </mesh>
        <mesh position={[0.17, 0.18, 0]} rotation={[0, 0, 0.34]}>
          <boxGeometry args={[0.035, 0.45, 0.05]} />
          <meshStandardMaterial color="#40566d" />
        </mesh>
      </group>
    );
  }

  if (kind === 'rainbow') {
    return (
      <group position={[-0.52, 0, 0.25]}>
        {['#f05b67', '#ffad3f', '#ffe15b', '#4ed18a', '#4d9df2'].map((arcColor, index) => (
          <mesh key={arcColor} position={[0, 0.16, index * -0.012]}>
            <torusGeometry args={[0.29 - index * 0.035, 0.022, 8, 28, Math.PI]} />
            <meshStandardMaterial color={arcColor} emissive={arcColor} emissiveIntensity={0.18} />
          </mesh>
        ))}
        <mesh position={[-0.29, 0.06, 0]}>
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
        <mesh position={[0.29, 0.06, 0]}>
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[0.52, 0, -0.06]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.17, 1.1, 8]} />
        <meshStandardMaterial color="#f5f8ff" metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.14, 0]} castShadow>
        <octahedronGeometry args={[0.19, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <torusGeometry args={[0.17, 0.025, 8, 24]} />
        <meshStandardMaterial color="#28dfc2" emissive="#28dfc2" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

function TownItem({ town }: { town: Town }) {
  const buildMode = useGameStore((state) => state.buildMode);
  const tileClick = useGameStore((state) => state.tileClick);
  const townClick = useGameStore((state) => state.townClick);
  const selection = useGameStore((state) => state.selection);
  const lineAnchorTown = useGameStore((state) => state.lineAnchorTown);
  const routeStartTown = useGameStore((state) => state.routeStartTown);
  const routeEndTown = useGameStore((state) => state.routeEndTown);
  const ownedDecorations = useGameStore((state) => state.ownedDecorations);
  const projects = useGameStore((state) => state.projects);
  const project = TOWN_PROJECTS.find((p) => p.townId === town.id);
  const lines = useGameStore((state) => state.lines);
  const progress = useGameStore((state) => state.townProgress[town.id] ?? { delivered: 0, level: 1 });
  useGameStore((state) => state.revision);

  const position = worldPos(town.x, town.z);
  const buildings = buildingsFor(town, progress.level);
  const selected = selection?.type === 'town' && selection.id === town.id;
  const isAnchor = lineAnchorTown === town.id;
  const isRouteStart = routeStartTown === town.id;
  const isRouteEnd = routeEndTown === town.id;
  const highlight = selected || isAnchor || isRouteStart || isRouteEnd;
  const waiting = townWaiting(sim, town.id);
  const gifts = DECORATIONS.filter(
    (item) => item.townId === town.id && ownedDecorations.includes(item.id),
  );
  const transferWaiting = townTransferWaiting(sim, town.id);
  const isTransferStation = townLineCount(lines, town.id) >= 2;
  const destinationCounts = new Map<string, number>();
  for (const passenger of sim.waiting.get(town.id) ?? []) {
    destinationCounts.set(
      passenger.toTownId,
      (destinationCounts.get(passenger.toTownId) ?? 0) + 1,
    );
  }
  const wishTownId = [...destinationCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0];
  const wishTown = wishTownId ? TOWNS_BY_ID.get(wishTownId) : null;
  const wishRoute = wishTownId ? findTownRoute(lines, town.id, wishTownId) : null;
  const transferTownId = wishRoute && wishRoute.length > 1 ? wishRoute[0].toTownId : null;
  const transferTown = transferTownId ? TOWNS_BY_ID.get(transferTownId) : null;

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
        <cylinderGeometry args={[0.83 + progress.level * 0.04, 0.89 + progress.level * 0.04, 0.07, 32]} />
        <meshStandardMaterial
          color={town.color}
          emissive={highlight ? town.color : '#000000'}
          emissiveIntensity={highlight ? 0.65 : 0}
          roughness={0.7}
        />
      </mesh>

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
        <group key={index} position={[building.x, 0.07 + building.h / 2, building.z]}>
        <mesh castShadow>
          <boxGeometry args={[building.w, building.h, building.d]} />
          <meshStandardMaterial color={building.color} roughness={0.58} metalness={0.03} />
        </mesh>
        <mesh position={[0, building.h / 2 + .025, 0]} castShadow>
          <boxGeometry args={[building.w + .035, .05, building.d + .035]} />
          <meshStandardMaterial color={index % 3 ? town.color : '#91a394'} roughness={.8} />
        </mesh>
        <mesh position={[0, .04, building.d / 2 + .004]}>
          <boxGeometry args={[building.w * .64, .065, .009]} />
          <meshStandardMaterial color="#729da2" roughness={.5} />
        </mesh>
        </group>
      ))}
      <GrowthDecor level={progress.level} color={town.color} />
      {project && projects[project.id] && <ProjectLandmark project={project} completed={projects[project.id].completed} />}
      {gifts.map((gift) => (
        <TownGift key={gift.id} kind={gift.kind} color={gift.color} />
      ))}
      <WaitingPeople count={waiting} />

      <Html
        position={[0, progress.level >= 4 || gifts.some((gift) => gift.kind === 'tower') ? 2.1 : 1.6, 0]}
        center
        zIndexRange={[12, 0]}
        wrapperClass="html-pass-through"
      >
        <button
          aria-label={town.name + 'をえらぶ'}
          onClick={(event) => { event.stopPropagation(); townClick(town.id); }}
          className={`town-label${highlight ? ' is-active' : ''}${
            isRouteStart ? ' is-route-start' : isRouteEnd ? ' is-route-end' : ''
          }`}
        >
          <span className="town-label__name"><Reading text={town.name} /></span>
          {isRouteStart && <span className="town-label__route">ここから</span>}
          {isRouteEnd && <span className="town-label__route">ここまで</span>}
          <span className="town-label__level">Lv.{progress.level}</span>
          {isTransferStation && <span className="town-label__transfer">🔁 のりかえ駅</span>}
          {waiting > 0 && (
            <span className="town-label__wait">
              🙂 {waiting}人{wishTown ? ` → ${wishTown.name}` : ''}
              {transferTown ? `（${transferTown.name}で のりかえ）` : ''}
              {transferWaiting > 0 ? `・🔁${transferWaiting}人` : ''}
            </span>
          )}
          {gifts.length > 0 && <span className="town-label__gift">🎁 {gifts.length}こ</span>}
        </button>
      </Html>
    </group>
  );
}

export function TownMeshes() {
  const towns = useGameStore((state) => state.towns);
  return (
    <group>
      {towns.map((town) => (
        <TownItem key={town.id} town={town} />
      ))}
    </group>
  );
}
