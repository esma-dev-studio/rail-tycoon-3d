// ============================================================================
// 下部ツールバー — モード切替 + いくらかかるかの案内(小2向け)
// ============================================================================
import { useMemo } from 'react';
import { TRACK_COST, TRAIN_COST } from '../data/config';
import { edgeKey, manhattanPath } from '../utils/grid';
import { useGameStore } from '../store/gameStore';
import type { BuildMode } from '../types/game';

const MODES: { mode: BuildMode; icon: string; label: string }[] = [
  { mode: 'inspect', icon: '👆', label: 'えらぶ' },
  { mode: 'track', icon: '🛤', label: 'せんろ' },
  { mode: 'line', icon: '🚆', label: '電車' },
  { mode: 'demolish', icon: '💥', label: 'こわす' },
];

const HINTS: Record<BuildMode, string> = {
  inspect: '町や 電車を クリックすると くわしく 見られるよ',
  track: `じめんを クリックして せんろを つくろう！（1マス ${TRACK_COST}円）`,
  line: `町を 2つ クリックすると 電車が はしるよ！（電車 1だい ${TRAIN_COST.toLocaleString()}円）`,
  demolish: 'せんろを クリックすると こわせるよ（お金が はんぶん もどる）',
};

export function BuildToolbar() {
  const buildMode = useGameStore((s) => s.buildMode);
  const setBuildMode = useGameStore((s) => s.setBuildMode);
  const lineAnchorTown = useGameStore((s) => s.lineAnchorTown);
  const anchorNode = useGameStore((s) => s.anchorNode);
  const hoverNode = useGameStore((s) => s.hoverNode);
  const trackEdges = useGameStore((s) => s.trackEdges);
  const money = useGameStore((s) => s.money);

  // いま敷こうとしている線路のマス数と値段
  const quote = useMemo(() => {
    if (buildMode !== 'track' || !anchorNode || !hoverNode || anchorNode === hoverNode) return null;
    const path = manhattanPath(anchorNode, hoverNode);
    let n = 0;
    for (let i = 0; i < path.length - 1; i++) {
      if (!trackEdges.has(edgeKey(path[i], path[i + 1]))) n++;
    }
    if (n === 0) return null;
    const cost = n * TRACK_COST;
    return { n, cost, ok: money >= cost };
  }, [buildMode, anchorNode, hoverNode, trackEdges, money]);

  let hint = HINTS[buildMode];
  if (buildMode === 'line' && lineAnchorTown) hint = 'つぎに ゴールの 町を クリック！（おなじ町で やめられるよ）';
  else if (buildMode === 'track' && anchorNode && !quote) hint = 'つぎの ばしょを クリックすると せんろが のびるよ';

  return (
    <div className="toolbar">
      {quote && (
        <div className={`quote ${quote.ok ? '' : 'is-over'}`}>
          🛤 せんろ {quote.n}マス ＝ <b>{quote.cost.toLocaleString()}円</b>
          {quote.ok ? '' : '　😢 お金が たりない！'}
        </div>
      )}
      <div className="toolbar__modes">
        {MODES.map((m) => (
          <button
            key={m.mode}
            className={`mode ${buildMode === m.mode ? 'is-active' : ''}`}
            onClick={() => setBuildMode(m.mode)}
          >
            <span className="mode__icon">{m.icon}</span>
            <span className="mode__label">{m.label}</span>
          </button>
        ))}
      </div>
      <div className="toolbar__hint">{hint}</div>
    </div>
  );
}
