// ============================================================================
// 上部バー — お金・日にち・はこんだ人数・スピード(小2向けのことばで表示)
// ============================================================================
import { SECONDS_PER_DAY, SPEEDS } from '../data/config';
import { useGameStore } from '../store/gameStore';
import { sim } from '../sim/simInstance';
import { totalWaiting } from '../sim/simulation';

const SPEED_LABELS: Record<number, { icon: string; title: string }> = {
  0: { icon: '⏸', title: 'とめる' },
  1: { icon: '▶', title: 'ふつう' },
  3: { icon: '⏩', title: 'はやい' },
};

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

  const onReset = () => {
    if (window.confirm('さいしょから やりなおす？')) reset();
  };

  return (
    <div className="topbar">
      <div className="brand">
        <span className="brand__logo">🚆</span>
        <span className="brand__name">でんしゃタイクーン3D</span>
      </div>

      <div className="stats">
        <div className="stat stat--money">
          <span className="stat__label">💰 お金</span>
          <span className={`stat__value ${money < 0 ? 'is-neg' : ''}`}>{money.toLocaleString()}円</span>
        </div>
        <div className="stat">
          <span className="stat__label">📅 ひにち</span>
          <span className="stat__value">{day}日め</span>
        </div>
        <div className="stat">
          <span className="stat__label">🙂 はこんだ人</span>
          <span className="stat__value">{totalDelivered.toLocaleString()}人</span>
        </div>
        <div className="stat">
          <span className="stat__label">🧍 まってる人</span>
          <span className="stat__value">{waiting}人</span>
        </div>
      </div>

      <div className="speed">
        {SPEEDS.map((s) => (
          <button
            key={s}
            className={`speed__btn ${speed === s ? 'is-active' : ''}`}
            onClick={() => setSpeed(s)}
            title={SPEED_LABELS[s].title}
          >
            {SPEED_LABELS[s].icon}
          </button>
        ))}
        <button className="speed__btn speed__reset" onClick={onReset} title="さいしょから">
          ↺
        </button>
      </div>
    </div>
  );
}
