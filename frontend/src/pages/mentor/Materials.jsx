import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, FileText, Video, Link as LinkIcon, File, AlertCircle, X } from 'lucide-react';
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
      case 'slides': return <FileText className="h-4 w-4" />;
      case 'recording': return <Video className="h-4 w-4" />;
      case 'document': return <File className="h-4 w-4" />;
      case 'link': return <LinkIcon className="h-4 w-4" />;
      default: return <LinkIcon className="h-4 w-4" />;
    }
  };

  // Extract unique months for the dropdown
  const uniqueMonths = [...new Set(sessions.map(s => s.month_number))].sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 text-primary">Materials Library</h1>
          <p className="text-body text-secondary mt-2">Manage slides and recordings for all sessions.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Material
        </button>
      </div>

      {error && !isModalOpen && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center z-10">
        <select 
          className="input bg-surface border-border-subtle w-full sm:w-48 text-primary"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          <option value="">All Months</option>
          {uniqueMonths.map(month => (
            <option key={month} value={month}>Month {month}</option>
          ))}
        </select>
        
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-tertiary" />
          <input 
            type="text"
            className="input w-full pl-12 bg-surface border-border-subtle"
            placeholder="Search topics or material titles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card bg-surface rounded-xl p-12 border border-border-subtle shadow-card flex items-center justify-center text-tertiary text-body-lg">
          Loading materials...
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="card bg-surface rounded-xl p-12 border border-border-subtle shadow-card flex items-center justify-center text-tertiary text-body-lg">
          No materials found for this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSessions.map(session => (
            <div key={session.id} className="card bg-surface rounded-xl border border-border-subtle shadow-card flex flex-col overflow-hidden">
              <div className="p-5 border-b border-border-subtle bg-surface-hover/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary px-2 py-1 bg-surface-hover rounded-md">
                    Month {session.month_number}
                  </span>
                  <span className="text-tertiary text-sm flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-h3 text-primary">{session.topic}</h3>
              </div>
              
              <div className="p-5 flex-1 flex flex-col gap-3">
                {(!session.materials || session.materials.length === 0) ? (
                  <div className="text-tertiary text-sm italic py-4">No materials added yet.</div>
                ) : (
                  session.materials.map(material => (
                    <a 
                      key={material.id}
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3 p-3 rounded-lg hover:bg-surface-hover border border-transparent hover:border-border-subtle transition-all"
                    >
                      <div className="mt-0.5 p-2 bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                        {getIconForType(material.type)}
                      </div>
                      <div>
                        <h4 className="text-primary font-medium text-sm group-hover:text-accent transition-colors">{material.title}</h4>
                        {material.description && (
                          <p className="text-secondary text-xs mt-1 line-clamp-2">{material.description}</p>
                        )}
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Material Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface border border-border-subtle rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-border-subtle flex items-center justify-between">
              <h2 className="text-h2 text-primary">Add Material</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-tertiary hover:text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddMaterial} className="p-5 space-y-4">
              {error && (
                <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-secondary">Session</label>
                <select 
                  required
                  className="input w-full bg-surface-hover border-border-subtle"
                  value={formData.session_id}
                  onChange={e => setFormData({...formData, session_id: e.target.value})}
                >
                  <option value="">Select a session...</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>
                      {new Date(s.date).toLocaleDateString()} - {s.topic}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-secondary">Title</label>
                <input 
                  type="text" 
                  required
                  className="input w-full bg-surface-hover border-border-subtle"
                  placeholder="e.g., Session Slides"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-secondary">Type</label>
                <select 
                  className="input w-full bg-surface-hover border-border-subtle"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="slides">Slides</option>
                  <option value="recording">Recording</option>
                  <option value="document">Document</option>
                  <option value="link">External Link</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-secondary">URL</label>
                <input 
                  type="url" 
                  required
                  className="input w-full bg-surface-hover border-border-subtle"
                  placeholder="https://..."
                  value={formData.url}
                  onChange={e => setFormData({...formData, url: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-secondary">Description (Optional)</label>
                <textarea 
                  className="input w-full bg-surface-hover border-border-subtle min-h-[80px] py-2"
                  placeholder="Brief notes about this material..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn bg-surface-hover text-secondary hover:text-primary flex-1"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1"
                >
                  {submitting ? 'Saving...' : 'Save Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
