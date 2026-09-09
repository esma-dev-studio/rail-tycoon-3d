import type { Line, Town } from '../types/game';

export interface TownConnection {
  toTownId: string;
  lineId: string;
}

export interface TownRide {
  fromTownId: string;
  toTownId: string;
  lineId: string;
}

export type TownNetwork = Map<string, TownConnection[]>;

function orderedUniqueStations(line: Line): string[] {
  return line.stations.filter((station, index) => line.stations.indexOf(station) === index);
}

function addConnection(
  network: TownNetwork,
  fromTownId: string,
  toTownId: string,
  lineId: string,
): void {
  const connections = network.get(fromTownId) ?? [];
  if (!connections.some((connection) => (
    connection.toTownId === toTownId && connection.lineId === lineId
  ))) {
    connections.push({ toTownId, lineId });
  }
  network.set(fromTownId, connections);
}

/**
 * 同じ路線にある駅同士は、乗り換えなしで行ける1本の「乗車」として扱う。
 * 別の路線へ移る時だけ、駅で自動的に乗り換える。
 */
export function buildTownNetwork(lines: Line[]): TownNetwork {
  const network: TownNetwork = new Map();
  for (const line of lines) {
    const stations = orderedUniqueStations(line);
    for (const station of stations) {
      if (!network.has(station)) network.set(station, []);
    }
    for (let fromIndex = 0; fromIndex < stations.length; fromIndex++) {
      for (let toIndex = fromIndex + 1; toIndex < stations.length; toIndex++) {
        const fromTownId = stations[fromIndex];
        const toTownId = stations[toIndex];
        addConnection(network, fromTownId, toTownId, line.id);
        addConnection(network, toTownId, fromTownId, line.id);
      }
    }
  }
  return network;
}

export function findTownRouteInNetwork(
  network: TownNetwork,
  fromTownId: string,
  toTownId: string,
): TownRide[] | null {
  if (fromTownId === toTownId) return [];
  if (!network.has(fromTownId) || !network.has(toTownId)) return null;

  const queue = [fromTownId];
  const visited = new Set([fromTownId]);
  const previous = new Map<string, { townId: string; lineId: string }>();

  for (let cursor = 0; cursor < queue.length; cursor++) {
    const townId = queue[cursor];
    for (const connection of network.get(townId) ?? []) {
      if (visited.has(connection.toTownId)) continue;
      visited.add(connection.toTownId);
      previous.set(connection.toTownId, { townId, lineId: connection.lineId });
      if (connection.toTownId === toTownId) {
        const rides: TownRide[] = [];
        let currentTownId = toTownId;
        while (currentTownId !== fromTownId) {
          const step = previous.get(currentTownId);
          if (!step) return null;
          rides.unshift({
            fromTownId: step.townId,
            toTownId: currentTownId,
            lineId: step.lineId,
          });
          currentTownId = step.townId;
        }
        return rides;
      }
      queue.push(connection.toTownId);
    }
  }
  return null;
}

export function findTownRoute(
  lines: Line[],
  fromTownId: string,
  toTownId: string,
): TownRide[] | null {
  return findTownRouteInNetwork(buildTownNetwork(lines), fromTownId, toTownId);
}

export function reachableTownIdsInNetwork(
  network: TownNetwork,
  fromTownId: string,
): string[] {
  if (!network.has(fromTownId)) return [];
  const queue = [fromTownId];
  const visited = new Set([fromTownId]);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const townId = queue[cursor];
    for (const connection of network.get(townId) ?? []) {
      if (visited.has(connection.toTownId)) continue;
      visited.add(connection.toTownId);
      queue.push(connection.toTownId);
    }
  }
  visited.delete(fromTownId);
  return [...visited];
}

/**
 * 「路線に駅がある数」ではなく、同じ鉄道網としてつながった最大の町数。
 * A-B と C-D のように線路が分かれている場合は 4 ではなく 2 になる。
 */
export function largestConnectedTownCount(lines: Line[], towns: Town[]): number {
  const network = buildTownNetwork(lines);
  const townIds = new Set(towns.map((town) => town.id));
  let largest = 0;

  for (const townId of network.keys()) {
    if (!townIds.has(townId)) continue;
    const connected = reachableTownIdsInNetwork(network, townId)
      .filter((connectedTownId) => townIds.has(connectedTownId));
    largest = Math.max(largest, connected.length + 1);
  }
  return largest;
}

export function allTownsConnected(lines: Line[], towns: Town[]): boolean {
  return towns.length > 0 && largestConnectedTownCount(lines, towns) === towns.length;
}

export function townLineCount(lines: Line[], townId: string): number {
  return new Set(
    lines
      .filter((line) => line.stations.includes(townId))
      .map((line) => line.id),
  ).size;
}
