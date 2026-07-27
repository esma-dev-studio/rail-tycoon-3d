import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

const WELCOME_KEY = 'rail-tycoon-3d-welcome-v2';

function shouldShowWelcome(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(WELCOME_KEY) !== 'done';
  } catch {
    return true;
  }
}

export function WelcomeOverlay() {
  const [open, setOpen] = useState(shouldShowWelcome);
  const setBuildMode = useGameStore((s) => s.setBuildMode);

  if (!open) return null;

  const start = () => {
    try {
      window.localStorage.setItem(WELCOME_KEY, 'done');
    } catch {
      // 保存できない環境でも、そのまま遊び始められる。
    }
    setBuildMode('track');
    setOpen(false);
  };

  return (
    <div className="welcome" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="welcome__card">
        <div className="welcome__eyebrow">きみが しゃちょう！</div>
        <div className="welcome__train" aria-hidden>
          🚆
        </div>
        <h1 id="welcome-title">でんしゃの 町を つくろう</h1>
        <p className="welcome__lead">
          せんろを つないで、電車を はしらせよう。
          <br />
          おきゃくさんを はこぶと、町も お金も そだつよ！
        </p>

        <div className="welcome__steps">
          <div className="welcome-step">
            <span className="welcome-step__number">1</span>
            <span className="welcome-step__icon">🛤️</span>
            <b>せんろを<br />つなぐ</b>
          </div>
          <span className="welcome__arrow" aria-hidden>→</span>
          <div className="welcome-step">
            <span className="welcome-step__number">2</span>
            <span className="welcome-step__icon">🚆</span>
            <b>電車を<br />はしらせる</b>
          </div>
          <span className="welcome__arrow" aria-hidden>→</span>
          <div className="welcome-step">
            <span className="welcome-step__number">3</span>
            <span className="welcome-step__icon">🏙️</span>
            <b>町と お金を<br />そだてる</b>
          </div>
        </div>

        <button className="welcome__start" onClick={start} autoFocus>
          しゅっぱつ！ <span aria-hidden>🚆💨</span>
        </button>
        <p className="welcome__save">あそんだ つづきは、じどうで きろくされるよ</p>
      </div>
    </div>
  );
}
