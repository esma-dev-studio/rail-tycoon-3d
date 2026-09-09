import assert from 'node:assert/strict';
import {
  allTownsConnected,
  findTownRoute,
  largestConnectedTownCount,
  townLineCount,
} from '../src/sim/network.ts';
import type { Line, Town } from '../src/types/game.ts';

const line = (id: string, stations: string[]): Line => ({
  id,
  name: id,
  color: '#000000',
  pathNodes: [],
  stations,
});

const towns: Town[] = ['a', 'b', 'c', 'd', 'e'].map((id, index) => ({
  id,
  name: id.toUpperCase(),
  x: index,
  z: 0,
  size: 1,
  color: '#000000',
}));

const chain = [
  line('line-ab', ['a', 'b']),
  line('line-bc', ['b', 'c']),
];

assert.deepEqual(findTownRoute(chain, 'a', 'c'), [
  { fromTownId: 'a', toTownId: 'b', lineId: 'line-ab' },
  { fromTownId: 'b', toTownId: 'c', lineId: 'line-bc' },
]);
assert.deepEqual(findTownRoute(chain, 'c', 'a'), [
  { fromTownId: 'c', toTownId: 'b', lineId: 'line-bc' },
  { fromTownId: 'b', toTownId: 'a', lineId: 'line-ab' },
]);
assert.equal(townLineCount(chain, 'b'), 2);
assert.equal(largestConnectedTownCount(chain, towns), 3);
assert.equal(allTownsConnected(chain, towns), false);

const oneTrainThroughThreeTowns = [line('line-ac', ['a', 'b', 'c'])];
assert.deepEqual(findTownRoute(oneTrainThroughThreeTowns, 'a', 'c'), [
  { fromTownId: 'a', toTownId: 'c', lineId: 'line-ac' },
]);

const disconnected = [
  line('line-ab', ['a', 'b']),
  line('line-cd', ['c', 'd']),
];
assert.equal(largestConnectedTownCount(disconnected, towns), 2);

const allConnected = [
  ...chain,
  line('line-cd', ['c', 'd']),
  line('line-de', ['d', 'e']),
];
assert.equal(largestConnectedTownCount(allConnected, towns), 5);
assert.equal(allTownsConnected(allConnected, towns), true);

console.log('network verification passed: bidirectional routes, transfers, and connectivity');
