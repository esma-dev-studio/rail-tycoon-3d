import { useMemo, useState } from 'react';
import { TRACK_COST, BRIDGE_COST, TRAIN_COST } from '../data/config';
import { TOWNS_BY_ID } from '../data/world';
import { edgeKey, key, manhattanPath } from '../utils/grid';
import { isBridgeEdge, trackEdgeCost } from '../sim/economy';
import { useGameStore } from '../store/gameStore';
import { RailIcon } from './RailIcon';


export function BuildToolbar() {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const buildMode = useGameStore((state) => state.buildMode);
  const setBuildMode = useGameStore((state) => state.setBuildMode);
  const anchorNode = useGameStore((state) => state.anchorNode);
  const hoverNode = useGameStore((state) => state.hoverNode);
  const routeStartTown = useGameStore((state) => state.routeStartTown);
  const routeEndTown = useGameStore((state) => state.routeEndTown);
  const trackEdges = useGameStore((state) => state.trackEdges);
  const terrain = useGameStore((state) => state.terrain);
  const money = useGameStore((state) => state.money);
  const lines = useGameStore((state) => state.lines);
  const confirmEasyRoute = useGameStore((state) => state.confirmEasyRoute);
  const cancelEasyRoute = useGameStore((state) => state.cancelEasyRoute);

  const routePlan = useMemo(() => {
    const start = routeStartTown ? TOWNS_BY_ID.get(routeStartTown) : null;
    const end = routeEndTown ? TOWNS_BY_ID.get(routeEndTown) : null;
    if (!start || !end) return null;
    const path = manhattanPath(key(start.x, start.z), key(end.x, end.z));
    let newTiles = 0;
    let bridges = 0;
    let trackPrice = 0;
    for (let index = 0; index < path.length - 1; index++) {
      const edge = edgeKey(path[index], path[index + 1]);
      if (trackEdges.has(edge)) continue;
      newTiles++;
      trackPrice += trackEdgeCost(path[index], path[index + 1], terrain);
      if (isBridgeEdge(path[index], path[index + 1], terrain)) bridges++;
    }
    const total = trackPrice + TRAIN_COST;
    return {
      start,
      end,
      newTiles,
      bridges,
      trackPrice,
      total,
      after: money - total,
      affordable: money >= total,
    };
  }, [routeStartTown, routeEndTown, trackEdges, terrain, money]);

  const manualQuote = useMemo(() => {
    if (buildMode !== 'track' || !anchorNode || !hoverNode || anchorNode === hoverNode) return null;
    const path = manhattanPath(anchorNode, hoverNode);
    let tiles = 0;
    let bridges = 0;
    let cost = 0;
    for (let index = 0; index < path.length - 1; index++) {
      if (trackEdges.has(edgeKey(path[index], path[index + 1]))) continue;
      tiles++;
      cost += trackEdgeCost(path[index], path[index + 1], terrain);
      if (isBridgeEdge(path[index], path[index + 1], terrain)) bridges++;
    }
    if (tiles === 0) return null;
    return { tiles, bridges, cost, affordable: money >= cost };
  }, [buildMode, anchorNode, hoverNode, trackEdges, terrain, money]);

  const chooseRouteMode = () => {
    setAdvancedOpen(false);
    setBuildMode('route');
  };

  return (
    <div className="control-dock">

      {buildMode === 'route' && (
        <div className="route-builder">
          <div className="route-builder__steps" aria-label="せんろをつくる 3ステップ">
            <span className={routeStartTown ? 'is-done' : 'is-current'}>
              <i>1</i> 町をえらぶ
            </span>
            <em />
            <span className={routeEndTown ? 'is-done' : routeStartTown ? 'is-current' : ''}>
              <i>2</i> もう1つ
            </span>
            <em />
            <span className={routePlan ? 'is-current' : ''}>
              <i>3</i> つくる
            </span>
          </div>

          {routePlan && (
            <div className="route-ticket">
              <div className="route-ticket__line">
                <span className="route-ticket__station">{routePlan.start.name}</span>
                <span className="route-ticket__rail">
                  <i />
                  <RailIcon name="train" />
                  <i />
                </span>
                <span className="route-ticket__station">{routePlan.end.name}</span>
              </div>
              <div className="route-ticket__facts">
                <span>
                  <small>せんろ</small>
                  <b>{routePlan.newTiles}マス</b>
                </span>
                {routePlan.bridges > 0 && (
                  <span>
                    <small>はし</small>
                    <b>{routePlan.bridges}マス</b>
                  </span>
                )}
                <span>
                  <small>せんろ代</small>
                  <b>{routePlan.trackPrice.toLocaleString()}円</b>
                </span>
                <span>
                  <small>電車つき</small>
                  <b>{TRAIN_COST.toLocaleString()}円</b>
                </span>
                <span className="route-ticket__total">
                  <small>ぜんぶで</small>
                  <strong>{routePlan.total.toLocaleString()}円</strong>
                </span>
              </div>
              <div className={`route-ticket__balance ${routePlan.affordable ? '' : 'is-short'}`}>
                {routePlan.affordable
                  ? `つくった あとは ${routePlan.after.toLocaleString()}円`
                  : `あと ${(-routePlan.after).toLocaleString()}円 たりない`}
              </div>
              <div className="route-ticket__actions">
                <button className="route-ticket__cancel" onClick={cancelEasyRoute}>
                  えらびなおす
                </button>
                <button
                  className="route-ticket__confirm"
                  onClick={confirmEasyRoute}
                  disabled={!routePlan.affordable}
                >
                  <RailIcon name="sparkle" />
                  このせんを つくる！
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {manualQuote && (
        <div className={`manual-quote ${manualQuote.affordable ? '' : 'is-short'}`}>
          {manualQuote.tiles}マス・{manualQuote.cost.toLocaleString()}円
          {manualQuote.bridges > 0 && `（はし ${manualQuote.bridges}マス）`}
        </div>
      )}

      <div className="control-dock__bar">
        <button
          className={`dock-action ${buildMode === 'inspect' ? 'is-active' : ''}`}
          onClick={() => {
            setAdvancedOpen(false);
            setBuildMode('inspect');
          }}
          aria-pressed={buildMode === 'inspect'}
        >
          <RailIcon name="eye" />
          <span>町を見る</span>
        </button>

        <button
          className={`dock-action dock-action--primary ${buildMode === 'route' ? 'is-active' : ''} ${
            lines.length === 0 && buildMode !== 'route' ? 'is-recommended' : ''
          }`}
          onClick={chooseRouteMode}
          aria-pressed={buildMode === 'route'}
        >
          {lines.length === 0 && buildMode !== 'route' && <small>ここから！</small>}
          <RailIcon name="route" />
          <span>新しいせんろ</span>
        </button>

        <button
          className={`dock-action ${advancedOpen ? 'is-active' : ''}`}
          onClick={() => setAdvancedOpen((open) => !open)}
          aria-expanded={advancedOpen}
        >
          <RailIcon name="tools" />
          <span>じゆう</span>
        </button>
      </div>

      {advancedOpen && (
        <div className="advanced-tools">
          <span className="advanced-tools__label">くわしく つくる</span>
          <button
            className={buildMode === 'track' ? 'is-active' : ''}
            onClick={() => setBuildMode('track')}
          >
            <RailIcon name="route" /> せんろを 1マスずつ
          </button>
          <button
            className={buildMode === 'line' ? 'is-active' : ''}
            onClick={() => setBuildMode('line')}
          >
            <RailIcon name="train" /> ろせんを きめる
          </button>
          <button
            className={`advanced-tools__danger ${buildMode === 'demolish' ? 'is-active' : ''}`}
            onClick={() => setBuildMode('demolish')}
          >
            <RailIcon name="broom" /> せんろを けす
          </button>
          <small>
            せんろ 1マス {TRACK_COST}円 ／ 川の はし {BRIDGE_COST}円
          </small>
        </div>
      )}
    </div>
  );
}
