// ============================================================================
// 右側パネル — えらんだ 町/電車/ろせん のくわしい情報(小2向けのことば)
// ============================================================================
import { TRAIN_COST } from '../data/config';
import { TOWNS_BY_ID } from '../data/world';
import { useGameStore } from '../store/gameStore';
import { sim } from '../sim/simInstance';

function TownDetail({ id }: { id: string }) {
  useGameStore((s) => s.revision);
  const town = TOWNS_BY_ID.get(id);
  if (!town) return null;
  const q = sim.waiting.get(id) ?? [];
  const byDest = new Map<string, number>();
  for (const p of q) byDest.set(p.toTownId, (byDest.get(p.toTownId) ?? 0) + 1);
  const rows = [...byDest.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <>
      <div className="insp__title">
        <span className="dot" style={{ background: town.color }} />
        {town.name}
      </div>
      <div className="insp__row">
        <span>町の 大きさ</span>
        <span>{'★'.repeat(town.size)}</span>
      </div>
      <div className="insp__row">
        <span>🧍 まってる人</span>
        <span>{q.length}人</span>
      </div>
      {rows.length > 0 && (
        <div className="insp__block">
          <div className="insp__blocktitle">いきたい ところ</div>
          {rows.map(([dest, n]) => (
            <div className="insp__row insp__row--sub" key={dest}>
              <span>{TOWNS_BY_ID.get(dest)?.name ?? dest}</span>
              <span>{n}人</span>
            </div>
          ))}
        </div>
      )}
      <p className="insp__note">この町に 電車を はしらせると、みんなを はこべるよ！</p>
    </>
  );
}

function TrainDetail({ id }: { id: string }) {
  useGameStore((s) => s.revision);
  const trainDefs = useGameStore((s) => s.trainDefs);
  const lines = useGameStore((s) => s.lines);
  const def = trainDefs.find((t) => t.id === id);
  if (!def) return <div className="insp__title">この電車は もう いないよ</div>;
  const line = lines.find((l) => l.id === def.lineId);
  const rt = sim.trains.get(id);

  return (
    <>
      <div className="insp__title">
        <span className="dot" style={{ background: def.color }} />
        電車 {id.replace('tr', 'No.')}
      </div>
      <div className="insp__row">
        <span>はしってる ろせん</span>
        <span>{line?.name ?? '—'}</span>
      </div>
      <div className="insp__row">
        <span>🙂 のってる人</span>
        <span>
          {rt?.load.length ?? 0} / {rt?.capacity ?? 0}人
        </span>
      </div>
      <p className="insp__note">駅に とまると、お客さんが のりおりするよ。</p>
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
  const line = lines.find((l) => l.id === id);
  if (!line) return <div className="insp__title">この ろせんは もう ないよ</div>;
  const trainCount = trainDefs.filter((t) => t.lineId === id).length;

  return (
    <>
      <div className="insp__title">
        <span className="dot" style={{ background: line.color }} />
        {line.name}
      </div>
      <div className="insp__stations">
        {line.stations.map((s, i) => (
          <span key={s}>
            {i > 0 && <span className="insp__arrow">→</span>}
            <span className="insp__station">{TOWNS_BY_ID.get(s)?.name ?? s}</span>
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
          title={money < TRAIN_COST ? 'お金が たりないよ' : ''}
        >
          🚃 電車を ふやす（{TRAIN_COST.toLocaleString()}円）
        </button>
        <button className="btn btn--danger" onClick={() => deleteLine(id)}>
          この ろせんを やめる
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
    <div className="inspector">
      <button className="inspector__close" onClick={clearSelection} title="とじる">
        ✕
      </button>
      {selection.type === 'town' && <TownDetail id={selection.id} />}
      {selection.type === 'train' && <TrainDetail id={selection.id} />}
      {selection.type === 'line' && <LineDetail id={selection.id} />}
    </div>
  );
}
