import React, { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import LandingRenderer from '../components/landing/LandingRenderer'

export default function FAQ() {
  useSEO({
    title: 'FAQ | FigusUY - Preguntas Frecuentes',
    description: 'Todo lo que necesitas saber sobre cómo completar tu álbum con FigusUY.'
  })

  const { handleCta, handleVisible } = useOutletContext()

  const faqItems = [
    {
      question: '¿Qué es FigusUY?',
      answer: 'FigusUY es la plataforma líder para coleccionistas en Uruguay. Te ayudamos a completar tus álbumes conectándote con personas reales que tienen las figuritas que te faltan de forma rápida y segura.'
    },
    {
      question: '¿Cómo encuentro a alguien para cambiar?',
      answer: 'Es simple: cargás tu lista de repetidas y las que te faltan. Nuestro algoritmo "Match-First" escanea la base de datos y te muestra automáticamente a las personas que tienen lo que necesitás y necesitan lo que tenés.'
    },
    {
      question: '¿Dónde se realizan los intercambios?',
      answer: 'Para tu seguridad, recomendamos usar los "Lugares de Intercambio" oficiales. Son comercios verificados (kioscos, cafés, plazas) donde la comunidad se reúne habitualmente. Podés verlos en la sección "Lugares".'
    },
    {
      question: '¿Tiene algún costo usar la plataforma?',
      answer: 'Registrarte, cargar tus figuritas y encontrar matches es 100% gratuito. También ofrecemos planes Premium para quienes quieren completar su álbum en tiempo récord con beneficios exclusivos.'
    },
    {
      question: '¿Qué beneficios tiene ser Premium?',
      answer: 'Los usuarios Premium aparecen destacados en las búsquedas, acceden a filtros avanzados de cercanía, ven matches ilimitados y participan en sorteos mensuales de sobres y álbumes completos.'
    },
    {
      question: '¿Cómo sé si un usuario es confiable?',
      answer: 'Contamos con un sistema de reputación y validación. Después de cada intercambio, los usuarios se califican entre sí. Siempre recomendamos revisar el nivel y las medallas de la otra persona antes de encontrarse.'
    },
    {
      question: '¿Qué pasa si un Punto de Intercambio está cerrado?',
      answer: 'En nuestra sección de Lugares podés ver los horarios de atención y, lo más importante, la actividad en tiempo real: cuántos coleccionistas hay en el lugar en ese momento.'
    },
    {
      question: '¿Puedo gestionar más de un álbum a la vez?',
      answer: '¡Totalmente! Podés tener activos álbumes de fútbol, básquet, animé o cualquier colección vigente. Todo se gestiona desde el mismo panel de control en tu perfil.'
    },
    {
      question: '¿Cómo gano XP y recompensas?',
      answer: 'Ganás puntos de experiencia (XP) por cada intercambio exitoso, por reportar nuevos lugares y por invitar amigos. La XP te permite subir de nivel y desbloquear insignias que mejoran tu reputación.'
    },
    {
      question: '¿Es una aplicación oficial de las editoriales?',
      answer: 'No, FigusUY es una plataforma independiente creada por coleccionistas apasionados. Trabajamos para facilitar el intercambio de figuritas de cualquier editorial (Panini, Topps, etc.) de forma comunitaria.'
    }
  ]

  const middleBlocks = useMemo(() => [
    {
      id: 'faq-content',
      slug: 'faq-section',
      block_type: 'faq',
      content: {
        title: 'Preguntas Frecuentes',
        subtitle: 'Resolvemos tus dudas para que solo te preocupes por pegar las figuritas.',
        items: faqItems
      }
    }
  ], [])

  return (
    <div className="faq-page-content">
      <LandingRenderer 
        blocks={middleBlocks} 
        onCta={handleCta}
        onBlockVisible={handleVisible}
      />
    </div>
  )
}
