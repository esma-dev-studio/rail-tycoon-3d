// ============================================================================
// 経済(運賃計算)。フレームワーク非依存。
// ============================================================================
import { FARE_BASE, FARE_PER_TILE } from '../data/config';
import { tileDistance } from '../utils/grid';
import type { Town } from '../types/game';

/** 2駅間の運賃(距離に比例) */
export function fareBetween(a: Town, b: Town): number {
  return Math.round(FARE_BASE + FARE_PER_TILE * tileDistance(a.x, a.z, b.x, b.z));
}
