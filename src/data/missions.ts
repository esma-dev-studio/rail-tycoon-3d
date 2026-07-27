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
  title: string;
  hint: string;
  reward: number;
  progress: (snapshot: MissionSnapshot) => [number, number];
  unit: 'check' | 'count' | 'yen';
}

function servedTownCount(snapshot: MissionSnapshot): number {
  return new Set(snapshot.lines.flatMap((line) => line.stations)).size;
}

export const MISSIONS: Mission[] = [
  {
    emoji: '01',
    title: 'はじめての せんを つくろう',
    hint: '「新しいせんろ」を おして、町を 2つ えらぼう',
    reward: 4000,
    unit: 'check',
    progress: (snapshot) => [Math.min(snapshot.lines.length, 1), 1],
  },
  {
    emoji: '02',
    title: 'おきゃくさんを 5人 はこぼう',
    hint: '電車は じどうで はしるよ。町に とうちゃくするのを 見てみよう',
    reward: 2500,
    unit: 'count',
    progress: (snapshot) => [Math.min(snapshot.totalDelivered, 5), 5],
  },
  {
    emoji: '03',
    title: '電車を 2だいに しよう',
    hint: '走っている せんを おして「電車を ふやす」を おそう',
    reward: 3500,
    unit: 'count',
    progress: (snapshot) => [Math.min(snapshot.trainDefs.length, 2), 2],
  },
  {
    emoji: '04',
    title: '3つの 町へ ひろげよう',
    hint: '「新しいせんろ」で、まだ つないでいない 町を えらぼう',
    reward: 4000,
    unit: 'count',
    progress: (snapshot) => [Math.min(servedTownCount(snapshot), 3), 3],
  },
  {
    emoji: '05',
    title: 'お金を 20,000円 ためよう',
    hint: 'つぎの せんろを つくるか、ちょきんするか、さくせんを きめよう',
    reward: 6000,
    unit: 'yen',
    progress: (snapshot) => [Math.min(snapshot.money, 20_000), 20_000],
  },
  {
    emoji: '06',
    title: 'おきゃくさんを 100人 はこぼう',
    hint: 'ぜんぶの 町を つないで、でんしゃマスターを めざそう！',
    reward: 0,
    unit: 'count',
    progress: (snapshot) => [Math.min(snapshot.totalDelivered, 100), 100],
  },
];
