// ============================================================================
// ゲーム定数(バランス調整はここ)
// ============================================================================
export const GRID_W = 16;
export const GRID_H = 16;
export const TILE = 1; // ワールド単位/タイル

// 小学2年生向け: 数字はぜんぶキリのいい値にする
export const START_MONEY = 10000;
export const TRACK_COST = 100; // 線路1タイルあたり(1マス100円で暗算しやすく)
export const TRACK_REFUND = 0.5; // 撤去時の払い戻し率
export const TRAIN_COST = 5000;

export const TRAIN_CAPACITY = 20;
export const TRAIN_SPEED = 2.4; // タイル/秒(1x時)
export const DWELL_TIME = 0.9; // 駅での停車時間(秒)

export const FARE_BASE = 100;
export const FARE_PER_TILE = 30;

export const SPAWN_INTERVAL = 2.2; // 乗客発生間隔(秒, 1x)
export const MAX_WAITING = 40; // 町ごとの待ち乗客の上限

export const SECONDS_PER_DAY = 18;
export const SPEEDS = [0, 1, 3] as const;

/** 路線に割り当てる色 */
export const LINE_COLORS = [
  '#e6484d',
  '#f2a13b',
  '#3bb0f2',
  '#57c98a',
  '#b07fe6',
  '#f25fa0',
  '#4dd0c0',
  '#d9c04d',
];
