// ============================================================================
// 線路グラフの最短経路(BFS)。フレームワーク非依存。
// ============================================================================
import { neighbors4, edgeKey } from '../utils/grid';
import type { NodeKey } from '../types/game';

/** 敷設済みエッジ集合(edgeKey)上で start→goal のノード経路を返す。無ければ null */
export function bfsPath(edges: Set<string>, start: NodeKey, goal: NodeKey): NodeKey[] | null {
  if (start === goal) return [start];
  const prev = new Map<NodeKey, NodeKey>();
  const visited = new Set<NodeKey>([start]);
  const queue: NodeKey[] = [start];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    for (const nb of neighbors4(cur)) {
      if (visited.has(nb)) continue;
      if (!edges.has(edgeKey(cur, nb))) continue;
      visited.add(nb);
      prev.set(nb, cur);
      if (nb === goal) {
        const path: NodeKey[] = [goal];
        let c = goal;
        while (c !== start) {
          c = prev.get(c)!;
          path.push(c);
        }
        return path.reverse();
      }
      queue.push(nb);
    }
  }
  return null;
}
