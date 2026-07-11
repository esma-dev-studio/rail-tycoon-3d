// ============================================================================
// 上部バー — 資金・日数・輸送実績・再生速度
// ============================================================================
import { SECONDS_PER_DAY, SPEEDS } from '../data/config';
import { useGameStore } from '../store/gameStore';
import { sim } from '../sim/simInstance';
import { totalWaiting, totalOnboard } from '../sim/simulation';

const SPEED_LABELS: Record<number, string> = { 0: '⏸', 1: '▶', 3: '⏩' };

export function TopBar() {
  const money = useGameStore((s) => s.money);
  const clock = useGameStore((s) => s.clock);
  const totalDelivered = useGameStore((s) => s.totalDelivered);
  const speed = useGameStore((s) => s.speed);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const reset = useGameStore((s) => s.reset);
  useGameStore((s) => s.revision); // ライブ更新

  const day = Math.floor(clock / SECONDS_PER_DAY) + 1;
  const waiting = totalWaiting(sim);
  const onboard = totalOnboard(sim);

  return (
    <div className="topbar">
      <div className="brand">
        <span className="brand__logo">🚆</span>
        <span className="brand__name">Rail Tycoon 3D</span>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="stat__label">資金</span>
          <span className={`stat__value ${money < 0 ? 'is-neg' : ''}`}>¥{money.toLocaleString()}</span>
        </div>
        <div className="stat">
          <span className="stat__label">日数</span>
          <span className="stat__value">{day}日目</span>
        </div>
        <div className="stat">
          <span className="stat__label">輸送人数</span>
          <span className="stat__value">{totalDelivered.toLocaleString()}人</span>
        </div>
        <div className="stat">
          <span className="stat__label">待ち / 乗車中</span>
          <span className="stat__value">
            {waiting} / {onboard}
          </span>
        </div>
      </div>

      <div className="speed">
        {SPEEDS.map((s) => (
          <button
            key={s}
            className={`speed__btn ${speed === s ? 'is-active' : ''}`}
            onClick={() => setSpeed(s)}
            title={s === 0 ? '一時停止' : `速度 ×${s}`}
          >
            {SPEED_LABELS[s]}
          </button>
        ))}
        <button className="speed__btn speed__reset" onClick={reset} title="最初からやり直す">
          ↺
        </button>
      </div>
    </div>
  );
}
