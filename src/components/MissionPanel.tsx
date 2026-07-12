// ============================================================================
// ミッションパネル(左上) — いまの目標・進捗バー・ごほうび。達成したら
// completeMission を呼ぶ(達成判定はストア側でも再検証される)。
// ============================================================================
import { useEffect } from 'react';
import { MISSIONS } from '../data/missions';
import { useGameStore } from '../store/gameStore';

export function MissionPanel() {
  const missionIndex = useGameStore((s) => s.missionIndex);
  const completeMission = useGameStore((s) => s.completeMission);
  const money = useGameStore((s) => s.money);
  const totalDelivered = useGameStore((s) => s.totalDelivered);
  const trackEdges = useGameStore((s) => s.trackEdges);
  const lines = useGameStore((s) => s.lines);
  const trainDefs = useGameStore((s) => s.trainDefs);
  const towns = useGameStore((s) => s.towns);
  useGameStore((s) => s.revision);

  const allClear = missionIndex >= MISSIONS.length;
  const mission = allClear ? null : MISSIONS[missionIndex];
  let cur = 0;
  let max = 1;
  if (mission) {
    [cur, max] = mission.progress({ money, totalDelivered, trackEdges, lines, trainDefs, towns });
  }
  const done = mission != null && cur >= max;

  useEffect(() => {
    if (done) completeMission(missionIndex);
  }, [done, missionIndex, completeMission]);

  if (allClear) {
    return (
      <div className="mission mission--clear">
        <div className="mission__head">🏆 ぜんぶ クリア！</div>
        <div className="mission__title">すきなように まちを つくって あそぼう！</div>
      </div>
    );
  }

  const pct = Math.round((cur / max) * 100);
  const fmt = (v: number) => (mission!.unit === 'yen' ? `${v.toLocaleString()}円` : v);

  return (
    <div className="mission">
      <div className="mission__head">
        ⭐ ミッション {missionIndex + 1} / {MISSIONS.length}
        <span className="mission__stars">
          {'★'.repeat(missionIndex)}
          {'☆'.repeat(MISSIONS.length - missionIndex)}
        </span>
      </div>
      <div className="mission__title">
        <span className="mission__emoji">{mission!.emoji}</span>
        {mission!.title}
      </div>
      {mission!.unit !== 'check' && (
        <div className="mission__progress">
          <div className="mission__bar">
            <div className="mission__fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="mission__nums">
            {fmt(cur)} / {fmt(max)}
          </div>
        </div>
      )}
      <div className="mission__hint">{mission!.hint}</div>
      {mission!.reward > 0 && (
        <div className="mission__reward">ごほうび：💰{mission!.reward.toLocaleString()}円</div>
      )}
    </div>
  );
}
