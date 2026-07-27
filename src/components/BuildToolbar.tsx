import { useMemo } from 'react';
import { TRACK_COST, BRIDGE_COST, TRAIN_COST } from '../data/config';
import { edgeKey, manhattanPath } from '../utils/grid';
import { isBridgeEdge, trackEdgeCost } from '../sim/economy';
import { useGameStore } from '../store/gameStore';
import type { BuildMode } from '../types/game';

const MAIN_MODES: { mode: BuildMode; icon: string; label: string; aria: string }[] = [
  { mode: 'inspect', icon: '👆', label: '見る', aria: '町や電車を見る' },
  { mode: 'track', icon: '🛤️', label: 'せんろ', aria: 'せんろをつくる' },
  { mode: 'line', icon: '🚆', label: '電車', aria: '電車をはしらせる' },
];

function Coach() {
  const buildMode = useGameStore((s) => s.buildMode);
  const anchorNode = useGameStore((s) => s.anchorNode);
  const lineAnchorTown = useGameStore((s) => s.lineAnchorTown);
  const trackEdges = useGameStore((s) => s.trackEdges);
  const lines = useGameStore((s) => s.lines);
  const totalDelivered = useGameStore((s) => s.totalDelivered);

  if (trackEdges.size === 0) {
    if (buildMode !== 'track') {
      return { step: '1', icon: '👇', text: '下の「せんろ」を おそう' };
    }
    if (!anchorNode) return { step: '1', icon: '🏘️', text: '1つめの 町を おそう' };
    return { step: '2', icon: '🏘️', text: 'つなぎたい もう1つの 町を おそう' };
  }
  if (lines.length === 0) {
    if (buildMode !== 'line') {
      return { step: '3', icon: '👇', text: '下の「電車」を おそう' };
    }
    if (!lineAnchorTown) return { step: '3', icon: '🚉', text: 'しゅっぱつする 町を おそう' };
    return { step: '4', icon: '🏁', text: 'とうちゃくする 町を おそう' };
  }
  if (totalDelivered === 0) {
    return { step: '5', icon: '👀', text: '電車が おきゃくさんを はこぶのを 見てみよう！' };
  }
  if (totalDelivered < 4) {
    return { step: '6', icon: '🏙️', text: `あと ${4 - totalDelivered}人 はこぶと、町が そだつよ！` };
  }
  return { step: '★', icon: '💡', text: 'せんろを のばす？ お金を ためる？ きみの さくせんで あそぼう！' };
}

export function BuildToolbar() {
  const buildMode = useGameStore((s) => s.buildMode);
  const setBuildMode = useGameStore((s) => s.setBuildMode);
  const anchorNode = useGameStore((s) => s.anchorNode);
  const hoverNode = useGameStore((s) => s.hoverNode);
  const trackEdges = useGameStore((s) => s.trackEdges);
  const lines = useGameStore((s) => s.lines);
  const terrain = useGameStore((s) => s.terrain);
  const money = useGameStore((s) => s.money);
  const coach = Coach();

  const quote = useMemo(() => {
    if (buildMode !== 'track' || !anchorNode || !hoverNode || anchorNode === hoverNode) return null;
    const path = manhattanPath(anchorNode, hoverNode);
    let tiles = 0;
    let bridges = 0;
    let cost = 0;
    for (let i = 0; i < path.length - 1; i++) {
      if (trackEdges.has(edgeKey(path[i], path[i + 1]))) continue;
      tiles++;
      cost += trackEdgeCost(path[i], path[i + 1], terrain);
      if (isBridgeEdge(path[i], path[i + 1], terrain)) bridges++;
    }
    if (tiles === 0) return null;
    return { tiles, bridges, cost, ok: money >= cost, left: money - cost };
  }, [buildMode, anchorNode, hoverNode, trackEdges, terrain, money]);

  const suggestedMode: BuildMode | null =
    trackEdges.size === 0 ? 'track' : lines.length === 0 ? 'line' : null;

  return (
    <div className="toolbar">
      <div className="coach" aria-live="polite">
        <span className="coach__step">{coach.step}</span>
        <span className="coach__icon">{coach.icon}</span>
        <b>{coach.text}</b>
      </div>

      {quote && (
        <div className={`quote ${quote.ok ? '' : 'is-over'}`}>
          <span>🛤️ {quote.tiles}マス</span>
          {quote.bridges > 0 && <span> 🌉 はし {quote.bridges}マス</span>}
          <strong>{quote.cost.toLocaleString()}円</strong>
          <small>
            {quote.ok
              ? `のこり ${quote.left.toLocaleString()}円`
              : `あと ${(-quote.left).toLocaleString()}円 たりない`}
          </small>
        </div>
      )}

      <div className="toolbar__main">
        <div className="toolbar__modes" role="group" aria-label="つくる どうぐ">
          {MAIN_MODES.map((item) => (
            <button
              key={item.mode}
              className={`mode ${buildMode === item.mode ? 'is-active' : ''} ${
                suggestedMode === item.mode && buildMode !== item.mode ? 'is-next' : ''
              }`}
              onClick={() => setBuildMode(item.mode)}
              aria-label={item.aria}
              aria-pressed={buildMode === item.mode}
            >
              {suggestedMode === item.mode && buildMode !== item.mode && (
                <span className="mode__next">つぎ</span>
              )}
              <span className="mode__icon">{item.icon}</span>
              <span className="mode__label">{item.label}</span>
            </button>
          ))}
        </div>
        <button
          className={`tidy-btn ${buildMode === 'demolish' ? 'is-active' : ''}`}
          onClick={() => setBuildMode(buildMode === 'demolish' ? 'inspect' : 'demolish')}
          aria-label="せんろを かたづける"
          aria-pressed={buildMode === 'demolish'}
        >
          🧹<span>{buildMode === 'demolish' ? 'けす ばしょを おす' : 'かたづけ'}</span>
        </button>
      </div>

      {buildMode === 'track' && !anchorNode && (
        <div className="cost-note">
          1マス {TRACK_COST}円 ・ 川の はし {BRIDGE_COST}円
        </div>
      )}
      {buildMode === 'line' && (
        <div className="cost-note">電車 1だい {TRAIN_COST.toLocaleString()}円</div>
      )}
    </div>
  );
}
