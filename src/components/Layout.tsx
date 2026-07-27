import { TopBar } from './TopBar';
import { BuildToolbar } from './BuildToolbar';
import { InspectorPanel } from './InspectorPanel';
import { MissionPanel } from './MissionPanel';
import { ClearOverlay } from './ClearOverlay';
import { HelpModal } from './HelpModal';
import { Confetti } from './Confetti';
import { Toast } from './Toast';
import { ProgressCenter } from './ProgressCenter';
import { WelcomeOverlay } from './WelcomeOverlay';

export function Layout() {
  return (
    <>
      <TopBar />
      <MissionPanel />
      <InspectorPanel />
      <ProgressCenter />
      <BuildToolbar />
      <HelpModal />
      <Toast />
      <Confetti />
      <ClearOverlay />
      <WelcomeOverlay />
    </>
  );
}
