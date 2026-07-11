// ============================================================================
// 初期ワールド — 町(駅)と地形(シード固定で毎回同じ)
// ============================================================================
import { GRID_W, GRID_H } from './config';
import { key } from '../utils/grid';
import type { NodeKey, TerrainKind, Town } from '../types/game';

export const TOWNS: Town[] = [
  { id: 't_midori', name: 'みどり町', x: 2, z: 3, size: 3, color: '#e6a24a' },
  { id: 't_aoba', name: 'あおば', x: 13, z: 3, size: 2, color: '#5aa0e0' },
  { id: 't_chuo', name: '中央市', x: 8, z: 8, size: 3, color: '#e2e2e6' },
  { id: 't_hibari', name: 'ひばり', x: 3, z: 12, size: 2, color: '#b07fe6' },
  { id: 't_minato', name: 'みなと', x: 13, z: 13, size: 3, color: '#57c98a' },
];

/** 町ノード → 町ID */
export const TOWN_BY_NODE = new Map<NodeKey, Town>(TOWNS.map((t) => [key(t.x, t.z), t]));
export const TOWNS_BY_ID = new Map<string, Town>(TOWNS.map((t) => [t.id, t]));

function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 地形マップ(装飾のみ・全タイル建設可能) */
export function generateTerrain(): Map<NodeKey, TerrainKind> {
  const rng = mulberry32(20240711);
  const terrain = new Map<NodeKey, TerrainKind>();
  for (let x = 0; x < GRID_W; x++) {
    for (let z = 0; z < GRID_H; z++) {
      const k = key(x, z);
      if (TOWN_BY_NODE.has(k)) {
        terrain.set(k, 'grass');
        continue;
      }
      const r = rng();
      terrain.set(k, r < 0.16 ? 'forest' : r < 0.22 ? 'hill' : 'grass');
    }
  }
  return terrain;
}
