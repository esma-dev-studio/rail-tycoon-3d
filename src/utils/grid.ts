// ============================================================================
// グリッド座標ユーティリティ(フレームワーク非依存)
// ============================================================================
import { GRID_W, GRID_H, TILE } from '../data/config';
import type { NodeKey, Vec3 } from '../types/game';

export function key(x: number, z: number): NodeKey {
  return `${x},${z}`;
}

export function parseKey(k: NodeKey): [number, number] {
  const i = k.indexOf(',');
  return [parseInt(k.slice(0, i), 10), parseInt(k.slice(i + 1), 10)];
}

export function inBounds(x: number, z: number): boolean {
  return x >= 0 && z >= 0 && x < GRID_W && z < GRID_H;
}

/** グリッド座標 → ワールド座標(グリッド中心を原点に) */
export function worldPos(x: number, z: number): Vec3 {
  const wx = (x - (GRID_W - 1) / 2) * TILE;
  const wz = (z - (GRID_H - 1) / 2) * TILE;
  return [wx, 0, wz];
}

export function nodeWorld(k: NodeKey): Vec3 {
  const [x, z] = parseKey(k);
  return worldPos(x, z);
}

/** ワールド座標 → 最も近いグリッドノード */
export function worldToNode(wx: number, wz: number): NodeKey | null {
  const x = Math.round(wx / TILE + (GRID_W - 1) / 2);
  const z = Math.round(wz / TILE + (GRID_H - 1) / 2);
  if (!inBounds(x, z)) return null;
  return key(x, z);
}

/** 4近傍 */
export function neighbors4(k: NodeKey): NodeKey[] {
  const [x, z] = parseKey(k);
  const out: NodeKey[] = [];
  if (inBounds(x + 1, z)) out.push(key(x + 1, z));
  if (inBounds(x - 1, z)) out.push(key(x - 1, z));
  if (inBounds(x, z + 1)) out.push(key(x, z + 1));
  if (inBounds(x, z - 1)) out.push(key(x, z - 1));
  return out;
}

/** 無向エッジのキー(端点をソートして一意化) */
export function edgeKey(a: NodeKey, b: NodeKey): string {
  return a < b ? `${a}~${b}` : `${b}~${a}`;
}

/**
 * a→b の L字マンハッタン経路のノード列(両端含む)。まずX、次にZ。
 */
export function manhattanPath(a: NodeKey, b: NodeKey): NodeKey[] {
  const [ax, az] = parseKey(a);
  const [bx, bz] = parseKey(b);
  const nodes: NodeKey[] = [];
  const stepX = Math.sign(bx - ax);
  const stepZ = Math.sign(bz - az);
  let x = ax;
  let z = az;
  nodes.push(key(x, z));
  while (x !== bx) {
    x += stepX;
    nodes.push(key(x, z));
  }
  while (z !== bz) {
    z += stepZ;
    nodes.push(key(x, z));
  }
  return nodes;
}

/** タイル距離(ユークリッド) */
export function tileDistance(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(ax - bx, az - bz);
}
