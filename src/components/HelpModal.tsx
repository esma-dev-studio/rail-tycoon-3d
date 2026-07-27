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
          <div className="help__card">
            <div className="help__head">
              <h2 className="help__title" id="help-title">あそびかた</h2>
              <button className="modal-close" onClick={() => setOpen(false)} aria-label="とじる">✕</button>
            </div>
            <ol className="help__steps">
              <li>
                <span className="help__step-icon"><RailIcon name="route" /></span>
                <div>
                  <b>新しいせんろ</b>
                  <p>町を 2つ おして、ねだんを見たら「このせんを つくる！」</p>
                  <small>せんろと 1だいめの電車が いっしょに できるよ</small>
                </div>
              </li>
              <li>
                <span className="help__step-icon"><RailIcon name="coin" /></span>
                <div>
                  <b>お金を ためる</b>
                  <p>電車が おきゃくさんを はこぶと、お金が ふえるよ。</p>
                  <small>ちょきんの もくひょうで ごほうびゲット！</small>
                </div>
              </li>
              <li>
                <span className="help__step-icon"><RailIcon name="city" /></span>
                <div>
                  <b>町を そだてる</b>
                  <p>町へ 人を はこぶと、たてものや かざりが ふえるよ。</p>
                  <small>「町と ごほうび」で せいちょうを 見られるよ</small>
                </div>
              </li>
              <li>
                <span className="help__step-icon"><RailIcon name="tools" /></span>
                <div>
                  <b>じゆうに つくる</b>
                  <p>なれたら、せんろを 1マスずつ つくることも できるよ。</p>
                  <small>
                    1マス {TRACK_COST}円 ／ 川の はし {BRIDGE_COST}円 ／ 電車 {TRAIN_COST.toLocaleString()}円
                  </small>
                </div>
              </li>
            </ol>
            <p className="help__camera">ドラッグで まわす ／ ホイールで ちかづく</p>
            <button className="btn btn--primary help__close" onClick={() => setOpen(false)}>
              わかった！
            </button>
          </div>
        </div>
      )}
    </>
  );
}
