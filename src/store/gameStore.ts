// ============================================================================
// ゲーム全体の状態
// 町づくり・ちょきん・保存までを、1つの予測しやすい状態として管理する。
// ============================================================================
import { create } from 'zustand';
import { START_MONEY, TRACK_REFUND, TRAIN_COST, LINE_COLORS } from '../data/config';
import { ALL_TOWNS, TOWNS, TOWNS_BY_ID, TOWN_BY_NODE, generateTerrain } from '../data/world';
import { availableTouristTowns, projectVisitors, sanitizeProjects, TOWN_PROJECTS, type Projects } from '../data/development';
import {
  MISSIONS,
  endlessChallengeReward,
  endlessDeliveryTarget,
} from '../data/missions';
import {
  SAVINGS_GOALS,
  townLevelFor,
  type TownProgress,
} from '../data/progression';
import { DECORATIONS_BY_ID } from '../data/decorations';
import {
  capacityUpgradeCost,
  lineCapacity,
  lineCapacityLevel,
  lineSpeed,
  lineSpeedLevel,
  speedUpgradeCost,
} from '../data/lineUpgrades';
import { key, edgeKey, manhattanPath, neighbors4 } from '../utils/grid';
import { bfsPath } from '../sim/pathfinding';
import { trackEdgeCost } from '../sim/economy';
import { sim } from '../sim/simInstance';
import {
  addTrainRuntime,
  applyLineRuntimeStats,
  primeFirstRoundTrip,
  pruneUnreachablePassengers,
  removeTrainsOfLine,
} from '../sim/simulation';
import { play, isMuted, setMuted } from '../utils/sound';
import { findTownRoute } from '../sim/network';
import { MAX_WAITING } from '../data/config';
import type {
  BuildMode,
  Line,
  NodeKey,
  Passenger,
  Selection,
  TerrainKind,
  ToastKind,
  Town,
  TrainDef,
} from '../types/game';

export interface Celebration {
  id: number;
  eyebrow: string;
  title: string;
  message: string;
  emoji: string;
  color: string;
}

export interface GameState {
  towns: Town[];
  terrain: Map<NodeKey, TerrainKind>;

  money: number;
  bestMoney: number;
  totalDelivered: number;
  totalTransferDelivered: number;
  totalRevenue: number;
  lastIncome: { amount: number; id: number } | null;
  lastArrival: { townId: string; count: number; fare: number; id: number; at: number } | null;
  clock: number;
  townProgress: Record<string, TownProgress>;
  projects: Projects;
  cameraReset: number;
  saveError: boolean;
  tourNumber: number;
  tourStartedAt: number;
  savingsGoalIndex: number;

  ownedDecorations: string[];
  celebration: Celebration | null;
  trackEdges: Set<string>;
  lines: Line[];
  trainDefs: TrainDef[];

  buildMode: BuildMode;
  anchorNode: NodeKey | null;
  hoverNode: NodeKey | null;
  lineAnchorTown: string | null;
  routeStartTown: string | null;
  routeEndTown: string | null;
  selection: Selection;
  speed: number;
  muted: boolean;
  toast: { msg: string; kind: ToastKind; id: number } | null;
  revision: number;

  missionIndex: number;
  endlessChallengeLevel: number;
  gameCleared: boolean;
  lineSeq: number;
  trainSeq: number;
  toastSeq: number;

  setBuildMode: (m: BuildMode) => void;
  setHover: (k: NodeKey | null) => void;
  tileClick: (node: NodeKey) => void;
  townClick: (id: string) => void;
  trainClick: (id: string) => void;
  clearSelection: () => void;
  select: (sel: Selection) => void;
  buildTrackPath: (a: NodeKey, b: NodeKey) => void;
  demolishNode: (node: NodeKey) => void;
  confirmEasyRoute: () => void;
  cancelEasyRoute: () => void;
  createLine: (aTownId: string, bTownId: string) => void;
  buyTrain: (lineId: string) => void;
  upgradeLineCapacity: (lineId: string) => void;
  upgradeLineSpeed: (lineId: string) => void;
  buyDecoration: (id: string) => void;
  startProject: (id: string) => void;
  completeProject: (id: string) => void;
  claimTour: () => void;
  resetCamera: () => void;
  claimStarterGrant: () => void;
  inviteVisitors: (townId: string) => void;
  dismissCelebration: () => void;
  deleteLine: (lineId: string) => void;
  deliver: (fare: number, townId: string, passenger?: Passenger) => void;
  completeMission: (index: number) => void;
  completeEndlessChallenge: (level: number) => void;
  dismissClear: () => void;
  commitTick: (dtGame: number) => void;
  setSpeed: (s: number) => void;
  toggleMute: () => void;
  pushToast: (msg: string, kind?: ToastKind) => void;
  clearToast: () => void;
  reset: () => void;
}

const SAVE_KEY = 'rail-tycoon-3d-save-v2';

interface SavedGame {
  projects?: Projects;
  tourNumber?: number;
  tourStartedAt?: number;
  gameCleared?: boolean;
  adventureVersion?: number;
  money: number;
  bestMoney: number;
  totalDelivered: number;
  totalTransferDelivered?: number;
  totalRevenue: number;
  endlessChallengeLevel?: number;
  clock: number;
  trackEdges: string[];
  lines: Line[];
  trainDefs: TrainDef[];
  townProgress: Record<string, TownProgress>;
  savingsGoalIndex: number;
  missionIndex: number;
  lineSeq: number;
  trainSeq: number;
  ownedDecorations: string[];
}

function emptyTownProgress(): Record<string, TownProgress> {
  return Object.fromEntries(ALL_TOWNS.map((town) => [town.id, { delivered: 0, level: 1 }]));
}

function loadSavedGame(): SavedGame | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedGame>;
    if (
      typeof parsed.money !== 'number' ||
      !Array.isArray(parsed.trackEdges) ||
      !Array.isArray(parsed.lines) ||
      !Array.isArray(parsed.trainDefs)
    ) {
      return null;
    }
    return {
      projects: sanitizeProjects(parsed.projects),
      tourNumber: Math.max(0, Math.floor(parsed.tourNumber ?? 0)),
      tourStartedAt: Math.max(0, parsed.tourStartedAt ?? 0),
      gameCleared: parsed.gameCleared === true,
      money: parsed.money,
      bestMoney: parsed.bestMoney ?? parsed.money,
      totalDelivered: parsed.totalDelivered ?? 0,
      totalTransferDelivered: parsed.totalTransferDelivered ?? 0,
      totalRevenue: parsed.totalRevenue ?? 0,
      endlessChallengeLevel: parsed.endlessChallengeLevel ?? 1,
      clock: parsed.clock ?? 0,
      trackEdges: parsed.trackEdges,
      lines: parsed.lines,
      trainDefs: parsed.trainDefs,
      townProgress: { ...emptyTownProgress(), ...(parsed.townProgress ?? {}) },
      savingsGoalIndex: Math.min(parsed.savingsGoalIndex ?? 0, SAVINGS_GOALS.length),
      missionIndex:
        (parsed.adventureVersion ?? 0) >= 5
          ? Math.min(parsed.missionIndex ?? 0, MISSIONS.length)
          : Math.min(parsed.missionIndex ?? 0, 3),
      lineSeq: parsed.lineSeq ?? parsed.lines.length,
      trainSeq: parsed.trainSeq ?? parsed.trainDefs.length,
      ownedDecorations: Array.isArray(parsed.ownedDecorations)
        ? parsed.ownedDecorations.filter((id) => DECORATIONS_BY_ID.has(id))
        : [],
    };
  } catch {
    return null;
  }
}

function makeInitialState(loadSave = true) {
  const saved = loadSave ? loadSavedGame() : null;
  return {
    towns: [...TOWNS, ...availableTouristTowns(saved?.projects ?? {})],
    projects: saved?.projects ?? {},
    tourNumber: saved?.tourNumber ?? 0,
    tourStartedAt: saved?.tourStartedAt ?? 0,
    cameraReset: 0,
    saveError: false,
    terrain: generateTerrain(),
    money: saved?.money ?? START_MONEY,
    bestMoney: saved?.bestMoney ?? START_MONEY,
    totalDelivered: saved?.totalDelivered ?? 0,
    totalTransferDelivered: saved?.totalTransferDelivered ?? 0,
    totalRevenue: saved?.totalRevenue ?? 0,
    lastIncome: null as { amount: number; id: number } | null,
    lastArrival: null as GameState['lastArrival'],
    clock: saved?.clock ?? 0,
    townProgress: saved?.townProgress ?? emptyTownProgress(),
    savingsGoalIndex: saved?.savingsGoalIndex ?? 0,
    trackEdges: new Set<string>(saved?.trackEdges ?? []),
    lines: saved?.lines ?? ([] as Line[]),
    trainDefs: saved?.trainDefs ?? ([] as TrainDef[]),
    ownedDecorations: saved?.ownedDecorations ?? [],
    celebration: null as Celebration | null,
    buildMode: 'inspect' as BuildMode,
    anchorNode: null as NodeKey | null,
    hoverNode: null as NodeKey | null,
    lineAnchorTown: null as string | null,
    routeStartTown: null as string | null,
    routeEndTown: null as string | null,
    selection: null as Selection,
    speed: 1,
    muted: isMuted(),
    toast: null as { msg: string; kind: ToastKind; id: number } | null,
    revision: 0,
    missionIndex: saved?.missionIndex ?? 0,
    endlessChallengeLevel: saved?.endlessChallengeLevel ?? 1,
    gameCleared: saved?.gameCleared ?? false,
    lineSeq: saved?.lineSeq ?? 0,
    trainSeq: saved?.trainSeq ?? 0,
    toastSeq: 0,
  };
}

function savingsAfter(balance: number, startIndex: number) {
  let money = balance;
  let index = startIndex;
  const unlocked: (typeof SAVINGS_GOALS)[number][] = [];
  while (index < SAVINGS_GOALS.length && money >= SAVINGS_GOALS[index].amount) {
    const goal = SAVINGS_GOALS[index];
    unlocked.push(goal);
    money += goal.reward;
    index++;
  }
  return { money, index, unlocked };
}

export const useGameStore = create<GameState>((set, get) => ({
  ...makeInitialState(),

  setBuildMode: (m) => {
    play('click');
    set({
      buildMode: m,
      anchorNode: null,
      lineAnchorTown: null,
      routeStartTown: null,
      routeEndTown: null,
      selection: null,
    });
  },
  setHover: (k) => set({ hoverNode: k }),

  tileClick: (node) => {
    const { buildMode, anchorNode } = get();
    if (buildMode === 'track') {
      if (!anchorNode) {
        set({ anchorNode: node });
        get().pushToast('ここから スタート！ つぎの ばしょを おしてね');
      } else {
        get().buildTrackPath(anchorNode, node);
        set({ anchorNode: node });
      }
    } else if (buildMode === 'demolish') {
      get().demolishNode(node);
    }
  },

  townClick: (id) => {
    if (!get().towns.some((town) => town.id === id)) return;
    const { buildMode, lineAnchorTown, routeStartTown } = get();
    if (buildMode === 'route') {
      if (!routeStartTown) {
        set({ routeStartTown: id, routeEndTown: null });
        get().pushToast('1つめの 町を えらんだよ。つなぎたい 町を もう1つ おしてね');
      } else if (routeStartTown === id) {
        set({ routeStartTown: null, routeEndTown: null });
        get().pushToast('町を えらびなおせるよ');
      } else {
        set({ routeEndTown: id });
        play('click');
      }
    } else if (buildMode === 'line') {
      if (!lineAnchorTown) {
        set({ lineAnchorTown: id });
        get().pushToast('しゅっぱつする 町を えらんだよ。もう1つ 町を おしてね');
      } else if (lineAnchorTown === id) {
        set({ lineAnchorTown: null });
      } else {
        get().createLine(lineAnchorTown, id);
        set({ lineAnchorTown: null });
      }
    } else {
      set({ selection: { type: 'town', id } });
    }
  },

  trainClick: (id) => set({ selection: { type: 'train', id } }),
  clearSelection: () => set({ selection: null }),
  select: (sel) => set({ selection: sel }),

  buildTrackPath: (a, b) => {
    const { trackEdges, money, terrain } = get();
    const path = manhattanPath(a, b);
    let cost = 0;
    const newEdges: string[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const ek = edgeKey(path[i], path[i + 1]);
      if (!trackEdges.has(ek)) {
        newEdges.push(ek);
        cost += trackEdgeCost(path[i], path[i + 1], terrain);
      }
    }
    if (newEdges.length === 0) return;
    if (money < cost) {
      play('error');
      get().pushToast(`💸 お金が たりないよ（${cost.toLocaleString()}円 かかるよ）`, 'bad');
      return;
    }
    const next = new Set(trackEdges);
    for (const e of newEdges) next.add(e);
    play('build');
    set({ trackEdges: next, money: money - cost });
    get().pushToast(`🛤️ せんろが ${newEdges.length}マス のびた！ −${cost.toLocaleString()}円`, 'good');
  },

  demolishNode: (node) => {
    const { trackEdges, money, lines, trainDefs, terrain } = get();
    const toRemove: string[] = [];
    let removedCost = 0;
    for (const nb of neighbors4(node)) {
      const ek = edgeKey(node, nb);
      if (trackEdges.has(ek)) {
        toRemove.push(ek);
        removedCost += trackEdgeCost(node, nb, terrain);
      }
    }
    if (toRemove.length === 0) return;
    const removed = new Set(toRemove);
    const next = new Set(trackEdges);
    for (const e of toRemove) next.delete(e);
    const broken = lines.filter((ln) => {
      for (let i = 0; i < ln.pathNodes.length - 1; i++) {
        if (removed.has(edgeKey(ln.pathNodes[i], ln.pathNodes[i + 1]))) return true;
      }
      return false;
    });
    for (const ln of broken) removeTrainsOfLine(sim, ln.id);
    const nextLines = lines.filter((ln) => !broken.includes(ln));
    pruneUnreachablePassengers(sim, nextLines);
    const nextTrainDefs = trainDefs.filter((td) => nextLines.some((l) => l.id === td.lineId));
    const refund = Math.round(removedCost * TRACK_REFUND);
    play('demolish');
    set({
      trackEdges: next,
      money: money + refund,
      lines: nextLines,
      trainDefs: nextTrainDefs,
      selection: null,
    });
    get().pushToast(
      broken.length
        ? `🧹 せんろを かたづけたよ。ろせんも おしまい（+${refund.toLocaleString()}円）`
        : `🧹 せんろを かたづけたよ（+${refund.toLocaleString()}円）`,
    );
  },

  confirmEasyRoute: () => {
    const state = get();
    const start = state.routeStartTown ? TOWNS_BY_ID.get(state.routeStartTown) : null;
    const end = state.routeEndTown ? TOWNS_BY_ID.get(state.routeEndTown) : null;
    if (!start || !end || start.id === end.id) return;
    if (![start, end].every((town) => state.towns.some((t) => t.id === town.id))) return;
    if (state.lines.some((line) => line.stations.includes(start.id) && line.stations.includes(end.id))) {
      get().pushToast('この2つの町には もう電車があるよ。「電車」で ふやせるよ');
      return;
    }

    const path = manhattanPath(key(start.x, start.z), key(end.x, end.z));
    const newEdges: string[] = [];
    let trackCost = 0;
    for (let index = 0; index < path.length - 1; index++) {
      const edge = edgeKey(path[index], path[index + 1]);
      if (!state.trackEdges.has(edge)) {
        newEdges.push(edge);
        trackCost += trackEdgeCost(path[index], path[index + 1], state.terrain);
      }
    }
    const totalCost = trackCost + TRAIN_COST;
    if (state.money < totalCost) {
      play('error');
      get().pushToast(
        `あと ${(totalCost - state.money).toLocaleString()}円 ためると つくれるよ`,
        'bad',
      );
      return;
    }

    const nextEdges = new Set(state.trackEdges);
    for (const edge of newEdges) nextEdges.add(edge);
    const lineNumber = state.lineSeq + 1;
    const trainNumber = state.trainSeq + 1;
    const lineId = `ln${lineNumber}`;
    const trainId = `tr${trainNumber}`;
    const color = LINE_COLORS[(lineNumber - 1) % LINE_COLORS.length];
    const stations = path
      .filter((node) => state.towns.some((town) => key(town.x, town.z) === node))
      .map((node) => TOWN_BY_NODE.get(node)!.id);
    const line: Line = {
      id: lineId,
      name: `${start.name} ↔ ${end.name}`,
      color,
      pathNodes: path,
      stations,
      capacityLevel: 1,
      speedLevel: 1,
    };

    addTrainRuntime(
      sim,
      trainId,
      lineId,
      path,
      stations,
      color,
      true,
      lineCapacity(line),
      lineSpeed(line),
    );
    primeFirstRoundTrip(sim, trainId, start.id, end.id);
    play('whistle');
    set({
      trackEdges: nextEdges,
      lines: [...state.lines, line],
      trainDefs: [...state.trainDefs, { id: trainId, lineId, color }],
      money: state.money - totalCost,
      lineSeq: lineNumber,
      trainSeq: trainNumber,
      buildMode: 'inspect',
      routeStartTown: null,
      routeEndTown: null,
      selection: { type: 'line', id: lineId },
      celebration: {
        id: Date.now(),
        eyebrow: 'せんろ かんせい！',
        title: line.name,
        message: `${start.name}と ${end.name}を いったり きたり！ 帰りの おきゃくさんも まっているよ。`,
        emoji: '🚆',
        color,
      },
    });
    get().pushToast(`「${line.name}」が しゅっぱつ！`, 'good');
  },

  cancelEasyRoute: () => {
    play('click');
    set({ routeStartTown: null, routeEndTown: null });
  },

  startProject: (id) => {
    const s = get();
    const p = TOWN_PROJECTS.find((project) => project.id === id);
    if (!p || s.projects[id] || !s.towns.some((t) => t.id === p.townId)) return;
    if (!s.lines.some((l) => l.stations.includes(p.townId))) {
      s.pushToast('まず この町に せんろを つなごう', 'bad');
      return;
    }
    if (s.money < p.cost) { s.pushToast(`あと ${(p.cost - s.money).toLocaleString()}円 ためよう`, 'bad'); return; }
    play('build');
    set({ money: s.money - p.cost, projects: { ...s.projects, [id]: { startedAt: s.townProgress[p.townId]?.delivered ?? 0, completed: false } } });
    s.pushToast(`${p.name}を つくりはじめたよ！ 電車で ${p.visitors}人 とどけよう`, 'good');
  },
  inviteVisitors: (townId) => {
    const s = get();
    if (!s.towns.some((t) => t.id === townId)) return;
    const project = TOWN_PROJECTS.find((p) => p.townId === townId);
    if (!project || !s.projects[project.id]) return;
    const pending = [...sim.waiting.values()].flat().filter((p) => p.toTownId === townId).length
      + [...sim.trains.values()].flatMap((t) => t.load).filter((p) => p.toTownId === townId).length;
    const origins = s.towns.filter((t) => t.id !== townId && findTownRoute(s.lines, t.id, townId));
    let invited = 0;
    for (const origin of origins) {
      const queue = sim.waiting.get(origin.id) ?? [];
      while (invited < Math.max(0, 6 - pending) && queue.length < MAX_WAITING) {
        queue.push({ id: ++sim.pseq, fromTownId: origin.id, toTownId: townId, transfers: 0 });
        invited++;
      }
      sim.waiting.set(origin.id, queue);
    }
    set({ revision: s.revision + 1 });
    s.pushToast(invited ? `${invited}人が 駅に あつまった！ 電車で 来るよ` : 'おきゃくさんは 電車を まっているよ', 'good');
  },
  completeProject: (id) => {
    const s = get();
    const p = TOWN_PROJECTS.find((project) => project.id === id);
    if (!p || !s.projects[id] || s.projects[id].completed) return;
    if (projectVisitors(p, s.projects[id], s.townProgress[p.townId]?.delivered ?? 0) < p.visitors) return;
    const projects = { ...s.projects, [id]: { ...s.projects[id], completed: true } };
    const towns = [...TOWNS, ...availableTouristTowns(projects)];
    const newTown = towns.find((town) => !s.towns.some((old) => old.id === town.id));
    const savings = savingsAfter(s.money + p.reward, s.savingsGoalIndex);
    for (const town of towns) if (!sim.waiting.has(town.id)) sim.waiting.set(town.id, []);
    play('fanfare');
    set({ projects, towns, money: savings.money, bestMoney: Math.max(s.bestMoney, savings.money), savingsGoalIndex: savings.index,
      celebration: { id: Date.now(), eyebrow: '町の ゆめが かなった！', title: p.name, message: newTown ? `${newTown.name}が 地図に あらわれたよ！ せんろを のばして 会いにいこう。` : '町に あたらしい けしきが できたよ！ これからも おきゃくさんが あそびに来るよ。', emoji: '✦', color: p.color },
    });
  },
  claimTour: () => {
    const s = get();
    const town = ALL_TOWNS[s.tourNumber % ALL_TOWNS.length];
    if (s.missionIndex < MISSIONS.length || (s.townProgress[town.id]?.delivered ?? 0) - s.tourStartedAt < 12) return;
    const nextTown = ALL_TOWNS[(s.tourNumber + 1) % ALL_TOWNS.length];
    const savings = savingsAfter(s.money + 5000, s.savingsGoalIndex);
    set({ tourNumber: s.tourNumber + 1, tourStartedAt: s.townProgress[nextTown.id]?.delivered ?? 0, money: savings.money, bestMoney: Math.max(s.bestMoney, savings.money), savingsGoalIndex: savings.index });
    play('fanfare');
    s.pushToast('おでかけ便 たっせい！ +5,000円。つぎの町へ いこう', 'good');
  },
  resetCamera: () => set((s) => ({ cameraReset: s.cameraReset + 1 })),
  claimStarterGrant: () => {
    const s = get();
    if (s.lines.length || s.money >= 7000) return;
    set({ money: START_MONEY });
    s.pushToast('はじめの お金を とどけたよ！ 町を2つ つなごう', 'good');
  },

  buyDecoration: (id) => {
    const state = get();
    if (!state.lines.length) { state.pushToast('まず せんろを1本 つくろう。プレゼントは そのあと！'); return; }
    const item = DECORATIONS_BY_ID.get(id);
    if (!item || state.ownedDecorations.includes(id)) return;
    if (state.money < item.price) {
      play('error');
      get().pushToast(
        `あと ${(item.price - state.money).toLocaleString()}円で「${item.name}」を おけるよ`,
        'bad',
      );
      return;
    }
    const town = TOWNS_BY_ID.get(item.townId);
    play('fanfare');
    set({
      money: state.money - item.price,
      ownedDecorations: [...state.ownedDecorations, id],
      celebration: {
        id: Date.now(),
        eyebrow: '町へ プレゼント！',
        title: item.name,
        message: `${town?.name ?? '町'}に あたらしい かざりが できたよ。3Dの町を 見てみよう！`,
        emoji: item.emoji,
        color: item.color,
      },
    });
  },

  dismissCelebration: () => {
    play('click');
    set({ celebration: null });
  },
  createLine: (aTownId, bTownId) => {
    const a = TOWNS_BY_ID.get(aTownId);
    const b = TOWNS_BY_ID.get(bTownId);
    if (!a || !b || a.id === b.id) return;
    if (![a, b].every((town) => get().towns.some((t) => t.id === town.id))) return;

    const { trackEdges, lines, lineSeq, money } = get();
    if (lines.some((line) => line.stations.includes(aTownId) && line.stations.includes(bTownId))) return;
    const path = bfsPath(trackEdges, key(a.x, a.z), key(b.x, b.z));
    if (!path) {
      play('error');
      get().pushToast('🛤️ その 2つの 町は、まだ せんろで つながっていないよ', 'bad');
      return;
    }
    if (money < TRAIN_COST) {
      play('error');
      get().pushToast(`💸 電車には ${TRAIN_COST.toLocaleString()}円 ひつようだよ`, 'bad');
      return;
    }
    const stations = path.filter((n) => get().towns.some((town) => key(town.x, town.z) === n)).map((n) => TOWN_BY_NODE.get(n)!.id);
    const seq = lineSeq + 1;
    const id = `ln${seq}`;
    const color = LINE_COLORS[(seq - 1) % LINE_COLORS.length];
    const line: Line = {
      id,
      name: `${a.name} ↔ ${b.name}`,
      color,
      pathNodes: path,
      stations,
      capacityLevel: 1,
      speedLevel: 1,
    };
    set({ lines: [...lines, line], lineSeq: seq, selection: { type: 'line', id } });
    get().buyTrain(id);
    get().pushToast(`🚆 ${line.name}が しゅっぱつ！`, 'good');
  },

  buyTrain: (lineId) => {
    const { money, lines, trainDefs, trainSeq } = get();
    const line = lines.find((l) => l.id === lineId);
    if (!line) return;
    if (money < TRAIN_COST) {
      play('error');
      get().pushToast(`💸 お金が たりないよ（電車は ${TRAIN_COST.toLocaleString()}円）`, 'bad');
      return;
    }
    const seq = trainSeq + 1;
    const id = `tr${seq}`;
    const atStart = trainDefs.filter((td) => td.lineId === lineId).length % 2 === 0;
    addTrainRuntime(
      sim,
      id,
      lineId,
      line.pathNodes,
      line.stations,
      line.color,
      atStart,
      lineCapacity(line),
      lineSpeed(line),
    );
    play('whistle');
    set({
      trainDefs: [...trainDefs, { id, lineId, color: line.color }],
      money: money - TRAIN_COST,
      trainSeq: seq,
    });
  },

  upgradeLineCapacity: (lineId) => {
    const state = get();
    const line = state.lines.find((candidate) => candidate.id === lineId);
    if (!line) return;
    if (state.missionIndex < 6) {
      get().pushToast('🔒 第1しょうを クリアすると つかえるよ', 'info');
      return;
    }
    const cost = capacityUpgradeCost(line);
    if (cost == null) {
      get().pushToast('🌟 この路線は いちばん長い電車だよ', 'good');
      return;
    }
    if (state.money < cost) {
      play('error');
      get().pushToast(`あと ${(cost - state.money).toLocaleString()}円で 長い電車に できるよ`, 'bad');
      return;
    }
    const upgraded: Line = {
      ...line,
      capacityLevel: lineCapacityLevel(line) + 1,
    };
    applyLineRuntimeStats(sim, lineId, lineCapacity(upgraded), lineSpeed(upgraded));
    play('fanfare');
    set({
      lines: state.lines.map((candidate) => candidate.id === lineId ? upgraded : candidate),
      money: state.money - cost,
      celebration: {
        id: Date.now(),
        eyebrow: '電車が ながくなった！',
        title: `${line.name}・長さレベル${upgraded.capacityLevel}`,
        message: `1だいに ${lineCapacity(upgraded)}人まで のれるようになったよ。`,
        emoji: '🚃',
        color: line.color,
      },
    });
  },

  upgradeLineSpeed: (lineId) => {
    const state = get();
    const line = state.lines.find((candidate) => candidate.id === lineId);
    if (!line) return;
    if (state.missionIndex < 6) {
      get().pushToast('🔒 第1しょうを クリアすると つかえるよ', 'info');
      return;
    }
    const cost = speedUpgradeCost(line);
    if (cost == null) {
      get().pushToast('🌟 この路線は いちばん速い電車だよ', 'good');
      return;
    }
    if (state.money < cost) {
      play('error');
      get().pushToast(`あと ${(cost - state.money).toLocaleString()}円で 速く できるよ`, 'bad');
      return;
    }
    const upgraded: Line = {
      ...line,
      speedLevel: lineSpeedLevel(line) + 1,
    };
    applyLineRuntimeStats(sim, lineId, lineCapacity(upgraded), lineSpeed(upgraded));
    play('fanfare');
    set({
      lines: state.lines.map((candidate) => candidate.id === lineId ? upgraded : candidate),
      money: state.money - cost,
      celebration: {
        id: Date.now(),
        eyebrow: 'スピードアップ！',
        title: `${line.name}・速さレベル${upgraded.speedLevel}`,
        message: '駅へ はやく ついて、まっている人を どんどん はこべるよ。',
        emoji: '⚡',
        color: line.color,
      },
    });
  },

  deleteLine: (lineId) => {
    const { lines, trainDefs, selection } = get();
    removeTrainsOfLine(sim, lineId);
    const nextLines = lines.filter((line) => line.id !== lineId);
    pruneUnreachablePassengers(sim, nextLines);
    set({
      lines: nextLines,
      trainDefs: trainDefs.filter((td) => td.lineId !== lineId),
      selection: selection && selection.type === 'line' && selection.id === lineId ? null : selection,
    });
  },

  deliver: (fare, townId, passenger) => {
    const s = get();
    const previous = s.townProgress[townId] ?? { delivered: 0, level: 1 };
    const delivered = previous.delivered + 1;
    const level = townLevelFor(delivered);
    const progress = {
      ...s.townProgress,
      [townId]: { delivered, level },
    };
    const savings = savingsAfter(s.money + fare, s.savingsGoalIndex);
    const town = TOWNS_BY_ID.get(townId);
    const leveledUp = level > previous.level;

    play(leveledUp || savings.unlocked.length ? 'fanfare' : 'coin');
    set({
      money: savings.money,
      bestMoney: Math.max(s.bestMoney, savings.money),
      totalDelivered: s.totalDelivered + 1,
      totalTransferDelivered: s.totalTransferDelivered + (passenger && passenger.transfers > 0 ? 1 : 0),
      totalRevenue: s.totalRevenue + fare,
      lastIncome: { amount: fare, id: s.totalDelivered + 1 },
      lastArrival: { townId,
        count: s.lastArrival?.townId === townId && Date.now() - s.lastArrival.at < 350 ? s.lastArrival.count + 1 : 1,
        fare: s.lastArrival?.townId === townId && Date.now() - s.lastArrival.at < 350 ? s.lastArrival.fare + fare : fare,
        at: Date.now(), id: s.totalDelivered + 1 },
      townProgress: progress,
      savingsGoalIndex: savings.index,
    });

    if (savings.unlocked.length) {
      const goal = savings.unlocked[savings.unlocked.length - 1];
      get().pushToast(
        `${goal.emoji} ちょきん たっせい！「${goal.name}」と +${goal.reward.toLocaleString()}円`,
        'good',
      );
    } else if (leveledUp && town) {
      get().pushToast(`🏙️ ${town.name}が レベル${level}に なった！`, 'good');
    } else if (passenger && passenger.transfers > 0 && s.totalTransferDelivered === 0) {
      const origin = TOWNS_BY_ID.get(passenger.fromTownId);
      const destination = TOWNS_BY_ID.get(passenger.toTownId);
      get().pushToast(
        `🔁 のりかえ せいこう！ ${origin?.name ?? '町'}から ${destination?.name ?? '町'}へ とうちゃく`,
        'good',
      );
    }
  },

  completeMission: (index) => {
    const s = get();
    if (s.gameCleared || s.missionIndex !== index || index < 0 || index >= MISSIONS.length) return;
    const mission = MISSIONS[index];
    const [cur, max] = mission.progress({
      money: s.money,
      totalDelivered: s.totalDelivered,
      totalTransferDelivered: s.totalTransferDelivered,
      trackEdges: s.trackEdges,
      lines: s.lines,
      trainDefs: s.trainDefs,
      towns: TOWNS,
      townProgress: s.townProgress,
      ownedDecorations: s.ownedDecorations,
      projects: s.projects,
    });
    if (cur < max) return;

    const savings = savingsAfter(s.money + mission.reward, s.savingsGoalIndex);
    play('fanfare');
    set({
      missionIndex: index + 1,
      ...(index + 1 === MISSIONS.length ? { tourStartedAt: s.townProgress.t_midori?.delivered ?? 0, tourNumber: 0 } : {}),
      money: savings.money,
      bestMoney: Math.max(s.bestMoney, savings.money),
      savingsGoalIndex: savings.index,
      celebration: mission.chapterEnd ? null : s.celebration,
      gameCleared: Boolean(mission.chapterEnd),
    });
    if (!mission.chapterEnd) {
      get().pushToast(
        mission.reward > 0
          ? `⭐ ミッションクリア！ +${mission.reward.toLocaleString()}円`
          : '⭐ ミッションクリア！',
        'good',
      );
    }
  },

  completeEndlessChallenge: (level) => {
    const s = get();
    if (
      s.missionIndex < MISSIONS.length
      || s.endlessChallengeLevel !== level
      || s.totalDelivered < endlessDeliveryTarget(level)
    ) return;
    const reward = endlessChallengeReward(level);
    const savings = savingsAfter(s.money + reward, s.savingsGoalIndex);
    play('fanfare');
    set({
      endlessChallengeLevel: level + 1,
      money: savings.money,
      bestMoney: Math.max(s.bestMoney, savings.money),
      savingsGoalIndex: savings.index,
      celebration: {
        id: Date.now(),
        eyebrow: `ずっとチャレンジ ${level} クリア！`,
        title: `${endlessDeliveryTarget(level)}人を はこんだ！`,
        message: `ごほうび ${reward.toLocaleString()}円！ つぎは ${endlessDeliveryTarget(level + 1)}人を めざそう。`,
        emoji: '🏅',
        color: '#ffbd3d',
      },
    });
  },

  dismissClear: () => set({ gameCleared: false }),
  commitTick: (dtGame) => set((s) => ({ clock: s.clock + dtGame, revision: s.revision + 1 })),
  setSpeed: (s) => {
    play('click');
    set({ speed: s });
  },

  toggleMute: () => {
    const next = !get().muted;
    setMuted(next);
    if (!next) play('click');
    set({ muted: next });
  },

  pushToast: (msg, kind = 'info') =>
    set((s) => ({ toast: { msg, kind, id: s.toastSeq + 1 }, toastSeq: s.toastSeq + 1 })),
  clearToast: () => set({ toast: null }),

  reset: () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(SAVE_KEY);
    sim.trains.clear();
    sim.waiting.clear();
    for (const town of TOWNS) sim.waiting.set(town.id, []);
    sim.spawnAcc = 0;
    sim.pseq = 0;
    set({ ...makeInitialState(false) });
  },
}));

// 保存した電車は、ページを開いた時に駅から再スタートする。
const restored = useGameStore.getState();
const restoredPerLine = new Map<string, number>();
for (const train of restored.trainDefs) {
  const line = restored.lines.find((candidate) => candidate.id === train.lineId);
  if (!line || line.pathNodes.length < 2) continue;
  const count = restoredPerLine.get(line.id) ?? 0;
  addTrainRuntime(
    sim,
    train.id,
    line.id,
    line.pathNodes,
    line.stations,
    train.color,
    count % 2 === 0,
    lineCapacity(line),
    lineSpeed(line),
  );
  restoredPerLine.set(line.id, count + 1);
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
export function flushSave() {
    if (typeof window === 'undefined') return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = undefined;
    const state = useGameStore.getState();
    const saved: SavedGame = {
      adventureVersion: 7,
      projects: state.projects,
      tourNumber: state.tourNumber,
      tourStartedAt: state.tourStartedAt,
      gameCleared: state.gameCleared,
      money: state.money,
      bestMoney: state.bestMoney,
      totalDelivered: state.totalDelivered,
      totalTransferDelivered: state.totalTransferDelivered,
      totalRevenue: state.totalRevenue,
      endlessChallengeLevel: state.endlessChallengeLevel,
      clock: state.clock,
      trackEdges: [...state.trackEdges],
      lines: state.lines,
      trainDefs: state.trainDefs,
      townProgress: state.townProgress,
      ownedDecorations: state.ownedDecorations,
      savingsGoalIndex: state.savingsGoalIndex,
      missionIndex: state.missionIndex,
      lineSeq: state.lineSeq,
      trainSeq: state.trainSeq,
    };
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
      if (state.saveError) useGameStore.setState({ saveError: false });
    } catch {
      if (!state.saveError) useGameStore.setState({ saveError: true });
    }
}
useGameStore.subscribe(() => {
  if (typeof window === 'undefined' || saveTimer) return;
  saveTimer = setTimeout(flushSave, 500);
});
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushSave);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushSave(); });
}
