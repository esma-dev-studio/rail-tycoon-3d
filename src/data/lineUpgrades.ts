import { TRAIN_CAPACITY, TRAIN_SPEED } from './config.ts';
import type { Line } from '../types/game.ts';

export const MAX_LINE_UPGRADE_LEVEL = 3;

export function lineCapacityLevel(line: Line): number {
  return Math.min(MAX_LINE_UPGRADE_LEVEL, Math.max(1, line.capacityLevel ?? 1));
}

export function lineSpeedLevel(line: Line): number {
  return Math.min(MAX_LINE_UPGRADE_LEVEL, Math.max(1, line.speedLevel ?? 1));
}

export function lineCapacity(line: Line): number {
  return TRAIN_CAPACITY + (lineCapacityLevel(line) - 1) * 10;
}

export function lineSpeed(line: Line): number {
  return TRAIN_SPEED * (1 + (lineSpeedLevel(line) - 1) * 0.2);
}

export function capacityUpgradeCost(line: Line): number | null {
  const level = lineCapacityLevel(line);
  return level >= MAX_LINE_UPGRADE_LEVEL ? null : 6_000 + (level - 1) * 4_000;
}

export function speedUpgradeCost(line: Line): number | null {
  const level = lineSpeedLevel(line);
  return level >= MAX_LINE_UPGRADE_LEVEL ? null : 7_000 + (level - 1) * 4_000;
}

export function totalLineUpgradeCount(lines: Line[]): number {
  return lines.reduce(
    (total, line) => total + lineCapacityLevel(line) - 1 + lineSpeedLevel(line) - 1,
    0,
  );
}
