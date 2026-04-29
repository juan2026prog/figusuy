import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

// Helper for tracking
const trackEvent = async (placementId, eventType, placementContext, page) => {
  if (!placementId) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('sponsored_events').insert({
      sponsored_placement_id: placementId,
      event_type: eventType,
      user_id: user?.id || null,
      placement_context: placementContext,
      page: page
    });
  } catch (e) {
    console.error('Error tracking sponsored event:', e);
  }
};

// 1. Base Sponsored Card
export function SponsoredCard({
  placementId,
  placementContext,
  page,
  children,
  badgeText = 'Patrocinado',
  badgeIcon = 'star',
  onClick
}) {
  useEffect(() => {
    trackEvent(placementId, 'impression', placementContext, page);
  }, [placementId, placementContext, page]);

  const handleCardClick = (e) => {
    if (onClick) {
      trackEvent(placementId, 'click', placementContext, page);
      onClick(e);
    }
  };

  return (
    <article 
      onClick={handleCardClick}
      className="card-interactive"
      style={{
        border: '1px solid var(--color-brand-400)',
        boxShadow: '0 4px 12px rgba(234, 88, 12, 0.1)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '1rem'
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: '4px',
        background: 'linear-gradient(90deg, var(--color-brand-400), var(--color-brand-600))'
      }} />
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        background: 'rgba(234, 88, 12, 0.1)',
        color: 'var(--color-brand-600)',
        padding: '0.25rem 0.5rem',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.6875rem',
        fontWeight: 800,
        marginBottom: '0.75rem'
      }}>
        {badgeIcon && <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>{badgeIcon}</span>}
        {badgeText}
      </div>
      {children}
    </article>
  );
}

// 2. Image Gallery
export function SponsoredImageGallery({ placementId }) {
  const [images, setImages] = useState([]);

  useEffect(() => {
    const fetchImages = async () => {
      if (!placementId) return;
      const { data } = await supabase
        .from('sponsored_images')
        .select('*')
        .eq('sponsored_placement_id', placementId)
        .order('is_main', { ascending: false })
        .order('sort_order', { ascending: true });
      if (data) setImages(data);
    };
    fetchImages();
  }, [placementId]);

  if (!images || images.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
      {images.map((img, idx) => (
        <img 
          key={img.id} 
          src={img.image_url} 
          alt="Sponsored" 
          style={{
            height: idx === 0 ? '120px' : '80px',
            width: idx === 0 ? '100%' : '100px',
            objectFit: 'cover',
            borderRadius: 'var(--radius-lg)',
            flexShrink: 0
          }}
        />
      ))}
    </div>
  );
}

// 3. Sponsored Point Card
export function SponsoredPointCard({ placement, page }) {
  if (!placement) return null;

  const handleWhatsapp = (e) => {
    e.stopPropagation();
    trackEvent(placement.id, 'whatsapp_click', 'points_featured', page);
    window.open(`https://wa.me/${placement.whatsapp}`, '_blank');
  };

  const handleMap = (e) => {
    e.stopPropagation();
    trackEvent(placement.id, 'map_click', 'points_featured', page);
    const dest = placement.location_id ? placement.locations?.address : placement.title;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`, '_blank');
  };

  return (
    <SponsoredCard 
      placementId={placement.id} 
      placementContext="points_featured" 
      page={page}
      badgeText={placement.badge_text || '⭐ Destacado'}
      badgeIcon="star"
    >
      <SponsoredImageGallery placementId={placement.id} />
      <h3 style={{ fontSize: '1.125rem', fontWeight: 900, marginBottom: '0.25rem' }}>{placement.title}</h3>
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
        {placement.target_neighborhood} · {placement.target_department}
      </p>
      <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
        {placement.description}
      </p>
      
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {placement.whatsapp && (
          <button onClick={handleWhatsapp} className="btn btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8125rem' }}>
            WhatsApp
          </button>
        )}
        <button onClick={handleMap} className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8125rem' }}>
          Cómo llegar
        </button>
      </div>
    </SponsoredCard>
  );
}

// 4. Album Context Promo
export function AlbumContextPromo({ albumId, page }) {
  const [promo, setPromo] = useState(null);

  useEffect(() => {
    const fetchPromo = async () => {
      const { data } = await supabase
        .from('sponsored_placements')
        .select('*')
        .eq('placement_type', 'album_contextual')
        .eq('album_id', albumId)
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .limit(1)
        .single();
      if (data) setPromo(data);
    };
    if (albumId) fetchPromo();
  }, [albumId]);

  if (!promo) return null;

  return (
    <SponsoredCard 
      placementId={promo.id} 
      placementContext="album_contextual" 
      page={page}
      badgeText="Patrocinado"
      badgeIcon="info"
    >
      <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '0.25rem' }}>{promo.title}</h3>
      <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--color-text-secondary)' }}>
        {promo.description}
      </p>
      <button 
        onClick={() => {
          trackEvent(promo.id, 'detail_click', 'album_contextual', page);
          if (promo.cta_url) window.open(promo.cta_url, '_blank');
        }}
        className="btn btn-secondary" style={{ width: '100%', padding: '0.5rem', fontSize: '0.8125rem' }}
      >
        {promo.cta_label || 'Ver más'}
      </button>
    </SponsoredCard>
  );
}

// 5. Exchange Context Promo
export function ExchangeContextPromo({ page }) {
  const [promo, setPromo] = useState(null);

  useEffect(() => {
    const fetchPromo = async () => {
      const { data } = await supabase
        .from('sponsored_placements')
        .select('*')
        .eq('placement_type', 'exchange_contextual')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .limit(1)
        .single();
      if (data) setPromo(data);
    };
    fetchPromo();
  }, []);

  if (!promo) return null;

  return (
    <SponsoredCard 
      placementId={promo.id} 
      placementContext="exchange_contextual" 
      page={page}
      badgeText="📍 Punto seguro cerca"
      badgeIcon="location_on"
    >
      <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '0.25rem' }}>{promo.title}</h3>
      <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--color-text-secondary)' }}>
        {promo.description}
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          onClick={() => {
            trackEvent(promo.id, 'map_click', 'exchange_contextual', page);
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(promo.title)}`, '_blank');
          }}
          className="btn btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8125rem' }}
        >
          Cómo llegar
        </button>
      </div>
    </SponsoredCard>
  );
}
