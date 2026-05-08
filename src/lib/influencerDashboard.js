export const AFFILIATE_ADMIN_ROLES = ['god_admin', 'admin', 'moderator', 'support', 'comercial', 'analista']

export const formatMoney = (value) =>
  `$${new Intl.NumberFormat('es-UY', {
    maximumFractionDigits: 0,
  }).format(Number(value || 0))}`

export const formatCompactMoney = (value) =>
  `$${new Intl.NumberFormat('es-UY', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value || 0))}`

export const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`

export const TIER_LABELS = {
  community: 'Community',
  growth: 'Growth',
  partner: 'Partner',
}

export const HEALTH_LABELS = {
  strong: 'Fuerte',
  stable: 'Estable',
  watch: 'Atencion',
  critical: 'Critico',
}

export const getTierLabel = (tier) => TIER_LABELS[tier] || 'Community'

export const getTierMeta = (tier) => {
  if (tier === 'partner') return { label: 'Partner', tier: 'Tier 3', color: '#22c55e', bg: 'rgba(34,197,94,.12)' }
  if (tier === 'growth') return { label: 'Growth', tier: 'Tier 2', color: '#38bdf8', bg: 'rgba(56,189,248,.12)' }
  return { label: 'Community', tier: 'Tier 1', color: '#f97316', bg: 'rgba(249,115,22,.12)' }
}

export const getHealthMeta = (health) => {
  if (health === 'strong') return { label: 'Fuerte', color: '#22c55e', bg: 'rgba(34,197,94,.12)' }
  if (health === 'stable') return { label: 'Estable', color: '#38bdf8', bg: 'rgba(56,189,248,.12)' }
  if (health === 'critical') return { label: 'Critico', color: '#ef4444', bg: 'rgba(239,68,68,.12)' }
  return { label: 'Atencion', color: '#f59e0b', bg: 'rgba(245,158,11,.12)' }
}

export const formatDate = (value) => {
  if (!value) return 'Sin fecha'
  return new Date(value).toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const getInfluencerLink = (campaign) => {
  if (!campaign) return ''
  const codeOrSlug = campaign.slug || campaign.code
  return `${window.location.origin}/r/${codeOrSlug}`
}

export const getBenefitSummary = (benefit) => {
  if (!benefit) return 'Sin beneficio activo'
  if (benefit.benefit_label) return benefit.benefit_label

  if (benefit.benefit_type === 'extra_days') return `${benefit.benefit_value} dias extra gratis`
  if (benefit.benefit_type === 'percent_off') return `${benefit.benefit_value}% off`
  if (benefit.benefit_type === 'fixed_off') return `${formatMoney(benefit.benefit_value)} off`
  if (benefit.benefit_type === 'extra_months') return `${benefit.benefit_value} meses extra`

  return 'Beneficio activo'
}

export const buildSuggestedCopies = ({ affiliate, campaign, benefit, commission }) => {
  const code = campaign?.code || affiliate?.invitation_code || 'FIGUSUY'
  const link = getInfluencerLink(campaign)
  const benefitText = getBenefitSummary(benefit)
  const commissionText = commission?.commission_value ? `${commission.commission_value}%` : null

  return [
    `Usa mi codigo ${code} y aprovecha ${benefitText.toLowerCase()} en FigusUY.`,
    `Estoy compartiendo mi link de FigusUY: ${link}`,
    `Si te gusta coleccionar mejor, entra con ${code}${commissionText ? ` y activa esta campaña con ${commissionText} de comisión para mi apoyo.` : '.'}`,
  ]
}

export const buildSuggestedCtas = ({ campaign, benefit }) => {
  const link = getInfluencerLink(campaign)
  const benefitText = getBenefitSummary(benefit)

  return [
    `Activa ${benefitText.toLowerCase()} con mi link`,
    `Entra ahora a FigusUY`,
    link ? `Comparte este acceso directo: ${link}` : 'Comparte tu código afiliado',
  ]
}

export const getSourceLabel = (value) => {
  if (!value) return 'Link directo'
  if (value === 'story') return 'Story'
  if (value === 'bio') return 'Link en bio'
  if (value === 'link') return 'Link directo'
  return value
}

const escapeSvgText = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;')

export const createShareCardSvg = ({ title, subtitle, code, benefit, handle }) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="1500" viewBox="0 0 1200 1500" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="1500" fill="#0B0B0B"/>
  <rect x="60" y="60" width="1080" height="1380" fill="#121212" stroke="rgba(255,255,255,0.12)"/>
  <circle cx="930" cy="290" r="250" fill="#FF5A00" fill-opacity="0.18"/>
  <circle cx="260" cy="1240" r="220" fill="#FF5A00" fill-opacity="0.14"/>
  <text x="120" y="170" fill="#FF5A00" font-family="Barlow, Arial, sans-serif" font-size="36" font-weight="700" letter-spacing="8">FIGUSUY</text>
  <text x="120" y="320" fill="#FFFFFF" font-family="Barlow Condensed, Arial, sans-serif" font-size="128" font-style="italic" font-weight="900">${escapeSvgText(title)}</text>
  <text x="120" y="392" fill="#A8A29E" font-family="Barlow, Arial, sans-serif" font-size="44">${escapeSvgText(subtitle)}</text>
  <rect x="120" y="490" width="420" height="120" fill="#FF5A00"/>
  <text x="160" y="565" fill="#FFFFFF" font-family="Barlow Condensed, Arial, sans-serif" font-size="72" font-weight="900">${escapeSvgText(code)}</text>
  <text x="120" y="720" fill="#FFFFFF" font-family="Barlow Condensed, Arial, sans-serif" font-size="74" font-style="italic" font-weight="900">BENEFICIO ACTIVO</text>
  <text x="120" y="790" fill="#E7E5E4" font-family="Barlow, Arial, sans-serif" font-size="38">${escapeSvgText(benefit)}</text>
  <text x="120" y="1280" fill="#A8A29E" font-family="Barlow, Arial, sans-serif" font-size="34">Comparte este acceso con tu audiencia</text>
  <text x="120" y="1340" fill="#FFFFFF" font-family="Barlow Condensed, Arial, sans-serif" font-size="52" font-style="italic" font-weight="900">@${escapeSvgText(handle || 'figusuy')}</text>
</svg>`

export const downloadTextFile = (filename, content, type = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export const downloadSvgCard = (filename, svgContent) => {
  downloadTextFile(filename, svgContent, 'image/svg+xml;charset=utf-8')
}
