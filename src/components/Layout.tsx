// ============================================================================
// HUD レイアウト — 3Dシーンに重ねる各種オーバーレイをまとめる
// ============================================================================
import { TopBar } from './TopBar';
import { BuildToolbar } from './BuildToolbar';
import { InspectorPanel } from './InspectorPanel';
import { Toast } from './Toast';

export function Layout() {
  return (
    <>
      <TopBar />
      <InspectorPanel />
      <BuildToolbar />
      <Toast />
    </>
  );
}
