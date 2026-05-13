import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Copy, RefreshCw, Check, X, RotateCcw, Loader2, Plus, Save, Sparkles, UserCheck, Calendar, Clock, ArrowRight, Keyboard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function MarkAttendance() {
  const { userProfile } = useAuth();
  const [phase, setPhase] = useState('setup'); // 'setup', 'marking', 'completion'
  const [className, setClassName] = useState('');
  const [hours, setHours] = useState('2.0');
  
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [students, setStudents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', usn: '', branch_code: 'CS' });
  const [addingStudent, setAddingStudent] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      setStudents(data.map(s => ({ ...s, status: null })));
    } catch (err) {
      alert('Error fetching students: ' + err.message);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.usn || !newStudent.branch_code) {
      alert('Please fill in Name, USN, and Branch Code.');
      return;
    }
    setAddingStudent(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([newStudent])
        .select()
        .single();
      
      if (error) throw error;
      
      setStudents(prev => [...prev, { ...data, status: null }].sort((a, b) => a.name.localeCompare(b.name)));
      setNewStudent({ name: '', usn: '', branch_code: 'CS' });
      setShowAddForm(false);
    } catch (err) {
      alert('Error adding student: ' + err.message);
    } finally {
      setAddingStudent(false);
    }
  };

  const handleStartMarking = () => {
    if (!className.trim()) {
      alert('Please enter a class name.');
      return;
    }
    if (!hours || isNaN(hours)) {
      alert('Please enter valid hours.');
      return;
    }
    if (students.length === 0) {
      alert('No students available. Please add students first.');
      return;
    }
    setCurrentIndex(0);
    setPhase('marking');
  };

  const markStudent = useCallback((status) => {
    if (phase !== 'marking') return;
    
    setStudents(prev => {
      const newStudents = [...prev];
      newStudents[currentIndex] = { ...newStudents[currentIndex], status };
      return newStudents;
    });

    if (currentIndex < students.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setPhase('completion');
    }
  }, [currentIndex, phase, students.length]);

  const undoLast = useCallback(() => {
    if (phase !== 'marking' || currentIndex === 0) return;
    setCurrentIndex(prev => prev - 1);
    setStudents(prev => {
       const newStudents = [...prev];
       newStudents[currentIndex - 1] = { ...newStudents[currentIndex - 1], status: null };
       return newStudents;
    });
  }, [currentIndex, phase]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (phase !== 'marking') return;
      if (e.key.toLowerCase() === 'p') {
        markStudent('present');
      } else if (e.key.toLowerCase() === 'a') {
        markStudent('absent');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undoLast();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, markStudent, undoLast]);

  const handleSaveAttendance = async () => {
    if (userProfile?.is_bypass) {
        alert("Database Sync Required: Your profile isn't fully registered in the database. Run the SQL sync script to enable saving.");
        return;
    }
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const monthNumber = new Date().getMonth() + 1;
      
      let sessionId;
      const { data: existingSession, error: checkError } = await supabase
        .from('sessions')
        .select('id')
        .eq('date', today)
        .single();
        
      if (existingSession) {
         sessionId = existingSession.id;
      } else if (checkError && checkError.code === 'PGRST116') { // No rows found
         const { data: newSession, error: createError } = await supabase
           .from('sessions')
           .insert({
             date: today,
             topic: className,
             session_type: 'offline',
             month_number: monthNumber,
             duration_hours: parseFloat(hours)
           })
           .select()
           .single();
           
         if (createError) throw createError;
         sessionId = newSession.id;
      } else {
         throw checkError;
      }

      const upsertData = students.filter(s => s.status !== null).map(student => ({
        student_id: student.id,
        session_id: sessionId,
        present: student.status === 'present',
        marked_by: userProfile?.display_name || 'Mentor'
      }));

      const { error: attendError } = await supabase
        .from('attendance')
        .upsert(upsertData, { onConflict: 'student_id, session_id' });

      if (attendError) throw attendError;
      setPhase('completion'); // Re-ensure we are in completion phase
      alert('Attendance successfully committed to database!');
    } catch (err) {
      alert('Error saving attendance: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStartOver = () => {
    setClassName('');
    setStudents(prev => prev.map(s => ({ ...s, status: null })));
    setCurrentIndex(0);
    setPhase('setup');
  };

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {phase === 'setup' && (
        <div className="flex flex-col gap-8 page-entrance">
          <div className="text-center mb-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-glow/10 border border-accent-glow/20 text-accent-glow text-[10px] font-bold uppercase tracking-widest mb-4">
               <UserCheck className="h-3.5 w-3.5" /> High-Speed Marking
             </div>
             <h1 className="text-4xl font-display font-bold text-primary tracking-tight">Mark Attendance</h1>
             <p className="text-secondary mt-2 max-w-md mx-auto">Set up your session parameters to begin the high-speed marking workflow.</p>
          </div>

          <div className="glass-card p-8 flex flex-col gap-8 bg-white/[0.02]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-3">
                <label className="block text-[10px] font-black text-tertiary mb-3 uppercase tracking-widest">Session Title / Topic</label>
                <div className="relative group">
                  <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-tertiary group-focus-within:text-accent-glow transition-colors" />
                  <input 
                    type="text" 
                    className="input-premium w-full pl-12 h-14 text-lg font-bold"
                    placeholder="e.g. Advanced React Architecture"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                  />
                </div>
              </div>
              <div className="md:col-span-1">
                <label className="block text-[10px] font-black text-tertiary mb-3 uppercase tracking-widest">Duration (Hrs)</label>
                <div className="relative group">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-tertiary group-focus-within:text-accent-glow transition-colors" />
                  <input 
                    type="number" 
                    step="0.5"
                    className="input-premium w-full pl-12 h-14 text-lg font-bold"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <label className="text-[10px] font-black text-tertiary uppercase tracking-widest flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent-glow" /> Student Roster ({students.length})
                </label>
                <button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="text-[10px] font-bold flex items-center gap-2 bg-white/5 hover:bg-white/10 text-primary px-4 py-2 rounded-xl border border-white/5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Quick Add
                </button>
              </div>

              {showAddForm && (
                <div className="mb-6 p-6 glass-card bg-accent-glow/[0.03] border-accent-glow/20 flex flex-col gap-4 animate-in zoom-in-95">
                  <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                    <Plus className="h-4 w-4 text-accent-glow" /> New Student Record
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input 
                      placeholder="Full Name" 
                      className="input-premium bg-white/5"
                      value={newStudent.name}
                      onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                    />
                    <input 
                      placeholder="USN (ID)" 
                      className="input-premium bg-white/5 font-mono"
                      value={newStudent.usn}
                      onChange={e => setNewStudent({...newStudent, usn: e.target.value})}
                    />
                    <input 
                      placeholder="Branch" 
                      className="input-premium bg-white/5"
                      value={newStudent.branch_code}
                      onChange={e => setNewStudent({...newStudent, branch_code: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end gap-3 mt-2">
                    <button onClick={() => setShowAddForm(false)} className="text-xs font-bold text-tertiary hover:text-primary transition-colors px-4 py-2">Cancel</button>
                    <button 
                      onClick={handleAddStudent} 
                      disabled={addingStudent}
                      className="btn-premium px-6 py-2 text-sm h-10 shadow-glow"
                    >
                      {addingStudent ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Record'}
                    </button>
                  </div>
                </div>
              )}

              <div className="glass-card p-0 border-white/10 h-64 bg-white/[0.02] overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                  {loadingStudents ? (
                    <div className="h-full flex flex-col items-center justify-center text-tertiary gap-3 font-bold uppercase tracking-widest text-[10px]">
                      <div className="h-8 w-8 border-4 border-accent-glow/20 border-t-accent-glow rounded-full animate-spin"></div>
                      Fetching Roster...
                    </div>
                  ) : students.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-tertiary text-sm gap-2">
                      <Users className="h-8 w-8 opacity-20" />
                      <p className="font-medium opacity-50">No students found.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
                      {students.map(s => (
                        <div key={s.id} className="flex justify-between items-center p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors group">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-primary truncate group-hover:text-accent-glow transition-colors">{s.name}</div>
                            <div className="text-[10px] text-tertiary font-bold tracking-widest uppercase mt-0.5">{s.usn}</div>
                          </div>
                          <span className="text-[10px] font-black text-tertiary px-2 py-1 bg-white/5 rounded-lg border border-white/5">{s.branch_code}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleStartMarking}
              disabled={loadingStudents || students.length === 0}
              className="btn-premium w-full py-5 text-xl h-20 shadow-glow-sm"
            >
              Start Marking Workflow <ArrowRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {phase === 'marking' && (
        <div className="flex flex-col h-[calc(100vh-160px)] animate-in slide-in-from-right-10 duration-500 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                 <Keyboard className="h-5 w-5 text-accent-glow" />
               </div>
               <div>
                 <h1 className="text-lg font-bold text-primary leading-none">{className}</h1>
                 <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest mt-1">Keyboard Mode Enabled</p>
               </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-display font-black text-accent-glow tabular-nums leading-none">
                {currentIndex + 1}<span className="text-lg text-tertiary font-normal tracking-tight"> / {students.length}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/5 h-2 rounded-full mb-12 overflow-hidden border border-white/5">
            <div 
              className="bg-gradient-to-r from-accent-glow to-accent-vibrant h-full transition-all duration-300 shadow-glow"
              style={{ width: `${((currentIndex + 1) / students.length) * 100}%` }}
            />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center relative">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent-glow/10 blur-[100px] pointer-events-none"></div>

            <div className="text-[10px] font-black text-accent-glow mb-6 uppercase tracking-[0.4em] bg-accent-glow/10 px-4 py-1.5 rounded-full border border-accent-glow/20">
              Roll No. {currentIndex + 1}
            </div>
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-display font-black text-white mb-4 tracking-tight leading-tight">
              {students[currentIndex]?.name}
            </h2>
            <div className="text-xl text-tertiary font-mono font-bold tracking-[0.2em] mb-16 opacity-60">
              {students[currentIndex]?.usn}
            </div>

            <div className="flex flex-col sm:flex-row gap-6 w-full max-w-xl px-4 relative z-10">
              <button 
                onClick={() => markStudent('present')}
                className="flex-1 bg-success text-void font-black py-8 rounded-3xl hover:brightness-110 active:scale-95 transition-all text-2xl flex flex-col items-center justify-center gap-2 shadow-[0_10px_30px_-10px_rgba(34,197,94,0.4)]"
              >
                Present 
                <span className="text-[10px] font-black bg-black/10 px-3 py-1 rounded-full border border-black/10 tracking-widest">PRESS P</span>
              </button>
              <button 
                onClick={() => markStudent('absent')}
                className="flex-1 bg-white/5 backdrop-blur-md text-primary font-black py-8 rounded-3xl border border-white/10 hover:bg-white/10 active:scale-95 transition-all text-2xl flex flex-col items-center justify-center gap-2"
              >
                Absent 
                <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full border border-white/10 tracking-widest opacity-50">PRESS A</span>
              </button>
            </div>
            
            <div className="mt-12 flex justify-center w-full">
              <button 
                onClick={undoLast}
                disabled={currentIndex === 0}
                className="text-tertiary hover:text-primary transition-all flex items-center gap-2 disabled:opacity-0 py-3 px-6 rounded-2xl bg-white/5 border border-white/5 font-bold text-xs uppercase tracking-widest"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Undo (Ctrl+Z)
              </button>
            </div>

            <div className="mt-8 text-xs font-bold uppercase tracking-widest text-tertiary h-6">
              {currentIndex > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  Last: <span className="text-primary">{students[currentIndex - 1]?.name}</span> → <span className={students[currentIndex - 1]?.status === 'present' ? 'text-success' : 'text-danger'}>{students[currentIndex - 1]?.status}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-12 mt-auto py-8 border-t border-white/5">
            <div className="text-center group">
              <div className="text-4xl font-display font-black text-success group-hover:scale-110 transition-transform">{presentCount}</div>
              <div className="text-[10px] text-tertiary font-bold uppercase tracking-[0.2em] mt-1">Present</div>
            </div>
            <div className="h-10 w-px bg-white/5"></div>
            <div className="text-center group">
              <div className="text-4xl font-display font-black text-secondary/40 group-hover:scale-110 transition-transform">{absentCount}</div>
              <div className="text-[10px] text-tertiary font-bold uppercase tracking-[0.2em] mt-1">Absent</div>
            </div>
          </div>
        </div>
      )}

      {phase === 'completion' && (
        <div className="flex flex-col gap-8 animate-in zoom-in-95 duration-500 max-w-3xl mx-auto">
          <div className="glass-card p-12 text-center bg-accent-glow/[0.02] border-accent-glow/20">
            <div className="h-20 w-20 bg-accent-glow/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow">
              <Check className="h-10 w-10 text-accent-glow" />
            </div>
            <h2 className="text-4xl font-display font-bold text-primary tracking-tight mb-2">Marking Complete</h2>
            <p className="text-secondary font-medium">{className} • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            
            <div className="flex justify-center gap-16 mt-12">
              <div className="group">
                <div className="text-6xl font-display font-black text-success tracking-tighter">{presentCount}</div>
                <div className="text-[10px] text-tertiary font-black uppercase tracking-[0.2em] mt-2">Verified Present</div>
              </div>
              <div className="group">
                <div className="text-6xl font-display font-black text-tertiary tracking-tighter opacity-40">{absentCount}</div>
                <div className="text-[10px] text-tertiary font-black uppercase tracking-[0.2em] mt-2">Recorded Absent</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-0 border-white/10 overflow-hidden flex flex-col max-h-[400px] bg-white/[0.02]">
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
              <span className="text-[10px] font-black text-tertiary uppercase tracking-widest">Final Session Roster</span>
              <span className="text-xs font-bold text-primary px-3 py-1 bg-white/5 rounded-lg border border-white/5">{students.length} Students Total</span>
            </div>
            <div className="overflow-y-auto flex-1 p-3 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {students.map((student, i) => (
                  <div key={student.id} className="flex justify-between items-center p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-[10px] font-black text-tertiary w-6">{(i + 1).toString().padStart(2, '0')}</span>
                      <div className="min-w-0">
                         <div className="font-bold text-primary truncate text-sm">{student.name}</div>
                         <div className="text-[10px] font-mono text-tertiary font-bold tracking-widest">{student.usn}</div>
                      </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                      student.status === 'present' 
                        ? 'bg-success/10 text-success border border-success/20' 
                        : 'bg-white/5 text-tertiary border border-white/10 opacity-60'
                    }`}>
                      {student.status === 'present' ? 'Present' : 'Absent'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <button 
              onClick={handleSaveAttendance}
              disabled={saving}
              className="btn-premium flex-1 h-16 text-xl shadow-glow"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
              Commit Attendance
            </button>
            <button 
              onClick={handleStartOver}
              className="btn-premium-outline flex-1 h-16 text-xl"
            >
              <RefreshCw className="w-5 h-5" /> Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
