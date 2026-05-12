import React, { useEffect } from 'react';
import { useSystemStore } from '../../stores/system/useSystemStore';
import { SystemModal } from './modals/SystemModal';
import { CelebrationLayer } from './celebrations/CelebrationLayer';
import { TemplateFactory } from './templates/TemplateFactory';
import { useSystemEvents } from '../../hooks/system/useSystemEvents';
import './system.css';

export const SystemEventEngine = () => {
  const { activeEvent, clearActiveEvent } = useSystemStore();
  const { dispatchEvent } = useSystemEvents();

  // Make the event dispatcher globally available for testing via console
  // In production, events should be dispatched by actual components/hooks
  useEffect(() => {
    window.__FigusUY_SystemEventEngine = {
      dispatch: dispatchEvent
    };
    return () => {
      delete window.__FigusUY_SystemEventEngine;
    };
  }, [dispatchEvent]);

  if (!activeEvent) return null;

  return (
    <CelebrationLayer>
      <SystemModal onClose={clearActiveEvent}>
        <TemplateFactory event={activeEvent} />
      </SystemModal>
    </CelebrationLayer>
  );
};
