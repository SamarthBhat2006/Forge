import { useState, useEffect } from 'react';
import { Search, Users, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
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

      // 1. Get total number of sessions
      const { count, error: countError } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true });
        
      if (countError) throw countError;
      setTotalSessions(count || 0);

      // 2. Get all students and their attendance
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id, name, usn, branch_code,
          attendance(present)
        `)
        .eq('is_active', true)
        .order('name');

      if (studentsError) throw studentsError;

      // Calculate percentage for each student
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
    if (percentage >= 75) return 'text-success bg-success/10 border-success/20';
    if (percentage >= 60) return 'text-warning bg-warning/10 border-warning/20';
    return 'text-danger bg-danger/10 border-danger/20';
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 75) return 'bg-success';
    if (percentage >= 60) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h2 text-primary tracking-tight">Student History</h1>
          <p className="text-sm text-secondary mt-1">View attendance reports for all students across {totalSessions} total sessions.</p>
        </div>
        
        <Link to="/attendance" className="btn-primary text-sm h-10 px-4 inline-flex items-center gap-2">
          Mark Attendance <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Roster Table Card */}
      <div className="card bg-surface rounded-xl border border-border-subtle shadow-sm overflow-hidden flex flex-col h-[700px]">
        {/* Header & Search */}
        <div className="p-4 sm:p-6 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between bg-surface gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-h3 text-primary">All Students</h3>
              <p className="text-xs text-secondary mt-0.5">{filteredStudents.length} active students</p>
            </div>
          </div>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
            <input 
              type="text" 
              className="input w-full pl-9 h-10 text-sm bg-surface-hover border-transparent focus:border-border-default focus:bg-surface"
              placeholder="Search by name, USN, branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Table Content */}
        <div className="flex-1 overflow-y-auto bg-surface-inset/30">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-tertiary gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-accent-glow" />
              <p className="text-sm">Loading attendance data...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-tertiary gap-2">
              <Users className="h-8 w-8 opacity-50" />
              <p>No active students found in the database.</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-tertiary gap-2">
              <Search className="h-8 w-8 opacity-50" />
              <p>No students match your search.</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-surface z-10 shadow-sm">
                <tr className="border-b border-border-subtle">
                  <th className="text-left py-3 px-6 text-xs font-semibold text-tertiary uppercase tracking-wider">Student</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-tertiary uppercase tracking-wider hidden sm:table-cell">Branch</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-tertiary uppercase tracking-wider">Attendance</th>
                  <th className="text-right py-3 px-6 text-xs font-semibold text-tertiary uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-surface transition-colors">
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium text-primary">{student.name}</div>
                      <div className="text-xs font-mono text-tertiary mt-1">{student.usn}</div>
                    </td>
                    <td className="py-4 px-6 hidden sm:table-cell">
                      <span className="text-xs px-2.5 py-1 bg-surface-hover border border-border-subtle rounded-md text-secondary font-medium">
                        {student.branch_code}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4 max-w-[200px]">
                        <div className={`text-sm font-bold w-12 text-right ${getPercentageColor(student.percentage).split(' ')[0]}`}>
                          {student.percentage}%
                        </div>
                        <div className="flex-1 h-2 bg-surface-hover rounded-full overflow-hidden border border-border-subtle">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(student.percentage)}`}
                            style={{ width: `${student.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-tertiary mt-1.5 pl-[64px]">
                        {student.presentCount} / {totalSessions} sessions
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link 
                        to="/attendance" 
                        className="btn-secondary text-xs h-8 px-3 inline-flex items-center"
                      >
                        Mark
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
