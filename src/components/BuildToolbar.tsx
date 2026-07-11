// ============================================================================
// 下部ツールバー — 建設モード切替 + 操作ヒント
// ============================================================================
import { TRACK_COST, TRAIN_COST } from '../data/config';
import { useGameStore } from '../store/gameStore';
import type { BuildMode } from '../types/game';

const MODES: { mode: BuildMode; icon: string; label: string }[] = [
  { mode: 'inspect', icon: '👆', label: '選択' },
  { mode: 'track', icon: '🛤', label: '線路' },
  { mode: 'line', icon: '🧭', label: '路線' },
  { mode: 'demolish', icon: '⛏', label: '撤去' },
];

const HINTS: Record<BuildMode, string> = {
  inspect: '町・列車・路線をクリックして詳細を表示',
  track: `2点をクリックして線路を敷設(1マス ¥${TRACK_COST})。連続でクリックすると延長`,
  line: `起点と終点の駅をクリックして路線を開設。列車1両 ¥${TRAIN_COST.toLocaleString()}が自動購入`,
  demolish: '線路をクリックで撤去(建設費の50%を返金)',
};

export function BuildToolbar() {
  const buildMode = useGameStore((s) => s.buildMode);
  const setBuildMode = useGameStore((s) => s.setBuildMode);
  const lineAnchorTown = useGameStore((s) => s.lineAnchorTown);
  const anchorNode = useGameStore((s) => s.anchorNode);

  let hint = HINTS[buildMode];
  if (buildMode === 'line' && lineAnchorTown) hint = '終点の駅をクリック(同じ駅で取り消し)';
  if (buildMode === 'track' && anchorNode) hint = '次の点をクリックして線路を延ばす';

  return (
    <div className="toolbar">
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
