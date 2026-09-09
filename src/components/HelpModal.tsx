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
                  <b>1　まず 5つの町を つなぐ</b>
                  <p>「新しいせんろ」で、町の名前を 2つ おそう。</p>
                  <small>5つつないだら、第1しょうクリア。ゲームは まだ つづくよ！</small>
                </div>
              </li>
              <li>
                <span className="help__step-icon help__step-icon--text">↔</span>
                <div>
                  <b>2　行きも 帰りも、のりかえも じどう</b>
                  <p>A―Bと B―Cがあれば、AからCへ Bで のりかえるよ。</p>
                  <small>きみは 町と町を つなげればOK！</small>
                </div>
              </li>
              <li>
                <span className="help__step-icon help__step-icon--text">😵</span>
                <div>
                  <b>3　こんでいる路線を 見つける</b>
                  <p>路線を おすと「すいている・ちょっとこんでる・大こんざつ」が わかるよ。</p>
                  <small>大こんざつなら、電車を ふやそう</small>
                </div>
              </li>
              <li>
                <span className="help__step-icon help__step-icon--text">🛠️</span>
                <div>
                  <b>4　電車と 町を そだてる</b>
                  <p>長い電車や 速い電車にして、町を レベル6まで そだてよう。</p>
                  <small>
                    せんろ {TRACK_COST}円 ／ はし {BRIDGE_COST}円 ／ 電車 {TRAIN_COST.toLocaleString()}円
                  </small>
                </div>
              </li>
            </ol>
            <p className="help__camera">3つの章のあとも、ずっとチャレンジが つづくよ</p>
            <button className="btn btn--primary help__close" onClick={() => setOpen(false)}>
              わかった！ やってみる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
