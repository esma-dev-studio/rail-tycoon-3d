import { useState } from 'react';
import { TRACK_COST, BRIDGE_COST, TRAIN_COST } from '../data/config';

export function HelpModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="help-btn" onClick={() => setOpen(true)}>
        ❓ <span>あそびかた</span>
      </button>
      {open && (
        <div className="help" role="dialog" aria-modal="true" aria-labelledby="help-title">
          <div className="help__card">
            <div className="help__head">
              <h2 className="help__title" id="help-title">🚆 あそびかた</h2>
              <button className="modal-close" onClick={() => setOpen(false)} aria-label="とじる">✕</button>
            </div>
            <ol className="help__steps">
              <li>
                <span className="help__step-icon">🛤️</span>
                <div>
                  <b>せんろを つくる</b>
                  <p>「せんろ」を おして、町を 2つ おそう。</p>
                  <small>1マス {TRACK_COST}円 ／ 川の はしは {BRIDGE_COST}円</small>
                </div>
              </li>
              <li>
                <span className="help__step-icon">🚆</span>
                <div>
                  <b>電車を はしらせる</b>
                  <p>「電車」を おして、つながった 町を 2つ おそう。</p>
                  <small>電車は 1だい {TRAIN_COST.toLocaleString()}円</small>
                </div>
              </li>
              <li>
                <span className="help__step-icon">🐷</span>
                <div>
                  <b>お金を ためる</b>
                  <p>おきゃくさんを はこぶたびに、お金が ふえるよ。</p>
                  <small>ちょきんの もくひょうで ごほうびゲット！</small>
                </div>
              </li>
              <li>
                <span className="help__step-icon">🏙️</span>
                <div>
                  <b>町を そだてる</b>
                  <p>町へ 人を はこぶと、たてものや かざりが ふえるよ。</p>
                  <small>「町と ごほうび」で せいちょうを 見られるよ。</small>
                </div>
              </li>
            </ol>
            <p className="help__camera">🖱️ ドラッグで まわす ／ ホイールで ちかづく</p>
            <button className="btn btn--primary help__close" onClick={() => setOpen(false)}>
              わかった！
            </button>
          </div>
        </div>
      )}
    </>
  );
}
