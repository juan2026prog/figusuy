import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LifeBuoy, 
  Briefcase, 
  Store, 
  Users, 
  Megaphone, 
  Globe, 
  Handshake, 
  ShieldAlert, 
  Newspaper, 
  Rocket,
  Send,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  MessageSquare
} from 'lucide-react';

const CATEGORIES = [
  { id: 'support', label: 'Soporte Técnico', icon: LifeBuoy, description: 'Ayuda con tu cuenta, stickers o intercambios.' },
  { id: 'business', label: 'Negocios & Marcas', icon: Briefcase, description: 'Propuestas comerciales y activaciones.' },
  { id: 'partner', label: 'PartnerStores', icon: Store, description: 'Convertí tu comercio en un punto oficial FigusUY.' },
  { id: 'influencer', label: 'Influencers', icon: Users, description: 'Sumate a nuestra red de creadores de contenido.' },
  { id: 'advertising', label: 'Publicidad', icon: Megaphone, description: 'Anunciate en el ecosistema FigusUY.' },
  { id: 'expansion', label: 'Licencias & Expansión', icon: Globe, description: 'Llevá FigusUY a tu ciudad o país.' },
  { id: 'partnership', label: 'Partnerships', icon: Handshake, description: 'Alianzas estratégicas y colaboraciones.' },
  { id: 'security', label: 'Seguridad & Moderación', icon: ShieldAlert, description: 'Reportá problemas de conducta o seguridad.' },
  { id: 'press', label: 'Prensa', icon: Newspaper, description: 'Consultas de medios y comunicados oficiales.' },
  { id: 'community', label: 'Comunidad', icon: Rocket, description: 'Iniciativas sociales y proyectos comunitarios.' }
];

export default function ContactHub() {
  useEffect(() => {
    console.log("FigusUY Contact Hub Loaded V3 - Center Fix");
  }, []);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: insertError } = await supabase
        .from('contact_requests')
        .insert([{
          ...formData,
          category: selectedCategory,
          user_id: user?.id || null,
          metadata: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            url: window.location.href
          }
        }]);

      if (insertError) throw insertError;

      // Trigger email notification
      try {
        await supabase.functions.invoke('email-lifecycle', {
          body: {
            action: 'trigger_event',
            event: 'contact_request',
            email: formData.email,
            variables: {
              name: formData.name,
              category: selectedCategory,
              subject: formData.subject,
              message: formData.message.length > 100 ? formData.message.substring(0, 100) + '...' : formData.message
            }
          }
        });
      } catch (emailErr) {
        console.error('Error triggering email:', emailErr);
      }

      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSelectedCategory(null);
    } catch (err) {
      console.error('Error submitting contact request:', err);
      setError('No pudimos enviar tu mensaje. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20 px-4 relative overflow-hidden flex flex-col items-center">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center">
        <header className="text-center mb-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-sm font-medium mb-6"
          >
            <MessageSquare size={16} />
            Contact Hub Inteligente
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent font-['Barlow_Condensed',_sans-serif-condensed,_sans-serif]"
          >
            Impulsando el ecosistema <br />
            <span className="text-orange-500">FigusUY</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-400 w-full text-center"
          >
            Seleccioná el área con la que deseás conectar. <br className="hidden md:block" />
            Nuestro equipo operativo te responderá en breve.
          </motion.p>
        </header>

        <AnimatePresence mode="wait">
          {!selectedCategory && !submitted && (
            <motion.div 
              key="grid"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto"
            >
              {CATEGORIES.map((cat, idx) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="group relative p-5 rounded-2xl bg-[#121212] border border-white/5 hover:border-orange-500/30 transition-all duration-300 text-left overflow-hidden h-full"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="text-orange-500" size={20} />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <cat.icon className="text-orange-500" size={24} />
                  </div>
                  <h3 className="text-xl font-black uppercase italic font-['Barlow_Condensed',_sans-serif-condensed,_sans-serif] mb-2 group-hover:text-orange-500 transition-colors leading-none">{cat.label}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{cat.description}</p>
                </motion.button>
              ))}
            </motion.div>
          )}

          {selectedCategory && !submitted && (
            <motion.div 
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
              >
                <ChevronRight size={20} className="rotate-180" />
                Volver a categorías
              </button>

              <div className="bg-[#121212] border border-white/5 rounded-3xl p-8 md:p-10 shadow-2xl relative">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                    {(() => {
                      const cat = CATEGORIES.find(c => c.id === selectedCategory);
                      const Icon = cat?.icon || LifeBuoy;
                      return <Icon className="text-orange-500" size={28} />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase italic font-['Barlow_Condensed']">{CATEGORIES.find(c => c.id === selectedCategory)?.label}</h2>
                    <p className="text-gray-400 text-sm">Completá el formulario para iniciar el contacto.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Nombre Completo</label>
                      <input 
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition-colors"
                        placeholder="Juan Pérez"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Email de Contacto</label>
                      <input 
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition-colors"
                        placeholder="juan@ejemplo.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Asunto</label>
                    <input 
                      required
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition-colors"
                      placeholder="¿En qué podemos ayudarte?"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Mensaje / Propuesta</label>
                    <textarea 
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition-colors resize-none"
                      placeholder="Contanos más detalles..."
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-4 rounded-xl border border-red-400/20">
                      <AlertCircle size={18} />
                      {error}
                    </div>
                  )}

                  <button 
                    disabled={loading}
                    type="submit"
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Enviar Solicitud
                        <Send size={18} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {submitted && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto text-center"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-8 border border-green-500/20">
                <CheckCircle className="text-green-500" size={40} />
              </div>
              <h2 className="text-3xl font-bold mb-4">¡Solicitud Enviada!</h2>
              <p className="text-gray-400 mb-10 leading-relaxed">
                Hemos recibido tu mensaje correctamente. Nuestro equipo revisará la información y se pondrá en contacto con vos a la brevedad.
              </p>
              <button 
                onClick={handleBack}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
              >
                Volver al Hub
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-24 pt-12 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left max-w-4xl mx-auto">
          <div>
            <h4 className="text-sm font-black uppercase italic tracking-wider text-orange-500 mb-4 font-['Barlow_Condensed']">Ecosistema</h4>
            <p className="text-gray-500 text-sm leading-relaxed">
              FigusUY es la plataforma líder de intercambio de figuritas y comunidad coleccionista en Uruguay.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-black uppercase italic tracking-wider text-orange-500 mb-4 font-['Barlow_Condensed']">Transparencia</h4>
            <p className="text-gray-500 text-sm leading-relaxed">
              Todas las solicitudes son procesadas de forma segura y auditadas por nuestro equipo operativo.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-black uppercase italic tracking-wider text-orange-500 mb-4 font-['Barlow_Condensed']">Urgencias</h4>
            <p className="text-gray-500 text-sm leading-relaxed">
              Para reportes críticos de seguridad, por favor usá la categoría correspondiente para prioridad inmediata.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
