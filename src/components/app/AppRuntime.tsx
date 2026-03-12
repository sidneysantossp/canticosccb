import React from 'react';
import AnalyticsScripts from '@/components/AnalyticsScripts';
import GlobalAudioPlayer from '@/components/GlobalAudioPlayer';
import FreePlayGateModal from '@/components/modals/FreePlayGateModal';
import { usePresence } from '@/hooks/usePresence';

const PresenceTracker: React.FC = () => {
  usePresence();
  return null;
};

const AppRuntime: React.FC = () => {
  return (
    <>
      <GlobalAudioPlayer />
      <FreePlayGateModal />
      <PresenceTracker />
      <AnalyticsScripts />
    </>
  );
};

export default AppRuntime;
