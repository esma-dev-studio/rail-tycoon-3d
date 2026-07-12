// ============================================================================
// 紙吹雪 — ミッションクリアの瞬間に画面上部から降らせる。
// CSSアニメーションのみで動く軽量実装。
// ============================================================================
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';

const COLORS = ['#ff6b6b', '#ffd24a', '#4fd6a3', '#5aa0e0', '#b07fe6', '#ff9f1a'];
const EMOJI = ['⭐', '🎉', '✨'];

interface Piece {
  id: number;
  left: number; // vw
  delay: number; // s
  dur: number; // s
  rot: number; // deg
  emoji?: string;
  color?: string;
  size: number; // px
}

function makeBurst(count: number, seed: number): Piece[] {
  // 疑似乱数(その場限りの見た目なので簡易でよい)
  let s = seed;
  const rng = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  return Array.from({ length: count }, (_, i) => {
    const isEmoji = rng() < 0.3;
    return {
      id: seed * 1000 + i,
      left: rng() * 100,
      delay: rng() * 0.5,
      dur: 1.6 + rng() * 1.2,
      rot: (rng() - 0.5) * 720,
      emoji: isEmoji ? EMOJI[Math.floor(rng() * EMOJI.length)] : undefined,
      color: COLORS[Math.floor(rng() * COLORS.length)],
      size: 8 + rng() * 8,
    };
  });
}

/** ミッション進行を監視して自動でバーストする紙吹雪 */
export function Confetti() {
  const missionIndex = useGameStore((s) => s.missionIndex);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const prev = useRef(missionIndex);

  useEffect(() => {
    if (missionIndex > prev.current) {
      setPieces(makeBurst(40, missionIndex + 1));
      const t = setTimeout(() => setPieces([]), 3200);
      prev.current = missionIndex;
      return () => clearTimeout(t);
    }
    prev.current = missionIndex; // リセット時は降らせない
  }, [missionIndex]);

  if (pieces.length === 0) return null;
  return <ConfettiRain pieces={pieces} />;
}

/** 描画だけの紙吹雪(クリア画面でも使う) */
export function ConfettiRain({ pieces }: { pieces: Piece[] }) {
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti__piece"
          style={{
            left: `${p.left}vw`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            ['--rot' as string]: `${p.rot}deg`,
            ...(p.emoji
              ? { fontSize: `${p.size + 8}px` }
              : { width: p.size, height: p.size * 0.6, background: p.color }),
          }}
        >
          {p.emoji ?? ''}
        </span>
      ))}
    </div>
  );
}

/** クリア画面用の大きめバースト */
export function bigBurst(): Piece[] {
  return makeBurst(70, 777);
}
