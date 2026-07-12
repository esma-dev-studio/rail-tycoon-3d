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
  x: number; // grid coord
  z: number; // grid coord
  size: number; // 1〜3。乗客発生と建物の規模に影響
  color: string;
}

/** 路線(2駅以上を結ぶ線路上の経路) */
export interface Line {
  id: string;
  name: string;
  color: string;
  /** 端から端までのノード経路 */
  pathNodes: NodeKey[];
  /** 経路上にある町(駅)のID(順序) */
  stations: string[];
}

/** 列車の静的定義(UI識別用。動的な位置は sim 側) */
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

export type BuildMode = 'inspect' | 'track' | 'line' | 'demolish';

export type Selection =
  | { type: 'town'; id: string }
  | { type: 'train'; id: string }
  | { type: 'line'; id: string }
  | null;

/** 3〜要素の座標 */
export type Vec3 = [number, number, number];
