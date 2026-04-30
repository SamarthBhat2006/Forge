import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar as CalendarIcon, Save, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function MarkAttendance() {
  const { userProfile } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { student_id: present_boolean }
  
  // Session Creation Form State (if session doesn't exist)
  const [newTopic, setNewTopic] = useState('');
  const [newType, setNewType] = useState('offline');

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Students
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      setStudents(studentsData || []);

      // 2. Fetch Session for this date
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('date', date)
        .single();
      
      setSession(sessionData || null);
      
      if (sessionData) {
        // 3. Fetch existing attendance if session exists
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('student_id, present')
          .eq('session_id', sessionData.id);
        
        const map = {};
        attendanceData?.forEach(row => {
          map[row.student_id] = row.present;
        });
        setAttendanceMap(map);
      } else {
        setAttendanceMap({});
        setNewTopic('');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!newTopic) return;
    setSaving(true);
    try {
      const monthNumber = new Date(date).getMonth() + 1;
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          date,
          topic: newTopic,
          session_type: newType,
          month_number: monthNumber,
          duration_hours: 2.0
        })
        .select()
        .single();
      
      if (error) throw error;
      setSession(data);
    } catch (err) {
      alert('Error creating session: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (studentId) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleSelectAll = (present) => {
    const newMap = {};
    students.forEach(s => {
      newMap[s.id] = present;
    });
    setAttendanceMap(newMap);
  };

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const upsertData = students.map(student => ({
        student_id: student.id,
        session_id: session.id,
        present: !!attendanceMap[student.id],
        marked_by: userProfile?.display_name || 'Mentor'
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(upsertData, { onConflict: 'student_id, session_id' });

      if (error) throw error;
      alert('Attendance saved successfully!');
    } catch (err) {
      alert('Error saving attendance: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter(v => v).length;
  const absentCount = students.length - presentCount;

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-h1 text-primary">Mark Attendance</h1>
      </div>

      {/* Date & Session Selection */}
      <div className="card bg-surface rounded-xl p-8 border border-border-subtle shadow-card flex flex-col lg:flex-row gap-8 items-start lg:items-center">
        <div className="w-full lg:w-64 shrink-0">
          <label className="block text-label text-secondary mb-2 uppercase tracking-widest">Date</label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
            <input 
              type="date" 
              className="input w-full pl-10"
              value={date}
              min="2025-08-04"
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 w-full">
          {loading ? (
            <div className="flex items-center gap-3 text-secondary">
              <Loader2 className="h-5 w-5 animate-spin" /> Fetching session...
            </div>
          ) : session ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-label text-tertiary mb-1 uppercase tracking-widest">Selected Session</div>
                <div className="text-h3 text-primary">{session.topic}</div>
                <div className="text-caption text-secondary mt-1">
                  {session.session_type.toUpperCase()} • {session.duration_hours}H
                </div>
              </div>
              <div className="pill pill-success self-start sm:self-center">Session Active</div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-label text-tertiary mb-1 uppercase tracking-widest">New Session Topic</label>
                <input 
                  className="input w-full" 
                  placeholder="Enter topic name..." 
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                />
              </div>
              <select 
                className="input w-full sm:w-32"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              >
                <option value="offline">Offline</option>
                <option value="online">Online</option>
              </select>
              <button 
                onClick={handleCreateSession}
                className="btn-secondary whitespace-nowrap h-11"
                disabled={!newTopic || saving}
              >
                Create Session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Roster Table */}
      <div className="card bg-surface rounded-xl border border-border-subtle shadow-card overflow-hidden flex flex-col h-[600px]">
        <div className="p-6 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between bg-surface-raised gap-4">
          <h3 className="text-h3 text-primary">Student Roster ({students.length})</h3>
          <div className="flex gap-3">
            <button 
              onClick={() => handleSelectAll(true)}
              className="btn-secondary text-sm h-9 px-4"
              disabled={!session || loading}
            >
              All Present
            </button>
            <button 
              onClick={() => handleSelectAll(false)}
              className="btn-secondary text-sm h-9 px-4"
              disabled={!session || loading}
            >
              All Absent
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-tertiary gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-accent-glow" />
              Loading student list...
            </div>
          ) : students.length === 0 ? (
            <div className="h-full flex items-center justify-center text-tertiary">No active students found.</div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-surface-raised z-10">
                <tr className="border-b border-border-subtle">
                  <th className="text-left py-4 px-8 text-label text-tertiary uppercase">Status</th>
                  <th className="text-left py-4 px-6 text-label text-tertiary uppercase">Student</th>
                  <th className="text-left py-4 px-6 text-label text-tertiary uppercase hidden sm:table-cell">USN</th>
                  <th className="text-right py-4 px-8 text-label text-tertiary uppercase">Branch</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr 
                    key={student.id} 
                    className="border-b border-border-subtle hover:bg-surface-raised transition-colors cursor-pointer"
                    onClick={() => handleToggle(student.id)}
                  >
                    <td className="py-4 px-8">
                      <div className={`h-6 w-6 rounded border-2 flex items-center justify-center transition-colors ${attendanceMap[student.id] ? 'bg-success border-success' : 'border-border-default bg-surface-inset'}`}>
                        {attendanceMap[student.id] && <CheckCircle2 className="h-4 w-4 text-void fill-current" />}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-body font-medium text-primary">{student.name}</div>
                    </td>
                    <td className="py-4 px-6 hidden sm:table-cell">
                      <div className="text-caption font-mono text-secondary uppercase">{student.usn}</div>
                    </td>
                    <td className="py-4 px-8 text-right">
                      <span className="text-micro px-2 py-1 bg-surface-inset border border-border-subtle rounded-md text-tertiary">
                        {student.branch_code}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-[260px] p-4 bg-canvas/95 backdrop-blur-md border-t border-border-subtle flex items-center justify-between z-30 px-6 sm:px-12 shadow-2xl">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div className="text-body font-medium text-primary">
              {presentCount} <span className="text-secondary font-normal">Present</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-danger" />
            <div className="text-body font-medium text-primary">
              {absentCount} <span className="text-secondary font-normal">Absent</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={!session || saving || loading}
          className="btn-primary flex items-center gap-2 px-10 h-12 shadow-lg shadow-accent-glow/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          Save Attendance
        </button>
      </div>
    </div>
  );
}
