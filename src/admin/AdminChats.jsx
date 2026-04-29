import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

const card = { background: '#ffffff', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }

export default function AdminChats() {
  const { reportedChats, fetchReportedChats, closeChatReport, escalateChatReport, blockUser, logAction, loading } = useAdminStore()
  const { user } = useAuthStore()
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    fetchReportedChats()
  }, [])

  const viewChat = async (report) => {
    setSelectedChat(report)
    setLoadingMessages(true)
    // Log access to chat for audit
    if (user?.id) {
      logAction(user.id, 'VIEW_REPORTED_CHAT', 'chat', report.reported_chat_id, { report_id: report.id })
    }
    const { data } = await supabase
      .from('messages')
      .select('*, sender:sender_id(name)')
      .eq('chat_id', report.reported_chat_id)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    setLoadingMessages(false)
  }

  const handleClose = (reportId) => {
    if (window.confirm('¿Cerrar este reporte como resuelto?')) {
      closeChatReport(reportId, user.id)
      setSelectedChat(null)
    }
  }

  const handleEscalate = (reportId) => {
    if (window.confirm('¿Escalar este reporte a nivel superior?')) {
      escalateChatReport(reportId, user.id)
    }
  }

  const handleBlockUser = (userId) => {
    if (window.confirm('¿Bloquear este usuario? Se registrará en el historial de bloqueos.')) {
      blockUser(userId, 'Bloqueado desde moderación de chats', 'permanent', user.id)
    }
  }

  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedChat) return
    await supabase.from('admin_notes').insert({
      entity_type: 'chat_report',
      entity_id: selectedChat.id,
      note: noteText,
      author_id: user.id
    })
    logAction(user.id, 'ADD_NOTE_CHAT_REPORT', 'report', selectedChat.id, { note: noteText })
    setNoteText('')
    alert('Nota interna agregada')
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '2rem' }}>chat</span>
          Moderación de Chats
        </h1>
        <p style={{ fontSize: '0.9375rem', color: '#64748b', marginTop: '0.25rem' }}>
          Revisión de conversaciones reportadas. Cada acceso se registra en auditoría.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedChat ? '1fr 1.5fr' : '1fr', gap: '1.5rem', transition: 'all 0.3s' }}>
        {/* Reports List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Reportes ({reportedChats.length})</h2>
          {reportedChats.map(report => (
            <div
              key={report.id}
              onClick={() => viewChat(report)}
              style={{
                ...card, cursor: 'pointer', padding: '1rem',
                borderColor: selectedChat?.id === report.id ? '#ea580c' : report.status === 'escalated' ? '#ef4444' : '#e7e5e4',
                background: selectedChat?.id === report.id ? '#fff7ed' : report.status === 'resolved' ? '#f8fafc' : 'white',
                opacity: report.status === 'resolved' ? 0.6 : 1
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: report.status === 'escalated' ? '#ef4444' : '#ea580c', background: report.status === 'escalated' ? '#fef2f2' : '#fff7ed', padding: '0.125rem 0.5rem', borderRadius: '1rem' }}>
                  {report.status?.toUpperCase() || 'PENDIENTE'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', margin: '0.25rem 0' }}>{report.reason}</p>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Reportero: {report.reporter?.name}</p>
            </div>
          ))}
          {reportedChats.length === 0 && (
            <div style={{ ...card, textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No hay chats reportados.</div>
          )}
        </div>

        {/* Chat Viewer */}
        {selectedChat && (
          <div style={{ ...card, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 15rem)', position: 'sticky', top: '5rem' }}>
            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Visor de Conversación</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Chat ID: {selectedChat.reported_chat_id} • Estado: <strong>{selectedChat.status}</strong></p>
              </div>
              <button onClick={() => setSelectedChat(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>Cargando historial...</div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', marginLeft: '0.5rem' }}>
                      {msg.sender?.name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ background: '#f1f5f9', padding: '0.75rem 1rem', borderRadius: '1rem 1rem 1rem 0.25rem', fontSize: '0.875rem', color: '#1e293b' }}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Internal Note */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Nota interna..." style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }} />
                <button onClick={handleAddNote} style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: '#f1f5f9', color: '#475569', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Agregar Nota</button>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => handleBlockUser(selectedChat.reported_user_id)} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '0.625rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>block</span> Bloquear
              </button>
              <button onClick={() => handleEscalate(selectedChat.id)} style={{ flex: 1, background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', padding: '0.625rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>priority_high</span> Escalar
              </button>
              <button onClick={() => handleClose(selectedChat.id)} style={{ flex: 1, background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', padding: '0.625rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>check_circle</span> Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
