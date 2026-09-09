import type { Town } from '../types/game';

export interface TownProject {
  id: string;
  townId: string;
  name: string;
  description: string;
  cost: number;
  visitors: number;
  reward: number;
  kind: 'park' | 'library' | 'market' | 'music' | 'aquarium' | 'camp' | 'airport' | 'lighthouse';
  color: string;
}
export interface ProjectProgress { startedAt: number; completed: boolean }
export type Projects = Record<string, ProjectProgress>;

export const TOURIST_TOWNS: (Town & { requires: number; teaser: string })[] = [
  { id: 't_forest', name: 'こもれびの森', x: 1, z: 8, size: 2, color: '#669174', requires: 1, teaser: '木かげで キャンプ' },
  { id: 't_airport', name: 'そらいろ空港', x: 7, z: 1, size: 3, color: '#699bb9', requires: 3, teaser: 'ひこうきを 見にいこう' },
  { id: 't_coast', name: 'しおかぜ海岸', x: 14, z: 8, size: 2, color: '#d79b62', requires: 5, teaser: '海と とうだいの町' },
];

export const TOWN_PROJECTS: TownProject[] = [
  { id: 'p_park', townId: 't_midori', name: 'にじいろ公園', description: 'みんなで あそべる 大きな公園。', cost: 2000, visitors: 8, reward: 3500, kind: 'park', color: '#73a77b' },
  { id: 'p_library', townId: 't_aoba', name: 'えほんの図書館', description: 'すきなお話に 出会える ばしょ。', cost: 3000, visitors: 10, reward: 4500, kind: 'library', color: '#679bc0' },
  { id: 'p_market', townId: 't_chuo', name: 'おひさま市場', description: 'やさいと パンが あつまる広場。', cost: 3500, visitors: 12, reward: 5000, kind: 'market', color: '#d8a04b' },
  { id: 'p_music', townId: 't_hibari', name: 'おんがくホール', description: 'すてきな音が ひびく町に。', cost: 4000, visitors: 12, reward: 5500, kind: 'music', color: '#b08ab2' },
  { id: 'p_aquarium', townId: 't_minato', name: '青い水族館', description: 'おさかなに 会いにいこう。', cost: 4500, visitors: 14, reward: 6500, kind: 'aquarium', color: '#5caaac' },
  { id: 'p_camp', townId: 't_forest', name: '星ぞらキャンプ', description: '電車で いける 森のぼうけん。', cost: 4000, visitors: 12, reward: 6000, kind: 'camp', color: '#709675' },
  { id: 'p_airport', townId: 't_airport', name: 'そらのデッキ', description: 'ひこうきが よく見える テラス。', cost: 6500, visitors: 16, reward: 9000, kind: 'airport', color: '#729fb4' },
  { id: 'p_lighthouse', townId: 't_coast', name: 'しおかぜ灯台', description: '海のむこうまで 光をとどけよう。', cost: 8000, visitors: 20, reward: 11000, kind: 'lighthouse', color: '#d59c70' },
];

export function completedProjectCount(projects: Projects): number {
  return TOWN_PROJECTS.filter((p) => projects[p.id]?.completed).length;
}
export function availableTouristTowns(projects: Projects): Town[] {
  return TOURIST_TOWNS.filter((t) => completedProjectCount(projects) >= t.requires);
}
export function projectVisitors(project: TownProject, progress: ProjectProgress | undefined, delivered: number): number {
  return progress ? Math.min(project.visitors, Math.max(0, delivered - progress.startedAt)) : 0;
}
export function sanitizeProjects(value: unknown): Projects {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(TOWN_PROJECTS.flatMap((p) => {
    const entry = (value as Projects)[p.id];
    return entry && Number.isFinite(entry.startedAt) && entry.startedAt >= 0
      ? [[p.id, { startedAt: Math.floor(entry.startedAt), completed: entry.completed === true }]] : [];
  }));
}
// 工事中の町へ行く人が増える。完成した施設も、観光客を呼び続ける。
export function townAttraction(townId: string, projects: Projects): number {
  const project = TOWN_PROJECTS.find((p) => p.townId === townId);
  const progress = project && projects[project.id];
  return progress ? progress.completed ? 2 : 4 : 1;
}

export const READINGS: Record<string, string> = {
  '森': 'もり', '空港': 'くうこう', '海岸': 'かいがん', '公園': 'こうえん',
  '図書館': 'としょかん', '市場': 'いちば', '水族館': 'すいぞくかん', '灯台': 'とうだい',
  '手帳': 'てちょう', '路線': 'ろせん', '研究所': 'けんきゅうじょ', '追加': 'ついか',
};
