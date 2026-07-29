// ============================================================================
// 6つのおねがい達成 — 短い物語のエンディングと、自由遊びへの入口。
// ============================================================================
import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { ConfettiRain, bigBurst } from './Confetti';

export function ClearOverlay() {
  const gameCleared = useGameStore((state) => state.gameCleared);
  const dismissClear = useGameStore((state) => state.dismissClear);
  const totalDelivered = useGameStore((state) => state.totalDelivered);
  const money = useGameStore((state) => state.money);
  const decorations = useGameStore((state) => state.ownedDecorations.length);
  const pieces = useMemo(() => bigBurst(), []);
  if (!gameCleared) return null;

  return (
    <div className="clear clear--v4">
      <ConfettiRain pieces={pieces} />
      <div className="clear__card">
        <div className="clear__confetti">✨ 🚆 ✨</div>
        <div className="clear__trophy">👑</div>
        <span className="clear__eyebrow">5つの町から ありがとう！</span>
        <h1 className="clear__title">でんしゃの町<br />だいせいこう！</h1>
        <p className="clear__text">
          ぜんぶの町に せんろが とどいたよ。
          <br />
          <b>{totalDelivered.toLocaleString()}人</b>が えがおに なって、
          町には <b>{decorations}こ</b>の プレゼント！
        </p>
        <div className="clear__score">
          <span>⭐ おねがい 6/6</span>
          <span>💰 {money.toLocaleString()}円</span>
        </div>
        <button className="btn btn--primary clear__btn" onClick={dismissClear}>
          もっと すてきな町を つくる！
        </button>
      </div>
    </div>
  );
}
