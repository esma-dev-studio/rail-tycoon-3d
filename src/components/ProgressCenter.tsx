import { useState } from 'react';
import {
  BADGES,
  MAX_TOWN_LEVEL,
  SAVINGS_GOALS,
  nextTownLevelRequirement,
} from '../data/progression';
import { useGameStore } from '../store/gameStore';

export function ProgressCenter() {
  const [open, setOpen] = useState(false);
  const towns = useGameStore((s) => s.towns);
  const townProgress = useGameStore((s) => s.townProgress);
  const money = useGameStore((s) => s.money);
  const savingsGoalIndex = useGameStore((s) => s.savingsGoalIndex);
  const trackEdges = useGameStore((s) => s.trackEdges);
  const lines = useGameStore((s) => s.lines);
  const totalDelivered = useGameStore((s) => s.totalDelivered);

  const maxTownLevel = Math.max(...Object.values(townProgress).map((p) => p.level));
  const reachedTowns = Object.values(townProgress).filter((p) => p.delivered > 0).length;
  const unlocked = new Set<string>();
  if (trackEdges.size > 0) unlocked.add('first-track');
  if (lines.length > 0) unlocked.add('first-line');
  if (totalDelivered >= 10) unlocked.add('ten-riders');
  if (maxTownLevel >= 2) unlocked.add('growing-town');
  if (savingsGoalIndex >= 1) unlocked.add('saver');
  if (reachedTowns === towns.length) unlocked.add('all-towns');

  return (
    <>
      <button className="progress-btn" onClick={() => setOpen(true)}>
        <span aria-hidden>🏙️</span>
        <span>町と ごほうび</span>
        <b>{unlocked.size}/{BADGES.length}</b>
      </button>

      {open && (
        <div className="progress-modal" role="dialog" aria-modal="true" aria-labelledby="progress-title">
          <div className="progress-card">
            <div className="progress-card__head">
              <div>
                <span className="progress-card__eyebrow">しゃちょうの きろく</span>
                <h2 id="progress-title">町と ごほうび</h2>
              </div>
              <button className="modal-close" onClick={() => setOpen(false)} aria-label="とじる">
                ✕
              </button>
            </div>

            <section className="progress-section">
              <h3>🐷 ちょきんの ごほうび</h3>
              <div className="reward-road">
                {SAVINGS_GOALS.map((goal, index) => {
                  const done = savingsGoalIndex > index;
                  return (
                    <div className={`reward-stop ${done ? 'is-done' : ''}`} key={goal.amount}>
                      <span className="reward-stop__icon">{done ? '✅' : goal.emoji}</span>
                      <div>
                        <b>{goal.amount.toLocaleString()}円</b>
                        <span>{goal.name}</span>
                      </div>
                      <small>+{goal.reward.toLocaleString()}円</small>
                    </div>
                  );
                })}
              </div>
              <p className="progress-section__note">
                いま <b>{money.toLocaleString()}円</b>。つかうか、ためるかは きみしだい！
              </p>
            </section>

            <section className="progress-section">
              <h3>🏙️ 町の せいちょう</h3>
              <div className="town-grid">
                {towns.map((town) => {
                  const progress = townProgress[town.id] ?? { delivered: 0, level: 1 };
                  const next = nextTownLevelRequirement(progress.level);
                  const pct = next ? Math.min(100, (progress.delivered / next) * 100) : 100;
                  return (
                    <div className="town-progress" key={town.id}>
                      <div className="town-progress__top">
                        <span className="dot" style={{ background: town.color }} />
                        <b>{town.name}</b>
                        <span>Lv.{progress.level}</span>
                      </div>
                      <div className="tiny-bar" aria-label={`${town.name}の せいちょう`}>
                        <span style={{ width: `${pct}%` }} />
                      </div>
                      <small>
                        {progress.level >= MAX_TOWN_LEVEL
                          ? 'さいこうレベル！'
                          : `あと ${Math.max(0, (next ?? 0) - progress.delivered)}人で レベルアップ`}
                      </small>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="progress-section">
              <h3>🏅 できたよバッジ</h3>
              <div className="badge-grid">
                {BADGES.map((badge) => {
                  const done = unlocked.has(badge.id);
                  return (
                    <div className={`badge ${done ? 'is-done' : ''}`} key={badge.id}>
                      <span>{done ? badge.emoji : '？'}</span>
                      <b>{done ? badge.name : 'まだ ひみつ'}</b>
                      <small>{done ? 'できた！' : badge.hint}</small>
                    </div>
                  );
                })}
              </div>
            </section>

            <button className="btn btn--primary progress-card__close" onClick={() => setOpen(false)}>
              町へ もどる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
