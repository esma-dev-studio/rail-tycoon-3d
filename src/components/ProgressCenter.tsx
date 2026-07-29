import { useMemo, useState } from 'react';
import { DECORATIONS } from '../data/decorations';
import {
  MAX_TOWN_LEVEL,
  SAVINGS_GOALS,
  nextTownLevelRequirement,
} from '../data/progression';
import { useGameStore } from '../store/gameStore';
import { RailIcon } from './RailIcon';

type BookTab = 'shop' | 'stamps' | 'towns';

export function ProgressCenter() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<BookTab>('shop');
  const towns = useGameStore((state) => state.towns);
  const townProgress = useGameStore((state) => state.townProgress);
  const money = useGameStore((state) => state.money);
  const savingsGoalIndex = useGameStore((state) => state.savingsGoalIndex);
  const lines = useGameStore((state) => state.lines);
  const ownedDecorations = useGameStore((state) => state.ownedDecorations);
  const buyDecoration = useGameStore((state) => state.buyDecoration);

  const servedTownIds = useMemo(
    () => new Set(lines.flatMap((line) => line.stations)),
    [lines],
  );
  const firstAffordable = DECORATIONS.find(
    (item) => !ownedDecorations.includes(item.id) && money >= item.price,
  )?.id;

  const showBook = (nextTab: BookTab) => {
    setTab(nextTab);
    setOpen(true);
  };

  return (
    <>
      <button className="progress-btn" onClick={() => showBook('shop')}>
        <RailIcon name="gift" />
        <span>
          <small>お金で 町が かわる！</small>
          ごほうびの町
        </span>
        <b>{ownedDecorations.length}/{DECORATIONS.length}</b>
      </button>

      {open && (
        <div className="progress-modal" role="dialog" aria-modal="true" aria-labelledby="progress-title">
          <div className="progress-card progress-card--v4">
            <div className="progress-card__head">
              <div>
                <span className="progress-card__eyebrow">しゃちょうの わくわくノート</span>
                <h2 id="progress-title">ごほうびの町</h2>
              </div>
              <div className="book-summary">
                <span>🎁 {ownedDecorations.length}/{DECORATIONS.length}</span>
                <span>🚉 {servedTownIds.size}/{towns.length}</span>
              </div>
              <button className="modal-close" onClick={() => setOpen(false)} aria-label="とじる">
                ✕
              </button>
            </div>

            <div className="book-tabs" role="tablist" aria-label="わくわくノート">
              <button
                className={tab === 'shop' ? 'is-active' : ''}
                onClick={() => setTab('shop')}
                role="tab"
                aria-selected={tab === 'shop'}
              >
                <RailIcon name="gift" /> 町のおみせ
              </button>
              <button
                className={tab === 'stamps' ? 'is-active' : ''}
                onClick={() => setTab('stamps')}
                role="tab"
                aria-selected={tab === 'stamps'}
              >
                <RailIcon name="stamp" /> えきスタンプ
              </button>
              <button
                className={tab === 'towns' ? 'is-active' : ''}
                onClick={() => setTab('towns')}
                role="tab"
                aria-selected={tab === 'towns'}
              >
                <RailIcon name="city" /> 町の せいちょう
              </button>
            </div>

            {tab === 'shop' && (
              <div className="book-page">
                <div className="shop-intro">
                  <div className="shop-intro__mascot" aria-hidden>🎁</div>
                  <div>
                    <b>はこんで ためた お金を、町の けしきに かえよう！</b>
                    <span>かった かざりは、3Dの町に ほんとうに あらわれるよ。</span>
                  </div>
                  <strong>{money.toLocaleString()}円</strong>
                </div>

                <div className="decoration-grid">
                  {DECORATIONS.map((item) => {
                    const owned = ownedDecorations.includes(item.id);
                    const affordable = money >= item.price;
                    return (
                      <article
                        className={`decoration-card ${owned ? 'is-owned' : ''} ${
                          item.id === firstAffordable ? 'is-recommended' : ''
                        }`}
                        key={item.id}
                        style={{ ['--gift-color' as string]: item.color }}
                      >
                        {item.id === firstAffordable && !owned && (
                          <span className="decoration-card__pick">おすすめ</span>
                        )}
                        <div className="decoration-card__picture" aria-hidden>{item.emoji}</div>
                        <div className="decoration-card__copy">
                          <b>{item.name}</b>
                          <span>{item.hint}</span>
                        </div>
                        <button
                          disabled={owned || !affordable}
                          onClick={() => buyDecoration(item.id)}
                        >
                          {owned
                            ? '町に あるよ！'
                            : affordable
                              ? `${item.price.toLocaleString()}円で おく`
                              : `あと ${(item.price - money).toLocaleString()}円`}
                        </button>
                      </article>
                    );
                  })}
                </div>

                <div className="savings-strip">
                  <span>🐷 ちょきんメダル</span>
                  {SAVINGS_GOALS.map((goal, index) => (
                    <div className={savingsGoalIndex > index ? 'is-done' : ''} key={goal.amount}>
                      <i>{savingsGoalIndex > index ? '✓' : goal.emoji}</i>
                      <small>{goal.amount.toLocaleString()}円</small>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'stamps' && (
              <div className="book-page">
                <div className="stamp-message">
                  <strong>{servedTownIds.size === towns.length ? 'ぜんぶ あつまった！' : 'せんろが とどくと スタンプが もらえるよ'}</strong>
                  <span>あと {towns.length - servedTownIds.size}こ</span>
                </div>
                <div className="stamp-grid">
                  {towns.map((town, index) => {
                    const done = servedTownIds.has(town.id);
                    return (
                      <div
                        className={`town-stamp ${done ? 'is-done' : ''}`}
                        key={town.id}
                        style={{ ['--town-color' as string]: town.color }}
                      >
                        <span className="town-stamp__number">{index + 1}</span>
                        <span className="town-stamp__mark">{done ? '🚉' : '？'}</span>
                        <b>{done ? town.name : 'まだ ひみつ'}</b>
                        <small>{done ? 'つながった！' : 'せんろを とどけよう'}</small>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === 'towns' && (
              <div className="book-page">
                <div className="town-grid town-grid--book">
                  {towns.map((town) => {
                    const progress = townProgress[town.id] ?? { delivered: 0, level: 1 };
                    const next = nextTownLevelRequirement(progress.level);
                    const pct = next ? Math.min(100, (progress.delivered / next) * 100) : 100;
                    return (
                      <div className="town-progress town-progress--book" key={town.id}>
                        <div className="town-progress__badge" style={{ background: town.color }}>
                          {progress.level}
                        </div>
                        <div className="town-progress__body">
                          <div className="town-progress__top">
                            <b>{town.name}</b>
                            <span>そだち {progress.level}/{MAX_TOWN_LEVEL}</span>
                          </div>
                          <div className="tiny-bar" aria-label={`${town.name}の せいちょう`}>
                            <span style={{ width: `${pct}%` }} />
                          </div>
                          <small>
                            {progress.level >= MAX_TOWN_LEVEL
                              ? '町が さいこうに にぎやか！'
                              : `あと ${Math.max(0, (next ?? 0) - progress.delivered)}人で たてものが ふえる`}
                          </small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button className="book-back" onClick={() => setOpen(false)}>
              町へ もどる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
