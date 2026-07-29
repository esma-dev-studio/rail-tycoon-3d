import type { Line, Town, TrainDef } from '../types/game';

export interface MissionSnapshot {
  money: number;
  totalDelivered: number;
  trackEdges: Set<string>;
  lines: Line[];
  trainDefs: TrainDef[];
  towns: Town[];
  ownedDecorations: string[];
}

export interface Mission {
  emoji: string;
  from: string;
  title: string;
  hint: string;
  reward: number;
  progress: (snapshot: MissionSnapshot) => [number, number];
  unit: 'check' | 'count' | 'yen';
}

function servedTownCount(snapshot: MissionSnapshot): number {
  return new Set(snapshot.lines.flatMap((line) => line.stations)).size;
}

/**
 * 1つのおねがいが1〜3分で終わり、毎回ちがう種類の喜びが返る6章構成。
 * 待つだけの目標を減らし、つくる→見る→かざる→ひろげるを交互にする。
 */
export const MISSIONS: Mission[] = [
  {
    emoji: '🚉',
    from: 'みどり町の みんな',
    title: 'となりの町へ いきたい！',
    hint: '「新しいせんろ」で、町を 2つ つなごう',
    reward: 3500,
    unit: 'check',
    progress: (snapshot) => [Math.min(snapshot.lines.length, 1), 1],
  },
  {
    emoji: '🙂',
    from: 'はじめての おきゃくさん',
    title: '3人を えがおに しよう',
    hint: '電車は じどうで はしるよ。とうちゃくを 見てみよう',
    reward: 2000,
    unit: 'count',
    progress: (snapshot) => [Math.min(snapshot.totalDelivered, 3), 3],
  },
  {
    emoji: '🎁',
    from: '町の こどもたち',
    title: '町に プレゼントを おこう',
    hint: '「ごほうびの町」で、すきな かざりを 1つ えらぼう',
    reward: 2500,
    unit: 'check',
    progress: (snapshot) => [Math.min(snapshot.ownedDecorations.length, 1), 1],
  },
  {
    emoji: '🗺️',
    from: 'ひばり村の えきちょう',
    title: '3つの町を つなげよう',
    hint: 'まだ つないでいない町へ、せんろを のばそう',
    reward: 4000,
    unit: 'count',
    progress: (snapshot) => [Math.min(servedTownCount(snapshot), 3), 3],
  },
  {
    emoji: '🚆',
    from: 'でんしゃファンクラブ',
    title: '15人を はこぼう',
    hint: '電車を見たり、つぎの町を つないだりして まってみよう',
    reward: 5000,
    unit: 'count',
    progress: (snapshot) => [Math.min(snapshot.totalDelivered, 15), 15],
  },
  {
    emoji: '👑',
    from: '5つの町の みんな',
    title: 'ぜんぶの町を つなげよう',
    hint: 'さいごの町まで せんろを とどけよう！',
    reward: 8000,
    unit: 'count',
    progress: (snapshot) => [
      Math.min(servedTownCount(snapshot), snapshot.towns.length),
      snapshot.towns.length,
    ],
  },
];
