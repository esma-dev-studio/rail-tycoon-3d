import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { bigBurst, ConfettiRain } from './Confetti';

export function CelebrationOverlay() {
  const celebration = useGameStore((state) => state.celebration);
  const dismissCelebration = useGameStore((state) => state.dismissCelebration);
  const pieces = useMemo(() => bigBurst(), [celebration?.id]);

  if (!celebration) return null;

  return (
    <div className="celebration" role="dialog" aria-modal="true" aria-labelledby="celebration-title">
      <ConfettiRain pieces={pieces} />
      <div
        className="celebration__card"
        style={{ ['--celebration-color' as string]: celebration.color }}
      >
        <div className="celebration__shine" aria-hidden />
        <div className="celebration__icon" aria-hidden>{celebration.emoji}</div>
        <span className="celebration__eyebrow">{celebration.eyebrow}</span>
        <h2 id="celebration-title">{celebration.title}</h2>
        <p>{celebration.message}</p>
        <button onClick={dismissCelebration}>
          町を 見てみる！
        </button>
      </div>
    </div>
  );
}
