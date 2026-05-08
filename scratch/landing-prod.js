import{r as e}from"./rolldown-runtime-S-ySWqyJ.js";import{t}from"./react-eV9h70qI.js";import{c as n,t as r,x as i}from"./index-DD4bBKF4.js";import{f as a,h as o,i as s,l as c,u as l}from"./landingApi-DgoSKIAi.js";import{t as u}from"./BusinessApplyModal-Buv__m8L.js";import{t as d}from"./AuthModal-CKTgNek5.js";var f=e(t(),1);function p({title:e,description:t}){(0,f.useEffect)(()=>{if(e){document.title=`${e} | FigusUY`;let t=document.querySelector(`meta[property="og:title"]`);t&&t.setAttribute(`content`,`${e} | FigusUY`)}if(t){let e=document.querySelector(`meta[name="description"]`);e&&e.setAttribute(`content`,t);let n=document.querySelector(`meta[property="og:description"]`);n&&n.setAttribute(`content`,t)}},[e,t])}var m=n(),h=[{id:`boost`,name:`Boost`,badge:`Presencia inicial`,price:`UYU 0`,accent:`var(--color-text-secondary)`,className:``,description:`Para aparecer, recibir puntos sugeridos y activar tu presencia comercial dentro del mapa.`,features:[`Aparecer en puntos sugeridos`,`1 foto`,`Promo simple`,`Contacto visible`,`Visibilidad basica`]},{id:`zone`,name:`Zone`,badge:`Mas visibilidad`,price:`UYU 690`,accent:`var(--color-primary)`,className:`featured`,description:`Escala presencia local y convierte mejor cuando un usuario esta decidiendo donde ir.`,features:[`Todo Boost`,`Promos destacadas`,`Prioridad local`,`Mejor presencia en mapa`,`Mas visibilidad en tu zona`]},{id:`conversion`,name:`Conversion`,badge:`Intencion comercial`,price:`UYU 1490`,accent:`#8b5cf6`,className:`premium`,description:`Pensado para capitalizar trafico, capturar intencion y aparecer primero en el momento correcto.`,features:[`Todo Zone`,`Top CTA`,`Prioridad comercial`,`Promo first`,`Mejor lectura de intencion`]},{id:`partnerstore`,name:`PartnerStore`,badge:`Validacion + autoridad`,price:`UYU 1900`,accent:`#f59e0b`,className:`partnerstore`,description:`La capa premium para validar, generar confianza, sumar rewards y capturar liquidez del ecosistema.`,features:[`Todo Conversion`,`Validacion de albumes`,`Validacion de usuarios`,`Badge PartnerStore`,`Prioridad de validacion`,`Rewards asociados`,`Visibilidad premium`,`Descuento minimo configurable 10%`]}],g=[{label:`Visibilidad`,boost:`Basica`,zone:`Alta`,conversion:`Prioritaria`,partnerstore:`Premium`},{label:`Promos`,boost:`Simple`,zone:`Destacadas`,conversion:`Promo first`,partnerstore:`Promo + rewards`},{label:`Contacto y CTA`,boost:`Visible`,zone:`Mejorado`,conversion:`Top CTA`,partnerstore:`Top CTA + autoridad`},{label:`Puntos sugeridos`,boost:`Si`,zone:`Si`,conversion:`Si`,partnerstore:`Si + prioridad`},{label:`Validacion`,boost:`-`,zone:`-`,conversion:`-`,partnerstore:`Albumes y usuarios`},{label:`Conversion`,boost:`Basica`,zone:`Local`,conversion:`Alta intencion`,partnerstore:`Premium + rewards`}];function _({isOpen:e,onClose:t}){if(!e)return null;let n=e=>{window.open(`https://wa.me/59899000000?text=Hola,%20me%20interesa%20contratar%20el%20plan%20${e}%20para%20mi%20local%20en%20FigusUY`,`_blank`)};return(0,m.jsxs)(`div`,{className:`modal-overlay`,style:{zIndex:2100},children:[(0,m.jsx)(`style`,{children:`
        .plans-modal {
          background: var(--color-bg);
          width: 100%;
          max-width: 72rem;
          max-height: 90vh;
          border-radius: 4px;
          border: 1px solid var(--color-border);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          color: var(--color-text);
          animation: modal-up 0.3s ease-out;
        }

        .plans-scroll {
          padding: 2rem;
          overflow-y: auto;
          flex: 1;
        }

        .plans-grid-modal {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .plan-card-modal {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 4px;
          padding: 1.4rem;
          display: flex;
          flex-direction: column;
          position: relative;
          min-height: 100%;
        }

        .plan-card-modal.featured {
          border-color: var(--color-primary);
          background: linear-gradient(to bottom right, var(--color-surface), #43140744);
        }

        .plan-card-modal.premium {
          border-color: #8b5cf6;
          background: linear-gradient(to bottom right, var(--color-surface), #2e106544);
        }

        .plan-card-modal.partnerstore {
          border-color: #f59e0b;
          background: linear-gradient(to bottom right, var(--color-surface), #78350f44);
        }

        .plan-badge-modal {
          display: inline-flex;
          width: fit-content;
          background: rgba(255,255,255,.05);
          border: 1px solid currentColor;
          padding: 0.25rem 0.65rem;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 900;
          margin-bottom: 0.8rem;
        }

        .plan-price-modal {
          font-size: 2.5rem;
          font-weight: 900;
          margin: 1rem 0;
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }

        .plan-price-modal span {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .feature-list-modal {
          list-style: none;
          padding: 0;
          margin: 0 0 1.5rem 0;
          flex: 1;
        }

        .feature-item-modal {
          display: flex;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin-bottom: 0.7rem;
          line-height: 1.4;
        }

        .feature-item-modal span {
          color: #10b981;
          font-weight: 900;
        }

        .btn-plan-modal {
          width: 100%;
          padding: 0.875rem;
          border-radius: 4px;
          font-weight: 900;
          border: none;
          cursor: pointer;
          transition: 0.2s;
        }

        .btn-boost-modal { background: var(--color-border); color: var(--color-text); }
        .btn-zone-modal { background: var(--color-primary); color: var(--color-text); }
        .btn-conversion-modal { background: #8b5cf6; color: var(--color-text); }
        .btn-partnerstore-modal { background: #f59e0b; color: #000000; }

        .comparison-grid {
          display: grid;
          grid-template-columns: 1.4fr repeat(4, minmax(72px, 1fr));
          gap: 0.4rem;
        }

        .comparison-grid > div {
          padding: 0.65rem 0.5rem;
          border-bottom: 1px solid var(--color-border);
          font-size: 0.8rem;
        }

        @keyframes modal-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 760px) {
          .comparison-grid {
            grid-template-columns: 1.4fr repeat(4, minmax(54px, 1fr));
          }
        }
      `}),(0,m.jsxs)(`div`,{className:`plans-modal`,children:[(0,m.jsxs)(`div`,{style:{padding:`1.5rem 2rem`,borderBottom:`1px solid var(--color-border)`,display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,m.jsxs)(`div`,{children:[(0,m.jsx)(`h2`,{style:{fontSize:`1.25rem`,fontWeight:900,margin:0},children:`Planes para Negocios`}),(0,m.jsx)(`p`,{style:{fontSize:`0.875rem`,color:`var(--color-text-secondary)`,margin:0},children:`Visibilidad, promos, validacion, trafico y conversion en una misma escalera comercial.`})]}),(0,m.jsx)(`button`,{onClick:t,className:`btn-icon`,children:(0,m.jsx)(`span`,{className:`material-symbols-outlined`,children:`close`})})]}),(0,m.jsxs)(`div`,{className:`plans-scroll`,children:[(0,m.jsxs)(`div`,{style:{background:`linear-gradient(135deg, rgba(255,90,0,.12), rgba(255,90,0,.03))`,border:`1px solid rgba(255,90,0,.25)`,padding:`1rem 1.1rem`,borderRadius:`1rem`,marginBottom:`1.5rem`},children:[(0,m.jsx)(`strong`,{style:{display:`block`,marginBottom:`0.35rem`},children:`El valor ya no es solo aparecer.`}),(0,m.jsx)(`span`,{style:{fontSize:`0.875rem`,color:`var(--color-text-secondary)`},children:`FigusUY ahora canaliza puntos sugeridos por usuarios, promueve promos, habilita validaciones y genera liquidez local.`})]}),(0,m.jsx)(`div`,{className:`plans-grid-modal`,children:h.map(e=>(0,m.jsxs)(`div`,{className:`plan-card-modal ${e.className}`,children:[(0,m.jsx)(`div`,{className:`plan-badge-modal`,style:{color:e.accent},children:e.badge}),(0,m.jsx)(`h3`,{style:{fontSize:`1.35rem`,fontWeight:900,margin:0},children:e.name}),(0,m.jsx)(`p`,{style:{fontSize:`0.85rem`,color:`var(--color-text-secondary)`,minHeight:`3rem`},children:e.description}),(0,m.jsxs)(`div`,{className:`plan-price-modal`,children:[e.price,` `,(0,m.jsx)(`span`,{children:`/mes`})]}),(0,m.jsx)(`ul`,{className:`feature-list-modal`,children:e.features.map(e=>(0,m.jsxs)(`li`,{className:`feature-item-modal`,children:[(0,m.jsx)(`span`,{children:`+`}),e]},e))}),(0,m.jsxs)(`button`,{className:`btn-plan-modal btn-${e.id}-modal`,onClick:()=>n(e.name),children:[`Contratar `,e.name]})]},e.id))}),(0,m.jsxs)(`div`,{style:{background:`var(--color-surface)`,padding:`1.2rem`,borderRadius:`1rem`,border:`1px solid var(--color-border)`},children:[(0,m.jsx)(`h4`,{style:{fontWeight:900,marginBottom:`0.9rem`},children:`Tabla comparativa`}),(0,m.jsxs)(`div`,{className:`comparison-grid`,children:[(0,m.jsx)(`div`,{style:{fontWeight:800,color:`var(--color-text-secondary)`},children:`Beneficio`}),(0,m.jsx)(`div`,{style:{textAlign:`center`,fontWeight:900},children:`Boost`}),(0,m.jsx)(`div`,{style:{textAlign:`center`,fontWeight:900,color:`var(--color-primary)`},children:`Zone`}),(0,m.jsx)(`div`,{style:{textAlign:`center`,fontWeight:900,color:`#8b5cf6`},children:`Conversion`}),(0,m.jsx)(`div`,{style:{textAlign:`center`,fontWeight:900,color:`#f59e0b`},children:`PartnerStore`}),g.map(e=>(0,m.jsxs)(f.Fragment,{children:[(0,m.jsx)(`div`,{style:{fontWeight:700},children:e.label}),(0,m.jsx)(`div`,{style:{textAlign:`center`},children:e.boost}),(0,m.jsx)(`div`,{style:{textAlign:`center`},children:e.zone}),(0,m.jsx)(`div`,{style:{textAlign:`center`},children:e.conversion}),(0,m.jsx)(`div`,{style:{textAlign:`center`},children:e.partnerstore})]},e.label))]})]})]}),(0,m.jsx)(`div`,{style:{padding:`1.5rem 2rem`,borderTop:`1px solid var(--color-border)`,display:`flex`,justifyContent:`flex-end`},children:(0,m.jsx)(`button`,{className:`btn btn-ghost`,onClick:t,children:`Cerrar`})})]})]})}var v=[{name:`Boost`,price:`UYU 0`,accent:`#10b981`,description:`Visibilidad basica, contacto y presencia en puntos sugeridos.`},{name:`Zone`,price:`UYU 690/mes`,accent:`var(--color-primary)`,description:`Mas visibilidad local, promos destacadas y mejor mapa.`},{name:`Conversion`,price:`UYU 1490/mes`,accent:`#8b5cf6`,description:`Top CTA, prioridad comercial y lectura de intencion.`},{name:`PartnerStore`,price:`UYU 1900/mes`,accent:`#f59e0b`,description:`Validacion, badge oficial, rewards y visibilidad premium.`}];function y({isOpen:e,onClose:t}){let[n,r]=(0,f.useState)(!1);return e?(0,m.jsxs)(`div`,{className:`modal-overlay`,style:{zIndex:1e3},children:[(0,m.jsx)(`style`,{children:`
        .business-modal {
          background: var(--color-bg);
          width: 100%;
          max-width: 46rem;
          max-height: 90vh;
          border-radius: 4px;
          border: 1px solid var(--color-border);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          color: var(--color-text);
          animation: modal-up 0.3s ease-out;
        }

        .modal-content-scroll {
          padding: 2rem;
          overflow-y: auto;
          flex: 1;
        }

        .plan-mini-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 4px;
          padding: 1.15rem 1.2rem;
          margin-bottom: 0.8rem;
        }

        .faq-item {
          margin-bottom: 1.3rem;
        }

        .faq-q {
          font-weight: 800;
          color: var(--color-primary);
          margin-bottom: 0.45rem;
          font-size: 1rem;
        }

        .faq-a {
          color: var(--color-text-secondary);
          font-size: 0.9375rem;
          line-height: 1.6;
        }

        @keyframes modal-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}),(0,m.jsxs)(`div`,{className:`business-modal`,children:[(0,m.jsxs)(`div`,{style:{padding:`1.5rem 2rem`,borderBottom:`1px solid var(--color-border)`,display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,m.jsxs)(`div`,{children:[(0,m.jsx)(`h2`,{style:{fontSize:`1.5rem`,fontWeight:900,margin:0,fontStyle:`italic`,textTransform:`uppercase`,fontFamily:`'Barlow Condensed', sans-serif`},children:`FigusUY para Negocios`}),(0,m.jsx)(`p`,{style:{fontSize:`0.875rem`,color:`var(--color-text-secondary)`,margin:0},children:`Informacion, valor y planes para locales, kioscos y puntos aliados`})]}),(0,m.jsx)(`button`,{onClick:t,className:`btn-icon`,children:(0,m.jsx)(`span`,{className:`material-symbols-outlined`,children:`close`})})]}),(0,m.jsxs)(`div`,{className:`modal-content-scroll`,children:[(0,m.jsxs)(`section`,{style:{marginBottom:`2rem`},children:[(0,m.jsxs)(`div`,{style:{background:`linear-gradient(135deg, rgba(255,90,0,.12), rgba(255,90,0,.03))`,border:`1px solid rgba(255,90,0,.24)`,borderRadius:`1rem`,padding:`1rem 1.1rem`,marginBottom:`1.4rem`},children:[(0,m.jsx)(`strong`,{style:{display:`block`,marginBottom:`0.35rem`},children:`El negocio ahora captura mas que presencia.`}),(0,m.jsx)(`span`,{style:{fontSize:`0.9rem`,color:`var(--color-text-secondary)`},children:`Gana visibilidad, recibe trafico desde puntos sugeridos, activa promos, valida y convierte mejor.`})]}),(0,m.jsx)(`h3`,{style:{fontSize:`1.25rem`,fontWeight:900,marginBottom:`1rem`,color:`var(--color-text)`,fontStyle:`italic`,textTransform:`uppercase`,fontFamily:`'Barlow Condensed', sans-serif`},children:`Vista rapida de planes`}),v.map(e=>(0,m.jsxs)(`div`,{className:`plan-mini-card`,style:{borderColor:e.accent},children:[(0,m.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:`0.35rem`,gap:`0.8rem`},children:[(0,m.jsx)(`span`,{style:{fontWeight:900,color:e.accent},children:e.name}),(0,m.jsx)(`span`,{style:{fontWeight:900,color:`var(--color-text-secondary)`},children:e.price})]}),(0,m.jsx)(`p`,{style:{fontSize:`0.875rem`,color:`var(--color-text-secondary)`,margin:0},children:e.description})]},e.name))]}),(0,m.jsxs)(`section`,{children:[(0,m.jsx)(`h3`,{style:{fontSize:`1.125rem`,fontWeight:800,marginBottom:`1.2rem`,color:`var(--color-text)`},children:`FAQ - Negocios`}),[{q:`1. Que es FigusUY Negocios?`,a:`Es la capa comercial de FigusUY para locales, kioscos y puntos aliados que quieren captar trafico real de la comunidad.`},{q:`2. Que valor nuevo genera hoy la plataforma?`,a:`Ya no es solo compra o intercambio. FigusUY ahora canaliza puntos sugeridos por usuarios, visibilidad local, promos, validacion y conversion.`},{q:`3. Puedo sumarme aunque no venda figuritas?`,a:`Si. Tambien podes operar como punto sugerido o aliado de intercambio si ofreces un espacio util, visible y confiable.`},{q:`4. Para que sirven los planes?`,a:`Escalan cuatro cosas concretas: visibilidad, promos, validacion y conversion. No compran el primer lugar, pero si mas capacidad comercial.`},{q:`5. Que cambia con PartnerStore?`,a:`Te convierte en punto de confianza para validar albumes y usuarios, sumar rewards asociados y operar con autoridad dentro del ecosistema.`},{q:`6. Que tiene de especial sugerir puntos?`,a:`Los usuarios ayudan a descubrir lugares utiles. Los negocios que entran bien posicionados capturan trafico, contexto y oportunidades de conversion.`}].map(e=>(0,m.jsxs)(`div`,{className:`faq-item`,children:[(0,m.jsx)(`div`,{className:`faq-q`,children:e.q}),(0,m.jsx)(`div`,{className:`faq-a`,children:e.a})]},e.q))]})]}),(0,m.jsxs)(`div`,{style:{padding:`1.5rem 2rem`,borderTop:`1px solid var(--color-border)`,display:`flex`,gap:`1rem`},children:[(0,m.jsx)(`button`,{className:`btn btn-primary`,style:{flex:1},onClick:()=>r(!0),children:`Ver Planes y Precios`}),(0,m.jsx)(`button`,{className:`btn btn-ghost`,style:{flex:1},onClick:t,children:`Cerrar`})]})]}),(0,m.jsx)(_,{isOpen:n,onClose:()=>r(!1)})]}):null}var b=o(a.map(e=>({...e,content:e.published_content})),`published`);function x(){p({title:`FigusUY | Intercambios, comunidad y albumes en movimiento`,description:`La landing oficial de FigusUY renderizada desde bloques CMS administrables.`});let e=i(),[t,n]=(0,f.useState)([]),[a,h]=(0,f.useState)(!0),[g,_]=(0,f.useState)(!1),[v,x]=(0,f.useState)(!1),[S,C]=(0,f.useState)(!1);(0,f.useEffect)(()=>{let e=!0;return(async()=>{try{let t=await s({mode:`published`});if(!e)return;n(o(t,`published`))}catch(t){console.error(`landing fetch error`,t),e&&n(b)}finally{e&&h(!1)}})(),()=>{e=!1}},[]);let w=(0,f.useMemo)(()=>t.length?t:b,[t]);return(0,m.jsxs)(`div`,{style:{minHeight:`100vh`,background:`#060606`},children:[(0,m.jsx)(r,{children:!a||w.length?(0,m.jsx)(l,{blocks:w,onCta:async(t,n,r)=>{await c({blockSlug:t.slug,blockType:t.block_type,eventType:`cta_click`,ctaId:r,metadata:{url:n?.url||``}});let i=String(n?.url||``);if(i){if(i.startsWith(`#`)){document.getElementById(i.slice(1))?.scrollIntoView({behavior:`smooth`,block:`start`});return}if(i===`/login`||i.startsWith(`action:auth`)){C(!0);return}if(i.startsWith(`action:business-apply`)||i===`/business/apply`){_(!0);return}if(i.startsWith(`action:business-info`)){x(!0);return}if(/^https?:\/\//i.test(i)){window.open(i,`_blank`,`noopener,noreferrer`);return}e(i)}},onBlockVisible:async e=>{await c({blockSlug:e.slug,blockType:e.block_type,eventType:`impression`,metadata:{visible:!0}})}}):null}),(0,m.jsx)(u,{isOpen:g,onClose:()=>_(!1)}),(0,m.jsx)(y,{isOpen:v,onClose:()=>x(!1)}),(0,m.jsx)(d,{isOpen:S,onClose:()=>C(!1)})]})}export{x as default};