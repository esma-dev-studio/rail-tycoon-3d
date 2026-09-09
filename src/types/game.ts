// ============================================================================
// Rail Tycoon 3D — 型定義
// ============================================================================

export type TerrainKind = 'grass' | 'forest' | 'hill' | 'water';

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

/** 路線。stations は電車が停車する町を順番に持つ。 */
export interface Line {
  id: string;
  name: string;
  color: string;
  pathNodes: NodeKey[];
  stations: string[];
  /** 1〜3。古いセーブには値がないため、未設定はレベル1として扱う。 */
  capacityLevel?: number;
  /** 1〜3。古いセーブには値がないため、未設定はレベル1として扱う。 */
  speedLevel?: number;
}

/** 電車の静的定義。動的な位置は sim 側で持つ。 */
export interface TrainDef {
  id: string;
  lineId: string;
  color: string;
}

export interface Passenger {
  id: number;
  /** さいしょに出発した町。運賃計算に使う。 */
  fromTownId: string;
  /** 本当に行きたい、最後の目的地。 */
  toTownId: string;
  /** いま乗っている電車で降りる駅。乗り換え待ちの時は未設定。 */
  legToTownId?: string;
  /** いま乗っている路線。乗り換え待ちの時は未設定。 */
  legLineId?: string;
  transfers: number;
}

/** route は町を2つ選ぶ標準モード。track/line は上級者向け。 */
export type BuildMode = 'inspect' | 'route' | 'track' | 'line' | 'demolish';

export type Selection =
  | { type: 'town'; id: string }
  | { type: 'train'; id: string }
  | { type: 'line'; id: string }
  | null;

export type Vec3 = [number, number, number];
