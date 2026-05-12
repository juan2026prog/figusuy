export const LANDING_MENU_LINKS = [
  { label: 'Como funciona', url: '/#como-funciona' },
  { label: 'Referidos', url: '/#invita-y-gana' },
  { label: 'Tiendas y Lugares', url: '/puntos' },
  { label: 'Planes', url: '/#planes-usuario' },
  { label: 'Influencers', url: '/influencers' },
  { label: 'FAQ', url: '/faq' },
  { label: '¡Ganar Plus!', url: '/#invita-y-gana' }
]

export const FOOTER_LINKS = [
  { label: 'Términos', url: '/p/terminos' },
  { label: 'Privacidad', url: '/p/privacidad' },
  { label: 'Seguridad', url: '/p/seguridad' },
  { label: 'Contacto', url: '/p/contacto' }
]

export const LEGAL_TEXT = '© 2026 FigusUY. Uruguay.'

export function patchLandingBlocks(blocks) {
  return blocks.map(block => {
    if (block.block_type === 'navbar') {
      return {
        ...block,
        content: {
          ...block.content,
          links: LANDING_MENU_LINKS
        }
      }
    }
    if (block.block_type === 'footer') {
      return {
        ...block,
        content: {
          ...block.content,
          links: FOOTER_LINKS,
          legal: LEGAL_TEXT
        }
      }
    }
    return block
  })
}
