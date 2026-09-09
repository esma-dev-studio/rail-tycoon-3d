// ============================================================================
// 町から届く「おねがい」— いま1つだけを大きく見せ、迷いをなくす。
// ============================================================================
import { useEffect } from 'react';
import {
  MISSIONS,
  endlessChallengeReward,
  endlessDeliveryTarget,
} from '../data/missions';
import { useGameStore } from '../store/gameStore';
import { largestConnectedTownCount } from '../sim/network';

export function MissionPanel() {
  const missionIndex = useGameStore((state) => state.missionIndex);
  const completeMission = useGameStore((state) => state.completeMission);
  const completeEndlessChallenge = useGameStore((state) => state.completeEndlessChallenge);
  const endlessChallengeLevel = useGameStore((state) => state.endlessChallengeLevel);
  const gameCleared = useGameStore((state) => state.gameCleared);
  const money = useGameStore((state) => state.money);
  const totalDelivered = useGameStore((state) => state.totalDelivered);
  const totalTransferDelivered = useGameStore((state) => state.totalTransferDelivered);
  const trackEdges = useGameStore((state) => state.trackEdges);
  const lines = useGameStore((state) => state.lines);
  const trainDefs = useGameStore((state) => state.trainDefs);
  const towns = useGameStore((state) => state.towns);
  const townProgress = useGameStore((state) => state.townProgress);
  const ownedDecorations = useGameStore((state) => state.ownedDecorations);
  useGameStore((state) => state.revision);
  const connectedTowns = largestConnectedTownCount(lines, towns);

  const allChaptersClear = missionIndex >= MISSIONS.length;
  const mission = allChaptersClear ? null : MISSIONS[missionIndex];
  let cur = 0;
  let max = 1;
  if (mission) {
    [cur, max] = mission.progress({
      money,
      totalDelivered,
      totalTransferDelivered,
      trackEdges,
      lines,
      trainDefs,
      towns,
      townProgress,
      ownedDecorations,
    });
  }
  const done = mission != null && cur >= max;
  const endlessTarget = endlessDeliveryTarget(endlessChallengeLevel);
  const endlessDone = allChaptersClear && totalDelivered >= endlessTarget;

  useEffect(() => {
    if (done && !gameCleared) completeMission(missionIndex);
  }, [done, gameCleared, missionIndex, completeMission]);

  useEffect(() => {
    if (endlessDone && !gameCleared) completeEndlessChallenge(endlessChallengeLevel);
  }, [
    completeEndlessChallenge,
    endlessChallengeLevel,
    endlessDone,
    gameCleared,
  ]);

  if (allChaptersClear) {
    const previousTarget = endlessDeliveryTarget(endlessChallengeLevel - 1);
    const chapterProgress = Math.max(0, totalDelivered - previousTarget);
    const chapterMax = endlessTarget - previousTarget;
    const pct = Math.min(100, (chapterProgress / chapterMax) * 100);
    return (
      <section className="mission mission--endless" aria-label="ずっとチャレンジ">
        <div className="mission__topline">
          <span>🏅 ずっとチャレンジ {endlessChallengeLevel}</span>
          <b>町は レベル6まで そだつ！</b>
        </div>
        <div className="mission__request">
          <span className="mission__portrait" aria-hidden>🚆</span>
          <div className="mission__copy">
            <div className="mission__from">てつくんからの ちょうせん</div>
            <div className="mission__title">{endlessTarget}人を えがおに しよう</div>
          </div>
        </div>
        <div className="mission__progress">
          <div className="mission__bar" aria-label={`${chapterProgress} / ${chapterMax}`}>
            <div className="mission__fill" style={{ width: `${pct}%` }} />
          </div>
          <strong>{chapterProgress} / {chapterMax}</strong>
        </div>
        <div className="mission__hint">こんでいる路線を そだてると、もっと はこべるよ</div>
        <div className="mission__reward">
          できたら <b>+{endlessChallengeReward(endlessChallengeLevel).toLocaleString()}円</b>
        </div>
      </section>
    );
  }

  const pct = Math.round((cur / max) * 100);
  const fmt = (value: number) =>
    mission!.unit === 'yen' ? `${value.toLocaleString()}円` : `${value}`;
  const chapterMissions = MISSIONS.filter((candidate) => candidate.chapter === mission!.chapter);
  const chapterStart = MISSIONS.findIndex((candidate) => candidate.chapter === mission!.chapter);
  const chapterStep = missionIndex - chapterStart + 1;

  return (
    <section className="mission" aria-label="いまの おねがい">
      <div className="mission__topline">
        <span>第{mission!.chapter}しょう・{chapterMissions[0]?.title}</span>
        <b>{chapterStep}/{chapterMissions.length}</b>
      </div>
      <div className="mission__network-line">
        🚉 1つにつながった町 {connectedTowns}/{towns.length}
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
