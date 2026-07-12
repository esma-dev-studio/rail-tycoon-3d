// ============================================================================
// ミッション(ゴール) — 小2向けの段階的な目標。順番にクリアしていく。
// progress はストアの状態だけから計算できる純関数(Nodeでも検証可能)。
// ============================================================================
import { key } from '../utils/grid';
import { bfsPath } from '../sim/pathfinding';
import type { Line, Town, TrainDef } from '../types/game';

export interface MissionSnapshot {
  money: number;
  totalDelivered: number;
  trackEdges: Set<string>;
  lines: Line[];
  trainDefs: TrainDef[];
  towns: Town[];
}

export interface Mission {
  emoji: string;
  title: string; // 小2向けのことば
  hint: string; // やりかたのヒント
  reward: number; // クリアごほうび(円)
  /** [いまの値, 目標値] */
  progress: (s: MissionSnapshot) => [number, number];
  /** 進捗の表示形式 */
  unit: 'check' | 'count' | 'yen';
}

/** どこか2つの町が線路でつながっているか */
function anyTownsConnected(s: MissionSnapshot): boolean {
  if (s.trackEdges.size === 0) return false;
  for (let i = 0; i < s.towns.length; i++) {
    for (let j = i + 1; j < s.towns.length; j++) {
      const a = s.towns[i];
      const b = s.towns[j];
      if (bfsPath(s.trackEdges, key(a.x, a.z), key(b.x, b.z))) return true;
    }
  }
  return false;
}

export const MISSIONS: Mission[] = [
  {
    emoji: '🛤',
    title: 'せんろで 町と 町を つなごう',
    hint: '下の「せんろ」を おして、町から 町まで じめんを クリック！',
    reward: 2000,
    unit: 'check',
    progress: (s) => [anyTownsConnected(s) ? 1 : 0, 1],
  },
  {
    emoji: '🚆',
    title: '電車を はしらせよう',
    hint: '下の「電車」を おして、つないだ 町を 2つ クリック！',
    reward: 3000,
    unit: 'check',
    progress: (s) => [Math.min(s.lines.length, 1), 1],
  },
  {
    emoji: '🙂',
    title: 'お客さんを 10人 はこぼう',
    hint: '電車が じどうで お客さんを はこぶよ。まってみよう！',
    reward: 3000,
    unit: 'count',
    progress: (s) => [Math.min(s.totalDelivered, 10), 10],
  },
  {
    emoji: '🚃',
    title: '電車を 3だいに ふやそう',
    hint: 'ろせんを クリックして「電車を ふやす」を おそう',
    reward: 5000,
    unit: 'count',
    progress: (s) => [Math.min(s.trainDefs.length, 3), 3],
  },
  {
    emoji: '💰',
    title: 'お金を 20,000円 ためよう',
    hint: 'せんろを のばして、いろんな 町に 電車を はしらせよう',
    reward: 8000,
    unit: 'yen',
    progress: (s) => [Math.min(s.money, 20000), 20000],
  },
  {
    emoji: '🏆',
    title: 'お客さんを 100人 はこぼう',
    hint: 'ぜんぶの 町を つないで、たくさん はこぼう！',
    reward: 0,
    unit: 'count',
    progress: (s) => [Math.min(s.totalDelivered, 100), 100],
  },
];
