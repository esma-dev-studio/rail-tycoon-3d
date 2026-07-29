import { useState } from 'react';
import { TRACK_COST, BRIDGE_COST, TRAIN_COST } from '../data/config';
import { RailIcon } from './RailIcon';

export function HelpModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="help-btn" onClick={() => setOpen(true)}>
        <RailIcon name="help" />
        <span>あそびかた</span>
      </button>
      {open && (
        <div className="help" role="dialog" aria-modal="true" aria-labelledby="help-title">
          <div className="help__card help__card--v4">
            <div className="help__head">
              <div>
                <span className="help__eyebrow">こまったら ここ！</span>
                <h2 className="help__title" id="help-title">あそびかた</h2>
              </div>
              <button className="modal-close" onClick={() => setOpen(false)} aria-label="とじる">✕</button>
            </div>
            <ol className="help__steps">
              <li>
                <span className="help__step-icon"><RailIcon name="route" /></span>
                <div>
                  <b>1　町を 2つ えらぶ</b>
                  <p>下の「新しいせんろ」を おして、町の名前を 2つ おそう。</p>
                  <small>ねだんを見てから つくれるので、まちがえても だいじょうぶ！</small>
                </div>
              </li>
              <li>
                <span className="help__step-icon"><RailIcon name="people" /></span>
                <div>
                  <b>2　電車と えがおを 見る</b>
                  <p>さいしょから 3人が のっているよ。町につくと お金が ふえる！</p>
                  <small>町のふきだしには、みんなの いきたい町が 出るよ</small>
                </div>
              </li>
              <li>
                <span className="help__step-icon"><RailIcon name="gift" /></span>
                <div>
                  <b>3　町に プレゼント</b>
                  <p>「ごほうびの町」で かざりを かうと、3Dの町に あらわれるよ。</p>
                  <small>せんろを ひろげると、えきスタンプも あつまる！</small>
                </div>
              </li>
              <li>
                <span className="help__step-icon"><RailIcon name="tools" /></span>
                <div>
                  <b>もっと じゆうに</b>
                  <p>なれたら「じゆう」で、せんろを 1マスずつ つくれるよ。</p>
                  <small>
                    せんろ {TRACK_COST}円 ／ はし {BRIDGE_COST}円 ／ 電車 {TRAIN_COST.toLocaleString()}円
                  </small>
                </div>
              </li>
            </ol>
            <p className="help__camera">1本ゆびで まわす　・　2本ゆびで ちかづく</p>
            <button className="btn btn--primary help__close" onClick={() => setOpen(false)}>
              やってみる！
            </button>
          </div>
        </div>
      )}
    </>
  );
}
