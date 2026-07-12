// ============================================================================
// シミュレーション駆動 — 毎フレーム sim を進め、UI用に一定間隔で revision を更新
// ============================================================================
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { sim } from '../sim/simInstance';
import { spawnPassengers, stepTrains } from '../sim/simulation';
import { pushFareFloat } from '../sim/fareFloats';
import { TOWNS_BY_ID } from '../data/world';
import { worldPos } from '../utils/grid';
import { useGameStore } from '../store/gameStore';

const UI_INTERVAL = 0.2; // 実時間0.2秒ごとにUIを更新

export function SimulationDriver() {
  const realAcc = useRef(0);
  const gameAcc = useRef(0);

  useFrame((_, dt) => {
    const st = useGameStore.getState();
    const clamped = Math.min(dt, 0.05); // タブ復帰時の大ジャンプを抑制
    const dtGame = clamped * st.speed;

    if (dtGame > 0) {
      spawnPassengers(sim, dtGame);
      stepTrains(sim, dtGame, (fare, townId) => {
        st.deliver(fare);
        const town = TOWNS_BY_ID.get(townId);
        if (town) {
          const w = worldPos(town.x, town.z);
          pushFareFloat(townId, w[0], w[2], fare);
        }
      });
    }

    realAcc.current += clamped;
    gameAcc.current += dtGame;
    if (realAcc.current >= UI_INTERVAL) {
      st.commitTick(gameAcc.current);
      realAcc.current = 0;
      gameAcc.current = 0;
    }
  });

  return null;
}
