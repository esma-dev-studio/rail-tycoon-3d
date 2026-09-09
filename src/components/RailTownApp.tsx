import { memo, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { GameScene } from '../scenes/GameScene';
import { useGameStore, type GameState } from '../store/gameStore';
import { RailIcon, type RailIconName } from './RailIcon';
import { Reading } from './Reading';
import { CHAPTERS, MISSIONS } from '../data/missions';
import { TOWNS, ALL_TOWNS, TOWNS_BY_ID } from '../data/world';
import { TOWN_PROJECTS, TOURIST_TOWNS, completedProjectCount, projectVisitors, type TownProject } from '../data/development';
import { DECORATIONS } from '../data/decorations';
import { capacityUpgradeCost, speedUpgradeCost, lineCapacity, lineCapacityLevel, lineSpeedLevel } from '../data/lineUpgrades';
import { TRAIN_COST } from '../data/config';
import { edgeKey, key, manhattanPath } from '../utils/grid';
import { trackEdgeCost } from '../sim/economy';
import { sim } from '../sim/simInstance';
import { nextTrainStopTownId, totalWaiting, totalOnboard } from '../sim/simulation';
import type { Town } from '../types/game';

type Tab = 'route' | 'town' | 'train' | 'journal';
const TABS: { id: Tab; label: string; icon: RailIconName }[] = [
  { id: 'route', label: 'せんろ', icon: 'route' }, { id: 'town', label: '町づくり', icon: 'city' },
  { id: 'train', label: '電車', icon: 'train' }, { id: 'journal', label: '手帳', icon: 'stamp' },
];
const MapScene = memo(GameScene);
const yen = (n: number) => n.toLocaleString('ja-JP');
const colorStyle = (color: string) => ({ '--accent': color } as CSSProperties);

function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  return <div className="progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(value, max)}><i style={{ width: `${Math.min(100, value / max * 100)}%` }} /></div>;
}

function Dialog({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="game-dialog" aria-label={title} onCancel={close}>
    <button className="dialog-close icon-button" aria-label="とじる" onClick={close}>×</button>
    <h2>{title}</h2>{children}
  </dialog>;
}

function MissionCard({ s, go }: { s: GameState; go: (tab: Tab) => void }) {
  const mission = MISSIONS[s.missionIndex];
  if (!mission) {
    const town = ALL_TOWNS[s.tourNumber % ALL_TOWNS.length];
    const value = Math.min(12, Math.max(0, (s.townProgress[town.id]?.delivered ?? 0) - s.tourStartedAt));
    return <section className="mission-card"><div className="eyebrow">おでかけ便 · {s.tourNumber + 1}</div>
      <h2><Reading text={town.name} />へ 12人 とどけよう</h2>
      <p>町の ゆめを かなえて、すべての駅を めぐろう。</p>
      <Progress value={value} max={12} label="おでかけ便" />
      <div className="mission-bottom"><span>{value} / 12人</span>{value >= 12
        ? <button className="reward-button" onClick={s.claimTour}>5,000円 うけとる <span>↗</span></button>
        : <button className="text-button" onClick={() => go('town')}>町の ゆめを見る →</button>}</div>
    </section>;
  }
  const [value, max] = mission.progress({ ...s, towns: TOWNS });
  const target: Tab = [2, 10].includes(s.missionIndex) ? 'town' : [6, 7, 11].includes(s.missionIndex) ? 'train' : 'route';
  return <section className={`mission-card ${value >= max ? 'is-ready' : ''}`}>
    <div className="mission-top"><span className="eyebrow">いま やってみよう</span><span className="chapter-pill">{mission.chapter}しょう · {s.missionIndex + 1} / {MISSIONS.length}</span></div>
    <h2><Reading text={mission.title} /></h2><p><Reading text={mission.hint} /></p>
    <Progress value={value} max={max} label={mission.title} />
    <div className="mission-bottom"><span>{value >= max ? 'できた！' : `${value} / ${max}`} <small>＋{yen(mission.reward)}円</small></span>
      {value >= max ? <button className="reward-button" disabled={s.gameCleared} onClick={() => s.completeMission(s.missionIndex)}>ごほうびを うけとる <span>↗</span></button>
        : <button className="text-button" onClick={() => go(target)}>やってみる →</button>}</div>
  </section>;
}

function TownDot({ town }: { town: Town }) {
  return <span className="town-dot" style={{ backgroundColor: town.color }} aria-hidden="true" />;
}

function RoutePanel({ s }: { s: GameState }) {
  const start = s.towns.find((t) => t.id === s.routeStartTown);
  const end = s.towns.find((t) => t.id === s.routeEndTown);
  const path = start && end ? manhattanPath(key(start.x, start.z), key(end.x, end.z)) : [];
  const trackCost = path.slice(1).reduce((cost, node, i) => cost + (s.trackEdges.has(edgeKey(path[i], node)) ? 0 : trackEdgeCost(path[i], node, s.terrain)), 0);
  const totalCost = trackCost + TRAIN_COST;
  const duplicate = start && end && s.lines.some((l) => l.stations.includes(start.id) && l.stations.includes(end.id));
  const choose = (id: string) => { if (s.buildMode !== 'route') s.setBuildMode('route'); useGameStore.getState().townClick(id); };
  return <div className="panel-stack">
    <div className="section-heading"><div><span className="eyebrow">CONNECT THE TOWNS</span><h2>つなげよう、次の町へ。</h2></div><RailIcon name="route" /></div>
    <p className="panel-lead">町を2つ えらぶだけ。<br />せんろと 電車が いっしょに できるよ。</p>
    {s.lines.length === 0 && s.money < 7000 && <button className="secondary-button" onClick={s.claimStarterGrant}>おたすけ！ はじめの お金をもらう</button>}
    <div className="route-ticket">
      <div><span className="step-number">1</span><strong>{start ? <Reading text={start.name} /> : 'どこから？'}</strong></div>
      <span className="route-ticket-arrow">↕</span>
      <div><span className="step-number">2</span><strong>{end ? <Reading text={end.name} /> : 'どこまで？'}</strong></div>
      {(start || end) && <button className="text-button ticket-reset" onClick={s.cancelEasyRoute}>えらびなおす</button>}
    </div>
    <div className="town-picker" aria-label="つなぐ町をえらぶ">
      {s.towns.map((town) => <button key={town.id} aria-pressed={town.id === start?.id || town.id === end?.id} onClick={() => choose(town.id)}><TownDot town={town} /><Reading text={town.name} />{town.id === start?.id ? <b>1</b> : town.id === end?.id ? <b>2</b> : <span>＋</span>}</button>)}
    </div>
    {start && end ? <div className="build-confirm">
      <div className="cost-breakdown"><span>せんろ {yen(trackCost)}円</span><span>電車 {yen(TRAIN_COST)}円</span></div>
      <button className="primary-button" disabled={!!duplicate || s.money < totalCost} onClick={() => { const count = s.lines.length; s.confirmEasyRoute(); if (useGameStore.getState().lines.length > count && window.innerWidth <= 800) requestAnimationFrame(() => document.getElementById('main-map')?.scrollIntoView({ behavior: 'smooth' })); }}><RailIcon name="train" />{duplicate ? 'この2つの町は つながっているよ' : `つくって しゅっぱつ！　${yen(totalCost)}円`}</button>
      {s.money < totalCost && !duplicate && <p className="inline-note">あと {yen(totalCost - s.money)}円。電車が はこぶと お金が ふえるよ。</p>}
      <p className="microcopy">行きも 帰りも 走るよ。のりかえも じどう。</p>
    </div> : <div className="gentle-note"><RailIcon name="eye" /><span>地図の 町の名前を おしても えらべるよ。</span></div>}
    <details className="quiet-details"><summary>せんろの しくみ</summary><p>A — B と B — C をつなぐと、Cへ行く人は Bで のりかえるよ。まんなか町を 通らなくても、つながった町どうしで おでかけできるよ。</p></details>
  </div>;
}

function ProjectArt({ project, completed }: { project: TownProject; completed?: boolean }) {
  return <div className={`project-art art-${project.kind} ${completed ? 'is-built' : ''}`} style={colorStyle(project.color)} aria-hidden="true">
    <div className="art-sun" /><div className="art-hill" /><div className="art-tree tree-one" /><div className="art-tree tree-two" />
    <div className="art-building"><div className="art-roof" /><span /><span /><span /><i /></div><div className="art-path" />
    <span className="art-label">{completed ? 'OPEN' : 'OUR NEXT DREAM'}</span>
  </div>;
}

function TownPanel({ s }: { s: GameState }) {
  const selectedTown = s.selection?.type === 'town' ? s.selection.id : s.towns[0].id;
  const town = s.towns.find((t) => t.id === selectedTown) ?? s.towns[0];
  const project = TOWN_PROJECTS.find((p) => p.townId === town.id)!;
  const progress = s.projects[project.id];
  const visitors = projectVisitors(project, progress, s.townProgress[town.id]?.delivered ?? 0);
  const connected = s.lines.some((l) => l.stations.includes(town.id));
  const completed = completedProjectCount(s.projects);
  const nextTown = TOURIST_TOWNS.find((t) => t.requires > completed);
  return <div className="panel-stack">
    <div className="section-heading"><div><span className="eyebrow">BUILD A LITTLE HAPPINESS</span><h2>この町の ゆめをかなえよう。</h2></div></div>
    <div className="town-chips" aria-label="町をえらぶ">{s.towns.map((t) => <button key={t.id} aria-pressed={t.id === town.id} onClick={() => s.select({ type: 'town', id: t.id })}><TownDot town={t} /><Reading text={t.name} /></button>)}</div>
    <article className="project-card">
      <ProjectArt project={project} completed={progress?.completed} />
      <div className="project-body"><div className="project-kicker"><span><Reading text={town.name} />の ゆめ</span><span>{progress?.completed ? '✓ かんせい' : progress ? 'つくっているよ' : 'これから'}</span></div>
        <h3><Reading text={project.name} /></h3><p>{project.description}</p>
        {progress?.completed ? <div className="finished-note"><RailIcon name="sparkle" />あそびに 来る人が ふえたよ！</div> : progress ? <>
          <div className="project-counter"><strong>{visitors}<small> / {project.visitors}人</small></strong><span>この町に とどいたよ</span></div>
          <Progress value={visitors} max={project.visitors} label="施設の完成まで" />
          {visitors >= project.visitors ? <button className="primary-button" onClick={() => { s.completeProject(project.id); if (window.innerWidth <= 800) requestAnimationFrame(() => document.getElementById('main-map')?.scrollIntoView({ behavior: 'smooth' })); }}>かんせいさせる！ ＋{yen(project.reward)}円</button>
            : <p className="inline-note">電車で あと{project.visitors - visitors}人 とどけよう。{s.speed === 0 ? '電車が おやすみ中だよ。' : 'ほかの町から 電車で 来るのを 待とう。'}</p>}
        </> : <>
          <div className="project-steps"><span>① {yen(project.cost)}円で はじめる</span><span>② {project.visitors}人 とどける</span><span>③ けしきが かわる！</span></div>
          <button className="primary-button" disabled={!connected || s.money < project.cost} onClick={() => s.startProject(project.id)}>{!connected ? 'まず この町に せんろを つなごう' : s.money < project.cost ? `あと ${yen(project.cost - s.money)}円 ためよう` : `つくりはじめる　${yen(project.cost)}円`}</button>
          <p className="microcopy">かんせいの ごほうび ＋{yen(project.reward)}円</p>
        </>}
      </div>
    </article>
    {nextTown ? <div className="unlock-note"><span className="unlock-number">{completed}<small> / {nextTown.requires}</small></span><div><strong>つぎは <Reading text={nextTown.name} /></strong><p>町の ゆめを あと{nextTown.requires - completed}こ かなえると<br />あたらしい駅が 地図に あらわれるよ。</p></div></div>
      : <div className="gentle-note"><RailIcon name="stamp" /><span>すべての駅を 見つけた！ 8この ゆめを かなえよう。</span></div>}
    <details className="quiet-details" open={s.missionIndex === 2 || s.missionIndex === 10}><summary>町に プレゼント <span>{s.ownedDecorations.length} / {DECORATIONS.length}</span></summary>
      <p>すぐに おける 小さなかざり。町の ゆめと いっしょに 楽しもう。</p>
      <div className="gift-list">{DECORATIONS.map((gift) => <button key={gift.id} disabled={!s.lines.length || s.ownedDecorations.includes(gift.id) || s.money < gift.price} onClick={() => s.buyDecoration(gift.id)}><span className="gift-icon" style={colorStyle(gift.color)}><RailIcon name="gift" /></span><span><strong>{gift.name}</strong><small>{TOWNS_BY_ID.get(gift.townId)?.name}</small></span><b>{s.ownedDecorations.includes(gift.id) ? '✓' : `${yen(gift.price)}円`}</b></button>)}</div>
    </details>
  </div>;
}

function TrainPanel({ s }: { s: GameState }) {
  const trainLine = s.selection?.type === 'train' ? s.trainDefs.find((t) => t.id === s.selection?.id)?.lineId : null;
  const line = s.lines.find((l) => l.id === (trainLine ?? s.selection?.id)) ?? s.lines[0];
  if (!line) return <div className="empty-state"><RailIcon name="train" /><h2>はじめの 1だいを 走らせよう。</h2><p>「せんろ」で 町を2つ つなぐと、<br />ここに 電車が あらわれるよ。</p></div>;
  const trains = s.trainDefs.filter((t) => t.lineId === line.id);
  const capacityCost = capacityUpgradeCost(line);
  const speedCost = speedUpgradeCost(line);
  const canUpgrade = s.missionIndex >= 6;
  return <div className="panel-stack">
    <div className="section-heading"><div><span className="eyebrow">YOUR LITTLE RAILWAY</span><h2>たよれる電車に そだてよう。</h2></div></div>
    <div className="line-picker">{s.lines.map((l, i) => <button aria-pressed={l.id === line.id} key={l.id} onClick={() => s.select({ type: 'line', id: l.id })}><span style={{ background: l.color }}>{i + 1}</span><Reading text={l.name} /></button>)}</div>
    <div className="train-showcase" style={colorStyle(line.color)}><span className="eyebrow">MY TRAIN · {trains.length}だい</span><div className="train-consist" aria-label={`${lineCapacityLevel(line) + 2}りょうの電車`}>{Array.from({ length: lineCapacityLevel(line) + 2 }, (_, i) => <div className="mini-car" key={i}><i /><i /><i /><b /></div>)}</div><div className="train-spec"><span>{lineCapacity(line)}人 のれる</span><span>はやさ {lineSpeedLevel(line)}</span></div></div>
    <div className="line-stops">{line.stations.map((id) => <span key={id}><i style={{ background: line.color }} /><Reading text={TOWNS_BY_ID.get(id)?.name ?? ''} /></span>)}</div>
    <p className="microcopy">この駅を 行ったり 来たり。途中の駅でも のりおりするよ。</p>
    <div className="live-trains">{trains.map((t, i) => { const runtime = sim.trains.get(t.id); const next = runtime ? nextTrainStopTownId(runtime) : null; return <div key={t.id}><RailIcon name="train" /><div><strong>{i + 1}ごう <small>{runtime?.dwell ? '駅に ていしゃ中' : '走っているよ'}</small></strong><span>つぎは <Reading text={TOWNS_BY_ID.get(next ?? '')?.name ?? 'おりかえし'} /></span></div><b>{runtime?.load.length ?? 0}<small>人</small></b></div>; })}</div>
    {!canUpgrade && <p className="gentle-note">5つの町を つないで 1しょうを クリアすると、長さと はやさを かえられるよ。</p>}
    <div className="upgrade-list">
      <button disabled={s.money < TRAIN_COST} onClick={() => s.buyTrain(line.id)}><RailIcon name="train" /><span><strong>電車を ふやす</strong><small>まつ時間が みじかくなる</small></span><b>{yen(TRAIN_COST)}円</b></button>
      <button disabled={!canUpgrade || capacityCost === null || s.money < capacityCost} onClick={() => s.upgradeLineCapacity(line.id)}><RailIcon name="people" /><span><strong>長い電車にする</strong><small>1りょう ふえて、10人 多くのれる</small></span><b>{capacityCost === null ? 'さいこう！' : `${yen(capacityCost)}円`}</b></button>
      <button disabled={!canUpgrade || speedCost === null || s.money < speedCost} onClick={() => s.upgradeLineSpeed(line.id)}><RailIcon name="fast" /><span><strong>はやくする</strong><small>つぎの駅に はやく とどく</small></span><b>{speedCost === null ? 'さいこう！' : `${yen(speedCost)}円`}</b></button>
    </div>
  </div>;
}

function JournalPanel({ s }: { s: GameState }) {
  const completed = completedProjectCount(s.projects);
  return <div className="panel-stack">
    <div className="section-heading"><div><span className="eyebrow">OUR RAILWAY STORY</span><h2>きみが つくった、町のものがたり。</h2></div></div>
    <div className="journal-stats"><div><b>{s.totalDelivered}</b><span>とどけた人</span></div><div><b>{completed}<small> / 8</small></b><span>かなえた ゆめ</span></div><div><b>{s.towns.length}<small> / 8</small></b><span>見つけた駅</span></div></div>
    <h3>町の ゆめスタンプ</h3>
    <div className="stamp-grid">{TOWN_PROJECTS.map((p, i) => <div className={s.projects[p.id]?.completed ? 'stamp is-stamped' : 'stamp'} key={p.id} style={colorStyle(p.color)}><span>{s.projects[p.id]?.completed ? <RailIcon name="city" /> : String(i + 1).padStart(2, '0')}</span><strong><Reading text={p.name} /></strong><small>{s.projects[p.id]?.completed ? 'かなえた！' : s.projects[p.id] ? 'つくっているよ' : 'これから'}</small></div>)}</div>
    <h3>これから 出会う駅</h3>
    <div className="destination-list">{TOURIST_TOWNS.map((t) => <div key={t.id}><TownDot town={t} /><div><strong><Reading text={t.name} /></strong><small>{t.teaser}</small></div><b>{completed >= t.requires ? '✓ はっけん' : `ゆめ ${t.requires}こ`}</b></div>)}</div>
    <div className="gentle-note"><RailIcon name="coin" /><span>いままで 電車で {yen(s.totalRevenue)}円。<br />この町は このブラウザに じどうで ほぞんされるよ。</span></div>
  </div>;
}

export function RailTownApp() {
  const s = useGameStore();
  const [tab, setTab] = useState<Tab>('route');
  const [dialog, setDialog] = useState<'help' | 'settings' | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const go = (next: Tab) => {
    setTab(next); s.setBuildMode(next === 'route' ? 'route' : 'inspect');
    requestAnimationFrame(() => {
      panel.current?.scrollTo({ top: 0 });
      if (window.innerWidth <= 800) panel.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  };
  useEffect(() => {
    if (s.routeEndTown && window.innerWidth <= 800) document.querySelector('.build-confirm')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [s.routeEndTown]);
  useEffect(() => { if (s.lines.length === 0) s.setBuildMode('route'); }, []); // 初回だけ、町選びから開始。
  useEffect(() => {
    if (s.selection?.type === 'town' && s.buildMode === 'inspect') setTab('town');
    if (s.selection?.type === 'line' || s.selection?.type === 'train') setTab('train');
  }, [s.selection, s.buildMode]);
  useEffect(() => { if (!s.toast) return; const timer = setTimeout(s.clearToast, 4500); return () => clearTimeout(timer); }, [s.toast, s.clearToast]);
  useEffect(() => { if (!s.celebration) return; const timer = setTimeout(s.dismissCelebration, 7500); return () => clearTimeout(timer); }, [s.celebration, s.dismissCelebration]);
  const clearedChapter = CHAPTERS[(MISSIONS[Math.max(0, s.missionIndex - 1)]?.chapter ?? 1) - 1];
  const selectedTown = s.selection?.type === 'town' ? s.selection.id : null;
  const waiting = selectedTown ? sim.waiting.get(selectedTown) ?? [] : [];
  const nextDestination = waiting[0] ? TOWNS_BY_ID.get(waiting[0].toTownId) : null;
  return <div className="railway-app">
    <header className="app-header">
      <a className="brand" href="#main-map" aria-label="でんしゃの町 地図へ"><span className="brand-mark"><RailIcon name="train" /></span><span><small>RAILWAY GARDEN</small><strong>でんしゃの町<span>。</span></strong></span></a>
      <div className="wallet" aria-label={`お金 ${yen(s.money)}円`}><span className="coin-mark"><RailIcon name="coin" /></span><div><small>きみの お金</small><strong>{yen(s.money)}<span>円</span></strong></div>{s.lastIncome && <span className="income" key={s.lastIncome.id}>＋{s.lastIncome.amount}</span>}</div>
      <div className="header-actions"><button className="icon-button" aria-label="あそびかた" onClick={() => setDialog('help')}><RailIcon name="help" /></button><button className="icon-button" aria-label="せってい" onClick={() => setDialog('settings')}><RailIcon name="settings" /></button></div>
    </header>
    <main className="game-workspace">
      <section className="map-stage" id="main-map" aria-label="きみの町の3D地図">
        <div className="map-title"><span className="eyebrow">A SMALL TOWN, A BIG ADVENTURE.</span><h1>小さなせんろから、<br /><span>大きな わくわくへ。</span></h1></div>
        <div className="scene-wrap"><MapScene /></div>
        <div className="map-status"><span className="status-dot" />{s.lines.length ? `${s.lines.length}本の せんろ・${s.trainDefs.length}だいが ${s.speed === 0 ? 'おやすみ中' : 'かつやく中'}` : 'まずは 町を2つ つないでみよう'}</div>
        {selectedTown && <div className="town-live-note"><RailIcon name="station" /><span><Reading text={TOWNS_BY_ID.get(selectedTown)?.name ?? ''} /> · {waiting.length}人が まっているよ{nextDestination && <small><Reading text={nextDestination.name} />へ おでかけしたい！</small>}</span><button aria-label="町の表示をとじる" onClick={s.clearSelection}>×</button></div>}
        {s.celebration && <div className="map-celebration" role="status"><span className="celebration-symbol"><RailIcon name="sparkle" /></span><div><small>{s.celebration.eyebrow}</small><strong><Reading text={s.celebration.title} /></strong><p><Reading text={s.celebration.message} /></p></div><button aria-label="おしらせをとじる" onClick={s.dismissCelebration}>×</button></div>}
        <div className="map-controls"><button className="map-reset" onClick={s.resetCamera}><RailIcon name="eye" /><span>地図を もどす</span></button><div className="speed-switch" aria-label="電車のはやさ">{[{ value: 0, icon: 'pause', label: 'おやすみ' }, { value: 1, icon: 'play', label: 'ふつう' }, { value: 3, icon: 'fast', label: 'はやおくり' }].map((v) => <button key={v.value} aria-label={v.label} aria-pressed={s.speed === v.value} onClick={() => s.setSpeed(v.value)}><RailIcon name={v.icon as RailIconName} /><span>{v.value === 3 ? '3×' : v.label}</span></button>)}</div></div>
        <div className="map-bottom-note"><span>ドラッグで くるり。ひろげて ズーム。</span><span>{totalOnboard(sim)}人が 電車でおでかけ · {totalWaiting(sim)}人が 駅でまっているよ</span></div>
      </section>
      <aside className="notebook" aria-label="町づくりの手帳">
        <MissionCard s={s} go={go} />
        <nav className="notebook-tabs" aria-label="あそびをえらぶ">{TABS.map((item) => <button key={item.id} aria-current={tab === item.id ? 'page' : undefined} onClick={() => go(item.id)}><RailIcon name={item.icon} /><span><Reading text={item.label} /></span></button>)}</nav>
        <div className="notebook-content" ref={panel} key={tab}>{tab === 'route' ? <RoutePanel s={s} /> : tab === 'town' ? <TownPanel s={s} /> : tab === 'train' ? <TrainPanel s={s} /> : <JournalPanel s={s} />}</div>
        <div className="notebook-footer"><span className="status-dot" />{s.saveError ? 'ほぞんできないよ。せっていを 見てね' : 'じどうで ほぞん'}<span>YOUR TOWN, YOUR STORY.</span></div>
      </aside>
    </main>
    {s.toast && <div className={`game-toast toast-${s.toast.kind}`} role="status"><Reading text={s.toast.msg} /></div>}
    {s.gameCleared && <Dialog title={clearedChapter.clearTitle} close={s.dismissClear}><div className="chapter-medal"><RailIcon name="stamp" /></div><p>{clearedChapter.number}しょう クリア！<br />町は まだまだ 大きくなるよ。</p><p>{clearedChapter.number === 3 ? '町の ゆめを かなえて、新しい駅や おでかけ便にも チャレンジしよう。' : clearedChapter.unlock}</p><button className="primary-button" onClick={s.dismissClear}>つぎの ぼうけんへ →</button></Dialog>}
    {dialog === 'help' && <Dialog title="きみが 町の しゃちょう！" close={() => setDialog(null)}><p>人を はこんで お金をためて、<br />すきな町を つくるゲームだよ。</p><ol className="help-steps"><li><RailIcon name="route" /><div><strong>町を2つ つなぐ</strong><p>電車も いっしょに できるよ。行きも 帰りも じどうで 走るよ。</p></div></li><li><RailIcon name="coin" /><div><strong>人をとどけて お金をためる</strong><p>遠い町へは じどうで のりかえ。とどくと 町も 大きくなるよ。</p></div></li><li><RailIcon name="city" /><div><strong>町の ゆめを かなえる</strong><p>たてものを つくると 新しい駅が あらわれるよ。また せんろを のばそう！</p></div></li></ol><button className="primary-button" onClick={() => setDialog(null)}>やってみよう！</button></Dialog>}
    {dialog === 'settings' && <Dialog title="せってい" close={() => { setDialog(null); setResetConfirm(false); }}><button className="secondary-button" onClick={s.toggleMute}>音を {s.muted ? '出す' : 'おやすみする'}（いまは {s.muted ? '音なし' : '音あり'}）</button>{s.saveError && <p className="danger-text">いまは ほぞんできないよ。ブラウザの ほぞんを ゆるしてから あそんでね。とじると 続きが なくなることが あるよ。</p>}<p>このブラウザに じどうで ほぞんするよ。<br />つぎに ひらくと 電車は 駅から スタート。<br />町・お金・つくったものは そのままだよ。</p><hr />{resetConfirm ? <><p className="danger-text">町と お金を ぜんぶ はじめにもどすよ。<br />もとには もどせないけれど、いい？</p><button className="danger-button" onClick={() => { s.reset(); go('route'); setResetConfirm(false); setDialog(null); }}>はい、はじめから あそぶ</button><button className="secondary-button" onClick={() => setResetConfirm(false)}>やめる</button></> : <button className="text-button" onClick={() => setResetConfirm(true)}>はじめから あそびなおす</button>}</Dialog>}
  </div>;
}
