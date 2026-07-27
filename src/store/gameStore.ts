// ============================================================================
// ゲーム全体の状態
// 町づくり・ちょきん・保存までを、1つの予測しやすい状態として管理する。
// ============================================================================
import { create } from 'zustand';
import { START_MONEY, TRACK_REFUND, TRAIN_COST, LINE_COLORS } from '../data/config';
import { TOWNS, TOWNS_BY_ID, TOWN_BY_NODE, generateTerrain } from '../data/world';
import { MISSIONS } from '../data/missions';
import {
  SAVINGS_GOALS,
  townLevelFor,
  type TownProgress,
} from '../data/progression';
import { key, edgeKey, manhattanPath, neighbors4 } from '../utils/grid';
import { bfsPath } from '../sim/pathfinding';
import { trackEdgeCost } from '../sim/economy';
import { sim } from '../sim/simInstance';
import { addTrainRuntime, removeTrainsOfLine } from '../sim/simulation';
import { play, isMuted, setMuted } from '../utils/sound';
import type {
  BuildMode,
  Line,
  NodeKey,
  Selection,
  TerrainKind,
  ToastKind,
  Town,
  TrainDef,
} from '../types/game';

export interface GameState {
  towns: Town[];
  terrain: Map<NodeKey, TerrainKind>;

  money: number;
  bestMoney: number;
  totalDelivered: number;
  totalRevenue: number;
  lastIncome: { amount: number; id: number } | null;
  clock: number;
  townProgress: Record<string, TownProgress>;
  savingsGoalIndex: number;

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
  deleteLine: (lineId: string) => void;
  deliver: (fare: number, townId: string) => void;
  completeMission: (index: number) => void;
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
  money: number;
  bestMoney: number;
  totalDelivered: number;
  totalRevenue: number;
  clock: number;
  trackEdges: string[];
  lines: Line[];
  trainDefs: TrainDef[];
  townProgress: Record<string, TownProgress>;
  savingsGoalIndex: number;
  missionIndex: number;
  lineSeq: number;
  trainSeq: number;
}

function emptyTownProgress(): Record<string, TownProgress> {
  return Object.fromEntries(TOWNS.map((town) => [town.id, { delivered: 0, level: 1 }]));
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
      money: parsed.money,
      bestMoney: parsed.bestMoney ?? parsed.money,
      totalDelivered: parsed.totalDelivered ?? 0,
      totalRevenue: parsed.totalRevenue ?? 0,
      clock: parsed.clock ?? 0,
      trackEdges: parsed.trackEdges,
      lines: parsed.lines,
      trainDefs: parsed.trainDefs,
      townProgress: { ...emptyTownProgress(), ...(parsed.townProgress ?? {}) },
      savingsGoalIndex: Math.min(parsed.savingsGoalIndex ?? 0, SAVINGS_GOALS.length),
      missionIndex: Math.min(parsed.missionIndex ?? 0, MISSIONS.length),
      lineSeq: parsed.lineSeq ?? parsed.lines.length,
      trainSeq: parsed.trainSeq ?? parsed.trainDefs.length,
    };
  } catch {
    return null;
  }
}

function makeInitialState(loadSave = true) {
  const saved = loadSave ? loadSavedGame() : null;
  return {
    towns: TOWNS,
    terrain: generateTerrain(),
    money: saved?.money ?? START_MONEY,
    bestMoney: saved?.bestMoney ?? START_MONEY,
    totalDelivered: saved?.totalDelivered ?? 0,
    totalRevenue: saved?.totalRevenue ?? 0,
    lastIncome: null as { amount: number; id: number } | null,
    clock: saved?.clock ?? 0,
    townProgress: saved?.townProgress ?? emptyTownProgress(),
    savingsGoalIndex: saved?.savingsGoalIndex ?? 0,
    trackEdges: new Set<string>(saved?.trackEdges ?? []),
    lines: saved?.lines ?? ([] as Line[]),
    trainDefs: saved?.trainDefs ?? ([] as TrainDef[]),
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
    gameCleared: false,
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
      .filter((node) => TOWN_BY_NODE.has(node))
      .map((node) => TOWN_BY_NODE.get(node)!.id);
    const line: Line = {
      id: lineId,
      name: `${start.name}・${end.name}せん`,
      color,
      pathNodes: path,
      stations,
    };

    addTrainRuntime(sim, trainId, lineId, path, stations, color, true);
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
    });
    get().pushToast(`「${line.name}」が しゅっぱつ！`, 'good');
  },

  cancelEasyRoute: () => {
    play('click');
    set({ routeStartTown: null, routeEndTown: null });
  },

  createLine: (aTownId, bTownId) => {
    const a = TOWNS_BY_ID.get(aTownId);
    const b = TOWNS_BY_ID.get(bTownId);
    if (!a || !b || a.id === b.id) return;
    const { trackEdges, lines, lineSeq, money } = get();
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
    const stations = path.filter((n) => TOWN_BY_NODE.has(n)).map((n) => TOWN_BY_NODE.get(n)!.id);
    const seq = lineSeq + 1;
    const id = `ln${seq}`;
    const color = LINE_COLORS[(seq - 1) % LINE_COLORS.length];
    const line: Line = {
      id,
      name: `${a.name}・${b.name}せん`,
      color,
      pathNodes: path,
      stations,
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
    addTrainRuntime(sim, id, lineId, line.pathNodes, line.stations, line.color, atStart);
    play('whistle');
    set({
      trainDefs: [...trainDefs, { id, lineId, color: line.color }],
      money: money - TRAIN_COST,
      trainSeq: seq,
    });
  },

  deleteLine: (lineId) => {
    const { lines, trainDefs, selection } = get();
    removeTrainsOfLine(sim, lineId);
    set({
      lines: lines.filter((l) => l.id !== lineId),
      trainDefs: trainDefs.filter((td) => td.lineId !== lineId),
      selection: selection && selection.type === 'line' && selection.id === lineId ? null : selection,
    });
  },

  deliver: (fare, townId) => {
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
      totalRevenue: s.totalRevenue + fare,
      lastIncome: { amount: fare, id: s.totalDelivered + 1 },
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
    }
  },

  completeMission: (index) => {
    const s = get();
    if (s.missionIndex !== index || index >= MISSIONS.length) return;
    const mission = MISSIONS[index];
    const [cur, max] = mission.progress({
      money: s.money,
      totalDelivered: s.totalDelivered,
      trackEdges: s.trackEdges,
      lines: s.lines,
      trainDefs: s.trainDefs,
      towns: s.towns,
    });
    if (cur < max) return;

    const savings = savingsAfter(s.money + mission.reward, s.savingsGoalIndex);
    const isLast = index === MISSIONS.length - 1;
    play('fanfare');
    set({
      missionIndex: index + 1,
      money: savings.money,
      bestMoney: Math.max(s.bestMoney, savings.money),
      savingsGoalIndex: savings.index,
      gameCleared: isLast || s.gameCleared,
    });
    if (!isLast) {
      get().pushToast(
        mission.reward > 0
          ? `⭐ ミッションクリア！ +${mission.reward.toLocaleString()}円`
          : '⭐ ミッションクリア！',
        'good',
      );
    }
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
  );
  restoredPerLine.set(line.id, count + 1);
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
useGameStore.subscribe((state) => {
  if (typeof window === 'undefined') return;
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    const saved: SavedGame = {
      money: state.money,
      bestMoney: state.bestMoney,
      totalDelivered: state.totalDelivered,
      totalRevenue: state.totalRevenue,
      clock: state.clock,
      trackEdges: [...state.trackEdges],
      lines: state.lines,
      trainDefs: state.trainDefs,
      townProgress: state.townProgress,
      savingsGoalIndex: state.savingsGoalIndex,
      missionIndex: state.missionIndex,
      lineSeq: state.lineSeq,
      trainSeq: state.trainSeq,
    };
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
    } catch {
      // プライベートモード等で保存できなくても、ゲームはそのまま続けられる。
    }
    saveTimer = undefined;
  }, 500);
});
