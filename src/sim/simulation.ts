// ============================================================================
// シミュレーション本体(フレームワーク非依存 → Nodeでも検証可能)
//  - 乗客の発生
//  - 列車の移動・駅での乗降
// 位置などの連続的な状態はここ(sim)に保持し、Reactの再描画から切り離す。
// ============================================================================
import {
  TRAIN_SPEED,
  DWELL_TIME,
  TRAIN_CAPACITY,
  SPAWN_INTERVAL,
  MAX_WAITING,
} from '../data/config';
import { TOWNS, TOWN_BY_NODE, TOWNS_BY_ID } from '../data/world';
import { nodeWorld } from '../utils/grid';
import { fareBetween } from './economy';
import type { NodeKey, Passenger, Town } from '../types/game';

export interface TrainRuntime {
  id: string;
  lineId: string;
  pathNodes: NodeKey[];
  stations: Set<string>;
  capacity: number;
  color: string;
  segIndex: number;
  dir: 1 | -1;
  segT: number;
  dwell: number;
  load: Passenger[];
  x: number;
  z: number;
  angle: number;
}

export interface SimState {
  trains: Map<string, TrainRuntime>;
  waiting: Map<string, Passenger[]>;
  spawnAcc: number;
  pseq: number;
}

export function createSim(): SimState {
  const waiting = new Map<string, Passenger[]>();
  for (const t of TOWNS) waiting.set(t.id, []);
  return { trains: new Map(), waiting, spawnAcc: 0, pseq: 0 };
}

export function addTrainRuntime(
  sim: SimState,
  id: string,
  lineId: string,
  pathNodes: NodeKey[],
  stations: string[],
  color: string,
  atStart: boolean,
): void {
  const segIndex = atStart ? 0 : pathNodes.length - 1;
  const w = nodeWorld(pathNodes[segIndex]);
  sim.trains.set(id, {
    id,
    lineId,
    pathNodes,
    stations: new Set(stations),
    capacity: TRAIN_CAPACITY,
    color,
    segIndex,
    dir: atStart ? 1 : -1,
    segT: 0,
    dwell: DWELL_TIME,
    load: [],
    x: w[0],
    z: w[2],
    angle: 0,
  });
}

export function removeTrainsOfLine(sim: SimState, lineId: string): void {
  for (const [id, tr] of sim.trains) if (tr.lineId === lineId) sim.trains.delete(id);
}

function pickTownWeighted(rng: () => number): Town {
  const total = TOWNS.reduce((a, t) => a + t.size, 0);
  let r = rng() * total;
  for (const t of TOWNS) {
    r -= t.size;
    if (r <= 0) return t;
  }
  return TOWNS[0];
}

export function spawnPassengers(sim: SimState, dt: number, rng: () => number = Math.random): void {
  sim.spawnAcc += dt;
  while (sim.spawnAcc >= SPAWN_INTERVAL) {
    sim.spawnAcc -= SPAWN_INTERVAL;
    const town = pickTownWeighted(rng);
    const q = sim.waiting.get(town.id)!;
    if (q.length >= MAX_WAITING) continue;
    let dest = town;
    while (dest.id === town.id) dest = TOWNS[Math.floor(rng() * TOWNS.length)];
    q.push({ id: ++sim.pseq, fromTownId: town.id, toTownId: dest.id });
  }
}

function updatePos(tr: TrainRuntime): void {
  const a = tr.pathNodes[tr.segIndex];
  const b = tr.pathNodes[tr.segIndex + tr.dir] ?? a;
  const wa = nodeWorld(a);
  const wb = nodeWorld(b);
  tr.x = wa[0] + (wb[0] - wa[0]) * tr.segT;
  tr.z = wa[2] + (wb[2] - wa[2]) * tr.segT;
  const dx = wb[0] - wa[0];
  const dz = wb[2] - wa[2];
  if (dx !== 0 || dz !== 0) tr.angle = Math.atan2(dx, dz);
}

function handleStop(
  sim: SimState,
  tr: TrainRuntime,
  town: Town,
  onDeliver: (fare: number, townId: string) => void,
): void {
  // 降車(目的地に到着)
  const remain: Passenger[] = [];
  for (const p of tr.load) {
    if (p.toTownId === town.id) {
      const from = TOWNS_BY_ID.get(p.fromTownId);
      if (from) onDeliver(fareBetween(from, town), town.id);
    } else {
      remain.push(p);
    }
  }
  tr.load = remain;
  // 乗車(この路線で到達できる目的地の乗客)
  const q = sim.waiting.get(town.id) ?? [];
  const stay: Passenger[] = [];
  for (const p of q) {
    if (tr.load.length < tr.capacity && p.toTownId !== town.id && tr.stations.has(p.toTownId)) {
      tr.load.push(p);
    } else {
      stay.push(p);
    }
  }
  sim.waiting.set(town.id, stay);
}

function stepTrain(
  sim: SimState,
  tr: TrainRuntime,
  dt: number,
  onDeliver: (fare: number, townId: string) => void,
): void {
  if (tr.dwell > 0) {
    tr.dwell -= dt;
    updatePos(tr);
    return;
  }
  tr.segT += TRAIN_SPEED * dt;
  let guard = 0;
  while (tr.segT >= 1 && guard++ < 128) {
    tr.segT -= 1;
    tr.segIndex += tr.dir;
    if (tr.segIndex <= 0) {
      tr.segIndex = 0;
      tr.dir = 1;
    } else if (tr.segIndex >= tr.pathNodes.length - 1) {
      tr.segIndex = tr.pathNodes.length - 1;
      tr.dir = -1;
    }
    const town = TOWN_BY_NODE.get(tr.pathNodes[tr.segIndex]);
    if (town) {
      handleStop(sim, tr, town, onDeliver);
      tr.dwell = DWELL_TIME;
      tr.segT = 0;
      break;
    }
  }
  updatePos(tr);
}

export function stepTrains(
  sim: SimState,
  dt: number,
  onDeliver: (fare: number, townId: string) => void,
): void {
  for (const tr of sim.trains.values()) stepTrain(sim, tr, dt, onDeliver);
}

export function townWaiting(sim: SimState, townId: string): number {
  return sim.waiting.get(townId)?.length ?? 0;
}
export function totalWaiting(sim: SimState): number {
  let n = 0;
  for (const q of sim.waiting.values()) n += q.length;
  return n;
}
export function totalOnboard(sim: SimState): number {
  let n = 0;
  for (const t of sim.trains.values()) n += t.load.length;
  return n;
}
