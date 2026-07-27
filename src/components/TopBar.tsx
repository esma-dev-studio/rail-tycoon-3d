import { useState } from 'react';
import { SECONDS_PER_DAY, SPEEDS } from '../data/config';
import { SAVINGS_GOALS } from '../data/progression';
import { useGameStore } from '../store/gameStore';

const SPEED_LABELS: Record<number, { icon: string; title: string }> = {
  0: { icon: '⏸', title: 'とめる' },
  1: { icon: '▶', title: 'ふつう' },
  3: { icon: '⏩', title: 'はやい' },
};

export function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const money = useGameStore((s) => s.money);
  const lastIncome = useGameStore((s) => s.lastIncome);
  const savingsGoalIndex = useGameStore((s) => s.savingsGoalIndex);
  const clock = useGameStore((s) => s.clock);
  const totalDelivered = useGameStore((s) => s.totalDelivered);
  const speed = useGameStore((s) => s.speed);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const muted = useGameStore((s) => s.muted);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const reset = useGameStore((s) => s.reset);

  const day = Math.floor(clock / SECONDS_PER_DAY) + 1;
  const goal = SAVINGS_GOALS[savingsGoalIndex];
  const savingsPct = goal ? Math.min(100, (money / goal.amount) * 100) : 100;

  const onReset = () => {
    if (window.confirm('いままでの きろくを けして、さいしょから あそぶ？')) {
      reset();
      setMenuOpen(false);
    }
  };

  return (
    <header className="topbar">
      <div className="brand" aria-label="でんしゃの町">
        <span className="brand__logo">🚆</span>
        <span className="brand__name">でんしゃの町</span>
      </div>

      <div className="money-card">
        <div className="money-card__top">
          <span>🐷 お金</span>
          <strong key={money}>{money.toLocaleString()}円</strong>
          {lastIncome && (
            <span className="money-card__income" key={lastIncome.id}>
              +{lastIncome.amount.toLocaleString()}円
            </span>
          )}
        </div>
        <div className="money-card__goal">
          <div className="money-card__bar">
            <span style={{ width: `${savingsPct}%` }} />
          </div>
          <small>{goal ? `つぎは ${goal.amount.toLocaleString()}円` : 'ちょきん ぜんぶ できた！'}</small>
        </div>
      </div>

      <div className="quick-stats">
        <div className="quick-stat">
          <span>🙂</span>
          <b>{totalDelivered.toLocaleString()}人</b>
          <small>はこんだ</small>
        </div>
        <div className="quick-stat">
          <span>☀️</span>
          <b>{day}日め</b>
          <small>ひにち</small>
        </div>
      </div>

      <div className="speed" aria-label="ゲームの はやさ">
        {SPEEDS.map((value) => (
          <button
            key={value}
            className={`speed__btn ${speed === value ? 'is-active' : ''}`}
            onClick={() => setSpeed(value)}
            title={SPEED_LABELS[value].title}
            aria-label={SPEED_LABELS[value].title}
            aria-pressed={speed === value}
          >
            {SPEED_LABELS[value].icon}
          </button>
        ))}
      </div>

      <div className="settings">
        <button
          className="settings__toggle"
          onClick={() => setMenuOpen((value) => !value)}
          aria-expanded={menuOpen}
          aria-label="せってい"
        >
          ⚙️
        </button>
        {menuOpen && (
          <div className="settings__panel">
            <b>せってい</b>
            <button onClick={toggleMute}>{muted ? '🔇 おとを だす' : '🔊 おとを けす'}</button>
            <span>💾 つづきは じどうで きろく中</span>
            <button className="settings__reset" onClick={onReset}>
              ↺ さいしょから
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
