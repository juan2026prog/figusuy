import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { useToast } from '../components/Toast'

export default function AlbumPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const {
    albums, selectedAlbum, fetchAlbums, fetchUserAlbums, selectAlbum,
    missingStickers, duplicateStickers,
    addMissingSticker, addDuplicateSticker, removeStickerStatus, bulkAddStickers,
  } = useAppStore()
  const toast = useToast()

  const [mode, setMode] = useState('have')
  const [searchFilter, setSearchFilter] = useState('')
  const [activeTab, setActiveTab] = useState('base')
  const [showBulk, setShowBulk] = useState(false)
  const [bulkInput, setBulkInput] = useState('')

  useEffect(() => {
    fetchAlbums()
    if (profile?.id) fetchUserAlbums(profile.id)
  }, [profile?.id])

  const total = selectedAlbum?.total_stickers || 980
  const tabs = [
    { key: 'base', label: `Base 1-${total}` },
    { key: 'special_m', label: 'Especiales M' },
    { key: 'promos', label: 'Promos' },
    { key: 'missing', label: 'Faltantes' },
    { key: 'duplicates', label: 'Repetidas' },
  ]

  const missingSet = new Set(missingStickers.map(s => String(s.sticker_number)))
  const duplicateSet = new Set(duplicateStickers.map(s => String(s.sticker_number)))

  const handleToggle = async (num) => {
    if (!profile?.id || !selectedAlbum?.id) return
    const isMissing = missingSet.has(String(num))
    const isDuplicate = duplicateSet.has(String(num))
    if (mode === 'missing') {
      if (isMissing) await removeStickerStatus(profile.id, selectedAlbum.id, num)
      else await addMissingSticker(profile.id, selectedAlbum.id, num)
    } else if (mode === 'duplicate') {
      if (isDuplicate) await removeStickerStatus(profile.id, selectedAlbum.id, num)
      else await addDuplicateSticker(profile.id, selectedAlbum.id, num)
    } else if (mode === 'clear' || mode === 'have') {
      if (isMissing || isDuplicate) await removeStickerStatus(profile.id, selectedAlbum.id, num)
    }
  }

  const handleBulkAdd = async () => {
    if (!bulkInput.trim() || !profile?.id || !selectedAlbum?.id) return
    const nums = bulkInput.split(/[,\s]+/).map(n => n.trim().toUpperCase()).filter(n => n.length > 0)
    if (!nums.length) { toast.error('No se encontraron números válidos'); return }
    const targetMode = mode === 'missing' ? 'missing' : 'duplicate'
    await bulkAddStickers(profile.id, selectedAlbum.id, nums, targetMode)
    toast.success(`${nums.length} figurita(s) procesada(s)`)
    setBulkInput(''); setShowBulk(false)
  }

  let numbers = []
  if (activeTab === 'base') numbers = Array.from({ length: total }, (_, i) => String(i + 1))
  else if (activeTab === 'special_m') numbers = Array.from({ length: 20 }, (_, i) => `M${i + 1}`)
  else if (activeTab === 'promos') numbers = ['P1', 'P2', 'P3', 'F1', 'F2']
  else if (activeTab === 'missing') numbers = Array.from(missingSet)
  else if (activeTab === 'duplicates') numbers = Array.from(duplicateSet)

  if (searchFilter) numbers = numbers.filter(n => n.toLowerCase().includes(searchFilter.toLowerCase()))

  const missingCount = missingStickers.length
  const duplicateCount = duplicateStickers.length
  const ownedCount = total - missingCount
  const progressPercent = total > 0 ? Math.round((ownedCount / total) * 100) : 0

  if (!selectedAlbum) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center text-white min-h-[60vh]">
        <div className="w-20 h-20 bg-[#0f172a] rounded-3xl flex items-center justify-center text-4xl mb-6">📖</div>
        <h1 className="text-3xl font-black mb-2">Elegí un álbum para empezar</h1>
        <p className="text-slate-400 mb-8">Seleccioná uno de los álbumes disponibles para administrar tus figuritas.</p>
        <div className="grid gap-3 w-full max-w-md">
          {albums.map(a => (
            <button key={a.id} onClick={() => selectAlbum(a, profile?.id)}
              className="flex items-center gap-4 p-4 rounded-2xl bg-[#0f172a] border border-white/10 hover:border-orange-500 transition-all text-left">
              <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center text-2xl">⚽</div>
              <div>
                <p className="font-black">{a.name}</p>
                <p className="text-xs text-slate-500">{a.year} • {a.total_stickers} figuritas</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-40 h-20 bg-[#050816]/90 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 font-black uppercase tracking-wide">Álbum activo</p>
          <h1 className="text-2xl md:text-3xl font-black truncate max-w-[200px] md:max-w-none">{selectedAlbum.name}</h1>
        </div>
        <div className="hidden lg:flex flex-1 max-w-xl mx-8">
          <input type="text" placeholder="Buscar figurita, código o sección..."
            className="w-full px-5 py-3 rounded-2xl bg-[#0f172a] border border-white/10 outline-none focus:ring-2 focus:ring-orange-600 text-sm font-bold placeholder:text-slate-500" />
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden sm:block px-4 py-3 rounded-2xl bg-[#0f172a] border border-white/10 font-black text-sm hover:bg-white/10 transition-colors"
            onClick={() => {
              const idx = albums.findIndex(x => x.id === selectedAlbum.id)
              const next = albums[(idx + 1) % albums.length]
              if (next) selectAlbum(next, profile?.id)
            }}>
            Cambiar álbum
          </button>
          <button onClick={() => navigate('/matches')}
            className="hidden sm:block px-4 py-3 rounded-2xl bg-orange-600 text-white font-black text-sm shadow-lg shadow-orange-600/25">
            Ver intercambios
          </button>
        </div>
      </header>

      <section className="max-w-[1500px] mx-auto px-4 md:px-8 py-6 pb-28 md:pb-8 space-y-6">

        {/* ── ALBUM SUMMARY ── */}
        <div className="rounded-[2rem] bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#1f1308] border border-white/10 shadow-2xl p-5 md:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* icon + title */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-3xl shadow-xl shadow-orange-600/30">⚽</div>
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2 mb-1.5">
                  <span className="px-3 py-1 rounded-full bg-orange-600/20 border border-orange-600/30 text-orange-500 text-xs font-black">Principal</span>
                  <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-300 text-xs font-black">{total} figuritas</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-black tracking-tight truncate">{selectedAlbum.name}</h2>
                <p className="text-slate-400 text-sm mt-0.5 hidden sm:block">Marcá tus figuritas, repetidas y faltantes desde una sola plantilla.</p>
              </div>
            </div>
            {/* stat cards */}
            <div className="grid grid-cols-4 gap-2 shrink-0">
              <div className="rounded-2xl bg-[#070b1a] border border-white/10 p-3 text-center min-w-[72px]">
                <p className="text-2xl font-black">{ownedCount}</p>
                <p className="text-[10px] text-slate-500 font-black uppercase mt-0.5">Tengo</p>
              </div>
              <div className="rounded-2xl bg-emerald-950/30 border border-emerald-500/20 p-3 text-center min-w-[72px]">
                <p className="text-2xl font-black text-emerald-400">{duplicateCount}</p>
                <p className="text-[10px] text-slate-500 font-black uppercase mt-0.5">Repetidas</p>
              </div>
              <div className="rounded-2xl bg-red-950/30 border border-red-500/20 p-3 text-center min-w-[72px]">
                <p className="text-2xl font-black text-red-400">{missingCount}</p>
                <p className="text-[10px] text-slate-500 font-black uppercase mt-0.5">Faltantes</p>
              </div>
              <div className="rounded-2xl bg-orange-600 p-3 text-center min-w-[72px]">
                <p className="text-2xl font-black text-white">{progressPercent}%</p>
                <p className="text-[10px] text-orange-100 font-black uppercase mt-0.5">Completo</p>
              </div>
            </div>
          </div>

          {/* progress bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5 text-sm font-black">
              <span>Progreso del álbum</span>
              <span className="text-orange-500">{ownedCount} / {total}</span>
            </div>
            <div className="h-3 rounded-full bg-[#070b1a] border border-white/10 overflow-hidden flex">
              <div className="h-full bg-orange-600" style={{ width: `${progressPercent}%` }} />
              <div className="h-full bg-red-500" style={{ width: `${(missingCount / total) * 100}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between text-xs font-bold text-slate-500">
              <span>✓ Marcadas como tengo</span>
              <span className="text-red-400">✕ Faltantes</span>
            </div>
          </div>
        </div>

        {/* ── CONTENT GRID ── */}
        <div className="grid xl:grid-cols-[1fr_300px] gap-6 items-start">

          {/* ── CONTROL PANEL ── */}
          <div className="rounded-[2rem] bg-[#0f172a] border border-white/10 shadow-xl overflow-hidden">

            {/* controls header */}
            <div className="p-5 md:p-6 border-b border-white/10">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black">Control de figuritas</h3>
                  <p className="text-sm text-slate-400 mt-0.5">Elegí un modo y tocá los números para marcarlos.</p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {[
                    { key: 'have', label: '✓ Tengo', active: 'bg-white text-slate-950 ring-2 ring-orange-600' },
                    { key: 'duplicate', label: '⇄ Repetida', active: 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 ring-2 ring-orange-600' },
                    { key: 'missing', label: '✕ Faltante', active: 'bg-red-500/15 border border-red-500/30 text-red-300 ring-2 ring-orange-600' },
                    { key: 'clear', label: 'Borrar', active: 'bg-white/20 border border-white/20 text-white ring-2 ring-orange-600' },
                  ].map(({ key, label, active }) => (
                    <button key={key} onClick={() => setMode(key)}
                      className={`px-4 py-2.5 rounded-2xl font-black text-sm transition-all ${mode === key ? active : 'bg-white/10 border border-white/10 text-slate-300 hover:bg-white/20'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <input type="text" placeholder="Buscar número o código: 10, 125, M1..."
                  value={searchFilter} onChange={e => setSearchFilter(e.target.value)}
                  className="flex-1 px-5 py-3.5 rounded-2xl bg-[#070b1a] border border-white/10 outline-none focus:ring-2 focus:ring-orange-600 text-sm font-bold placeholder:text-slate-600" />
                <button onClick={() => setShowBulk(!showBulk)}
                  className="px-5 py-3.5 rounded-2xl bg-orange-600 text-white font-black text-sm hover:bg-orange-500 transition-colors whitespace-nowrap">
                  Carga rápida
                </button>
                <button className="px-5 py-3.5 rounded-2xl bg-white/10 border border-white/10 font-black text-sm hover:bg-white/20 transition-colors">
                  Guardar
                </button>
              </div>

              {showBulk && (
                <div className="mt-3 p-4 rounded-2xl bg-[#070b1a] border border-white/10">
                  <textarea placeholder="Ingresá los números separados por coma o espacio (ej: 1, 5, 12, M3...)"
                    value={bulkInput} onChange={e => setBulkInput(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-sm font-bold min-h-[80px] mb-3 text-white placeholder:text-slate-600" />
                  <button onClick={handleBulkAdd}
                    className="w-full py-3 bg-white text-slate-950 rounded-xl font-black text-sm">
                    Procesar figuritas
                  </button>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-slate-400">
                <span className="inline-flex items-center gap-2"><span className="w-4 h-4 rounded bg-white shrink-0" /> Tengo</span>
                <span className="inline-flex items-center gap-2"><span className="w-4 h-4 rounded bg-emerald-500 shrink-0" /> Repetida</span>
                <span className="inline-flex items-center gap-2"><span className="w-4 h-4 rounded bg-red-500 shrink-0" /> Faltante</span>
                <span className="inline-flex items-center gap-2"><span className="w-4 h-4 rounded border border-white/20 bg-[#070b1a] shrink-0" /> Sin marcar</span>
              </div>
            </div>

            {/* tabs */}
            <div className="px-5 md:px-6 pt-5 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-2 rounded-xl font-black text-sm whitespace-nowrap transition-all ${activeTab === t.key ? 'bg-orange-600 text-white' : 'bg-[#070b1a] border border-white/10 text-slate-300 hover:border-orange-600'
                    }`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── STICKER GRID — max height + internal scroll ── */}
            <div className="px-5 md:px-6 pt-4 pb-6">
              <div
                className="overflow-y-auto rounded-2xl"
                style={{
                  maxHeight: '480px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#1e293b transparent',
                }}
              >
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 pr-1">
                  {numbers.map(num => {
                    const isMissing = missingSet.has(String(num))
                    const isDuplicate = duplicateSet.has(String(num))
                    let cls = 'aspect-square rounded-xl text-sm font-black transition-all flex items-center justify-center '
                    if (isDuplicate) cls += 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    else if (isMissing) cls += 'bg-red-500 text-white shadow-md shadow-red-500/20'
                    else if (ownedCount > 0) cls += 'bg-white text-slate-950'
                    else cls += 'bg-[#070b1a] border border-white/10 text-slate-500 hover:border-orange-600'
                    return (
                      <button key={num} onClick={() => handleToggle(num)} className={cls}>
                        {num}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL (sticky) ── */}
          <aside className="space-y-4 sticky top-24">
            <div className="rounded-[2rem] bg-orange-600 p-6 shadow-xl shadow-orange-600/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-black text-white">Intercambios</h3>
                <span className="px-3 py-1 rounded-full bg-white text-orange-600 text-xs font-black">7 nuevos</span>
              </div>
              <p className="text-orange-100 text-sm">Hay personas cerca que pueden tener tus faltantes.</p>
              <button onClick={() => navigate('/matches')}
                className="mt-5 w-full py-3.5 rounded-2xl bg-white text-orange-600 font-black hover:bg-orange-50 transition-colors">
                Ver intercambios
              </button>
            </div>

            <div className="rounded-[2rem] bg-[#0f172a] border border-white/10 p-5 shadow-xl">
              <h3 className="text-xl font-black mb-4 text-white">Navegación rápida</h3>
              <div className="space-y-2">
                {[
                  { label: 'Ver faltantes', val: missingCount, color: 'text-red-400', tab: 'missing' },
                  { label: 'Ver repetidas', val: duplicateCount, color: 'text-emerald-400', tab: 'duplicates' },
                  { label: 'Especiales M', val: 'M1+', color: 'text-slate-400', tab: 'special_m' },
                ].map(({ label, val, color, tab }) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#070b1a] border border-white/10 hover:border-orange-600 text-left transition-all">
                    <span className="font-black text-white text-sm">{label}</span>
                    <span className={`font-black text-sm ${color}`}>{val}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] bg-[#0f172a] border border-white/10 p-5 shadow-xl">
              <h3 className="text-xl font-black mb-2 text-white">Consejo</h3>
              <p className="text-sm text-slate-400">Marcá primero tus faltantes. Después cargá repetidas para que FigusUY encuentre mejores intercambios.</p>
            </div>
          </aside>

        </div>
      </section>

      {/* MOBILE NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f172a]/95 backdrop-blur-xl border-t border-white/10 px-4 py-3">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold text-slate-400">
          <button className="text-orange-500">📚<br />Álbumes</button>
          <button onClick={() => navigate('/matches')}>🔄<br />Cruces</button>
          <button>💬<br />Chats</button>
          <button>👤<br />Perfil</button>
        </div>
      </nav>
    </>
  )
}
