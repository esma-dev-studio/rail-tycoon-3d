// ============================================================================
// アプリのルート — 3Dシーン(背景) + HUD(前面)
// ============================================================================
import { useEffect } from 'react';
import { GameScene } from './scenes/GameScene';
import { Layout } from './components/Layout';

export default function App() {
  // 一部の埋め込み環境で Canvas の初期サイズが 0 になる問題への保険
  useEffect(() => {
    const nudge = () => window.dispatchEvent(new Event('resize'));
    const t1 = setTimeout(nudge, 60);
    const t2 = setTimeout(nudge, 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="app">
      <div className="app__scene">
        <GameScene />
      </div>
      <Layout />
    </div>
  );
}
