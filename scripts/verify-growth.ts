import assert from 'node:assert/strict';
import {
  MAX_LINE_UPGRADE_LEVEL,
  capacityUpgradeCost,
  lineCapacity,
  lineSpeed,
  speedUpgradeCost,
  totalLineUpgradeCount,
} from '../src/data/lineUpgrades.ts';
import {
  CHAPTERS,
  MISSIONS,
  endlessChallengeReward,
  endlessDeliveryTarget,
} from '../src/data/missions.ts';
import {
  MAX_TOWN_LEVEL,
  nextTownLevelRequirement,
  townLevelFor,
} from '../src/data/progression.ts';
import type { Line } from '../src/types/game.ts';

const line = (capacityLevel = 1, speedLevel = 1): Line => ({
  id: 'line-test',
  name: 'テスト線',
  color: '#00aabb',
  pathNodes: [],
  stations: ['a', 'b'],
  capacityLevel,
  speedLevel,
});

assert.equal(lineCapacity(line()), 20);
assert.equal(lineCapacity(line(2, 1)), 30);
assert.equal(lineCapacity(line(3, 1)), 40);
assert.equal(lineSpeed(line(1, 2)), 2.4 * 1.2);
assert.equal(capacityUpgradeCost(line()), 6_000);
assert.equal(capacityUpgradeCost(line(3, 1)), null);
assert.equal(speedUpgradeCost(line()), 7_000);
assert.equal(speedUpgradeCost(line(1, 3)), null);
assert.equal(totalLineUpgradeCount([line(3, 2)]), 3);
assert.equal(MAX_LINE_UPGRADE_LEVEL, 3);

assert.equal(CHAPTERS.length, 3);
assert.deepEqual(
  MISSIONS.map((mission, index) => mission.chapterEnd ? index : -1).filter((index) => index >= 0),
  [5, 9, 14],
);
assert.equal(MISSIONS[6].chapter, 2);
assert.equal(MISSIONS[10].chapter, 3);
assert.equal(endlessDeliveryTarget(0), 100);
assert.equal(endlessDeliveryTarget(1), 150);
assert.equal(endlessDeliveryTarget(4), 300);
assert.equal(endlessChallengeReward(1), 6_000);

assert.equal(MAX_TOWN_LEVEL, 6);
assert.equal(townLevelFor(0), 1);
assert.equal(townLevelFor(4), 2);
assert.equal(townLevelFor(25), 4);
assert.equal(townLevelFor(70), 6);
assert.equal(nextTownLevelRequirement(4), 45);
assert.equal(nextTownLevelRequirement(6), null);

console.log('growth verification passed: chapters, upgrades, endless goals, and town levels');
