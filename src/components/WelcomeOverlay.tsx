import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { RailIcon } from './RailIcon';
import { ConductorMark } from './MascotCoach';

const WELCOME_KEY = 'rail-tycoon-3d-welcome-v6-growth';

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
  const hasRailway = useGameStore((state) => state.lines.length > 0);

  if (!open) return null;

  const start = () => {
    try {
      window.localStorage.setItem(WELCOME_KEY, 'done');
    } catch {
      // 保存できない環境でも、そのまま遊び始められる。
    }
    setBuildMode(hasRailway ? 'inspect' : 'route');
    setOpen(false);
  };

  return (
    <div className="welcome welcome--v4" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="welcome-v4__sky" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="welcome__card welcome-v4__card">
        <div className="welcome-v4__hero">
          <ConductorMark />
          <div>
            <span className="welcome__eyebrow">てつくんと いっしょに</span>
            <h1 id="welcome-title">わくわく<br />でんしゃの町</h1>
            <p>
              せんろを つないで、電車を そだてて、
              <br />
              みんなを いきたい町へ とどけよう！
            </p>
          </div>
        </div>

        <div className="welcome-v4__promise">
          <div>
            <span><RailIcon name="route" /></span>
            <b>第1しょう<br />町を つなぐ</b>
          </div>
          <i aria-hidden>→</i>
          <div>
            <span className="welcome-v4__symbol">🚃</span>
            <b>第2しょう<br />電車を そだてる</b>
          </div>
          <i aria-hidden>→</i>
          <div>
            <span className="welcome-v4__symbol">🌟</span>
            <b>第3しょう<br />町を そだてる</b>
          </div>
        </div>

        <div className="welcome-v4__first welcome-v4__first--network">
          <span>まずは 第1しょう</span>
          <b>5つの町を 1つにつなげよう！</b>
          <small>つないでも おわりじゃないよ。新しい あそびが ひらくよ！</small>
        </div>

        <button className="welcome__start welcome-v4__start" onClick={start} autoFocus>
          <RailIcon name="play" />
          しゃちょうに なって はじめる
        </button>
        <p className="welcome__save">
          つなぐ → はこぶ → お金をためる → 電車と町が そだつ！
        </p>
      </div>
    </div>
  );
}
