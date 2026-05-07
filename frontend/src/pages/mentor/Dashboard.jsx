import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Users, CheckCircle2, Calendar as CalendarIcon, ArrowRight, PlayCircle, Plus, FileText, Activity, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { userProfile } = useAuth();
  
  const [stats, setStats] = useState({
    totalSessions: 0,
    overallAttendance: 0,
    activeStudents: 0,
    lastSession: '-'
  });

  const [todaySession, setTodaySession] = useState(null);
  const [todayAttendanceStats, setTodayAttendanceStats] = useState({ present: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [sessionsList, setSessionsList] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data: session } = await supabase
          .from('sessions')
          .select('*')
          .eq('date', today)
          .single();

        setTodaySession(session || null);

        // Fetch active students count
        const { count: studentsCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        // Fetch total sessions count
        const { count: sessionsCount } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true });

        // Fetch overall attendance to calculate %
        const { data: allAttendance } = await supabase
          .from('attendance')
          .select('present');
          
        let overallPercent = 0;
        if (allAttendance && allAttendance.length > 0) {
           const totalP = allAttendance.filter(a => a.present).length;
           overallPercent = Math.round((totalP / allAttendance.length) * 100);
        }

        if (session) {
          const { data: todayAtt } = await supabase
            .from('attendance')
            .select('present')
            .eq('session_id', session.id);
          
          if (todayAtt && todayAtt.length > 0) {
            setTodayAttendanceStats({
              present: todayAtt.filter(a => a.present).length,
              total: studentsCount || 0
            });
          }
        }

        setStats({
          totalSessions: sessionsCount || 0,
          overallAttendance: overallPercent,
          activeStudents: studentsCount || 0,
          lastSession: session ? 'Today' : 'Past' 
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const openSessionsModal = async () => {
    setShowSessionsModal(true);
    setLoadingSessions(true);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      setSessionsList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const todayCompletion = todayAttendanceStats.total > 0 
    ? Math.round((todayAttendanceStats.present / todayAttendanceStats.total) * 100) 
    : 0;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Hero */}
      <div>
        <h1 className="text-h2 text-primary tracking-tight">
          Welcome Back, {userProfile?.display_name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-secondary mt-1">
          Last login: Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Ticker Strip - More Compact */}
      <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 lg:gap-6 bg-surface p-4 rounded-xl border border-border-subtle shadow-sm">
        <div 
          onClick={openSessionsModal}
          className="flex items-center gap-3 shrink-0 cursor-pointer hover:bg-surface-hover p-2 rounded transition-colors"
        >
          <div className="p-2 bg-primary/10 rounded-lg"><CalendarIcon className="h-4 w-4 text-primary" /></div>
          <div>
            <div className="text-xs text-tertiary uppercase tracking-wider font-semibold hover:text-primary transition-colors">Total Sessions</div>
            <div className="text-lg font-bold text-primary">{stats.totalSessions}</div>
          </div>
        </div>
        <div className="hidden lg:block w-px h-8 bg-border-subtle shrink-0"></div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2 bg-success/10 rounded-lg"><CheckCircle2 className="h-4 w-4 text-success" /></div>
          <div>
            <div className="text-xs text-tertiary uppercase tracking-wider font-semibold">Overall Attendance</div>
            <div className="text-lg font-bold text-primary">{stats.overallAttendance}%</div>
          </div>
        </div>
        <div className="hidden lg:block w-px h-8 bg-border-subtle shrink-0"></div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2 bg-accent/10 rounded-lg"><Users className="h-4 w-4 text-accent" /></div>
          <div>
            <div className="text-xs text-tertiary uppercase tracking-wider font-semibold">Active Students</div>
            <div className="text-lg font-bold text-primary">{stats.activeStudents}</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Today's Overview (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="card bg-surface rounded-xl p-6 shadow-sm border border-border-subtle flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
            <div>
              <div className="text-xs text-tertiary mb-1 uppercase tracking-wider font-semibold flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-glow"></span>
                TODAY'S SESSION
              </div>
              <h2 className="text-h3 text-primary mt-1">
                {todaySession ? todaySession.topic : "No Session Scheduled"}
              </h2>
              {todaySession && (
                <div className="flex gap-2 mt-2">
                  <span className="text-xs font-medium px-2 py-1 bg-surface-hover rounded text-secondary">
                    {todaySession.session_type === 'online' ? 'Online' : 'Offline'}
                  </span>
                  <span className="text-xs font-medium px-2 py-1 bg-surface-hover rounded text-secondary">
                    {todaySession.duration_hours} Hours
                  </span>
                </div>
              )}
            </div>
            
            <div>
              {todaySession ? (
                <Link to="/attendance" className="btn-primary text-sm h-10 px-4 inline-flex items-center gap-2">
                  Mark Attendance <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link to="/attendance" className="btn-secondary text-sm h-10 px-4 inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Create Session
                </Link>
              )}
            </div>
          </div>

          <div className="card bg-surface rounded-xl p-6 shadow-sm border border-border-subtle">
            <div className="text-xs text-tertiary mb-4 uppercase tracking-wider font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-tertiary" />
              TODAY'S ATTENDANCE
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <div className="text-h2 text-primary tabular-nums">{todayAttendanceStats.present}<span className="text-h4 text-tertiary font-normal"> / {todayAttendanceStats.total || stats.activeStudents}</span></div>
                <div className="text-sm text-secondary">Present</div>
              </div>
              
              <div className="w-full sm:w-1/2">
                <div className="flex justify-between text-xs text-secondary mb-1">
                  <span>Completion</span>
                  <span>{todayCompletion}%</span>
                </div>
                <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden border border-border-subtle">
                  <div className="h-full bg-success rounded-full transition-all duration-500" style={{ width: `${todayCompletion}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Activity List */}
        <div className="lg:col-span-1 card bg-surface rounded-xl p-6 shadow-sm border border-border-subtle">
          <div className="text-xs text-tertiary mb-4 uppercase tracking-wider font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-tertiary" />
            RECENT ACTIVITY
          </div>
          
          <ul className="space-y-4">
            <li className="text-center py-8 text-tertiary text-sm">
              No recent activity yet.
            </li>
          </ul>
        </div>
      </div>

      {/* Sessions Modal */}
      {showSessionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border-subtle rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border-subtle">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" /> 
                All Sessions
              </h2>
              <button 
                onClick={() => setShowSessionsModal(false)}
                className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-tertiary hover:text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {loadingSessions ? (
                <div className="flex items-center justify-center py-12 text-secondary">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : sessionsList.length === 0 ? (
                <div className="text-center py-12 text-tertiary">
                  No sessions found. Mark attendance to create one!
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {sessionsList.map(session => (
                    <div key={session.id} className="p-4 border border-border-subtle rounded-lg hover:border-primary/50 hover:bg-surface-hover transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-primary">{session.topic}</h3>
                        <p className="text-sm text-secondary mt-1 flex items-center gap-2">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(session.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs font-medium px-2.5 py-1 bg-surface-inset border border-border-subtle rounded text-secondary">
                          {session.duration_hours}h
                        </span>
                        <span className="text-xs font-medium px-2.5 py-1 bg-surface-inset border border-border-subtle rounded text-secondary uppercase">
                          {session.session_type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
