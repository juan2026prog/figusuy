import React from 'react';
import { useSystemStore } from '../../../stores/system/useSystemStore';
import { SystemIcon } from '../SystemIcons';

export const TemplateFactory = ({ event }) => {
  const { clearActiveEvent } = useSystemStore();

  switch (event.type) {
    case 'MATCH_FOUND':
      return <MatchFoundTemplate data={event.data} onClose={clearActiveEvent} />;
    case 'MATCH_DETAIL':
      return <MatchDetailTemplate data={event.data} onClose={clearActiveEvent} />;
    case 'TRADE_CONFIRMED':
      return <TradeConfirmedTemplate data={event.data} onClose={clearActiveEvent} />;
    case 'FIRST_TRADE':
      return <FirstTradeTemplate data={event.data} onClose={clearActiveEvent} />;
    case 'BADGE_UNLOCKED':
      return <BadgeUnlockedTemplate data={event.data} onClose={clearActiveEvent} />;
    case 'LEVEL_UP':
      return <LevelUpTemplate data={event.data} onClose={clearActiveEvent} />;
    case 'FOUNDING_MEMBER':
      return <FoundingMemberTemplate data={event.data} onClose={clearActiveEvent} />;
    case 'ALBUM_COMPLETED':
      return <AlbumCompletedTemplate data={event.data} onClose={clearActiveEvent} />;
    case 'PLAN_UPGRADED':
      return <PlanUpgradedTemplate data={event.data} onClose={clearActiveEvent} />;
    case 'PLUS_ACTIVATED':
      return <PlusActivatedTemplate data={event.data} onClose={clearActiveEvent} />;
    case 'PRO_ACTIVATED':
      return <ProActivatedTemplate data={event.data} onClose={clearActiveEvent} />;
    case 'FOUNDING_HUB':
      return <FoundingHubTemplate data={event.data} onClose={clearActiveEvent} />;
    case 'COLLECTOR_HUB_VERIFIED':
      return <CollectorHubVerifiedTemplate data={event.data} onClose={clearActiveEvent} />;
    case 'NEW_ACTIVE_LOCATION':
      return <NewPlaceActiveTemplate data={event.data} onClose={clearActiveEvent} />;
    case 'REFERRAL_COMPLETED':
      return <ReferralActivatedTemplate data={event.data} onClose={clearActiveEvent} />;
    default:
      return null;
  }
};

// 1. MATCH ENCONTRADO
const MatchFoundTemplate = ({ data, onClose }) => (
  <section className="fy-template">
    <div className="dots"></div><div className="template-id">1 · Match encontrado</div>
    <h2 className="headline">¡Nuevo <span>Match!</span></h2><p className="sub">Encontramos a alguien con quien tenés gran conexión.</p>
    <div className="avatar-row">
      <div><div className="avatar"></div><div className="who">Vos<div className="handle">@{data.usernameA || 'vos'}</div></div></div>
      <div className="bolt">⚡</div>
      <div><div className="avatar"></div><div className="who">Usuario<div className="handle">@{data.usernameB || 'usuario'}</div></div></div>
    </div>
    <div className="stats">
      <div className="stat"><b>{data.heHas || 12}</b><small>él tiene que te faltan</small></div>
      <div className="stat"><b>{data.youHave || 8}</b><small>vos tenés que le sirven</small></div>
    </div>
    <div className="section-card">
      <div className="section-title">Figuritas clave</div>
      <div className="chips">
        {(data.stickersHeHas || ['#014', '#087', 'M10', 'ARG-09']).map((s, i) => <span key={i} className="chip">{s}</span>)}
        <span className="chip more">+8</span>
      </div>
    </div>
    <div className="meta-list">
      <div className="meta"><span>Compatibilidad</span><b className="accent">{data.compatibilityScore || 85}%</b></div>
      <div className="bar" style={{'--value': `${data.compatibilityScore || 85}%`}}><i></i></div>
      <div className="meta"><span>📍 A {data.distance || '1.2 km'} de vos</span><span>{data.reputation || '🟢 Muy activo'}</span></div>
    </div>
    <button className="btn" onClick={onClose}>Ver detalle</button>
    <div className="link" onClick={onClose}>Ahora no</div>
  </section>
);

// 2. DETALLE DEL MATCH
const MatchDetailTemplate = ({ data, onClose }) => (
  <section className="fy-template">
    <div className="template-id">2 · Detalle del match</div>
    <div className="topbar"><span className="back" onClick={onClose}>←</span><span>Detalle del match</span><span>⋮</span></div>
    <div className="match-head"><div className="avatar"></div><div className="percent">{data.compatibilityScore || 85}%</div><div className="avatar"></div></div>
    <p className="sub">Compatibilidad del intercambio</p>
    <div className="section-card">
      <div className="section-title">Él tiene · te sirven</div>
      <div className="chips">
        {(data.stickersHeHas || ['#014', '#087', '#112', 'M10', 'URU-22']).map((s, i) => <span key={i} className="chip">{s}</span>)}
        <span className="chip more">+7</span>
      </div>
    </div>
    <div className="section-card">
      <div className="section-title">Vos tenés · le sirven</div>
      <div className="chips">
        {(data.stickersYouHave || ['#003', '#044', '#091', 'BRA-18']).map((s, i) => <span key={i} className="chip">{s}</span>)}
        <span className="chip more">+4</span>
      </div>
    </div>
    <div className="meta-list">
      <div className="meta"><span>Álbum / colección</span><b>{data.collection || 'Mundial Qatar 2022'}</b></div>
      <div className="meta"><span>Lugar sugerido</span><b>{data.location || 'Plaza Italia'}</b></div>
      <div className="meta"><span>Distancia</span><b>{data.distance || '1,2 km'}</b></div>
    </div>
    <button className="btn">Enviar mensaje</button>
    <div className="link" onClick={onClose}>Ver perfil completo</div>
  </section>
);

// 3. INTERCAMBIO CONFIRMADO
const TradeConfirmedTemplate = ({ data, onClose }) => (
  <section className="fy-template green">
    <div className="dots"></div><div className="template-id">3 · Intercambio confirmado</div>
    <div className="big-icon" style={{'--accent': 'var(--green)'}}><SystemIcon name="BadgeTrustedIcon" /></div>
    <h2 className="headline">¡Intercambio <span>confirmado!</span></h2><p className="sub">Coordiná con @{data.usernameB || 'usuario_b'} y concreten el intercambio.</p>
    <div className="section-card trade-box">
      <div className="stat"><b>{data.heHas || 12}</b><small>él te da</small></div>
      <div className="swap">⇄</div>
      <div className="stat"><b>{data.youHave || 8}</b><small>vos le das</small></div>
    </div>
    <div className="notice">Consejo: coordinen en un lugar público o Collector Hub para una mejor experiencia.</div>
    <button className="btn accent" onClick={onClose}>Ir al chat</button>
    <div className="link" onClick={onClose}>Ver mis intercambios</div>
  </section>
);

// 4. PRIMER INTERCAMBIO
const FirstTradeTemplate = ({ data, onClose }) => (
  <section className="fy-template purple">
    <div className="dots"></div><div className="template-id">4 · Primer intercambio</div>
    <div className="big-icon"><SystemIcon name="UserLevelTraderIcon" /></div>
    <h2 className="headline">¡Primer <span>intercambio!</span></h2><p className="sub">Bien hecho. Empezaste a mover la comunidad.</p><div className="large-number">+{data.xp || 50} XP</div>
    <div className="progress-box">
      <div className="meta"><span>Tu progreso</span><b>Nivel {data.level || 2}</b></div>
      <div className="bar" style={{'--value': '60%'}}><i></i></div>
      <div className="small-muted">120 / 200 XP</div>
    </div>
    <button className="btn accent" onClick={onClose}>Seguir explorando</button>
    <div className="link" onClick={onClose}>Ver mis estadísticas</div>
  </section>
);

// 5. BADGE DESBLOQUEADO
const BadgeUnlockedTemplate = ({ data, onClose }) => (
  <section className="fy-template teal compact">
    <div className="dots"></div><div className="template-id">5 · Badge desbloqueado</div>
    <div className="big-icon"><SystemIcon name={data.icon || 'BadgeTopTradeIcon'} /></div>
    <h2 className="headline">¡Nuevo badge <span>desbloqueado!</span></h2>
    <div className="section-card"><div className="section-title">{data.badge || 'Coleccionista inicial'}</div><p className="sub" style={{margin:'0 auto'}}>{data.description || 'Completaste 10 intercambios.'}</p></div>
    <div className="large-number">+{data.xp || 100} XP</div>
    <button className="btn accent" onClick={onClose}>Ver mis badges</button>
    <div className="link" onClick={onClose}>Compartir</div>
  </section>
);

// 6. LEVEL UP
const LevelUpTemplate = ({ data, onClose }) => (
  <section className="fy-template blue compact">
    <div className="dots"></div><div className="template-id">6 · Level up</div>
    <div className="big-icon"><SystemIcon name={data.icon || 'UserLevelCollectorIcon'} /></div>
    <h2 className="headline">¡Subiste <span>de nivel!</span></h2>
    <div className="section-card">
      <div className="meta"><span>Antes</span><b>{data.levelFrom || 'Explorador'}</b></div>
      <div className="meta"><span>Ahora</span><b>{data.levelTo || 'Coleccionista'}</b></div>
    </div>
    <div className="reward-row">
      <div className="stat"><b>+{data.xp || 200}</b><small>XP</small></div>
      <div className="stat"><b>1</b><small>nuevo badge</small></div>
    </div>
    <button className="btn accent" onClick={onClose}>Genial</button>
    <div className="link" onClick={onClose}>Ver mi perfil</div>
  </section>
);

// 7. FOUNDING MEMBER
const FoundingMemberTemplate = ({ data, onClose }) => (
  <section className="fy-template gold compact">
    <div className="dots"></div><div className="template-id">7 · Founding Member</div>
    <div className="big-icon"><SystemIcon name="FoundingMemberIcon" /></div>
    <h2 className="headline">¡Sos parte de los <span>primeros {data.total || 250}!</span></h2>
    <p className="sub">Formás parte de los primeros usuarios en construir FigusUY.</p>
    <div className="large-number">#{data.number || 124}</div>
    <div className="small-muted">de los primeros {data.total || 250}</div>
    <button className="btn" onClick={onClose}>Compartir</button>
    <div className="link" onClick={onClose}>Ver mi perfil</div>
  </section>
);

// 8. ALBUM COMPLETADO
const AlbumCompletedTemplate = ({ data, onClose }) => (
  <section className="fy-template gold compact">
    <div className="dots"></div><div className="template-id">8 · Álbum completado</div>
    <div className="big-icon"><SystemIcon name="CollectorHubIcon" /></div>
    <h2 className="headline">¡Álbum <span>completado!</span></h2>
    <p className="sub">Ahora falta validar el logro.</p>
    <div className="notice">Llevá tu álbum a un Collector Hub oficial para validarlo y desbloquear el logro. Estado: pending_verification</div>
    <button className="btn" onClick={onClose}>Encontrar Collector Hub</button>
    <div className="link" onClick={onClose}>Ver mi álbum</div>
  </section>
);

// 9. PLAN MEJORADO
const PlanUpgradedTemplate = ({ data, onClose }) => {
  const handleNext = () => {
    onClose();
    // Chain to the next modal based on plan
    const { enqueueEvent } = useSystemStore.getState();
    const eventType = data.newPlan === 'PRO' ? 'PRO_ACTIVATED' : 'PLUS_ACTIVATED';
    setTimeout(() => enqueueEvent({
      id: Date.now().toString(),
      type: eventType,
      data,
      priority: 'high',
      timestamp: Date.now()
    }), 600);
  };

  return (
    <section className="fy-template purple compact">
      <div className="dots"></div><div className="template-id">9 · Plan mejorado</div>
      <div className="big-icon"><SystemIcon name="PlanConversionDominioIcon" /></div>
      <h2 className="headline">¡Plan <span>mejorado!</span></h2>
      <p className="sub">Ahora tenés más herramientas y ventajas para avanzar más rápido.</p>
      <div className="section-card"><div className="meta"><span>Tu nuevo plan</span><b>{data.newPlan || 'PRO'}</b></div></div>
      <button className="btn accent" onClick={handleNext}>Ver beneficios</button>
      <div className="link" onClick={onClose}>Administrar plan</div>
    </section>
  );
};

// 10. PLUS ACTIVADO
const PlusActivatedTemplate = ({ data, onClose }) => (
  <section className="fy-template cyan compact">
    <div className="dots"></div><div className="template-id">10 · Plus activado</div>
    <div className="big-icon"><SystemIcon name="PlanRadarTurboIcon" /></div>
    <h2 className="headline">¡Plus <span>activado!</span></h2>
    <p className="sub">Tenés acceso temporal a beneficios para encontrar más oportunidades.</p>
    <div className="check-list">
      <div className="check">Más visibilidad</div>
      <div className="check">Más matches</div>
      <div className="check">Filtros avanzados</div>
    </div>
    <button className="btn accent" onClick={onClose}>Ir a beneficios</button>
    <div className="link" onClick={onClose}>{data.days || 3} días gratis</div>
  </section>
);

// 11. PRO ACTIVADO
const ProActivatedTemplate = ({ data, onClose }) => (
  <section className="fy-template gold compact">
    <div className="dots"></div><div className="template-id">11 · Pro activado</div>
    <div className="big-icon"><SystemIcon name="CollectorHubIcon" /></div>
    <h2 className="headline">¡Pro <span>activado!</span></h2>
    <p className="sub">Experiencia completa para coleccionistas activos.</p>
    <div className="check-list">
      <div className="check">Todos los beneficios Plus</div>
      <div className="check">Alcance ampliado</div>
      <div className="check">Prioridad en oportunidades</div>
    </div>
    <button className="btn" onClick={onClose}>Ir a beneficios</button>
    <div className="link" onClick={onClose}>Ver mi plan</div>
  </section>
);

// 12. FOUNDING HUB
const FoundingHubTemplate = ({ data, onClose }) => (
  <section className="fy-template gold compact">
    <div className="dots"></div><div className="template-id">12 · Founding Hub</div>
    <div className="big-icon"><SystemIcon name="FoundingHubIcon" /></div>
    <h2 className="headline">¡Hub fundador <span>activado!</span></h2>
    <p className="sub">Tu lugar forma parte de los primeros hubs fundadores de FigusUY.</p>
    <div className="large-number">#{data.number || 8} / {data.total || 25}</div>
    <button className="btn" onClick={onClose}>Ver beneficios</button>
    <div className="link" onClick={onClose}>Ver ficha del lugar</div>
  </section>
);

// 13. COLLECTOR HUB VERIFICADO
const CollectorHubVerifiedTemplate = ({ data, onClose }) => (
  <section className="fy-template teal compact">
    <div className="dots"></div><div className="template-id">13 · Collector Hub verificado</div>
    <div className="big-icon"><SystemIcon name="BadgePartnerVerifiedIcon" /></div>
    <h2 className="headline">¡Hub <span>verificado!</span></h2>
    <p className="sub">Tu punto de encuentro fue verificado por la comunidad.</p>
    <div className="notice">Este álbum fue verificado presencialmente en un Collector Hub oficial.</div>
    <button className="btn accent" onClick={onClose}>Ver mi hub</button>
    <div className="link" onClick={onClose}>Compartir</div>
  </section>
);

// 14. NUEVO LUGAR ACTIVO
const NewPlaceActiveTemplate = ({ data, onClose }) => (
  <section className="fy-template purple compact">
    <div className="dots"></div><div className="template-id">14 · Nuevo lugar activo</div>
    <div className="big-icon"><SystemIcon name="PlanFreeBoostIcon" /></div>
    <h2 className="headline">¡Nuevo lugar <span>activo!</span></h2>
    <p className="sub">Más coleccionistas cerca tuyo.</p>
    <div className="meta-list">
      <div className="meta"><span>{data.place || 'Shopping Tres Cruces'}</span><b>Activo</b></div>
      <div className="meta"><span>Distancia</span><b>{data.distance || '0,8 km'}</b></div>
      <div className="meta"><span>Coleccionistas activos</span><b>{data.activeCollectors || 12}</b></div>
    </div>
    <button className="btn accent" onClick={onClose}>Ver en el mapa</button>
    <div className="link" onClick={onClose}>Compartir</div>
  </section>
);

// 15. REFERIDO ACTIVADO
const ReferralActivatedTemplate = ({ data, onClose }) => (
  <section className="fy-template blue compact">
    <div className="dots"></div><div className="template-id">15 · Referido activado</div>
    <div className="big-icon"><SystemIcon name="BadgeActiveIcon" /></div>
    <h2 className="headline">¡Referido <span>activado!</span></h2>
    <p className="sub">Tu invitado completó su primer intercambio.</p>
    <div className="reward-row">
      <div className="stat"><b>{data.days || 3}</b><small>días Plus para ambos</small></div>
      <div className="stat"><b>+{data.xp || 200}</b><small>XP para vos</small></div>
    </div>
    <div className="notice">FigusUY premia actividad real: el beneficio se libera cuando hay un intercambio completado.</div>
    <button className="btn accent" onClick={onClose}>Ver mis referidos</button>
  </section>
);
