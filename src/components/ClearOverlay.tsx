// ============================================================================
// クリア画面 — 全ミッション達成のお祝い
// ============================================================================
import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { ConfettiRain, bigBurst } from './Confetti';

export function ClearOverlay() {
  const gameCleared = useGameStore((s) => s.gameCleared);
  const dismissClear = useGameStore((s) => s.dismissClear);
  const totalDelivered = useGameStore((s) => s.totalDelivered);
  const money = useGameStore((s) => s.money);
  const pieces = useMemo(() => bigBurst(), []);
  if (!gameCleared) return null;

  return (
    <div className="clear">
      <ConfettiRain pieces={pieces} />
      <div className="clear__card">
        <div className="clear__confetti">🎉🎊🎉</div>
        <div className="clear__trophy">🏆</div>
        <h1 className="clear__title">でんしゃマスター！</h1>
        <p className="clear__text">
          ミッションを ぜんぶ クリアしたよ！
          <br />
          おきゃくさんを <b>{totalDelivered.toLocaleString()}人</b> はこんで、
          <br />
          お金は <b>{money.toLocaleString()}円</b> になったよ。すごい！
        </p>
        <button className="btn btn--primary clear__btn" onClick={dismissClear}>
          つづけて あそぶ 🚆
        </button>
      </div>
    </div>
  );
}
