// ============================================================================
// HUD レイアウト — 3Dシーンに重ねる各種オーバーレイをまとめる
// ============================================================================
import { TopBar } from './TopBar';
import { BuildToolbar } from './BuildToolbar';
import { InspectorPanel } from './InspectorPanel';
import { MissionPanel } from './MissionPanel';
import { ClearOverlay } from './ClearOverlay';
import { HelpModal } from './HelpModal';
import { Confetti } from './Confetti';
import { Toast } from './Toast';

export function Layout() {
  return (
    <>
      <TopBar />
      <MissionPanel />
      <InspectorPanel />
      <BuildToolbar />
      <HelpModal />
      <Toast />
      <Confetti />
      <ClearOverlay />
    </>
  );
}
