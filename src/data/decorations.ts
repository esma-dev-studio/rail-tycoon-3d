export type DecorationKind =
  | 'flowers'
  | 'clock'
  | 'fountain'
  | 'wheel'
  | 'rainbow'
  | 'tower';

export interface Decoration {
  id: string;
  name: string;
  hint: string;
  price: number;
  emoji: string;
  townId: string;
  kind: DecorationKind;
  color: string;
}

/**
 * お金を「ただ増える数字」で終わらせず、町の景色に変えるごほうび。
 * 安いものから順に、路線を1本作った直後でも1つ買える価格にする。
 */
export const DECORATIONS: Decoration[] = [
  {
    id: 'flower-garden',
    name: 'お花ばたけ',
    hint: 'みどり町が カラフルに！',
    price: 1200,
    emoji: '🌷',
    townId: 't_midori',
    kind: 'flowers',
    color: '#ff7baa',
  },
  {
    id: 'station-clock',
    name: '大きな とけい',
    hint: 'あおば町の まちあわせばしょ',
    price: 2200,
    emoji: '🕐',
    townId: 't_aoba',
    kind: 'clock',
    color: '#58b8ff',
  },
  {
    id: 'happy-fountain',
    name: 'きらきら ふんすい',
    hint: 'まんなか町に 水の ひろば',
    price: 3200,
    emoji: '⛲',
    townId: 't_chuo',
    kind: 'fountain',
    color: '#4fe2ff',
  },
  {
    id: 'mini-wheel',
    name: 'ミニ かんらんしゃ',
    hint: 'ひばり村が あそびの町に！',
    price: 4500,
    emoji: '🎡',
    townId: 't_hibari',
    kind: 'wheel',
    color: '#b58aff',
  },
  {
    id: 'rainbow-gate',
    name: 'にじいろ ゲート',
    hint: 'みなと町へ ようこそ！',
    price: 6000,
    emoji: '🌈',
    townId: 't_minato',
    kind: 'rainbow',
    color: '#ff9d42',
  },
  {
    id: 'star-tower',
    name: 'ほしぞら タワー',
    hint: 'ぜんぶの町から 見える シンボル',
    price: 8000,
    emoji: '🌟',
    townId: 't_chuo',
    kind: 'tower',
    color: '#ffd84a',
  },
];

export const DECORATIONS_BY_ID = new Map(DECORATIONS.map((item) => [item.id, item]));
