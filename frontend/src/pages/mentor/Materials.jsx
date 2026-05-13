import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, FileText, Video, Link as LinkIcon, File, AlertCircle, X, Library, Filter, ExternalLink, Download, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Materials() {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    session_id: '',
    title: '',
    type: 'slides',
    url: '',
    description: ''
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    filterData();
  }, [sessions, selectedMonth, searchTerm]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id, date, topic, month_number,
          materials(id, title, type, url, description)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let result = sessions;
    
    if (selectedMonth) {
      result = result.filter(s => s.month_number.toString() === selectedMonth);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => {
        const topicMatch = s.topic.toLowerCase().includes(term);
        const materialMatch = s.materials && s.materials.some(m => m.title.toLowerCase().includes(term));
        return topicMatch || materialMatch;
      });
    }

    setFilteredSessions(result);
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('materials')
        .insert([{
          session_id: parseInt(formData.session_id),
          title: formData.title,
          type: formData.type,
          url: formData.url,
          description: formData.description
        }])
        .select();

      if (error) throw error;
      
      // Update local state instead of refetching everything
      const updatedSessions = sessions.map(s => {
        if (s.id === parseInt(formData.session_id)) {
          return { ...s, materials: [...(s.materials || []), data[0]] };
        }
        return s;
      });
      
      setSessions(updatedSessions);
      setIsModalOpen(false);
      setFormData({
        session_id: '',
        title: '',
        type: 'slides',
        url: '',
        description: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'slides': return <FileText className="h-5 w-5" />;
      case 'recording': return <Video className="h-5 w-5" />;
      case 'document': return <File className="h-5 w-5" />;
      case 'link': return <LinkIcon className="h-5 w-5" />;
      default: return <LinkIcon className="h-5 w-5" />;
    }
  };

  const getBadgeColor = (type) => {
    switch (type) {
        case 'slides': return 'bg-accent-glow text-white';
        case 'recording': return 'bg-danger text-white';
        case 'document': return 'bg-success text-white';
        default: return 'bg-primary text-white';
    }
  };

  // Extract unique months for the dropdown
  const uniqueMonths = [...new Set(sessions.map(s => s.month_number))].sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-10 pb-20 page-entrance">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-glow/10 border border-accent-glow/20 text-accent-glow text-[10px] font-bold uppercase tracking-widest mb-4">
             <Library className="h-3.5 w-3.5" /> Resource Knowledge Hub
           </div>
          <h1 className="text-4xl font-display font-bold text-primary tracking-tight">Materials Library</h1>
          <p className="text-secondary mt-2 font-medium">Your centralized vault for all session recordings, slides, and study guides.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-premium flex items-center gap-3 px-8 shadow-glow"
        >
          <Plus className="h-5 w-5" /> Add New Resource
        </button>
      </div>

      {error && !isModalOpen && (
        <div className="glass-card border-danger/30 bg-danger/5 p-5 text-danger flex items-center gap-4">
          <AlertCircle className="h-6 w-6" />
          <p className="font-bold text-sm">{error}</p>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center relative z-20">
        <div className="glass-card p-1.5 flex items-center gap-2 w-full lg:w-fit bg-white/[0.02]">
            <select 
            className="bg-transparent border-none outline-none text-sm font-bold text-primary px-4 py-2 cursor-pointer appearance-none min-w-[160px]"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            >
                <option value="" className="bg-void">All Timeframes</option>
                {uniqueMonths.map(month => (
                    <option key={month} value={month} className="bg-void text-primary">Month {month}</option>
                ))}
            </select>
            <div className="h-6 w-px bg-white/10 hidden sm:block"></div>
            <div className="relative w-full lg:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary group-focus-within:text-accent-glow transition-colors" />
                <input 
                type="text"
                className="bg-transparent border-none outline-none text-sm text-primary pl-11 pr-4 py-2 w-full placeholder:text-tertiary font-medium"
                placeholder="Search topics, modules, or file names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button className="hidden sm:flex items-center gap-2 p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-tertiary hover:text-primary transition-all px-4 font-bold text-xs">
                <Filter className="h-4 w-4" /> Filter
            </button>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="glass-card p-32 flex flex-col items-center justify-center gap-6 border-white/5 bg-white/[0.01]">
            <div className="h-16 w-16 border-4 border-accent-glow/20 border-t-accent-glow rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-tertiary">Indexing Knowledge Vault...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="glass-card p-32 flex flex-col items-center justify-center gap-4 text-center">
          <Library className="h-20 w-20 text-tertiary opacity-10" />
          <h3 className="text-xl font-bold text-primary">No resources match your search</h3>
          <p className="text-tertiary max-w-xs mx-auto">Try adjusting your filters or search terms to find what you're looking for.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {filteredSessions.map(session => (
            <div key={session.id} className="glass-card group flex flex-col overflow-hidden border-white/5 hover:border-accent-glow/30 transition-all duration-500 hover:shadow-glow-sm">
              {/* Card Header */}
              <div className="p-8 border-b border-white/5 bg-white/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 bg-accent-glow/5 blur-[40px] pointer-events-none rounded-full group-hover:bg-accent-glow/10 transition-colors"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent-glow px-3 py-1.5 bg-accent-glow/10 border border-accent-glow/20 rounded-xl">
                      Month {session.month_number}
                    </span>
                    <span className="text-tertiary text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-primary tracking-tight group-hover:text-accent-glow transition-colors">{session.topic}</h3>
                </div>
                
                <div className="relative z-10 h-14 w-14 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center text-tertiary shadow-inner">
                    <Clock className="h-6 w-6 opacity-40" />
                </div>
              </div>
              
              {/* Card Body - Materials List */}
              <div className="p-8 flex-1 flex flex-col gap-4 bg-white/[0.01]">
                {(!session.materials || session.materials.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center opacity-40 gap-3">
                    <FileText className="h-10 w-10 text-tertiary" />
                    <p className="text-xs font-bold uppercase tracking-widest text-tertiary">No materials uploaded yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {session.materials.map(material => (
                      <a 
                        key={material.id}
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/item flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-accent-glow/30 transition-all"
                      >
                        <div className="flex items-center gap-5">
                          <div className={`p-3 rounded-2xl bg-white/5 text-primary group-hover/item:scale-110 transition-all duration-300 shadow-lg ${getBadgeColor(material.type)}`}>
                            {getIconForType(material.type)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-primary group-hover/item:text-accent-glow transition-colors">{material.title}</h4>
                            <div className="text-[10px] text-tertiary font-bold uppercase tracking-widest mt-1 flex items-center gap-3">
                                <span className="flex items-center gap-1"><ExternalLink className="h-3 w-3" /> External Access</span>
                                {material.description && <span className="text-tertiary/40 hidden sm:inline">•</span>}
                                {material.description && <span className="hidden sm:inline line-clamp-1">{material.description}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-tertiary group-hover/item:bg-accent-glow group-hover/item:text-white transition-all">
                            <Download className="h-4 w-4" />
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Material Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 p-0 border-white/10 shadow-glow">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-accent-glow/10 rounded-2xl flex items-center justify-center border border-accent-glow/20 shadow-glow-sm">
                    <Plus className="h-6 w-6 text-accent-glow" />
                </div>
                <div>
                    <h2 className="text-2xl font-display font-bold text-primary tracking-tight">Upload Resource</h2>
                    <p className="text-[10px] font-black text-tertiary uppercase tracking-widest mt-1">Populate library with new assets</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 hover:bg-white/10 rounded-2xl transition-all text-tertiary hover:text-primary"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddMaterial} className="p-8 space-y-6">
              {error && (
                <div className="bg-danger/10 text-danger p-4 rounded-2xl text-xs font-bold border border-danger/20 flex items-center gap-3">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Target Session</label>
                <select 
                  required
                  className="input-premium w-full bg-white/[0.04] text-sm font-bold"
                  value={formData.session_id}
                  onChange={e => setFormData({...formData, session_id: e.target.value})}
                >
                  <option value="" className="bg-void">Identify specific session...</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id} className="bg-void">
                      {new Date(s.date).toLocaleDateString()} — {s.topic}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Asset Title</label>
                <input 
                  type="text" 
                  required
                  className="input-premium w-full bg-white/[0.04] text-sm font-bold"
                  placeholder="e.g., Deep Dive into React Performance"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Asset Type</label>
                    <select 
                    className="input-premium w-full bg-white/[0.04] text-sm font-bold"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                    <option value="slides" className="bg-void">Presentation Slides</option>
                    <option value="recording" className="bg-void">Video Recording</option>
                    <option value="document" className="bg-void">Whitepaper / Doc</option>
                    <option value="link" className="bg-void">External Web Link</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Access URL</label>
                    <input 
                    type="url" 
                    required
                    className="input-premium w-full bg-white/[0.04] text-sm font-mono font-bold"
                    placeholder="https://..."
                    value={formData.url}
                    onChange={e => setFormData({...formData, url: e.target.value})}
                    />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Metadata / Description</label>
                <textarea 
                  className="input-premium w-full bg-white/[0.04] min-h-[100px] py-4 text-sm font-medium leading-relaxed"
                  placeholder="Summarize the core concepts covered in this material..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="pt-6 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-premium-outline flex-1 h-14"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="btn-premium flex-1 h-14 shadow-glow"
                >
                  {submitting ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Commit Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
