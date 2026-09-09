import { TRAIN_COST } from '../data/config';
import {
  MAX_LINE_UPGRADE_LEVEL,
  capacityUpgradeCost,
  lineCapacity,
  lineCapacityLevel,
  lineSpeedLevel,
  speedUpgradeCost,
} from '../data/lineUpgrades';
import { MAX_TOWN_LEVEL, nextTownLevelRequirement } from '../data/progression';
import { TOWNS_BY_ID } from '../data/world';
import { findTownRoute, townLineCount } from '../sim/network';
import { sim } from '../sim/simInstance';
import { lineWaitingCount, nextTrainStopTownId } from '../sim/simulation';
import { useGameStore } from '../store/gameStore';

function TownDetail({ id }: { id: string }) {
  useGameStore((state) => state.revision);
  const progress = useGameStore((state) => state.townProgress[id] ?? { delivered: 0, level: 1 });
  const lines = useGameStore((state) => state.lines);
  const town = TOWNS_BY_ID.get(id);
  if (!town) return null;

  const waiting = sim.waiting.get(id) ?? [];
  const byDestination = new Map<string, number>();
  for (const passenger of waiting) {
    byDestination.set(passenger.toTownId, (byDestination.get(passenger.toTownId) ?? 0) + 1);
  }
  const rows = [...byDestination.entries()].sort((left, right) => right[1] - left[1]);
  const next = nextTownLevelRequirement(progress.level);
  const pct = next ? Math.min(100, (progress.delivered / next) * 100) : 100;
  const lineCount = townLineCount(lines, id);

  return (
    <>
      <div className="insp__title">
        <span className="dot" style={{ background: town.color }} />
        {town.name}
        <span className="insp__level">Lv.{progress.level}</span>
      </div>
      {lineCount >= 2 && (
        <div className="insp__transfer-badge">🔁 のりかえ駅・{lineCount}本の せんろ</div>
      )}
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
            ? 'やったね！ レベル6まで そだったよ'
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
          {rows.map(([destination, count]) => {
            const route = findTownRoute(lines, id, destination);
            const transferTownId = route && route.length > 1 ? route[0].toTownId : null;
            return (
              <div className="insp__row insp__row--sub" key={destination}>
                <span>
                  {TOWNS_BY_ID.get(destination)?.name ?? destination}
                  {transferTownId && (
                    <small>（{TOWNS_BY_ID.get(transferTownId)?.name}で のりかえ）</small>
                  )}
                </span>
                <span>{count}人</span>
              </div>
            );
          })}
        </div>
      )}
      <p className="insp__note">
        のりかえは じどう。さいごの町につくと、町が そだつよ！
      </p>
    </>
  );
}

function TrainDetail({ id }: { id: string }) {
  useGameStore((state) => state.revision);
  const trainDefs = useGameStore((state) => state.trainDefs);
  const lines = useGameStore((state) => state.lines);
  const definition = trainDefs.find((train) => train.id === id);
  if (!definition) return <div className="insp__title">この電車は もう いないよ</div>;
  const line = lines.find((candidate) => candidate.id === definition.lineId);
  const runtime = sim.trains.get(id);
  const nextStop = runtime ? TOWNS_BY_ID.get(nextTrainStopTownId(runtime) ?? '') : null;

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
        <span>つぎの駅</span>
        <span>{nextStop?.name ?? 'しゅっぱつ じゅんび中'}</span>
      </div>
      <div className="insp__row">
        <span>🙂 のってる人</span>
        <span>{runtime?.load.length ?? 0} / {runtime?.capacity ?? 0}人</span>
      </div>
      {line && (
        <div className="train-power">
          <span>🚃 長さ Lv.{lineCapacityLevel(line)}</span>
          <span>⚡ 速さ Lv.{lineSpeedLevel(line)}</span>
        </div>
      )}
      <p className="insp__note">終点についたら むきをかえて、帰りも はしるよ。</p>
    </>
  );
}

function congestionFor(waiting: number): { emoji: string; label: string; level: string; advice: string } {
  if (waiting >= 10) {
    return {
      emoji: '😵',
      label: '大こんざつ！',
      level: 'busy',
      advice: '電車をふやすか、長い電車に しよう',
    };
  }
  if (waiting >= 4) {
    return {
      emoji: '😅',
      label: 'ちょっと こんでる',
      level: 'medium',
      advice: 'もうすぐ 電車をふやすと よさそう',
    };
  }
  return {
    emoji: '😊',
    label: 'すいている',
    level: 'calm',
    advice: 'いまは じゅんちょう！',
  };
}

function LineDetail({ id }: { id: string }) {
  useGameStore((state) => state.revision);
  const lines = useGameStore((state) => state.lines);
  const trainDefs = useGameStore((state) => state.trainDefs);
  const money = useGameStore((state) => state.money);
  const missionIndex = useGameStore((state) => state.missionIndex);
  const buyTrain = useGameStore((state) => state.buyTrain);
  const upgradeLineCapacity = useGameStore((state) => state.upgradeLineCapacity);
  const upgradeLineSpeed = useGameStore((state) => state.upgradeLineSpeed);
  const deleteLine = useGameStore((state) => state.deleteLine);
  const line = lines.find((candidate) => candidate.id === id);
  if (!line) return <div className="insp__title">この せんは もう ないよ</div>;

  const trainCount = trainDefs.filter((train) => train.lineId === id).length;
  const waiting = lineWaitingCount(sim, lines, id);
  const congestion = congestionFor(waiting);
  const capacityLevel = lineCapacityLevel(line);
  const speedLevel = lineSpeedLevel(line);
  const capacityCost = capacityUpgradeCost(line);
  const speedCost = speedUpgradeCost(line);
  const upgradesUnlocked = missionIndex >= 6;

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
      <div className="insp__direction">↔ どちら向きにも はしるよ</div>
      <div className="insp__stations">
        {line.stations.map((station, index) => (
          <span key={station}>
            {index > 0 && <span className="insp__arrow">↔</span>}
            <span className="insp__station">{TOWNS_BY_ID.get(station)?.name ?? station}</span>
          </span>
        ))}
      </div>

      <div className={`congestion-card is-${congestion.level}`}>
        <span className="congestion-card__face">{congestion.emoji}</span>
        <div>
          <small>この路線を まっている人</small>
          <b>{congestion.label}・{waiting}人</b>
          <span>{congestion.advice}</span>
        </div>
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
      </div>

      <div className="line-upgrades">
        <div className="line-upgrades__head">
          <div>
            <small>第2しょうから</small>
            <b>路線を パワーアップ</b>
          </div>
          {!upgradesUnlocked && <span>🔒 まだ ひみつ</span>}
        </div>
        <button
          className="upgrade-card"
          disabled={!upgradesUnlocked || capacityCost == null || money < capacityCost}
          onClick={() => upgradeLineCapacity(id)}
        >
          <span className="upgrade-card__emoji">🚃</span>
          <span>
            <b>長い電車 Lv.{capacityLevel}/{MAX_LINE_UPGRADE_LEVEL}</b>
            <small>{lineCapacity(line)}人 のれる</small>
          </span>
          <strong>{capacityCost == null ? 'MAX' : `${capacityCost.toLocaleString()}円`}</strong>
        </button>
        <button
          className="upgrade-card"
          disabled={!upgradesUnlocked || speedCost == null || money < speedCost}
          onClick={() => upgradeLineSpeed(id)}
        >
          <span className="upgrade-card__emoji">⚡</span>
          <span>
            <b>速い電車 Lv.{speedLevel}/{MAX_LINE_UPGRADE_LEVEL}</b>
            <small>駅へ はやく つく</small>
          </span>
          <strong>{speedCost == null ? 'MAX' : `${speedCost.toLocaleString()}円`}</strong>
        </button>
      </div>

      <button className="btn btn--danger line-delete" onClick={onDelete}>
        この せんを おしまいにする
      </button>
    </>
  );
}

export function InspectorPanel() {
  const selection = useGameStore((state) => state.selection);
  const clearSelection = useGameStore((state) => state.clearSelection);
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
