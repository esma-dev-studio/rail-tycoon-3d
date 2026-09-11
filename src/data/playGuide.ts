import type { Line, Town } from '../types/game';

export function isFirstJourney(state: { missionIndex: number; lines: Line[]; totalDelivered: number }): boolean {
  return state.missionIndex < 2 && state.lines.every((l) => l.stations.every((id) => id === 't_midori' || id === 't_chuo'));
}
export function visibleMapTowns(state: { towns: Town[]; missionIndex: number; lines: Line[]; totalDelivered: number }): Town[] {
  return isFirstJourney(state) ? state.towns.filter((t) => t.id === 't_midori' || t.id === 't_chuo') : state.towns;
}
