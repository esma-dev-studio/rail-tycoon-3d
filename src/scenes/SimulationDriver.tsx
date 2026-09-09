import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { sim } from '../sim/simInstance';
import { spawnPassengers, stepTrains } from '../sim/simulation';
import { pushFareFloat } from '../sim/fareFloats';
import { TOWNS_BY_ID } from '../data/world';
import { worldPos } from '../utils/grid';
import { useGameStore } from '../store/gameStore';
import { townAttraction } from '../data/development';

const UI_INTERVAL = 0.2;

export function SimulationDriver() {
  const realAcc = useRef(0);
  const gameAcc = useRef(0);

  useFrame((_, dt) => {
    const state = useGameStore.getState();
    const clamped = Math.min(dt, 0.05);
    const dtGame = clamped * state.speed;

    if (dtGame > 0) {
      spawnPassengers(sim, dtGame, state.lines, Math.random, state.towns, (id) => townAttraction(id, state.projects));
      stepTrains(sim, dtGame, state.lines, (fare, townId, passenger) => {
        // 毎フレームの途中でも最新のストアを使う。
        useGameStore.getState().deliver(fare, townId, passenger);
        const town = TOWNS_BY_ID.get(townId);
        if (town) {
          const world = worldPos(town.x, town.z);
          pushFareFloat(townId, world[0], world[2], fare);
        }
      });
    }

    realAcc.current += clamped;
    gameAcc.current += dtGame;
    if (realAcc.current >= UI_INTERVAL) {
      useGameStore.getState().commitTick(gameAcc.current);
      realAcc.current = 0;
      gameAcc.current = 0;
    }
  });

  return null;
}
