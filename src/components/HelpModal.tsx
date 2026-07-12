// ============================================================================
// あそびかた — ❓ボタンで開く3ステップの説明
// ============================================================================
import { useState } from 'react';
import { TRACK_COST, BRIDGE_COST, TRAIN_COST } from '../data/config';

export function HelpModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="help-btn" onClick={() => setOpen(true)} title="あそびかた">
        ❓ あそびかた
      </button>
      {open && (
        <div className="help" onClick={() => setOpen(false)}>
          <div className="help__card" onClick={(e) => e.stopPropagation()}>
            <h2 className="help__title">🚆 あそびかた</h2>
            <ol className="help__steps">
              <li>
                <span className="help__step-icon">🛤</span>
                <div>
                  <b>せんろを つくる</b>
                  <br />
                  下の「せんろ」を おして、じめんを 2かい クリック！
                  <br />
                  <small>
                    1マス {TRACK_COST}円だよ（川を わたる はしは {BRIDGE_COST}円）
                  </small>
                </div>
              </li>
              <li>
                <span className="help__step-icon">🚆</span>
                <div>
                  <b>電車を はしらせる</b>
                  <br />
                  下の「電車」を おして、つないだ 町を 2つ クリック！
                  <br />
                  <small>電車は 1だい {TRAIN_COST.toLocaleString()}円だよ</small>
                </div>
              </li>
              <li>
                <span className="help__step-icon">💰</span>
                <div>
                  <b>お金を もらう</b>
                  <br />
                  電車が お客さんを はこぶと お金が もらえるよ！
                </div>
              </li>
            </ol>
            <p className="help__camera">🖱 ドラッグで まわす ／ ホイールで ちかづく</p>
            <button className="btn btn--primary help__close" onClick={() => setOpen(false)}>
              わかった！
            </button>
          </div>
        </div>
      )}
    </>
  );
}
