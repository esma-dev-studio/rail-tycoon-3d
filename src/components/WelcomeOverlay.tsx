import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { RailIcon } from './RailIcon';

const WELCOME_KEY = 'rail-tycoon-3d-welcome-v3';

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
  const setBuildMode = useGameStore((state) => state.setBuildMode);

  if (!open) return null;

  const start = () => {
    try {
      window.localStorage.setItem(WELCOME_KEY, 'done');
    } catch {
      // 保存できない環境でも、そのまま遊び始められる。
    }
    setBuildMode('route');
    setOpen(false);
  };

  return (
    <div className="welcome welcome--v3" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="welcome__grid" aria-hidden />
      <div className="welcome__card">
        <div className="welcome__status">
          <span />
          RAILWAY CONTROL
        </div>
        <div className="welcome__train-mark" aria-hidden>
          <RailIcon name="train" />
        </div>
        <div className="welcome__eyebrow">きみが しゃちょう！</div>
        <h1 id="welcome-title">でんしゃの町を つくろう</h1>
        <p className="welcome__lead">
          やることは かんたん。町を 2つ えらぶだけ！
          <br />
          せんろと 電車を いっしょに つくれるよ。
        </p>

        <div className="welcome__steps">
          <div className="welcome-step">
            <span className="welcome-step__number">1</span>
            <RailIcon name="station" />
            <b>町を<br />えらぶ</b>
          </div>
          <span className="welcome__arrow" aria-hidden>›</span>
          <div className="welcome-step">
            <span className="welcome-step__number">2</span>
            <RailIcon name="route" />
            <b>ねだんを<br />見る</b>
          </div>
          <span className="welcome__arrow" aria-hidden>›</span>
          <div className="welcome-step">
            <span className="welcome-step__number">3</span>
            <RailIcon name="train" />
            <b>電車が<br />しゅっぱつ</b>
          </div>
        </div>

        <button className="welcome__start" onClick={start} autoFocus>
          <RailIcon name="play" />
          町を えらんで はじめる
        </button>
        <p className="welcome__save">つづきは じどうで きろくされるよ</p>
      </div>
    </div>
  );
}
