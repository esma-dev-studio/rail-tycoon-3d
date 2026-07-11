# 🚆 Rail Tycoon 3D

自分で線路を敷き、路線を開設し、列車を走らせて乗客を運ぶ——
Transport Tycoon 風の3D鉄道経営シミュレーションです。ブラウザだけで動きます。

![tech](https://img.shields.io/badge/React-18-61dafb) ![tech](https://img.shields.io/badge/Three.js-0.161-000) ![tech](https://img.shields.io/badge/TypeScript-strict-3178c6) ![tech](https://img.shields.io/badge/Vite-5-646cff)

## 遊び方

1. **🛤 線路** モードで、2つの地点をクリックして線路を敷きます（1マスごとに費用）。続けてクリックすると線路が延びます。町と町が線路でつながるように敷設しましょう。
2. **🧭 路線** モードで、起点の駅と終点の駅をクリックすると路線が開設され、列車が1両自動購入されます。
3. 列車が駅間を自動で往復し、乗客を乗せて目的地まで運ぶと**運賃**が入ります。
4. 駅に乗客がたまってきたら、路線を選択して **列車を増発** しましょう。
5. **⛏ 撤去** モードで線路を撤去できます（建設費の一部を返金）。
6. 右上の **⏸ / ▶ / ⏩** で時間の進み方を変えられます。

町の上のラベルには待っている乗客数が表示されます。多くの乗客をさばいて資金を増やすのが目標です。

## 操作

| 操作 | 効果 |
| --- | --- |
| ドラッグ | カメラ回転 |
| 右ドラッグ / 2本指 | パン(平行移動) |
| ホイール / ピンチ | ズーム |
| クリック | モードに応じて 選択 / 敷設 / 駅指定 / 撤去 |

## 開発

```bash
npm install
npm run dev      # 開発サーバ (http://localhost:5182)
npm run build    # 本番ビルド (dist/)
npm run preview  # ビルド結果のプレビュー
```

## 設計メモ

- **状態の分離**: 資金・路線・線路などの離散的な状態は Zustand ストア（`src/store`）が持ち、列車の連続的な位置は React の外の可変シングルトン（`src/sim/simInstance.ts`）が持つ。列車の移動は `useFrame` から直接メッシュを更新し、毎フレームの React 再描画を避けている。UI 表示は約 5Hz で `revision` を更新して追従する。
- **シミュレーションの独立性**: 乗客発生・列車の移動と乗降・運賃計算などのロジックは Three.js / React に依存しない純粋な関数（`src/sim`, `src/utils/grid.ts`）。Node 単体でも検証できる。
- **経路探索**: 路線開設時は敷設済みエッジのグラフ上で BFS を行い、最短の駅間経路を求める（`src/sim/pathfinding.ts`）。
- **グリッド世界**: 16×16 のグリッド。線路はノード間の無向エッジ集合として保持し、敷設はマンハッタン（L字）経路で行う。

## クレジット

- 3D: [Three.js](https://threejs.org/) / [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) / [drei](https://github.com/pmndrs/drei)
- 状態管理: [Zustand](https://github.com/pmndrs/zustand)
- 地形・建物・列車はすべてプリミティブ幾何によるローポリ表現（外部モデル不使用）。
