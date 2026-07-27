import { useState } from 'react';
import { SECONDS_PER_DAY, SPEEDS } from '../data/config';
import { SAVINGS_GOALS } from '../data/progression';
import { useGameStore } from '../store/gameStore';
import { RailIcon, type RailIconName } from './RailIcon';

const SPEED_LABELS: Record<number, { icon: RailIconName; title: string }> = {
  0: { icon: 'pause', title: 'とめる' },
  1: { icon: 'play', title: 'ふつう' },
  3: { icon: 'fast', title: 'はやい' },
};

export function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const money = useGameStore((state) => state.money);
  const lastIncome = useGameStore((state) => state.lastIncome);
  const savingsGoalIndex = useGameStore((state) => state.savingsGoalIndex);
  const clock = useGameStore((state) => state.clock);
  const totalDelivered = useGameStore((state) => state.totalDelivered);
  const speed = useGameStore((state) => state.speed);
  const setSpeed = useGameStore((state) => state.setSpeed);
  const muted = useGameStore((state) => state.muted);
  const toggleMute = useGameStore((state) => state.toggleMute);
  const reset = useGameStore((state) => state.reset);

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
    <header className="topbar topbar--control">
      <div className="brand" aria-label="でんしゃの町">
        <span className="brand__logo">
          <RailIcon name="train" />
        </span>
        <span className="brand__copy">
          <strong>でんしゃの町</strong>
          <small>RAIL CITY</small>
        </span>
      </div>

      <div className="money-card">
        <div className="money-card__top">
          <span className="money-card__label">
            <RailIcon name="coin" /> お金
          </span>
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
          <small>{goal ? `つぎ ${goal.amount.toLocaleString()}円` : 'ぜんぶ できた！'}</small>
        </div>
      </div>

      <div className="quick-stats">
        <div className="quick-stat">
          <RailIcon name="people" />
          <b>{totalDelivered.toLocaleString()}人</b>
          <small>はこんだ</small>
        </div>
        <div className="quick-stat">
          <RailIcon name="sun" />
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
            <RailIcon name={SPEED_LABELS[value].icon} />
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
          <RailIcon name="settings" />
        </button>
        {menuOpen && (
          <div className="settings__panel">
            <b>せってい</b>
            <button onClick={toggleMute}>{muted ? 'おとを だす' : 'おとを けす'}</button>
            <span>つづきは じどうで きろく中</span>
            <button className="settings__reset" onClick={onReset}>
              さいしょから
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
