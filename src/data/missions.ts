import { totalLineUpgradeCount } from './lineUpgrades.ts';
import type { TownProgress } from './progression.ts';
import { largestConnectedTownCount } from '../sim/network.ts';
import type { Line, Town, TrainDef } from '../types/game.ts';

export interface MissionSnapshot {
  money: number;
  totalDelivered: number;
  totalTransferDelivered: number;
  trackEdges: Set<string>;
  lines: Line[];
  trainDefs: TrainDef[];
  towns: Town[];
  townProgress: Record<string, TownProgress>;
  ownedDecorations: string[];
}

export interface Mission {
  chapter: 1 | 2 | 3;
  emoji: string;
  from: string;
  title: string;
  hint: string;
  reward: number;
  progress: (snapshot: MissionSnapshot) => [number, number];
  unit: 'check' | 'count' | 'yen';
  chapterEnd?: boolean;
}

export const CHAPTERS = [
  {
    number: 1,
    emoji: '🗺️',
    title: '町を つなごう',
    clearTitle: '5つの町が つながった！',
    unlock: '第2しょう「せんろを そだてよう」と、電車の パワーアップが はじまるよ。',
  },
  {
    number: 2,
    emoji: '🛠️',
    title: 'せんろを そだてよう',
    clearTitle: 'たよれる せんろに なった！',
    unlock: '第3しょう「にぎやかな町を つくろう」が はじまるよ。',
  },
  {
    number: 3,
    emoji: '🌟',
    title: 'にぎやかな町を つくろう',
    clearTitle: 'でんせつの しゃちょう！',
    unlock: 'この先は「ずっとチャレンジ」。50人ずつ はこんで、町を レベル6まで そだてよう。',
  },
] as const;

function connectedTownProgress(snapshot: MissionSnapshot): number {
  return largestConnectedTownCount(snapshot.lines, snapshot.towns);
}

function townsAtLevel(snapshot: MissionSnapshot, level: number): number {
  return snapshot.towns.filter(
    (town) => (snapshot.townProgress[town.id]?.level ?? 1) >= level,
  ).length;
}

/**
 * つなぐ → せんろを育てる → 町を育てる、の3章構成。
 * 5町接続はゲームの終わりではなく、第1章の大きな達成として扱う。
 */
export const MISSIONS: Mission[] = [
  {
    chapter: 1,
    emoji: '🚉',
    from: 'みどり町の みんな',
    title: '2つの町を つなごう！',
    hint: '「せんろ」で 町を2つ えらぶと、電車も いっしょに つくれるよ',
    reward: 3500,
    unit: 'check',
    progress: (snapshot) => [Math.min(connectedTownProgress(snapshot), 2), 2],
  },
  {
    chapter: 1,
    emoji: '↔️',
    from: 'はじめての おきゃくさん',
    title: '行きと 帰りを 見てみよう',
    hint: '行きの3人と、帰りの3人。電車が もどるところまで 見よう',
    reward: 2000,
    unit: 'count',
    progress: (snapshot) => [Math.min(snapshot.totalDelivered, 6), 6],
  },
  {
    chapter: 1,
    emoji: '🎁',
    from: '町の こどもたち',
    title: '町に プレゼントを おこう',
    hint: '「町づくり」の下にある プレゼントを 1つ えらぼう',
    reward: 2500,
    unit: 'check',
    progress: (snapshot) => [Math.min(snapshot.ownedDecorations.length, 1), 1],
  },
  {
    chapter: 1,
    emoji: '🔁',
    from: 'ひばり村の えきちょう',
    title: '3つの町を 1つにつなごう',
    hint: 'A―Bと B―Cなら、Bで じどうで のりかえできるよ',
    reward: 4000,
    unit: 'count',
    progress: (snapshot) => [Math.min(connectedTownProgress(snapshot), 3), 3],
  },
  {
    chapter: 1,
    emoji: '🚆',
    from: 'でんしゃファンクラブ',
    title: '15人を いきたい町へ とどけよう',
    hint: 'のりかえも 電車に おまかせ。町が つながるほど 人が ふえるよ',
    reward: 5000,
    unit: 'count',
    progress: (snapshot) => [Math.min(snapshot.totalDelivered, 15), 15],
  },
  {
    chapter: 1,
    emoji: '👑',
    from: '5つの町の みんな',
    title: '5つの町を 1つにつなげよう',
    hint: 'ここは おわりではなく、第1しょうの ゴールだよ！',
    reward: 8000,
    unit: 'count',
    chapterEnd: true,
    progress: (snapshot) => [
      Math.min(connectedTownProgress(snapshot), snapshot.towns.length),
      snapshot.towns.length,
    ],
  },
  {
    chapter: 2,
    emoji: '🚃',
    from: 'こんでいる駅の みんな',
    title: '電車を もう1だい ふやそう',
    hint: '路線を おすと「電車を ふやす」ボタンが あるよ',
    reward: 5000,
    unit: 'count',
    progress: (snapshot) => [
      Math.min(Math.max(0, snapshot.trainDefs.length - snapshot.lines.length), 1),
      1,
    ],
  },
  {
    chapter: 2,
    emoji: '🛠️',
    from: 'てつくん',
    title: '路線を 1かい パワーアップ',
    hint: '路線を おして「長い電車」か「スピードアップ」を えらぼう',
    reward: 6000,
    unit: 'count',
    progress: (snapshot) => [Math.min(totalLineUpgradeCount(snapshot.lines), 1), 1],
  },
  {
    chapter: 2,
    emoji: '🙂',
    from: 'おでかけが すきな みんな',
    title: '40人を えがおに しよう',
    hint: 'こんでいる路線には、電車を ふやすと はやく はこべるよ',
    reward: 7000,
    unit: 'count',
    progress: (snapshot) => [Math.min(snapshot.totalDelivered, 40), 40],
  },
  {
    chapter: 2,
    emoji: '🏙️',
    from: '5つの町の えきちょう',
    title: 'ぜんぶの町を レベル2に しよう',
    hint: 'まだ星1の町へ 行く おきゃくさんも はこんでみよう',
    reward: 10_000,
    unit: 'count',
    chapterEnd: true,
    progress: (snapshot) => [
      Math.min(townsAtLevel(snapshot, 2), snapshot.towns.length),
      snapshot.towns.length,
    ],
  },
  {
    chapter: 3,
    emoji: '🎡',
    from: '町の こどもたち',
    title: 'プレゼントを 4こに しよう',
    hint: 'はこんで ためたお金で、町の けしきを かえよう',
    reward: 8000,
    unit: 'count',
    progress: (snapshot) => [Math.min(snapshot.ownedDecorations.length, 4), 4],
  },
  {
    chapter: 3,
    emoji: '⚡',
    from: 'でんしゃ研究所',
    title: 'パワーアップを 3かい しよう',
    hint: 'こんでいる路線から そだてるのが おすすめだよ',
    reward: 9000,
    unit: 'count',
    progress: (snapshot) => [Math.min(totalLineUpgradeCount(snapshot.lines), 3), 3],
  },
  {
    chapter: 3,
    emoji: '🔁',
    from: 'のりかえ名人',
    title: 'のりかえで 10人 とどけよう',
    hint: '2本いじょうの路線が あつまる駅が、のりかえ駅だよ',
    reward: 10_000,
    unit: 'count',
    progress: (snapshot) => [Math.min(snapshot.totalTransferDelivered, 10), 10],
  },
  {
    chapter: 3,
    emoji: '🎊',
    from: '町の おまつり係',
    title: '100人を えがおに しよう',
    hint: '長い電車・速い電車・電車の追加を じょうずに つかおう',
    reward: 12_000,
    unit: 'count',
    progress: (snapshot) => [Math.min(snapshot.totalDelivered, 100), 100],
  },
  {
    chapter: 3,
    emoji: '🌟',
    from: 'ぜんぶの町の みんな',
    title: 'ぜんぶの町を レベル3に しよう',
    hint: 'この先も町は レベル6まで そだつよ！',
    reward: 20_000,
    unit: 'count',
    chapterEnd: true,
    progress: (snapshot) => [
      Math.min(townsAtLevel(snapshot, 3), snapshot.towns.length),
      snapshot.towns.length,
    ],
  },
];

export function chapterForMissionIndex(index: number): number {
  return MISSIONS[Math.min(index, MISSIONS.length - 1)]?.chapter ?? 3;
}

export function endlessDeliveryTarget(challengeLevel: number): number {
  return 100 + Math.max(0, challengeLevel) * 50;
}

export function endlessChallengeReward(challengeLevel: number): number {
  return 5_000 + Math.max(1, challengeLevel) * 1_000;
}
