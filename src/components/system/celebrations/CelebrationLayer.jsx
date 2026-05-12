import React, { useEffect, useState } from 'react';
import { useSystemStore } from '../../../stores/system/useSystemStore';
import '../system.css';

export const CelebrationLayer = ({ children }) => {
  const { activeEvent } = useSystemStore();
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!activeEvent) {
      setParticles([]);
      return;
    }

    // Trigger celebrations based on event type
    const typesWithConfetti = ['LEVEL_UP', 'BADGE_UNLOCKED', 'PLAN_UPGRADED', 'FOUNDING_MEMBER', 'ALBUM_COMPLETED'];
    
    if (typesWithConfetti.includes(activeEvent.type)) {
      generateConfetti();
    }
  }, [activeEvent]);

  const generateConfetti = () => {
    // Basic placeholder for confetti system
    const newParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: ['#ff6a00', '#FFD700', '#22C55E', '#3B82F6', '#8B5CF6'][Math.floor(Math.random() * 5)],
      delay: Math.random() * 0.5
    }));
    setParticles(newParticles);
    
    // Clean up particles after animation
    setTimeout(() => {
      setParticles([]);
    }, 3000);
  };

  return (
    <>
      {children}
      {particles.length > 0 && (
        <div className="celebration-layer">
          {particles.map(p => (
            <div 
              key={p.id} 
              style={{
                position: 'absolute',
                left: `${p.x}vw`,
                top: `${p.y}vh`,
                width: '8px',
                height: '8px',
                backgroundColor: p.color,
                borderRadius: '50%',
                opacity: 0.8,
                animation: `fall 2s ease-in ${p.delay}s forwards`
              }}
            />
          ))}
          <style>{`
            @keyframes fall {
              0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}
    </>
  );
};
