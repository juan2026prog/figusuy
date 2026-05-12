import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  User, 
  Tag, 
  RefreshCw,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

const cardStyle = { 
  background: "var(--admin-panel)", 
  borderRadius: "0.75rem", 
  padding: "1.5rem", 
  border: "1px solid var(--admin-line)",
  transition: "all 0.2s ease"
};

const badgeStyle = (bg, color) => ({
  padding: '0.25rem 0.625rem',
  borderRadius: '1rem',
  background: bg,
  color: color,
  fontSize: '0.75rem',
  fontWeight: 800,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem'
});

const statusConfig = {
  pending: { bg: '#fffbeb', color: '#d97706', label: 'Pendiente' },
  in_progress: { bg: '#eff6ff', color: '#2563eb', label: 'En Proceso' },
  resolved: { bg: '#ecfdf5', color: '#10b981', label: 'Resuelto' },
  rejected: { bg: '#fef2f2', color: '#ef4444', label: 'Rechazado' },
  spam: { bg: '#121212', color: '#666', label: 'Spam' }
};

export default function AdminContactRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [notes, setNotes] = useState({});

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
      
      const n = {};
      data.forEach(r => n[r.id] = r.admin_notes || '');
      setNotes(n);
    } catch (err) {
      console.error('Error fetching contact requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('contact_requests')
        .update({ status, admin_notes: notes[id] })
        .eq('id', id);

      if (error) throw error;
      fetchRequests();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const filteredRequests = requests.filter(r => filter === 'all' || r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="admin-page-container" style={{ paddingBottom: '4rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div className="admin-kicker">/ soporte & expansión</div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: "#f5f5f5", letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '2.5rem' }}>contact_support</span>
            Contact Hub Requests
          </h1>
          <p style={{ fontSize: '1rem', color: "var(--admin-muted2)", marginTop: '0.5rem', fontWeight: 500 }}>
            Gestión de leads, soporte y alianzas estratégicas.
            {pendingCount > 0 && (
              <span style={{ color: 'var(--color-primary)', fontWeight: 800, marginLeft: '0.5rem' }}>
                • {pendingCount} pendientes
              </span>
            )}
          </p>
        </div>
        <button 
          onClick={fetchRequests}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', 
            borderRadius: '0.75rem', background: 'var(--admin-panel2)', border: '1px solid var(--admin-line)',
            color: '#fff', fontWeight: 700, cursor: 'pointer'
          }}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refrescar
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {Object.entries(statusConfig).map(([key, config]) => (
          <div key={key} style={{ ...cardStyle, padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: config.color }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', fontWeight: 700, uppercase: 'true' }}>{config.label}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{requests.filter(r => r.status === key).length}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setFilter('all')}
          style={{
            padding: '0.625rem 1.25rem', borderRadius: '2rem', fontSize: '0.875rem', fontWeight: 700,
            background: filter === 'all' ? 'var(--color-primary)' : 'var(--admin-panel)',
            color: filter === 'all' ? '#fff' : 'var(--admin-muted2)',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          Todos
        </button>
        {Object.entries(statusConfig).map(([key, config]) => (
          <button 
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '0.625rem 1.25rem', borderRadius: '2rem', fontSize: '0.875rem', fontWeight: 700,
              background: filter === key ? config.color : 'var(--admin-panel)',
              color: filter === key ? '#fff' : 'var(--admin-muted2)',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {config.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        {loading && requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <RefreshCw size={40} className="animate-spin text-orange-500 mx-auto mb-4" />
            <p>Cargando solicitudes...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '5rem' }}>
            <Mail size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>No hay solicitudes</h3>
            <p style={{ color: 'var(--admin-muted)' }}>No se encontraron registros en esta categoría.</p>
          </div>
        ) : (
          filteredRequests.map(r => (
            <div key={r.id} style={{ 
              ...cardStyle, 
              borderLeft: `4px solid ${statusConfig[r.status]?.color || '#ccc'}`,
              opacity: r.status === 'spam' ? 0.6 : 1
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={badgeStyle(statusConfig[r.status]?.bg, statusConfig[r.status]?.color)}>
                      {statusConfig[r.status]?.label}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                      {r.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>{r.subject}</h3>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <User size={16} className="text-gray-500" />
                      <strong>{r.name}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <Mail size={16} className="text-gray-500" />
                      <span className="text-gray-400">{r.email}</span>
                    </div>
                    {r.user_id && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', background: 'rgba(234, 88, 12, 0.1)', color: 'var(--color-primary)', padding: '0.2rem 0.5rem', borderRadius: '0.5rem' }}>
                        <Tag size={12} />
                        Usuario Registrado
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-muted)' }}
                >
                  {expandedId === r.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </button>
              </div>

              {expandedId === r.id && (
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--admin-line)', paddingTop: '1.5rem' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--admin-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MessageSquare size={16} />
                      MENSAJE DEL USUARIO:
                    </h4>
                    <div style={{ 
                      background: 'var(--admin-panel2)', padding: '1.25rem', borderRadius: '0.75rem', 
                      fontSize: '1rem', lineHeight: 1.6, whiteSpace: 'pre-wrap'
                    }}>
                      {r.message}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--admin-muted)', marginBottom: '0.75rem' }}>NOTAS ADMINISTRATIVAS:</h4>
                      <textarea 
                        value={notes[r.id] || ''}
                        onChange={(e) => setNotes({...notes, [r.id]: e.target.value})}
                        placeholder="Agregar notas internas..."
                        style={{ 
                          width: '100%', height: '100px', background: 'var(--admin-panel2)', 
                          border: '1px solid var(--admin-line)', borderRadius: '0.75rem', 
                          padding: '0.75rem', color: '#fff', fontSize: '0.875rem', resize: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--admin-muted)', marginBottom: '0.75rem' }}>ACCIONES:</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <button 
                          onClick={() => updateStatus(r.id, 'in_progress')}
                          style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#2563eb', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                        >
                          En Proceso
                        </button>
                        <button 
                          onClick={() => updateStatus(r.id, 'resolved')}
                          style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#10b981', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Resolver
                        </button>
                        <button 
                          onClick={() => updateStatus(r.id, 'rejected')}
                          style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Rechazar
                        </button>
                        <button 
                          onClick={() => updateStatus(r.id, 'spam')}
                          style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#333', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Marcar Spam
                        </button>
                      </div>
                      <div style={{ marginTop: '1rem' }}>
                        <a 
                          href={`mailto:${r.email}?subject=Re: FigusUY - ${r.subject}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 700, textDecoration: 'none' }}
                        >
                          Responder vía Email
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
