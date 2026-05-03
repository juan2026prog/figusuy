import React, { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { getPartnerStoreValidations, subscribePartnerStoreStorage, verifyAlbumAsPartnerStore } from '../lib/partnerStore'

export default function BusinessPartnerStoreValidations() {
  const { location } = useOutletContext()
  const profile = useAuthStore(state => state.profile)
  const [items, setItems] = useState([])
  const [notesByKey, setNotesByKey] = useState({})

  useEffect(() => {
    const sync = () => setItems(getPartnerStoreValidations())
    sync()
    return subscribePartnerStoreStorage(sync)
  }, [])

  const pendingItems = useMemo(
    () => items.filter(item => item.status === 'pending'),
    [items]
  )
  const verifiedItems = useMemo(
    () => items.filter(item => item.status === 'verified').slice(0, 8),
    [items]
  )

  if (!location) return null

  const isPartnerStore = location.business_plan === 'legend'

  const handleApprove = (item) => {
    verifyAlbumAsPartnerStore({
      userId: item.userId,
      albumId: item.albumId,
      locationId: location.id,
      locationName: location.name,
      validatedByUserId: profile?.id,
      validatedByName: profile?.name || location.name,
      notes: notesByKey[item.userAlbumKey] || ''
    })
  }

  if (!isPartnerStore) {
    return (
      <div className="biz-page">
        <div className="biz-empty-state">
          <h2>Validaciones PartnerStore</h2>
          <p>Este modulo solo se activa para tiendas con plan PartnerStore. PartnerStore convierte tu local en referencia para validar albumes completos y verificar colecciones.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="biz-page">
      <style>{`
        .legend-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(280px, .85fr);
          gap: 1.25rem;
        }

        .legend-lead,
        .legend-side,
        .legend-card {
          border: 1px solid var(--line);
        }

        .legend-lead {
          padding: 1.4rem;
          background:
            linear-gradient(135deg, rgba(250, 204, 21, .18) 0%, rgba(255, 90, 0, .08) 36%, transparent 68%),
            var(--panel);
        }

        .legend-side {
          padding: 1.4rem;
          background: var(--panel2);
        }

        .legend-lead h2,
        .legend-side h3 {
          margin: .55rem 0 0;
          font: italic 900 2.2rem 'Barlow Condensed';
          line-height: .9;
          text-transform: uppercase;
        }

        .legend-lead p,
        .legend-side p,
        .legend-meta,
        .legend-note {
          color: var(--muted);
          line-height: 1.55;
        }

        .legend-grid {
          display: grid;
          gap: 1rem;
          margin-top: 1.25rem;
        }

        .legend-card {
          padding: 1.2rem;
          background: var(--panel);
        }

        .legend-card-head {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: start;
        }

        .legend-card-title {
          font: italic 900 1.8rem 'Barlow Condensed';
          line-height: .9;
          text-transform: uppercase;
          margin: 0;
        }

        .legend-chip {
          display: inline-flex;
          align-items: center;
          gap: .4rem;
          padding: .42rem .62rem;
          border: 1px solid rgba(250, 204, 21, .3);
          background: rgba(250, 204, 21, .08);
          color: var(--yellow);
          font: 900 .7rem 'Barlow Condensed';
          letter-spacing: .08em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .legend-card img {
          width: 72px;
          height: 96px;
          object-fit: cover;
          border: 1px solid var(--line);
          background: #0d0d0d;
        }

        .legend-body {
          display: grid;
          grid-template-columns: 72px 1fr;
          gap: 1rem;
          margin-top: .9rem;
        }

        .legend-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: .55rem;
          margin-top: .7rem;
        }

        .legend-pill {
          padding: .32rem .5rem;
          border: 1px solid var(--line2);
          background: #0d0d0d;
          font: 800 .72rem 'Barlow', sans-serif;
          color: var(--muted);
        }

        .legend-textarea {
          width: 100%;
          min-height: 84px;
          margin-top: .85rem;
          padding: .8rem .9rem;
          border: 1px solid var(--line2);
          background: #0d0d0d;
          color: #fff;
          resize: vertical;
        }

        .legend-actions {
          display: flex;
          justify-content: flex-end;
          gap: .7rem;
          margin-top: .9rem;
        }

        @media (max-width: 980px) {
          .legend-hero {
            grid-template-columns: 1fr;
          }
          .legend-body {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <section className="legend-hero">
        <div className="legend-lead">
          <div className="biz-page-kicker">/ tienda partnerstore</div>
          <h2>Autoridad, validacion y prestigio real dentro de FigusUY.</h2>
          <p>Desde este modulo puedes revisar albumes completados y emitir Validación PartnerStore de forma manual. Eso convierte a tu local en referencia, genera confianza y atrae trafico fisico.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.55rem', marginTop: '1rem' }}>
            <span className="biz-chip orange">Pendientes: {pendingItems.length}</span>
            <span className="biz-chip green">Validados: {verifiedItems.length}</span>
            <span className="biz-chip blue">Tienda PartnerStore</span>
          </div>
        </div>

        <aside className="legend-side">
          <div className="biz-page-kicker">/ que valida partnerstore</div>
          <h3>No solo destacas. Te convertis en referencia.</h3>
          <p>Una Tienda PartnerStore puede validar albumes completos, verificar colecciones terminadas y emitir Validación PartnerStore como sello de confianza.</p>
        </aside>
      </section>

      <section style={{ marginTop: '1.25rem' }}>
        <div className="biz-section-head">
          <div>
            <div className="biz-page-kicker">/ pendientes</div>
            <h2>Albumes listos para revisar</h2>
            <p>La validacion sigue siendo manual. Revisa coleccion, confirma que este completa y aprueba cuando corresponda.</p>
          </div>
        </div>

        {pendingItems.length === 0 ? (
          <div className="biz-card">
            <p className="biz-text-muted">No hay albumes pendientes de Validación PartnerStore en este navegador.</p>
          </div>
        ) : (
          <div className="legend-grid">
            {pendingItems.map(item => (
              <article key={item.userAlbumKey} className="legend-card">
                <div className="legend-card-head">
                  <div>
                    <h3 className="legend-card-title">{item.albumName}</h3>
                    <div className="legend-meta">Coleccionista: {item.userName || 'Usuario FigusUY'}</div>
                  </div>
                  <span className="legend-chip">Pendiente</span>
                </div>

                <div className="legend-body">
                  {item.albumCover ? (
                    <img src={item.albumCover} alt={item.albumName} />
                  ) : (
                    <div style={{ width: '72px', height: '96px', border: '1px solid var(--line)', background: '#0d0d0d', display: 'grid', placeItems: 'center', color: 'var(--muted2)' }}>Album</div>
                  )}
                  <div>
                    <div className="legend-meta-row">
                      <span className="legend-pill">Estado: Completado (sin verificar)</span>
                      <span className="legend-pill">Completado: {new Date(item.completedAt).toLocaleDateString('es-UY')}</span>
                      {item.albumYear && <span className="legend-pill">Edicion: {item.albumYear}</span>}
                    </div>
                    <textarea
                      className="legend-textarea"
                      placeholder="Notas de validacion PartnerStore (opcional)"
                      value={notesByKey[item.userAlbumKey] || ''}
                      onChange={(event) => setNotesByKey(prev => ({ ...prev, [item.userAlbumKey]: event.target.value }))}
                    />
                    <div className="legend-actions">
                      <button className="biz-btn-primary" onClick={() => handleApprove(item)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>verified</span>
                        Aprobar Validación PartnerStore
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <div className="biz-section-head">
          <div>
            <div className="biz-page-kicker">/ historial</div>
            <h2>Ultimas validaciones</h2>
            <p>Las validaciones aprobadas refuerzan autoridad, reputacion y confianza dentro del ecosistema.</p>
          </div>
        </div>

        {verifiedItems.length === 0 ? (
          <div className="biz-card">
            <p className="biz-text-muted">Todavia no emitiste ninguna Validación PartnerStore en este navegador.</p>
          </div>
        ) : (
          <div className="legend-grid">
            {verifiedItems.map(item => (
              <article key={item.userAlbumKey} className="legend-card">
                <div className="legend-card-head">
                  <div>
                    <h3 className="legend-card-title">{item.albumName}</h3>
                    <div className="legend-meta">{item.userName} · Partner Verified</div>
                  </div>
                  <span className="legend-chip" style={{ color: 'var(--green)', borderColor: 'rgba(34,197,94,.3)', background: 'rgba(34,197,94,.08)' }}>Validado</span>
                </div>
                <p className="legend-note" style={{ marginTop: '.8rem' }}>
                  Validado en {item.locationName || location.name} el {item.verifiedAt ? new Date(item.verifiedAt).toLocaleDateString('es-UY') : 'hoy'}.
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
