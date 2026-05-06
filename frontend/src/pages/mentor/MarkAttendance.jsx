import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Copy, RefreshCw, Check, X, RotateCcw, Loader2, Plus, Save } from 'lucide-react';
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
      alert('Attendance saved successfully to database!');
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
    <div className="max-w-3xl mx-auto p-4 sm:p-6 w-full pb-24 font-sans text-gray-900">
      {phase === 'setup' && (
        <div className="flex flex-col gap-6 animate-in fade-in zoom-in duration-300">
          <h1 className="text-3xl font-bold tracking-tight text-white">Mark Attendance</h1>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 flex flex-col gap-5">
            <div className="flex gap-4 flex-col sm:flex-row">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-300 mb-2">Class Name / Topic</label>
                <input 
                  type="text" 
                  className="w-full border border-[#444] rounded p-3 text-base outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors bg-[#0a0a0a] text-white"
                  placeholder="e.g. AI Class 2026"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-32">
                <label className="block text-sm font-semibold text-gray-300 mb-2">Hours</label>
                <input 
                  type="number" 
                  step="0.5"
                  className="w-full border border-[#444] rounded p-3 text-base outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors bg-[#0a0a0a] text-white"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-300">Student List ({students.length})</label>
                <button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="text-xs flex items-center gap-1 bg-[#333] hover:bg-[#444] text-white px-3 py-1.5 rounded transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Student
                </button>
              </div>

              {showAddForm && (
                <div className="mb-4 p-4 border border-[#444] rounded bg-[#222] flex flex-col gap-3">
                  <h4 className="text-sm font-bold text-white">New Student</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      placeholder="Name" 
                      className="flex-1 border border-[#555] rounded p-2 text-sm bg-[#0a0a0a] text-white"
                      value={newStudent.name}
                      onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                    />
                    <input 
                      placeholder="USN" 
                      className="w-full sm:w-32 border border-[#555] rounded p-2 text-sm bg-[#0a0a0a] text-white"
                      value={newStudent.usn}
                      onChange={e => setNewStudent({...newStudent, usn: e.target.value})}
                    />
                    <input 
                      placeholder="Branch" 
                      className="w-full sm:w-24 border border-[#555] rounded p-2 text-sm bg-[#0a0a0a] text-white"
                      value={newStudent.branch_code}
                      onChange={e => setNewStudent({...newStudent, branch_code: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setShowAddForm(false)} className="text-xs text-gray-400 hover:text-white px-3 py-1">Cancel</button>
                    <button 
                      onClick={handleAddStudent} 
                      disabled={addingStudent}
                      className="text-xs bg-white text-black font-bold px-4 py-1.5 rounded flex items-center gap-1 disabled:opacity-50"
                    >
                      {addingStudent ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                    </button>
                  </div>
                </div>
              )}

              <div className="w-full border border-[#444] rounded h-48 bg-[#0a0a0a] overflow-y-auto p-2">
                {loadingStudents ? (
                  <div className="h-full flex items-center justify-center text-gray-500 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Loading students...
                  </div>
                ) : students.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                    No students found. Add one above.
                  </div>
                ) : (
                  students.map(s => (
                    <div key={s.id} className="flex justify-between items-center py-2 px-3 border-b border-[#222] last:border-0 hover:bg-[#1a1a1a]">
                      <span className="text-sm text-white">{s.name}</span>
                      <span className="text-xs text-gray-500 font-mono">{s.usn} • {s.branch_code}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <button 
              onClick={handleStartMarking}
              disabled={loadingStudents || students.length === 0}
              className="mt-2 w-full bg-white text-black font-semibold rounded p-4 hover:bg-gray-200 transition-colors text-lg disabled:opacity-50"
            >
              Start Marking
            </button>
          </div>
        </div>
      )}

      {phase === 'marking' && (
        <div className="flex flex-col h-[calc(100vh-120px)] animate-in slide-in-from-right-8 duration-300">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-semibold text-gray-300">{className}</h1>
            <div className="text-sm font-medium text-gray-400">
              {currentIndex + 1} / {students.length}
            </div>
          </div>

          <div className="w-full bg-[#333] h-2 rounded-full mb-8 overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-300"
              style={{ width: `${(currentIndex / students.length) * 100}%` }}
            />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="text-gray-400 font-medium text-sm mb-4 uppercase tracking-wider">
              Roll No. {currentIndex + 1}
            </div>
            <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-2 max-w-full truncate px-4">
              {students[currentIndex]?.name}
            </div>
            <div className="text-lg text-gray-500 font-mono mb-10">
              {students[currentIndex]?.usn}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md px-4">
              <button 
                onClick={() => markStudent('present')}
                className="flex-1 bg-green-600 text-white font-bold py-6 rounded-lg hover:bg-green-500 active:bg-green-700 transition-colors text-xl flex items-center justify-center gap-2"
              >
                Present <span className="opacity-75 text-sm font-normal bg-black/20 px-2 py-0.5 rounded">(P)</span>
              </button>
              <button 
                onClick={() => markStudent('absent')}
                className="flex-1 bg-red-600 text-white font-bold py-6 rounded-lg hover:bg-red-500 active:bg-red-700 transition-colors text-xl flex items-center justify-center gap-2"
              >
                Absent <span className="opacity-75 text-sm font-normal bg-black/20 px-2 py-0.5 rounded">(A)</span>
              </button>
            </div>
            
            <div className="mt-8 flex justify-center w-full">
              <button 
                onClick={undoLast}
                disabled={currentIndex === 0}
                className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-30 disabled:hover:text-gray-400 py-2 px-4 rounded"
              >
                <RotateCcw className="w-4 h-4" /> Undo last (Ctrl+Z)
              </button>
            </div>

            <div className="mt-6 text-sm text-gray-400 min-h-[20px]">
              {currentIndex > 0 ? (
                <span>
                  Last: <strong className="text-white">{students[currentIndex - 1]?.name}</strong> marked as{' '}
                  <span className={students[currentIndex - 1]?.status === 'present' ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                    {students[currentIndex - 1]?.status}
                  </span>
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 mt-auto py-4 border-t border-[#333]">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{presentCount}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Present</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{absentCount}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Absent</div>
            </div>
          </div>
        </div>
      )}

      {phase === 'completion' && (
        <div className="flex flex-col gap-6 animate-in zoom-in-95 duration-300">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Attendance Complete</h2>
            <p className="text-gray-400">{className} • {new Date().toLocaleDateString()}</p>
            
            <div className="flex justify-center gap-12 mt-8">
              <div>
                <div className="text-4xl font-black text-green-500">{presentCount}</div>
                <div className="text-sm text-gray-400 mt-1 uppercase tracking-wide">Present</div>
              </div>
              <div>
                <div className="text-4xl font-black text-red-500">{absentCount}</div>
                <div className="text-sm text-gray-400 mt-1 uppercase tracking-wide">Absent</div>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden flex flex-col max-h-[400px]">
            <div className="p-4 border-b border-[#333] bg-[#0a0a0a] flex justify-between items-center">
              <span className="font-semibold text-gray-300">Student List</span>
              <span className="text-sm text-gray-400">{students.length} total</span>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {students.map((student, i) => (
                <div key={student.id} className="flex justify-between items-center p-3 border-b border-[#222] last:border-0 hover:bg-[#2a2a2a]">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-6">{i + 1}</span>
                    <span className="font-medium text-white">{student.name}</span>
                    <span className="text-xs text-gray-500 font-mono hidden sm:inline">{student.usn}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    student.status === 'present' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {student.status === 'present' ? 'Present' : 'Absent'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleSaveAttendance}
              disabled={saving}
              className="flex-1 bg-white text-black font-semibold rounded py-4 flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Attendance
            </button>
            <button 
              onClick={handleStartOver}
              className="flex-1 bg-[#222] text-white font-semibold rounded py-4 flex items-center justify-center gap-2 hover:bg-[#333] transition-colors border border-[#444]"
            >
              <RefreshCw className="w-5 h-5" /> Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
