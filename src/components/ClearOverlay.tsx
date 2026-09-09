// ============================================================================
// 章クリア — ゲームの終わりではなく、次の遊びを開く大きなお祝い。
// ============================================================================
import { useMemo } from 'react';
import { CHAPTERS, MISSIONS } from '../data/missions';
import { useGameStore } from '../store/gameStore';
import { ConfettiRain, bigBurst } from './Confetti';

export function ClearOverlay() {
  const gameCleared = useGameStore((state) => state.gameCleared);
  const dismissClear = useGameStore((state) => state.dismissClear);
  const missionIndex = useGameStore((state) => state.missionIndex);
  const totalDelivered = useGameStore((state) => state.totalDelivered);
  const money = useGameStore((state) => state.money);
  const pieces = useMemo(() => bigBurst(), []);
  if (!gameCleared) return null;

  const completedMission = MISSIONS[Math.max(0, missionIndex - 1)];
  const chapter = CHAPTERS[(completedMission?.chapter ?? 1) - 1] ?? CHAPTERS[0];
  const hasNextChapter = chapter.number < CHAPTERS.length;

  return (
    <div className="clear clear--v4 clear--chapter">
      <ConfettiRain pieces={pieces} />
      <div className="clear__card">
        <div className="clear__confetti">✨ 🚆 ⭐ 🚆 ✨</div>
        <div className="clear__trophy">{chapter.emoji}</div>
        <span className="clear__eyebrow">第{chapter.number}しょう クリア！</span>
        <h1 className="clear__title">{chapter.clearTitle}</h1>
        <p className="clear__text">
          {chapter.number === 1 && (
            <>
              これは ゲームの おわりじゃないよ。
              <br />
            </>
          )}
          {chapter.unlock}
        </p>
        <div className="chapter-unlock">
          <span>{hasNextChapter ? '🔓 あたらしい あそび' : '🏅 ずっと あそべる'}</span>
          <b>
            {chapter.number === 1 && '長い電車・スピードアップ'}
            {chapter.number === 2 && '町をレベル6まで育てる目標'}
            {chapter.number === 3 && '50人ごとのずっとチャレンジ'}
          </b>
        </div>
        <div className="clear__score">
          <span>🙂 えがお {totalDelivered.toLocaleString()}人</span>
          <span>💰 {money.toLocaleString()}円</span>
        </div>
        <button className="btn btn--primary clear__btn" onClick={dismissClear}>
          {hasNextChapter ? `第${chapter.number + 1}しょうへ すすむ！` : 'もっと 町を そだてる！'}
        </button>
      </div>
    </div>
  );
}
