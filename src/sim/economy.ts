// ============================================================================
// 経済(運賃・建設費の計算)。フレームワーク非依存。
// ============================================================================
import { FARE_BASE, FARE_PER_TILE, TRACK_COST, BRIDGE_COST } from '../data/config';
import { tileDistance } from '../utils/grid';
import type { NodeKey, TerrainKind, Town } from '../types/game';

/** 2駅間の運賃(距離に比例) */
export function fareBetween(a: Town, b: Town): number {
  return Math.round(FARE_BASE + FARE_PER_TILE * tileDistance(a.x, a.z, b.x, b.z));
}

/** 川に触れるエッジは「はし」か */
export function isBridgeEdge(a: NodeKey, b: NodeKey, terrain: Map<NodeKey, TerrainKind>): boolean {
  return terrain.get(a) === 'water' || terrain.get(b) === 'water';
}

/** 線路エッジ1本の建設費(川の上は はし料金) */
export function trackEdgeCost(a: NodeKey, b: NodeKey, terrain: Map<NodeKey, TerrainKind>): number {
  return isBridgeEdge(a, b, terrain) ? BRIDGE_COST : TRACK_COST;
}
