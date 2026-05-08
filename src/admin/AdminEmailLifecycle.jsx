import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminEmailLifecycle() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    templates: [],
    blocks: [],
    triggers: [],
    queue: [],
    logs: [],
    analytics: []
  });

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const fetchers = {
        analytics: () => supabase.from('vw_email_analytics').select('*'),
        templates: () => supabase.from('email_templates').select('*, email_blocks(name)').order('created_at', { ascending: false }),
        blocks: () => supabase.from('email_blocks').select('*').order('category'),
        triggers: () => supabase.from('email_trigger_configs').select('*, email_templates(slug)').order('event_key'),
        logs: () => supabase.from('email_logs').select('*').order('created_at', { ascending: false }).limit(50),
        queue: () => supabase.from('email_queue').select('*, profiles(email)').order('created_at', { ascending: false }).limit(50)
      };

      const { data: resData } = await fetchers[activeTab]();
      setData(prev => ({ ...prev, [activeTab]: resData || [] }));
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  };

  const handlePreview = async (template) => {
    setSelectedTemplate(template);
    setPreviewHtml('Cargando preview...');
    try {
      const { data: res, error } = await supabase.functions.invoke('email-lifecycle', {
        body: { 
          action: 'preview_template', 
          template_id: template.id,
          variables: { name: 'Usuario Prueba', title: 'Título de Prueba', subtitle: 'Subtítulo del hero' }
        }
      });
      if (error) throw error;
      setPreviewHtml(res.html);
    } catch (err) {
      setPreviewHtml('Error: ' + err.message);
    }
  };

  const handleTestSend = async () => {
    if (!testEmail) return alert('Ingresa un email');
    try {
      const { data: res, error } = await supabase.functions.invoke('email-lifecycle', {
        body: { 
          action: 'test_send', 
          template_id: selectedTemplate.id, 
          email: testEmail,
          variables: { name: 'Admin Test' }
        }
      });
      if (error) throw error;
      alert('Prueba enviada!');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="admin-email-system">
      <div className="admin-header-row">
        <div>
          <div className="admin-kicker">/ infraestructura</div>
          <h1>Email Operating System</h1>
        </div>
        <div className="admin-header-actions">
          <button className="admin-action-btn admin-action-primary" onClick={() => supabase.functions.invoke('email-lifecycle', { body: { action: 'process_queue' } }).then(() => fetchData())}>
            <span className="material-symbols-outlined">bolt</span>
            Forzar Procesamiento
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        {['analytics', 'templates', 'blocks', 'triggers', 'logs', 'queue'].map(tab => (
          <button 
            key={tab} 
            className={`admin-tab ${activeTab === tab ? 'active' : ''}`} 
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="admin-grid">
        <div className="admin-main-card">
          {loading ? (
            <div className="admin-loading">Cargando sistema de emails...</div>
          ) : (
            <div className="admin-table-container">
              {activeTab === 'analytics' && (
                <table className="admin-table">
                  <thead>
                    <tr><th>Template</th><th>Sent</th><th>Open Rate</th><th>CTR</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {data.analytics.map(a => (
                      <tr key={a.slug}>
                        <td className="bold">{a.slug}</td>
                        <td>{a.total_sent}</td>
                        <td className="metric">{a.open_rate.toFixed(1)}%</td>
                        <td className="metric">{a.click_through_rate.toFixed(1)}%</td>
                        <td><span className="status-chip active">Healthy</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'templates' && (
                <table className="admin-table">
                  <thead>
                    <tr><th>Name</th><th>Slug</th><th>Category</th><th>Variant</th><th>Layout</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {data.templates.map(t => (
                      <tr key={t.id}>
                        <td className="bold">{t.template_name || t.slug}</td>
                        <td><code>{t.slug}</code></td>
                        <td><span className="cat-pill">{t.category || 'N/A'}</span></td>
                        <td><span className={`variant-pill ${t.variant_style}`}>{t.variant_style}</span></td>
                        <td>{t.email_blocks?.name || 'Default'}</td>
                        <td>
                          <button className="admin-mini-btn" onClick={() => handlePreview(t)}>Preview</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'blocks' && (
                <table className="admin-table">
                  <thead>
                    <tr><th>Name</th><th>Category</th><th>Slug</th></tr>
                  </thead>
                  <tbody>
                    {data.blocks.map(b => (
                      <tr key={b.id}>
                        <td className="bold">{b.name}</td>
                        <td><span className="cat-pill">{b.category}</span></td>
                        <td><code>{b.slug}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'triggers' && (
                <table className="admin-table">
                  <thead>
                    <tr><th>Event</th><th>Template</th><th>Priority</th><th>Delay</th></tr>
                  </thead>
                  <tbody>
                    {data.triggers.map(tr => (
                      <tr key={tr.id}>
                        <td className="bold"><code>{tr.event_key}</code></td>
                        <td>{tr.email_templates?.slug}</td>
                        <td>{tr.priority}</td>
                        <td>{tr.delay_minutes}m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'logs' && (
                <table className="admin-table">
                  <thead>
                    <tr><th>Time</th><th>Recipient</th><th>Subject</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {data.logs.map(l => (
                      <tr key={l.id}>
                        <td>{new Date(l.created_at).toLocaleTimeString()}</td>
                        <td>{l.recipient_email}</td>
                        <td className="subject-cell">{l.subject}</td>
                        <td><span className={`status-badge ${l.status}`}>{l.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'queue' && (
                <table className="admin-table">
                  <thead>
                    <tr><th>Scheduled</th><th>Template</th><th>Email</th><th>Retries</th></tr>
                  </thead>
                  <tbody>
                    {data.queue.map(q => (
                      <tr key={q.id}>
                        <td>{new Date(q.created_at).toLocaleTimeString()}</td>
                        <td>{q.template_slug}</td>
                        <td>{q.profiles?.email}</td>
                        <td>{q.retry_count} / {q.max_retries}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {selectedTemplate && (
        <div className="admin-preview-overlay">
          <div className="admin-preview-modal">
            <div className="admin-modal-header">
              <div>
                <h2>Preview: {selectedTemplate.template_name || selectedTemplate.slug}</h2>
                <p>Subject: {selectedTemplate.subject}</p>
              </div>
              <button className="admin-close-btn" onClick={() => setSelectedTemplate(null)}>Ã—</button>
            </div>
            
            <div className="admin-modal-content">
              <div className="admin-preview-frame" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              
              <div className="admin-preview-sidebar">
                <div className="admin-sidebar-section">
                  <h3>Test Send</h3>
                  <input 
                    type="email" 
                    placeholder="Email de prueba" 
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="admin-input"
                  />
                  <button className="admin-action-btn" onClick={handleTestSend}>Enviar Prueba</button>
                </div>

                <div className="admin-sidebar-section">
                  <h3>Variables Detectadas</h3>
                  <div className="variables-list">
                    {Object.keys(selectedTemplate.variables || {}).map(v => (
                      <div key={v} className="variable-item">
                        <code>{`{{${v}}}`}</code>
                        <span>{String(selectedTemplate.variables[v])}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

      </div>

      <style>{`
        .admin-email-system { color: #f1f5f9; }
        .admin-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; }
        .admin-grid:has(.admin-side-preview) { grid-template-columns: 1fr 400px; }
        
        .admin-tabs { display: flex; gap: 0.5rem; margin-bottom: 2rem; border-bottom: 1px solid #1e293b; }
        .admin-tab { padding: 1rem; background: none; border: none; color: #64748b; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; }
        .admin-tab.active { color: #f97316; border-bottom-color: #f97316; }

        .admin-main-card { background: #111827; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th { text-align: left; padding: 1rem; border-bottom: 1px solid #1e293b; color: #64748b; font-size: 0.8rem; text-transform: uppercase; }
        .admin-table td { padding: 1rem; border-bottom: 1px solid #1e293b; font-size: 0.9rem; }
        
        .variant-pill { padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
        .variant-pill.activation { background: #f9731633; color: #f97316; }
        .variant-pill.trust { background: #3b82f633; color: #3b82f6; }
        .cat-pill { background: #334155; color: #94a3b8; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; }

        .admin-side-preview { background: #0f172a; border-left: 1px solid #1e293b; padding: 1.5rem; height: calc(100vh - 200px); position: sticky; top: 100px; }
        .preview-frame-container { display: flex; justify-content: center; padding-top: 2rem; }
        .preview-frame.mobile { width: 320px; height: 568px; border: 12px solid #1e293b; border-radius: 32px; overflow: hidden; background: #fff; }
        .preview-frame iframe { width: 100%; height: 100%; border: none; }
        
        .admin-mini-btn { background: #1e293b; color: #fff; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
        .admin-mini-btn:hover { background: #334155; }
        
        .metric { font-family: 'JetBrains Mono', monospace; font-weight: bold; color: #10b981; }
        .status-chip { padding: 2px 8px; border-radius: 99px; font-size: 0.7rem; }
        .status-chip.active { background: #10b98122; color: #10b981; }

        /* Preview Modal */
        .admin-preview-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); }
        .admin-preview-modal { background: #0b0e14; width: 90vw; height: 90vh; border-radius: 24px; border: 1px solid #1e293b; overflow: hidden; display: flex; flex-direction: column; }
        .admin-modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; background: #111827; }
        .admin-modal-header h2 { margin: 0; font-size: 1.5rem; color: #fff; }
        .admin-modal-header p { margin: 4px 0 0; color: #64748b; font-size: 0.9rem; }
        .admin-close-btn { background: none; border: none; color: #64748b; font-size: 2rem; cursor: pointer; }
        
        .admin-modal-content { display: grid; grid-template-columns: 1fr 350px; flex: 1; overflow: hidden; }
        .admin-preview-frame { background: #050505; overflow-y: auto; display: flex; justify-content: center; padding: 2rem; }
        .admin-preview-sidebar { background: #111827; border-left: 1px solid #1e293b; padding: 1.5rem; overflow-y: auto; }
        
        .admin-sidebar-section { margin-bottom: 2rem; }
        .admin-sidebar-section h3 { font-size: 0.8rem; text-transform: uppercase; color: #64748b; margin-bottom: 1rem; letter-spacing: 1px; }
        .admin-input { width: 100%; padding: 0.75rem; background: #0b0e14; border: 1px solid #1e293b; border-radius: 8px; color: #fff; margin-bottom: 1rem; }
        .admin-action-btn { width: 100%; padding: 0.75rem; background: #f97316; color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
        .admin-action-btn:hover { background: #ea580c; }
        
        .variables-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .variable-item { background: #0b0e14; border: 1px solid #1e293b; padding: 0.5rem; border-radius: 4px; display: flex; flex-direction: column; gap: 4px; }
        .variable-item code { color: #f97316; font-size: 0.8rem; }
        .variable-item span { color: #94a3b8; font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      `}</style>
    </div>
  );
}
