// ============================================================================
// Rail Tycoon 3D — 型定義
// ============================================================================

export type TerrainKind = 'grass' | 'forest' | 'hill' | 'water';

/** トーストの見た目(ふつう/うれしい/こまった) */
export type ToastKind = 'info' | 'good' | 'bad';

/** グリッドノードのキー `${x},${z}` */
export type NodeKey = string;

export interface Town {
  id: string;
  name: string;
  x: number;
  z: number;
  size: number;
  color: string;
}

/** 路線(2駅以上を結ぶ線路上の経路) */
export interface Line {
  id: string;
  name: string;
  color: string;
  pathNodes: NodeKey[];
  stations: string[];
}

/** 列車の静的定義。動的な位置は sim 側に持つ。 */
export interface TrainDef {
  id: string;
  lineId: string;
  color: string;
}

export interface Passenger {
  id: number;
  fromTownId: string;
  toTownId: string;
}

/** route は町を2つ選ぶだけの標準モード。track/line は上級者向け。 */
export type BuildMode = 'inspect' | 'route' | 'track' | 'line' | 'demolish';

export type Selection =
  | { type: 'town'; id: string }
  | { type: 'train'; id: string }
  | { type: 'line'; id: string }
  | null;

export type Vec3 = [number, number, number];
