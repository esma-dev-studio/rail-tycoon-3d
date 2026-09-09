// ============================================================================
// 町の成長・ちょきん・バッジ
// 小学2年生が「あと少し」を見て、自分で次の目標を決められる小さな進行表。
// ============================================================================

export interface TownProgress {
  delivered: number;
  level: number;
}

export const MAX_TOWN_LEVEL = 6;

/** そのレベルになるために、町へはこぶ人数 */
export const TOWN_LEVEL_REQUIREMENTS = [0, 4, 12, 25, 45, 70] as const;

export function townLevelFor(delivered: number): number {
  let level = 1;
  for (let i = 1; i < TOWN_LEVEL_REQUIREMENTS.length; i++) {
    if (delivered >= TOWN_LEVEL_REQUIREMENTS[i]) level = i + 1;
  }
  return level;
}

export function nextTownLevelRequirement(level: number): number | null {
  return level >= MAX_TOWN_LEVEL ? null : TOWN_LEVEL_REQUIREMENTS[level];
}

export const SAVINGS_GOALS = [
  {
    amount: 15_000,
    reward: 1_500,
    emoji: '🎈',
    name: 'えきの かざり',
  },
  {
    amount: 25_000,
    reward: 3_000,
    emoji: '🌈',
    name: 'にじいろ ホーム',
  },
  {
    amount: 40_000,
    reward: 5_000,
    emoji: '👑',
    name: 'きんの えき',
  },
] as const;

export interface BadgeDefinition {
  id: string;
  emoji: string;
  name: string;
  hint: string;
}

export const BADGES: BadgeDefinition[] = [
  { id: 'first-track', emoji: '🛤️', name: 'せんろ はかせ', hint: 'はじめて せんろを つくる' },
  { id: 'first-line', emoji: '🚆', name: 'しゅっぱつ！', hint: 'はじめて 電車を はしらせる' },
  { id: 'ten-riders', emoji: '🙂', name: 'にこにこ えき', hint: '10人 はこぶ' },
  { id: 'growing-town', emoji: '🏙️', name: '町を そだてた', hint: '町を レベル2に する' },
  { id: 'saver', emoji: '🐷', name: 'ちょきん めいじん', hint: '15,000円 ためる' },
  { id: 'all-towns', emoji: '🗺️', name: '5つの 町', hint: 'ぜんぶの 町に 電車を とどける' },
];
