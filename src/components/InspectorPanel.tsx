// ============================================================================
// 右側インスペクタ — 選択中の町/列車/路線の詳細と操作
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
        <span>規模</span>
        <span>{'★'.repeat(town.size)}</span>
      </div>
      <div className="insp__row">
        <span>待ち乗客</span>
        <span>{q.length}人</span>
      </div>
      {rows.length > 0 && (
        <div className="insp__block">
          <div className="insp__blocktitle">行き先の内訳</div>
          {rows.map(([dest, n]) => (
            <div className="insp__row insp__row--sub" key={dest}>
              <span>{TOWNS_BY_ID.get(dest)?.name ?? dest}</span>
              <span>{n}人</span>
            </div>
          ))}
        </div>
      )}
      <p className="insp__note">この町を起点/終点にして「路線」を開設すると乗客を運べます。</p>
    </>
  );
}

function TrainDetail({ id }: { id: string }) {
  useGameStore((s) => s.revision);
  const trainDefs = useGameStore((s) => s.trainDefs);
  const lines = useGameStore((s) => s.lines);
  const def = trainDefs.find((t) => t.id === id);
  if (!def) return <div className="insp__title">列車は撤去されました</div>;
  const line = lines.find((l) => l.id === def.lineId);
  const rt = sim.trains.get(id);

  return (
    <>
      <div className="insp__title">
        <span className="dot" style={{ background: def.color }} />
        列車 {id.replace('tr', '#')}
      </div>
      <div className="insp__row">
        <span>所属路線</span>
        <span>{line?.name ?? '—'}</span>
      </div>
      <div className="insp__row">
        <span>乗車中</span>
        <span>
          {rt?.load.length ?? 0} / {rt?.capacity ?? 0}人
        </span>
      </div>
      <p className="insp__note">路線の駅間を自動で往復し、乗客を乗降させて運賃を稼ぎます。</p>
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
  if (!line) return <div className="insp__title">路線は撤去されました</div>;
  const trainCount = trainDefs.filter((t) => t.lineId === id).length;

  return (
    <>
      <div className="insp__title">
        <span className="dot" style={{ background: line.color }} />
        {line.name}
      </div>
      <div className="insp__row">
        <span>停車駅</span>
        <span>{line.stations.length}駅</span>
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
        <span>編成数</span>
        <span>{trainCount}両</span>
      </div>
      <div className="insp__actions">
        <button
          className="btn btn--primary"
          disabled={money < TRAIN_COST}
          onClick={() => buyTrain(id)}
          title={money < TRAIN_COST ? '資金不足' : ''}
        >
          ＋列車を増発 (¥{TRAIN_COST.toLocaleString()})
        </button>
        <button className="btn btn--danger" onClick={() => deleteLine(id)}>
          路線を廃止
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
      <button className="inspector__close" onClick={clearSelection} title="閉じる">
        ✕
      </button>
      {selection.type === 'town' && <TownDetail id={selection.id} />}
      {selection.type === 'train' && <TrainDetail id={selection.id} />}
      {selection.type === 'line' && <LineDetail id={selection.id} />}
    </div>
  );
}
