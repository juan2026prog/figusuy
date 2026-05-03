import React from 'react';
import { useNavigate } from 'react-router-dom';
import BusinessApplyModal from '../components/BusinessApplyModal';

export default function BusinessApply() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      <BusinessApplyModal 
        isOpen={true} 
        onClose={() => navigate(-1)} 
      />
    </div>
  );
}
