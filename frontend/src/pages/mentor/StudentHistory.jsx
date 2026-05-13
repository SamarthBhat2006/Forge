import { useState, useEffect } from 'react';
import { Search, Users, AlertCircle, ArrowRight, Loader2, Sparkles, Filter, MoreHorizontal, Download, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

export default function StudentHistory() {
  const [students, setStudents] = useState([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { count, error: countError } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true });
        
      if (countError) throw countError;
      setTotalSessions(count || 0);

      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id, name, usn, branch_code,
          attendance(present)
        `)
        .eq('is_active', true)
        .order('name');

      if (studentsError) throw studentsError;

      const studentsWithStats = studentsData.map(student => {
        const presentCount = student.attendance?.filter(a => a.present).length || 0;
        const percentage = count > 0 ? Math.round((presentCount / count) * 100) : 0;
        
        return {
          ...student,
          presentCount,
          percentage
        };
      });

      setStudents(studentsWithStats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.usn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.branch_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPercentageColor = (percentage) => {
    if (percentage >= 75) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-danger';
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 75) return 'bg-success shadow-[0_0_10px_rgba(34,197,94,0.3)]';
    if (percentage >= 60) return 'bg-warning shadow-[0_0_10px_rgba(234,179,8,0.3)]';
    return 'bg-danger shadow-[0_0_10px_rgba(239,68,68,0.3)]';
  };

  return (
    <div className="flex flex-col gap-8 pb-20 page-entrance">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-glow/10 border border-accent-glow/20 text-accent-glow text-[10px] font-bold uppercase tracking-widest mb-4">
             <TrendingUp className="h-3.5 w-3.5" /> Performance Analytics
           </div>
          <h1 className="text-4xl font-display font-bold text-primary tracking-tight">Student History</h1>
          <p className="text-secondary mt-2 font-medium">Deep insights into attendance trends across {totalSessions} total sessions.</p>
        </div>
        
        <div className="flex items-center gap-3">
            <button className="btn-premium-outline h-12 px-6 flex items-center gap-2 text-sm">
                <Download className="h-4 w-4" /> Export Report
            </button>
            <Link to="/attendance" className="btn-premium text-sm h-12 px-6 shadow-glow">
              Mark New Attendance <ArrowRight className="h-4 w-4" />
            </Link>
        </div>
      </div>

      {error && (
        <div className="glass-card border-danger/30 bg-danger/5 p-5 text-danger flex items-center gap-4 animate-in slide-in-from-top-4">
          <AlertCircle className="h-6 w-6" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {/* Roster Table Card */}
      <div className="glass-card flex flex-col h-[750px] p-0 overflow-hidden bg-white/[0.01]">
        {/* Header & Search */}
        <div className="p-8 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent-glow/10 rounded-2xl text-accent-glow shadow-glow-sm">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-primary">Student Roster</h3>
              <p className="text-[10px] text-tertiary mt-1 font-black uppercase tracking-widest">{filteredStudents.length} active records found</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative w-full lg:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary group-focus-within:text-accent-glow transition-colors" />
                <input 
                type="text" 
                className="input-premium w-full pl-11 h-12 text-sm bg-white/[0.03]"
                placeholder="Search by name, USN, branch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button className="p-3 bg-white/5 border border-white/5 rounded-xl text-tertiary hover:text-primary transition-all">
                <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Table Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-tertiary gap-4">
              <div className="h-12 w-12 border-4 border-accent-glow/20 border-t-accent-glow rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Aggregating Intelligence...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-tertiary gap-4 py-20">
              <Users className="h-16 w-16 opacity-10" />
              <p className="font-bold text-sm">No active students found in the database.</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-tertiary gap-4 py-20">
              <Search className="h-16 w-16 opacity-10" />
              <p className="font-bold text-sm">No students match your query.</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-20 shadow-md">
                <tr className="bg-[#0f0f18] border-b border-white/5">
                  <th className="text-left py-5 px-8 text-[10px] font-black text-tertiary uppercase tracking-widest">Student Profile</th>
                  <th className="text-left py-5 px-8 text-[10px] font-black text-tertiary uppercase tracking-widest hidden sm:table-cell">Branch Unit</th>
                  <th className="text-left py-5 px-8 text-[10px] font-black text-tertiary uppercase tracking-widest">Attendance Performance</th>
                  <th className="text-right py-5 px-8 text-[10px] font-black text-tertiary uppercase tracking-widest">Options</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-white/[0.02] transition-all group">
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-sm font-bold text-primary group-hover:border-accent-glow/30 transition-all">
                            {student.name.charAt(0)}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-primary group-hover:text-accent-glow transition-colors">{student.name}</div>
                            <div className="text-[10px] font-mono text-tertiary mt-1 font-bold tracking-widest">{student.usn}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-8 hidden sm:table-cell">
                      <span className="text-[10px] font-black px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-tertiary uppercase tracking-widest">
                        {student.branch_code}
                      </span>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-6 max-w-[280px]">
                        <div className={`text-xl font-display font-black w-14 text-right tabular-nums ${getPercentageColor(student.percentage)}`}>
                          {student.percentage}%
                        </div>
                        <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressBarColor(student.percentage)}`}
                            style={{ width: `${student.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-tertiary mt-2 pl-[80px] uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="h-3 w-3" /> {student.presentCount} / {totalSessions} total sessions
                      </div>
                    </td>
                    <td className="py-6 px-8 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link 
                            to="/attendance" 
                            className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-tertiary hover:text-accent-glow hover:bg-accent-glow/10 transition-all"
                        >
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                        <button className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-tertiary hover:text-primary transition-all">
                            <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Footer info */}
        <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success"></div>
                <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Optimal (&gt;75%)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-warning"></div>
                <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Caution (&gt;60%)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-danger"></div>
                <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Critical (&lt;60%)</span>
            </div>
        </div>
      </div>
    </div>
  );
}
