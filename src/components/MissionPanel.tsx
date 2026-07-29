// ============================================================================
// 町から届く「おねがい」— いま1つだけを大きく見せ、迷いをなくす。
// ============================================================================
import { useEffect } from 'react';
import { MISSIONS } from '../data/missions';
import { useGameStore } from '../store/gameStore';

export function MissionPanel() {
  const missionIndex = useGameStore((state) => state.missionIndex);
  const completeMission = useGameStore((state) => state.completeMission);
  const money = useGameStore((state) => state.money);
  const totalDelivered = useGameStore((state) => state.totalDelivered);
  const trackEdges = useGameStore((state) => state.trackEdges);
  const lines = useGameStore((state) => state.lines);
  const trainDefs = useGameStore((state) => state.trainDefs);
  const towns = useGameStore((state) => state.towns);
  const ownedDecorations = useGameStore((state) => state.ownedDecorations);
  useGameStore((state) => state.revision);

  const allClear = missionIndex >= MISSIONS.length;
  const mission = allClear ? null : MISSIONS[missionIndex];
  let cur = 0;
  let max = 1;
  if (mission) {
    [cur, max] = mission.progress({
      money,
      totalDelivered,
      trackEdges,
      lines,
      trainDefs,
      towns,
      ownedDecorations,
    });
  }
  const done = mission != null && cur >= max;

  useEffect(() => {
    if (done) completeMission(missionIndex);
  }, [done, missionIndex, completeMission]);

  if (allClear) {
    return (
      <div className="mission mission--clear">
        <span className="mission__portrait">👑</span>
        <div>
          <div className="mission__from">みんなから ありがとう！</div>
          <div className="mission__title">きみだけの町を もっと そだてよう</div>
        </div>
      </div>
    );
  }

  const pct = Math.round((cur / max) * 100);
  const fmt = (value: number) =>
    mission!.unit === 'yen' ? `${value.toLocaleString()}円` : `${value}`;

  return (
    <section className="mission" aria-label="いまの おねがい">
      <div className="mission__topline">
        <span>いまの おねがい</span>
        <b>
          {'★'.repeat(missionIndex)}
          {'☆'.repeat(MISSIONS.length - missionIndex)}
        </b>
      </div>
      <div className="mission__request">
        <span className="mission__portrait" aria-hidden>{mission!.emoji}</span>
        <div className="mission__copy">
          <div className="mission__from">{mission!.from} より</div>
          <div className="mission__title">{mission!.title}</div>
        </div>
      </div>
      {mission!.unit !== 'check' && (
        <div className="mission__progress">
          <div className="mission__bar" aria-label={`${fmt(cur)} / ${fmt(max)}`}>
            <div className="mission__fill" style={{ width: `${pct}%` }} />
          </div>
          <strong>{fmt(cur)} / {fmt(max)}</strong>
        </div>
      )}
      <div className="mission__hint">{mission!.hint}</div>
      <div className="mission__reward">
        できたら <b>+{mission!.reward.toLocaleString()}円</b>
      </div>
    </section>
  );
}
