import { memo, useEffect, useState } from 'react';
import { GameScene } from '../scenes/GameScene';
import { useGameStore } from '../store/gameStore';
import { RailIcon } from './RailIcon';
import { Reading } from './Reading';
import { TouchDialog, TownAction, RideAction, TrainWorkshop, JourneyBook } from './TabletPanels';
import { MISSIONS, CHAPTERS } from '../data/missions';
import { TOWNS, ALL_TOWNS } from '../data/world';
import { TOWN_PROJECTS } from '../data/development';
import { isFirstJourney, visibleMapTowns } from '../data/playGuide';
import { key, manhattanPath, edgeKey } from '../utils/grid';
import { trackEdgeCost } from '../sim/economy';
import { TRAIN_COST } from '../data/config';

const Map = memo(GameScene);
type Mode = 'route' | 'town' | 'watch';
type Overlay = 'help' | 'book' | 'settings' | 'workshop' | 'stations' | null;
export function TabletGame() {
  const s = useGameStore();
  const [mode, setMode] = useState<Mode>(s.lines.length ? 'watch' : 'route');
  const [overlay,setOverlay]=useState<Overlay>(null);
  const [resetConfirm,setResetConfirm]=useState(false);
  const [arrivalVisible,setArrivalVisible]=useState(false);
  const mission = MISSIONS[s.missionIndex];
  const tourTown=ALL_TOWNS[s.tourNumber%ALL_TOWNS.length];
  const [value, goal] = mission?.progress({ ...s, towns: TOWNS }) ?? [Math.min(12,Math.max(0,(s.townProgress[tourTown.id]?.delivered??0)-s.tourStartedAt)),12];
  const start = s.towns.find((t) => t.id === s.routeStartTown);
  const end = s.towns.find((t) => t.id === s.routeEndTown);
  const path = start && end ? manhattanPath(key(start.x,start.z),key(end.x,end.z)) : [];
  const cost = TRAIN_COST + path.slice(1).reduce((sum,node,i) => sum + (s.trackEdges.has(edgeKey(path[i],node)) ? 0 : trackEdgeCost(path[i],node,s.terrain)),0);
  const duplicate = start && end && s.lines.some((l) => l.stations.includes(start.id) && l.stations.includes(end.id));
  const intro=isFirstJourney(s);
  const reward=mission?.reward??5000;
  useEffect(() => { s.setBuildMode(s.lines.length ? 'inspect' : 'route'); }, []);
  useEffect(()=>{
    if(s.buildMode==='route')setMode('route');
    else if(s.selection?.type==='town')setMode('town');
    else if(s.selection?.type==='line'||s.selection?.type==='train')setMode('watch');
  },[s.buildMode,s.selection]);
  useEffect(()=>{if(!s.lastArrival)return;setArrivalVisible(true);const timer=setTimeout(()=>setArrivalVisible(false),4500);return()=>clearTimeout(timer);},[s.lastArrival?.id]);
  useEffect(()=>{if(!s.toast)return;const timer=setTimeout(s.clearToast,4500);return()=>clearTimeout(timer);},[s.toast,s.clearToast]);
  useEffect(()=>{if(!s.celebration)return;const timer=setTimeout(s.dismissCelebration,6500);return()=>clearTimeout(timer);},[s.celebration,s.dismissCelebration]);
  const changeMode = (next: Mode) => {
    setMode(next); s.setBuildMode(next === 'route' ? 'route' : 'inspect');
    if(next==='town'){
      const p=TOWN_PROJECTS.find(p=>s.projects[p.id]&&!s.projects[p.id].completed)??TOWN_PROJECTS.find(p=>!s.projects[p.id]&&s.lines.some(l=>l.stations.includes(p.townId)));
      if(p)s.select({type:'town',id:p.townId});
    }
  };
  const goalAction=()=>{
    if(value>=goal){if(mission)s.completeMission(s.missionIndex);else s.claimTour();return;}
    if(!mission){changeMode('town');s.select({type:'town',id:tourTown.id});return;}
    if([2,9,10,14].includes(s.missionIndex))changeMode('town');
    else if([6,7,11].includes(s.missionIndex)){changeMode('watch');setOverlay('workshop');}
    else if([1,4,8,12,13].includes(s.missionIndex))changeMode('watch');
    else changeMode('route');
  };
  const launch=()=>{const count=s.lines.length;s.confirmEasyRoute();if(useGameStore.getState().lines.length>count)setMode('watch');};
  const close=()=>{setOverlay(null);setResetConfirm(false);};
  const chapter=CHAPTERS[(MISSIONS[Math.max(0,s.missionIndex-1)]?.chapter??1)-1];
  return <div className="tablet-game">
    <header className="play-header">
      <div className="play-brand"><RailIcon name="train"/><strong>でんしゃの町</strong></div>
      <div className="play-wallet" aria-label={`お金 ${s.money.toLocaleString()}円`}><RailIcon name="coin"/><strong>{s.money.toLocaleString()}<small>円</small></strong></div>
      <button className="play-icon" aria-label="たびのアルバム" onClick={()=>setOverlay('book')}><RailIcon name="stamp"/></button>
      <button className="play-icon" aria-label="あそびかた" onClick={()=>setOverlay('help')}><RailIcon name="help"/></button>
      <button className="play-icon" aria-label="せってい" onClick={()=>setOverlay('settings')}><RailIcon name="settings"/></button>
    </header>
    <section className={`play-goal ${value>=goal?'goal-ready':''}`}>
      <span className="goal-number">{value>=goal?'✓':s.missionIndex+1}</span>
      <div className="goal-copy"><small>{value>=goal?'できた！ ごほうびを もらおう':'いまの おねがい'}</small><h1><Reading text={mission?.title??`${tourTown.name}へ 12人 とどけよう`}/></h1></div>
      <div className="goal-reward"><span>{value} / {goal}</span><div className="goal-meter" role="progressbar" aria-label="いまの目標" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={value}><i style={{width:`${value/goal*100}%`}}/></div><small>ごほうび {reward.toLocaleString()}円</small></div>
      <button className={value>=goal?'play-primary':'goal-hint'} disabled={s.gameCleared} onClick={goalAction}>{value>=goal?'うけとる！':'ここから やろう'}</button>
    </section>
    <main className="play-world" aria-label="町と電車の地図">
      <Map/>
      <div className="map-legend">{mode==='route'?(start?(end?'点線の せんろで つなぐよ':'もう1つの駅を タッチ！'):'駅から 駅へ なぞろう。2回タッチでも OK！'):mode==='town'?'そだてたい町を タッチしよう':'電車を タッチすると、だれを はこんでいるか 分かるよ'}</div>
      {intro&&!s.lines.length&&<div className="first-journey-note"><span>はじめの ぼうけん</span><strong>この2つの町を つなごう！</strong><small>電車が 人をはこぶと、お金が ふえるよ。</small></div>}
      {!intro&&<span className="map-chapter"><RailIcon name="station"/>{s.towns.length}この駅 · {s.lines.length}本のせんろ</span>}
      <div className="map-buttons"><button className="play-icon" aria-label="駅の一覧からえらぶ" onClick={()=>setOverlay('stations')}><RailIcon name="station"/></button><button className="play-icon" aria-label="地図をもとにもどす" onClick={s.resetCamera}><RailIcon name="eye"/></button></div>
      <div className="play-speed" aria-label="電車の動き"><button aria-label={s.speed===0?'電車をうごかす':'電車をとめる'} aria-pressed={s.speed===0} onClick={()=>s.setSpeed(s.speed===0?1:0)}><RailIcon name={s.speed===0?'play':'pause'}/>{s.speed===0?'うごかす':'とめる'}</button><button aria-label="はやおくり" aria-pressed={s.speed===3} onClick={()=>s.setSpeed(s.speed===3?1:3)}><RailIcon name="fast"/>{s.speed===3?'はやおくり中':'はやおくり'}</button></div>
      {s.speed===0&&!overlay&&<div className="pause-sign">電車は おやすみ中</div>}
      {s.celebration&&s.celebration.eyebrow!=='せんろ かんせい！'&&<div className="touch-celebration" role="status"><RailIcon name="sparkle"/><div><small>{s.celebration.eyebrow}</small><strong><Reading text={s.celebration.title}/></strong><p><Reading text={s.celebration.message}/></p></div><button aria-label="おしらせをとじる" onClick={s.dismissCelebration}>×</button></div>}
    </main>
    <section className={`play-action mode-${mode}`} aria-label="いまの操作">
      {mode==='route'?<>
        <div className="route-steps"><span className={start?'chosen':''}><b>1</b>{start?<Reading text={start.name}/>:'どこから？'}</span><RailIcon name="route"/><span className={end?'chosen':''}><b>2</b>{end?<Reading text={end.name}/>:'どこまで？'}</span></div>
        {start&&end?<div className="route-buy"><button className="play-primary" disabled={!!duplicate||s.money<cost} onClick={launch}><RailIcon name="train"/>{duplicate?'もう つながっているよ':s.money<cost?`あと ${(cost-s.money).toLocaleString()}円`:`しゅっぱつ！ ${cost.toLocaleString()}円`}</button><small>せんろ ＋ 電車1だい のお金</small></div>:<p>{start?'つなぎたい駅を もう1つ タッチ！':'地図の駅を タッチしよう。'}</p>}
        {start&&<button className="play-quiet" onClick={s.cancelEasyRoute}>えらびなおす</button>}
        {!s.lines.length&&s.money<7000&&<button className="play-primary" onClick={s.claimStarterGrant}>はじめの お金をもらう</button>}
      </>:mode==='town'?<TownAction s={s}/>:<RideAction s={s} arrival={arrivalVisible?s.lastArrival:null} edit={()=>setOverlay('workshop')} build={()=>changeMode('route')}/>}
    </section>
    <nav className="play-nav" aria-label="あそびをえらぶ">
      <button aria-pressed={mode==='route'} onClick={()=>changeMode('route')}><RailIcon name="route"/>せんろをつなぐ</button>
      <button aria-pressed={mode==='town'} onClick={()=>changeMode('town')}><RailIcon name="city"/>町をそだてる</button>
      <button aria-pressed={mode==='watch'} onClick={()=>changeMode('watch')}><RailIcon name="train"/>電車を見る</button>
    </nav>
    {s.saveError&&<div className="save-warning" role="alert">ほぞんできないよ。せっていを 見てね。</div>}
    {s.toast?.kind==='bad'&&!s.celebration&&!arrivalVisible&&<div className={`touch-toast ${s.toast.kind}`} role="status"><Reading text={s.toast.msg}/></div>}
    {s.gameCleared&&<TouchDialog title={chapter.clearTitle} close={s.dismissClear}><div className="chapter-won"><RailIcon name="stamp"/><strong>{chapter.number}しょう クリア！</strong><p>つないだ町は そのまま。<br/>電車と 町を もっと そだてよう。</p></div><button className="play-primary" onClick={s.dismissClear}>つぎの ぼうけんへ！</button></TouchDialog>}
    {overlay==='workshop'&&<TouchDialog title="電車を そだてよう" close={close}><TrainWorkshop s={s}/></TouchDialog>}
    {overlay==='book'&&<TouchDialog title="きみの たびのアルバム" close={close}><JourneyBook s={s}/></TouchDialog>}
    {overlay==='stations'&&<TouchDialog title="駅を えらぼう" close={close}><div className="station-list">{visibleMapTowns(s).map(t=><button key={t.id} onClick={()=>{s.townClick(t.id);close();}}><span style={{background:t.color}}/><Reading text={t.name}/></button>)}</div></TouchDialog>}
    {overlay==='help'&&<TouchDialog title="3つで あそべるよ！" close={close}><ol className="touch-help"><li><RailIcon name="route"/><div><strong>① 駅を2つ つなぐ</strong><p>駅から駅へ なぞって「しゅっぱつ！」。駅を 2回タッチしても つなげるよ。</p></div></li><li><RailIcon name="coin"/><div><strong>② 人をはこんで お金をためる</strong><p>電車は 行きも 帰りも 走るよ。別の電車への のりかえも おまかせ！</p></div></li><li><RailIcon name="city"/><div><strong>③ 町の ゆめをかなえる</strong><p>「町をそだてる」で 工事をはじめて、おきゃくさんを よぼう。人がつくと たてものが できるよ。</p></div></li></ol><button className="play-primary" onClick={close}>やってみよう！</button></TouchDialog>}
    {overlay==='settings'&&<TouchDialog title="せってい" close={close}><button className="play-secondary" onClick={s.toggleMute}>音を {s.muted?'出す':'おやすみする'}</button><p className="touch-note">{s.saveError?'今は ほぞんできないよ。このブラウザで ほぞんを ゆるしてから あそんでね。':'町と お金は、このiPadの 同じブラウザに じどうで ほぞんするよ。つぎは 電車が 駅から スタートするよ。'}</p><p className="touch-note">たてでも よこでも あそべるよ。<br/>むきを かえても、町は そのままだよ。</p>{resetConfirm?<div className="reset-confirm"><p>町と お金を はじめにもどすよ。<br/>もとには もどせないけれど、いい？</p><button className="reset-button" onClick={()=>{s.reset();changeMode('route');close();}}>はい、はじめから あそぶ</button><button className="play-secondary" onClick={()=>setResetConfirm(false)}>やめる</button></div>:<button className="play-quiet" onClick={()=>setResetConfirm(true)}>はじめから あそびなおす</button>}</TouchDialog>}
  </div>;
}
