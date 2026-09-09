// ============================================================================
// シミュレーション本体（フレームワーク非依存）
//  - 乗客の発生
//  - 双方向運転
//  - 路線をまたぐ自動乗り換え
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
import {
  buildTownNetwork,
  findTownRouteInNetwork,
  reachableTownIdsInNetwork,
  type TownNetwork,
} from './network';
import type { Line, NodeKey, Passenger, Town } from '../types/game';

export interface TrainRuntime {
  id: string;
  lineId: string;
  pathNodes: NodeKey[];
  stations: Set<string>;
  capacity: number;
  speed: number;
  color: string;
  segIndex: number;
  dir: 1 | -1;
  segT: number;
  dwell: number;
  initialStopPending: boolean;
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
  for (const town of TOWNS) waiting.set(town.id, []);
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
  capacity = TRAIN_CAPACITY,
  speed = TRAIN_SPEED,
): void {
  const segIndex = atStart ? 0 : pathNodes.length - 1;
  const world = nodeWorld(pathNodes[segIndex]);
  sim.trains.set(id, {
    id,
    lineId,
    pathNodes,
    stations: new Set(stations),
    capacity,
    speed,
    color,
    segIndex,
    dir: atStart ? 1 : -1,
    segT: 0,
    dwell: DWELL_TIME,
    initialStopPending: true,
    load: [],
    x: world[0],
    z: world[2],
    angle: 0,
  });
}

/**
 * 新しい路線は、行きに3人・帰りにも3人を用意する。
 * 「AからBへ行くだけ」に見えず、最初の往復で両方向の動きが分かる。
 */
export function primeFirstRoundTrip(
  sim: SimState,
  trainId: string,
  fromTownId: string,
  toTownId: string,
  count = 3,
): void {
  const train = sim.trains.get(trainId);
  if (!train) return;

  for (let index = 0; index < count && train.load.length < train.capacity; index++) {
    train.load.push({
      id: ++sim.pseq,
      fromTownId,
      toTownId,
      legToTownId: toTownId,
      legLineId: train.lineId,
      transfers: 0,
    });
  }

  const reverseQueue = sim.waiting.get(toTownId) ?? [];
  for (let index = 0; index < count && reverseQueue.length < MAX_WAITING; index++) {
    reverseQueue.push({
      id: ++sim.pseq,
      fromTownId: toTownId,
      toTownId: fromTownId,
      transfers: 0,
    });
  }
  sim.waiting.set(toTownId, reverseQueue);
}

export function removeTrainsOfLine(sim: SimState, lineId: string): void {
  for (const [id, train] of sim.trains) {
    if (train.lineId === lineId) sim.trains.delete(id);
  }
}

function pickTownWeighted(rng: () => number, towns: Town[]): Town {
  const total = towns.reduce((sum, town) => sum + town.size, 0);
  let value = rng() * total;
  for (const town of towns) {
    value -= town.size;
    if (value <= 0) return town;
  }
  return towns[0];
}

export function applyLineRuntimeStats(
  sim: SimState,
  lineId: string,
  capacity: number,
  speed: number,
): void {
  for (const train of sim.trains.values()) {
    if (train.lineId !== lineId) continue;
    train.capacity = capacity;
    train.speed = speed;
  }
}

/**
 * 通常の乗客は、現在の鉄道網で到着できる町だけを目的地にする。
 * 未接続の町へ行きたい気持ちはミッションで見せ、永久に待つ乗客は作らない。
 */
export function spawnPassengers(
  sim: SimState,
  dt: number,
  lines: Line[],
  rng: () => number = Math.random,
  towns: Town[] = TOWNS,
  attraction: (townId: string) => number = () => 1,
): void {
  sim.spawnAcc += dt;
  const network = buildTownNetwork(lines);
  const reachableByTown = new Map(
    towns.map((town) => [town.id, reachableTownIdsInNetwork(network, town.id).filter((id) => towns.some((t) => t.id === id))]),
  );
  const origins = towns.filter((town) => (reachableByTown.get(town.id)?.length ?? 0) > 0);

  while (sim.spawnAcc >= SPAWN_INTERVAL) {
    sim.spawnAcc -= SPAWN_INTERVAL;
    if (origins.length === 0) continue;

    const town = pickTownWeighted(rng, origins);
    const queue = sim.waiting.get(town.id) ?? [];
    if (queue.length >= MAX_WAITING) continue;

    const reachable = reachableByTown.get(town.id) ?? [];
    const destinations = towns.filter((t) => reachable.includes(t.id)).map((t) => ({ ...t, size: attraction(t.id) }));
    const toTownId = destinations.length ? pickTownWeighted(rng, destinations).id : undefined;
    if (!toTownId) continue;

    queue.push({
      id: ++sim.pseq,
      fromTownId: town.id,
      toTownId,
      transfers: 0,
    });
    sim.waiting.set(town.id, queue);
  }
}

function updatePos(train: TrainRuntime): void {
  const fromNode = train.pathNodes[train.segIndex];
  const toNode = train.pathNodes[train.segIndex + train.dir] ?? fromNode;
  const from = nodeWorld(fromNode);
  const to = nodeWorld(toNode);
  train.x = from[0] + (to[0] - from[0]) * train.segT;
  train.z = from[2] + (to[2] - from[2]) * train.segT;
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  if (dx !== 0 || dz !== 0) train.angle = Math.atan2(dx, dz);
}

function stationIdsAhead(train: TrainRuntime): string[] {
  const stations: string[] = [];
  for (
    let index = train.segIndex + train.dir;
    index >= 0 && index < train.pathNodes.length;
    index += train.dir
  ) {
    const town = TOWN_BY_NODE.get(train.pathNodes[index]);
    if (town && train.stations.has(town.id) && !stations.includes(town.id)) {
      stations.push(town.id);
    }
  }
  return stations;
}

export function nextTrainStopTownId(train: TrainRuntime): string | null {
  return stationIdsAhead(train)[0] ?? null;
}

function handleStop(
  sim: SimState,
  train: TrainRuntime,
  town: Town,
  network: TownNetwork,
  onDeliver: (fare: number, townId: string, passenger: Passenger) => void,
): void {
  const stationQueue = sim.waiting.get(town.id) ?? [];
  const remainingOnTrain: Passenger[] = [];

  for (const passenger of train.load) {
    if (passenger.legToTownId !== town.id) {
      remainingOnTrain.push(passenger);
      continue;
    }

    if (passenger.toTownId === town.id) {
      const origin = TOWNS_BY_ID.get(passenger.fromTownId);
      if (origin) onDeliver(fareBetween(origin, town), town.id, passenger);
      continue;
    }

    stationQueue.push({
      ...passenger,
      legToTownId: undefined,
      legLineId: undefined,
      transfers: passenger.transfers + 1,
    });
  }
  train.load = remainingOnTrain;

  const ahead = new Set(stationIdsAhead(train));
  const stay: Passenger[] = [];
  for (const passenger of stationQueue) {
    const route = findTownRouteInNetwork(network, town.id, passenger.toTownId);
    if (!route) continue;
    const nextRide = route[0];
    const canBoard = (
      train.load.length < train.capacity
      && nextRide?.lineId === train.lineId
      && ahead.has(nextRide.toTownId)
    );

    if (canBoard && nextRide) {
      train.load.push({
        ...passenger,
        legToTownId: nextRide.toTownId,
        legLineId: nextRide.lineId,
      });
    } else {
      stay.push(passenger);
    }
  }
  sim.waiting.set(town.id, stay);
}

function stepTrain(
  sim: SimState,
  train: TrainRuntime,
  dt: number,
  network: TownNetwork,
  onDeliver: (fare: number, townId: string, passenger: Passenger) => void,
): void {
  if (train.initialStopPending) {
    const initialTown = TOWN_BY_NODE.get(train.pathNodes[train.segIndex]);
    if (initialTown && train.stations.has(initialTown.id)) {
      handleStop(sim, train, initialTown, network, onDeliver);
    }
    train.initialStopPending = false;
  }

  if (train.dwell > 0) {
    train.dwell -= dt;
    updatePos(train);
    return;
  }

  train.segT += train.speed * dt;
  let guard = 0;
  while (train.segT >= 1 && guard++ < 128) {
    train.segT -= 1;
    train.segIndex += train.dir;
    if (train.segIndex <= 0) {
      train.segIndex = 0;
      train.dir = 1;
    } else if (train.segIndex >= train.pathNodes.length - 1) {
      train.segIndex = train.pathNodes.length - 1;
      train.dir = -1;
    }

    const town = TOWN_BY_NODE.get(train.pathNodes[train.segIndex]);
    if (town && train.stations.has(town.id)) {
      handleStop(sim, train, town, network, onDeliver);
      train.dwell = DWELL_TIME;
      train.segT = 0;
      break;
    }
  }
  updatePos(train);
}

export function stepTrains(
  sim: SimState,
  dt: number,
  lines: Line[],
  onDeliver: (fare: number, townId: string, passenger: Passenger) => void,
): void {
  const network = buildTownNetwork(lines);
  for (const train of sim.trains.values()) {
    stepTrain(sim, train, dt, network, onDeliver);
  }
}

/** 路線を消した後、もう行けなくなった乗客を待ち行列から外す。 */
export function pruneUnreachablePassengers(sim: SimState, lines: Line[]): void {
  const network = buildTownNetwork(lines);
  for (const [townId, queue] of sim.waiting) {
    sim.waiting.set(
      townId,
      queue.filter((passenger) => (
        findTownRouteInNetwork(network, townId, passenger.toTownId) !== null
      )),
    );
  }
}

export function townWaiting(sim: SimState, townId: string): number {
  return sim.waiting.get(townId)?.length ?? 0;
}

export function townTransferWaiting(sim: SimState, townId: string): number {
  return sim.waiting.get(townId)?.filter((passenger) => passenger.transfers > 0).length ?? 0;
}

export function totalWaiting(sim: SimState): number {
  let count = 0;
  for (const queue of sim.waiting.values()) count += queue.length;
  return count;
}

export function totalOnboard(sim: SimState): number {
  let count = 0;
  for (const train of sim.trains.values()) count += train.load.length;
  return count;
}

export function lineWaitingCount(sim: SimState, lines: Line[], lineId: string): number {
  const network = buildTownNetwork(lines);
  let count = 0;
  for (const [townId, queue] of sim.waiting) {
    for (const passenger of queue) {
      const route = findTownRouteInNetwork(network, townId, passenger.toTownId);
      if (route?.[0]?.lineId === lineId) count++;
    }
  }
  return count;
}
