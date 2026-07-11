// ============================================================================
// 状態管理 (Zustand)
//  - 金額・路線・列車定義・線路・選択・建設モード・時計など「離散的」な状態を保持
//  - 列車の連続的な位置は sim(simInstance) 側
// ============================================================================
import { create } from 'zustand';
import {
  START_MONEY,
  TRACK_COST,
  TRACK_REFUND,
  TRAIN_COST,
  LINE_COLORS,
} from '../data/config';
import { TOWNS, TOWNS_BY_ID, TOWN_BY_NODE, generateTerrain } from '../data/world';
import { key, edgeKey, manhattanPath, neighbors4 } from '../utils/grid';
import { bfsPath } from '../sim/pathfinding';
import { sim } from '../sim/simInstance';
import { addTrainRuntime, removeTrainsOfLine } from '../sim/simulation';
import type {
  BuildMode,
  Line,
  NodeKey,
  Selection,
  TerrainKind,
  Town,
  TrainDef,
} from '../types/game';

export interface GameState {
  // 静的
  towns: Town[];
  terrain: Map<NodeKey, TerrainKind>;
  // 経済
  money: number;
  totalDelivered: number;
  totalRevenue: number;
  clock: number; // ゲーム内秒
  // 建設物
  trackEdges: Set<string>;
  lines: Line[];
  trainDefs: TrainDef[];
  // UI/操作
  buildMode: BuildMode;
  anchorNode: NodeKey | null;
  hoverNode: NodeKey | null;
  lineAnchorTown: string | null;
  selection: Selection;
  speed: number;
  toast: { msg: string; id: number } | null;
  revision: number; // ライブ表示更新用
  // 連番
  lineSeq: number;
  trainSeq: number;
  toastSeq: number;

  // アクション
  setBuildMode: (m: BuildMode) => void;
  setHover: (k: NodeKey | null) => void;
  tileClick: (node: NodeKey) => void;
  townClick: (id: string) => void;
  trainClick: (id: string) => void;
  clearSelection: () => void;
  select: (sel: Selection) => void;
  buildTrackPath: (a: NodeKey, b: NodeKey) => void;
  demolishNode: (node: NodeKey) => void;
  createLine: (aTownId: string, bTownId: string) => void;
  buyTrain: (lineId: string) => void;
  deleteLine: (lineId: string) => void;
  deliver: (fare: number) => void;
  commitTick: (dtGame: number) => void;
  setSpeed: (s: number) => void;
  pushToast: (msg: string) => void;
  clearToast: () => void;
  reset: () => void;
}

function initialState() {
  return {
    towns: TOWNS,
    terrain: generateTerrain(),
    money: START_MONEY,
    totalDelivered: 0,
    totalRevenue: 0,
    clock: 0,
    trackEdges: new Set<string>(),
    lines: [] as Line[],
    trainDefs: [] as TrainDef[],
    buildMode: 'inspect' as BuildMode,
    anchorNode: null as NodeKey | null,
    hoverNode: null as NodeKey | null,
    lineAnchorTown: null as string | null,
    selection: null as Selection,
    speed: 1,
    toast: null as { msg: string; id: number } | null,
    revision: 0,
    lineSeq: 0,
    trainSeq: 0,
    toastSeq: 0,
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState(),

  setBuildMode: (m) => set({ buildMode: m, anchorNode: null, lineAnchorTown: null }),
  setHover: (k) => set({ hoverNode: k }),

  tileClick: (node) => {
    const { buildMode, anchorNode } = get();
    if (buildMode === 'track') {
      if (!anchorNode) set({ anchorNode: node });
      else {
        get().buildTrackPath(anchorNode, node);
        set({ anchorNode: node });
      }
    } else if (buildMode === 'demolish') {
      get().demolishNode(node);
    }
  },

  townClick: (id) => {
    const { buildMode, lineAnchorTown } = get();
    if (buildMode === 'line') {
      if (!lineAnchorTown) set({ lineAnchorTown: id });
      else if (lineAnchorTown === id) set({ lineAnchorTown: null });
      else {
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
    const { trackEdges, money } = get();
    const path = manhattanPath(a, b);
    const newEdges: string[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const ek = edgeKey(path[i], path[i + 1]);
      if (!trackEdges.has(ek)) newEdges.push(ek);
    }
    if (newEdges.length === 0) return;
    const cost = newEdges.length * TRACK_COST;
    if (money < cost) {
      get().pushToast('資金が足りません');
      return;
    }
    const next = new Set(trackEdges);
    for (const e of newEdges) next.add(e);
    set({ trackEdges: next, money: money - cost });
  },

  demolishNode: (node) => {
    const { trackEdges, money, lines, trainDefs } = get();
    const toRemove: string[] = [];
    for (const nb of neighbors4(node)) {
      const ek = edgeKey(node, nb);
      if (trackEdges.has(ek)) toRemove.push(ek);
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
    const refund = Math.round(toRemove.length * TRACK_COST * TRACK_REFUND);
    set({
      trackEdges: next,
      money: money + refund,
      lines: nextLines,
      trainDefs: nextTrainDefs,
      selection: null,
    });
    if (broken.length) get().pushToast(`${broken.length}路線を撤去しました`);
  },

  createLine: (aTownId, bTownId) => {
    const a = TOWNS_BY_ID.get(aTownId);
    const b = TOWNS_BY_ID.get(bTownId);
    if (!a || !b || a.id === b.id) return;
    const { trackEdges, lines, lineSeq } = get();
    const path = bfsPath(trackEdges, key(a.x, a.z), key(b.x, b.z));
    if (!path) {
      get().pushToast('2駅が線路でつながっていません');
      return;
    }
    const stations = path.filter((n) => TOWN_BY_NODE.has(n)).map((n) => TOWN_BY_NODE.get(n)!.id);
    const seq = lineSeq + 1;
    const id = `ln${seq}`;
    const color = LINE_COLORS[(seq - 1) % LINE_COLORS.length];
    const line: Line = { id, name: `路線${seq}`, color, pathNodes: path, stations };
    set({ lines: [...lines, line], lineSeq: seq, selection: { type: 'line', id } });
    get().buyTrain(id);
  },

  buyTrain: (lineId) => {
    const { money, lines, trainDefs, trainSeq } = get();
    const line = lines.find((l) => l.id === lineId);
    if (!line) return;
    if (money < TRAIN_COST) {
      get().pushToast('列車を買う資金が足りません');
      return;
    }
    const seq = trainSeq + 1;
    const id = `tr${seq}`;
    const atStart = trainDefs.filter((td) => td.lineId === lineId).length % 2 === 0;
    addTrainRuntime(sim, id, lineId, line.pathNodes, line.stations, line.color, atStart);
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

  deliver: (fare) =>
    set((s) => ({
      money: s.money + fare,
      totalDelivered: s.totalDelivered + 1,
      totalRevenue: s.totalRevenue + fare,
    })),

  commitTick: (dtGame) => set((s) => ({ clock: s.clock + dtGame, revision: s.revision + 1 })),
  setSpeed: (s) => set({ speed: s }),

  pushToast: (msg) => set((s) => ({ toast: { msg, id: s.toastSeq + 1 }, toastSeq: s.toastSeq + 1 })),
  clearToast: () => set({ toast: null }),

  reset: () => {
    sim.trains.clear();
    for (const t of TOWNS) sim.waiting.set(t.id, []);
    sim.spawnAcc = 0;
    sim.pseq = 0;
    set({ ...initialState() });
  },
}));
