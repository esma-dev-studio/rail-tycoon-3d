import { TRAIN_COST } from '../data/config';
import { MAX_TOWN_LEVEL, nextTownLevelRequirement } from '../data/progression';
import { TOWNS_BY_ID } from '../data/world';
import { useGameStore } from '../store/gameStore';
import { sim } from '../sim/simInstance';

function TownDetail({ id }: { id: string }) {
  useGameStore((s) => s.revision);
  const progress = useGameStore((s) => s.townProgress[id] ?? { delivered: 0, level: 1 });
  const town = TOWNS_BY_ID.get(id);
  if (!town) return null;
  const waiting = sim.waiting.get(id) ?? [];
  const byDestination = new Map<string, number>();
  for (const passenger of waiting) {
    byDestination.set(passenger.toTownId, (byDestination.get(passenger.toTownId) ?? 0) + 1);
  }
  const rows = [...byDestination.entries()].sort((a, b) => b[1] - a[1]);
  const next = nextTownLevelRequirement(progress.level);
  const pct = next ? Math.min(100, (progress.delivered / next) * 100) : 100;

  return (
    <>
      <div className="insp__title">
        <span className="dot" style={{ background: town.color }} />
        {town.name}
        <span className="insp__level">Lv.{progress.level}</span>
      </div>
      <div className="town-level-card">
        <div className="town-level-card__top">
          <span>🏙️ 町の せいちょう</span>
          <b>{progress.delivered}人 とどいた</b>
        </div>
        <div className="tiny-bar tiny-bar--large">
          <span style={{ width: `${pct}%` }} />
        </div>
        <small>
          {progress.level >= MAX_TOWN_LEVEL
            ? 'やったね！ さいこうレベルだよ'
            : `あと ${Math.max(0, (next ?? 0) - progress.delivered)}人で レベル${progress.level + 1}`}
        </small>
      </div>
      <div className="insp__row">
        <span>🧍 まってる人</span>
        <span>{waiting.length}人</span>
      </div>
      {rows.length > 0 && (
        <div className="insp__block">
          <div className="insp__blocktitle">いきたい ところ</div>
          {rows.map(([destination, count]) => (
            <div className="insp__row insp__row--sub" key={destination}>
              <span>{TOWNS_BY_ID.get(destination)?.name ?? destination}</span>
              <span>{count}人</span>
            </div>
          ))}
        </div>
      )}
      <p className="insp__note">
        この町に おきゃくさんが つくと、たてものや かざりが ふえていくよ！
      </p>
    </>
  );
}

function TrainDetail({ id }: { id: string }) {
  useGameStore((s) => s.revision);
  const trainDefs = useGameStore((s) => s.trainDefs);
  const lines = useGameStore((s) => s.lines);
  const definition = trainDefs.find((train) => train.id === id);
  if (!definition) return <div className="insp__title">この電車は もう いないよ</div>;
  const line = lines.find((candidate) => candidate.id === definition.lineId);
  const runtime = sim.trains.get(id);

  return (
    <>
      <div className="insp__title">
        <span className="dot" style={{ background: definition.color }} />
        電車 {id.replace('tr', 'No.')}
      </div>
      <div className="insp__row">
        <span>はしってる せん</span>
        <span>{line?.name ?? '—'}</span>
      </div>
      <div className="insp__row">
        <span>🙂 のってる人</span>
        <span>
          {runtime?.load.length ?? 0} / {runtime?.capacity ?? 0}人
        </span>
      </div>
      <p className="insp__note">駅に とまると、おきゃくさんが のりおりするよ。</p>
    </>
  );
}

function LineDetail({ id }: { id: string }) {
  useGameStore((s) => s.revision);
  const lines = useGameStore((s) => s.lines);
  const trainDefs = useGameStore((s) => s.trainDefs);
  const money = useGameStore((s) => s.money);
  const buyTrain = useGameStore((s) => s.buyTrain);
  const deleteLine = useGameStore((s) => s.deleteLine);
  const line = lines.find((candidate) => candidate.id === id);
  if (!line) return <div className="insp__title">この せんは もう ないよ</div>;
  const trainCount = trainDefs.filter((train) => train.lineId === id).length;

  const onDelete = () => {
    if (window.confirm(`${line.name}と、はしっている 電車を おしまいにする？`)) {
      deleteLine(id);
    }
  };

  return (
    <>
      <div className="insp__title">
        <span className="dot" style={{ background: line.color }} />
        {line.name}
      </div>
      <div className="insp__stations">
        {line.stations.map((station, index) => (
          <span key={station}>
            {index > 0 && <span className="insp__arrow">→</span>}
            <span className="insp__station">{TOWNS_BY_ID.get(station)?.name ?? station}</span>
          </span>
        ))}
      </div>
      <div className="insp__row">
        <span>🚃 電車の かず</span>
        <span>{trainCount}だい</span>
      </div>
      <div className="insp__actions">
        <button
          className="btn btn--primary"
          disabled={money < TRAIN_COST}
          onClick={() => buyTrain(id)}
        >
          🚃 電車を ふやす
          <small>{TRAIN_COST.toLocaleString()}円</small>
        </button>
        <button className="btn btn--danger" onClick={onDelete}>
          この せんを おしまいにする
        </button>
      </div>
    </>
  );
}

export function InspectorPanel() {
  const selection = useGameStore((s) => s.selection);
  const clearSelection = useGameStore((s) => s.clearSelection);
  if (!selection) return null;

  return (
    <aside className="inspector">
      <button className="inspector__close" onClick={clearSelection} aria-label="とじる">
        ✕
      </button>
      {selection.type === 'town' && <TownDetail id={selection.id} />}
      {selection.type === 'train' && <TrainDetail id={selection.id} />}
      {selection.type === 'line' && <LineDetail id={selection.id} />}
    </aside>
  );
}
