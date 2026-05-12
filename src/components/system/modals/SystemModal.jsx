import React from 'react';
import { useSystemStore } from '../../../stores/system/useSystemStore';
import '../system.css';

export const SystemModal = ({ children, onClose }) => {
  return (
    <div className="system-modal-overlay" onClick={onClose}>
      <div className="system-modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};
