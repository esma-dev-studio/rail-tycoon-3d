import { useEffect, useRef, type ReactNode } from 'react';
import { Reading } from './Reading';
import { RailIcon } from './RailIcon';
import { useGameStore, type GameState } from '../store/gameStore';
import { TOWN_PROJECTS, TOURIST_TOWNS, completedProjectCount, projectVisitors } from '../data/development';
import { TOWNS_BY_ID } from '../data/world';
import { DECORATIONS } from '../data/decorations';
import { lineCapacity, capacityUpgradeCost, speedUpgradeCost } from '../data/lineUpgrades';
import { sim } from '../sim/simInstance';
import { nextTrainStopTownId } from '../sim/simulation';
import { TRAIN_COST } from '../data/config';

export function TouchDialog({title,close,children}:{title:string;close:()=>void;children:ReactNode}){
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const d=ref.current;const speed=useGameStore.getState().speed;useGameStore.getState().setSpeed(0);d?.showModal();return()=>{d?.close();useGameStore.getState().setSpeed(speed);};},[]);
  return <dialog className="touch-dialog" ref={ref} aria-label={title} onCancel={close}><header><h2>{title}</h2><button className="play-icon" aria-label="とじる" onClick={close}>×</button></header>{children}</dialog>;
}
export function Pending({townId}:{townId:string}){
  const passengers=[...sim.waiting.values()].flat().concat([...sim.trains.values()].flatMap(t=>t.load)).filter(p=>p.toTownId===townId);
  return <span>{passengers.length ? `${passengers.length}人が 電車で 来るよ` : 'おきゃくさんを よんでみよう'}</span>;
}
export function TownAction({s}:{s:GameState}){
  const town=s.towns.find(t=>s.selection?.type==='town'&&t.id===s.selection.id);
  if(!town)return <div className="action-empty"><RailIcon name="city"/><div><strong>どの町を そだてる？</strong><p>地図の 町の名前を タッチしよう。</p></div></div>;
  const p=TOWN_PROJECTS.find(p=>p.townId===town.id)!;
  const progress=s.projects[p.id];
  const visitors=projectVisitors(p,progress,s.townProgress[town.id]?.delivered??0);
  const connected=s.lines.some(l=>l.stations.includes(town.id));
  const pending=[...sim.waiting.values()].flat().concat([...sim.trains.values()].flatMap(t=>t.load)).filter(p=>p.toTownId===town.id).length;
  const nextTown=TOURIST_TOWNS.find(t=>t.requires>completedProjectCount(s.projects));
  return <div className="town-action-content">
    <div className="action-title"><span className="action-symbol" style={{background:p.color}}><RailIcon name={progress?.completed?'sparkle':'city'}/></span><div><small><Reading text={town.name}/>の ゆめ</small><h2><Reading text={p.name}/></h2><p>{progress?.completed?'できた！ 町に あそびに来る人が ふえたよ。':p.description}</p></div></div>
    <div className="dream-progress"><div className="dream-steps"><span className={progress?'done':'now'}>① つくる</span><span className={progress&&!progress.completed?'now':progress?.completed?'done':''}>② 人をはこぶ</span><span className={progress?.completed?'done':''}>③ かんせい</span></div>
      {progress&&!progress.completed?<><div className="dream-meter"><i style={{width:`${visitors/p.visitors*100}%`}}/></div><strong>{visitors} / {p.visitors}人 <small>とうちゃく！</small></strong><p><Pending townId={town.id}/></p></>:<p>{progress?.completed?'つぎの町の ゆめも かなえよう！':nextTown?`町のゆめを あと${nextTown.requires-completedProjectCount(s.projects)}こで 新しい駅！`:'すべての町の ゆめを かなえよう！'}</p>}
    </div>
    <div className="action-buttons">{!connected?<button className="play-primary" onClick={()=>{s.setBuildMode('route');s.townClick(town.id);}}>この町に せんろをつなぐ</button>:!progress?<><button className="play-primary" disabled={s.money<p.cost} onClick={()=>s.startProject(p.id)}>{s.money<p.cost?`あと ${(p.cost-s.money).toLocaleString()}円`:`つくる　${p.cost.toLocaleString()}円`}</button><small>かんせいで ＋{p.reward.toLocaleString()}円</small></>:!progress.completed&&visitors>=p.visitors?<button className="play-primary" onClick={()=>s.completeProject(p.id)}><RailIcon name="sparkle"/>かんせい！ ＋{p.reward.toLocaleString()}円</button>:<><button className="play-primary" disabled={pending>=6} onClick={()=>s.inviteVisitors(town.id)}><RailIcon name="people"/>{pending>=6?'いま 電車で 来るよ':'おきゃくさんを よぶ'}</button><small>お金は かからないよ</small></>}</div>
  </div>;
}
export function RideAction({s,arrival,edit,build}:{s:GameState;arrival:GameState['lastArrival'];edit:()=>void;build:()=>void}){
  const selected=s.selection?.type==='train'?s.trainDefs.find(t=>t.id===s.selection?.id)?.lineId:s.selection?.type==='line'?s.selection.id:undefined;
  const line=s.lines.find(l=>l.id===selected)??s.lines[s.lines.length-1];
  if(!line)return <div className="action-empty"><RailIcon name="train"/><div><strong>はじめの 電車を 走らせよう！</strong><p>せんろを つなぐと、電車も できるよ。</p></div><button className="play-primary" onClick={build}>せんろをつなぐ</button></div>;
  if(arrival)return <div className="ride-action-content arrival-result"><span className="action-symbol"><RailIcon name="coin"/></span><div className="ride-heading" role="status"><small><Reading text={TOWNS_BY_ID.get(arrival.townId)?.name??''}/>に とうちゃく！</small><h2>{arrival.count}人を とどけたよ！</h2><p>人を はこんで お金を もらったよ</p></div><strong className="arrival-fare">＋{arrival.fare.toLocaleString()}<small>円</small></strong><button className="play-secondary" onClick={edit}><RailIcon name="tools"/>電車を そだてる</button></div>;
  const trains=[...sim.trains.values()].filter(t=>t.lineId===line.id);
  const train=trains.find(t=>t.load.length)??trains[0];
  const next=train?nextTrainStopTownId(train):null;
  const onboard=trains.reduce((sum,t)=>sum+t.load.length,0);
  return <div className="ride-action-content"><span className="action-symbol" style={{background:line.color}}><RailIcon name="train"/></span><div className="ride-heading"><small>{s.speed===0?'おやすみ中':train?.dwell?'駅で のりおりしているよ':'電車が 走っているよ！'}</small><h2>{onboard}人を はこんでいるよ</h2><p>つぎは <Reading text={TOWNS_BY_ID.get(next??'')?.name??'おりかえし'}/></p></div><div className="ride-route">{line.stations.map((id,i)=><span key={id}>{i>0&&<b>↔</b>}<Reading text={TOWNS_BY_ID.get(id)?.name??''}/></span>)}<small>行きも 帰りも 走るよ。のりかえは おまかせ。</small></div><button className="play-secondary" onClick={edit}><RailIcon name="tools"/>電車を そだてる</button></div>;
}
export function TrainWorkshop({s}:{s:GameState}){
  const id=s.selection?.type==='train'?s.trainDefs.find(t=>t.id===s.selection?.id)?.lineId:s.selection?.id;
  const line=s.lines.find(l=>l.id===id)??s.lines[0];
  if(!line)return <p>せんろを つなぐと 電車が できるよ。</p>;
  const capacityCost=capacityUpgradeCost(line),speedCost=speedUpgradeCost(line);
  return <div className="workshop"><label>そだてる電車<select aria-label="そだてる電車" value={line.id} onChange={e=>s.select({type:'line',id:e.target.value})}>{s.lines.map(l=><option value={l.id} key={l.id}>{l.name}</option>)}</select></label><div className="workshop-summary"><RailIcon name="train"/><strong>{s.trainDefs.filter(t=>t.lineId===line.id).length}だい</strong><span>1だいに {lineCapacity(line)}人 のれるよ</span></div><button className="upgrade-choice" disabled={s.money<TRAIN_COST} onClick={()=>s.buyTrain(line.id)}><RailIcon name="train"/><span><strong>電車を もう1だい</strong><small>駅で まつ時間が みじかくなる</small></span><b>5,000円</b></button>{s.missionIndex<6?<p className="touch-note">5つの町を つないで 1しょうを クリアすると、長さと はやさも かえられるよ。</p>:<><button className="upgrade-choice" disabled={capacityCost===null||s.money<capacityCost} onClick={()=>s.upgradeLineCapacity(line.id)}><RailIcon name="people"/><span><strong>車りょうを ふやす</strong><small>10人 多く のれるよ</small></span><b>{capacityCost===null?'さいこう！':`${capacityCost.toLocaleString()}円`}</b></button><button className="upgrade-choice" disabled={speedCost===null||s.money<speedCost} onClick={()=>s.upgradeLineSpeed(line.id)}><RailIcon name="fast"/><span><strong>はやい電車にする</strong><small>はやく 町に つくよ</small></span><b>{speedCost===null?'さいこう！':`${speedCost.toLocaleString()}円`}</b></button></>}</div>;
}
export function JourneyBook({s}:{s:GameState}){
  return <><div className="book-summary"><strong>{s.totalDelivered}<small>人を とどけた！</small></strong><strong>{completedProjectCount(s.projects)} / 8<small>町のゆめが かなった！</small></strong></div><div className="dream-stamps">{TOWN_PROJECTS.map(p=><div key={p.id} className={s.projects[p.id]?.completed?'earned':''}><RailIcon name={s.projects[p.id]?.completed?'stamp':'city'}/><strong><Reading text={p.name}/></strong><small>{s.projects[p.id]?.completed?'かんせい！':s.projects[p.id]?'つくっているよ':'これから'}</small></div>)}</div><h3>あたらしい おでかけ先</h3><div className="book-destinations">{TOURIST_TOWNS.map(t=><div key={t.id}><Reading text={t.name}/><span>{s.towns.some(x=>x.id===t.id)?'見つけた！':`ゆめ ${t.requires}こで ひらく`}</span></div>)}</div><details className="legacy-gifts"><summary>町に 小さなプレゼント</summary>{DECORATIONS.map(d=><button className="upgrade-choice" key={d.id} disabled={!s.lines.length||s.money<d.price||s.ownedDecorations.includes(d.id)} onClick={()=>s.buyDecoration(d.id)}><RailIcon name="gift"/><span>{d.name}</span><b>{s.ownedDecorations.includes(d.id)?'もっている':`${d.price.toLocaleString()}円`}</b></button>)}</details></>;
}
