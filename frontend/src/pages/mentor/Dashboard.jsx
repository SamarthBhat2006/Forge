import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Users, CheckCircle2, Calendar as CalendarIcon, ArrowRight, PlayCircle, Plus, FileText, Activity, X, TrendingUp, Clock, Globe } from 'lucide-react';
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

        const { count: studentsCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        const { count: sessionsCount } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true });

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

  const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
    <div 
      onClick={onClick}
      className={`glass-card p-6 flex flex-col gap-4 cursor-pointer hover:translate-y-[-4px] transition-all duration-300 group`}
    >
      <div className={`p-3 rounded-xl w-fit ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
        <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <div className="text-[10px] font-bold text-tertiary uppercase tracking-[0.2em] mb-1">{label}</div>
        <div className="text-3xl font-display font-bold text-primary tracking-tight">{value}</div>
      </div>
      <div className="flex items-center gap-1 text-[10px] font-bold text-success uppercase tracking-widest mt-auto">
        <TrendingUp className="h-3 w-3" /> +12% from last month
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-primary tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-glow to-accent-vibrant">{userProfile?.display_name?.split(' ')[0]}</span>
          </h1>
          <p className="text-secondary mt-2 font-medium">Here's what's happening with your classes today.</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
          <div className="h-10 w-10 rounded-xl bg-accent-glow/10 flex items-center justify-center text-accent-glow">
            <Clock className="h-5 w-5" />
          </div>
          <div className="pr-4">
            <div className="text-[10px] font-bold text-tertiary uppercase">Current Time</div>
            <div className="text-sm font-bold text-primary">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={CalendarIcon} 
          label="Total Sessions" 
          value={stats.totalSessions} 
          color="bg-accent-glow" 
          onClick={openSessionsModal}
        />
        <StatCard 
          icon={CheckCircle2} 
          label="Avg Attendance" 
          value={`${stats.overallAttendance}%`} 
          color="bg-success" 
        />
        <StatCard 
          icon={Users} 
          label="Active Students" 
          value={stats.activeStudents} 
          color="bg-primary" 
        />
        <StatCard 
          icon={Globe} 
          label="Course Progress" 
          value="74%" 
          color="bg-warning" 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Session Focus */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-8 border-accent-glow/20 bg-accent-glow/[0.02]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-accent-glow animate-pulse"></span>
                  <span className="text-[10px] font-bold text-accent-glow uppercase tracking-[0.2em]">Active Session</span>
                </div>
                <h2 className="text-3xl font-display font-bold text-primary tracking-tight">
                  {todaySession ? todaySession.topic : "Ready to start today's session?"}
                </h2>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs text-secondary">
                    <Clock className="h-3.5 w-3.5" /> {todaySession?.duration_hours || '2.0'} Hours
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs text-secondary">
                    <Globe className="h-3.5 w-3.5" /> {todaySession?.session_type || 'Offline'}
                  </div>
                </div>
              </div>
              
              <Link 
                to="/attendance" 
                className="btn-premium px-8 py-4 h-fit shadow-glow"
              >
                {todaySession ? 'Continue Marking' : 'Create Session'} 
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            {/* Attendance Progress bar for today */}
            {todaySession && (
              <div className="mt-10 pt-8 border-t border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Attendance Status</div>
                    <div className="text-xl font-bold text-primary mt-1">
                      {todayAttendanceStats.present} <span className="text-tertiary font-normal text-sm">/ {todayAttendanceStats.total || stats.activeStudents} marked</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Completion</div>
                    <div className="text-xl font-bold text-success mt-1">{todayCompletion}%</div>
                  </div>
                </div>
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-accent-glow to-success rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${todayCompletion}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions / Recent activity list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="glass-card p-6 border-white/5">
                <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-accent-glow" /> Quick Resources
                </h3>
                <div className="space-y-3">
                  {['Curriculum PDF', 'Student Roster', 'Attendance Guide'].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-tertiary group-hover:text-primary transition-colors" />
                        <span className="text-sm font-medium text-secondary group-hover:text-primary transition-colors">{item}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-tertiary opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  ))}
                </div>
             </div>
             <div className="glass-card p-6 border-white/5">
                <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-warning" /> Recent Uploads
                </h3>
                <div className="flex flex-col items-center justify-center py-6 text-center">
                   <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                     <Plus className="h-6 w-6 text-tertiary" />
                   </div>
                   <p className="text-xs text-tertiary font-medium">No recent uploads found.</p>
                </div>
             </div>
          </div>
        </div>

        {/* Right: Insights / Activity */}
        <div className="space-y-6">
          <div className="glass-card p-6 h-full flex flex-col">
            <h3 className="text-sm font-bold text-primary mb-6 flex items-center justify-between">
              Recent Activity
              <span className="text-[10px] text-accent-glow hover:underline cursor-pointer">View All</span>
            </h3>
            
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
              <div className="relative h-20 w-20 mb-6">
                <div className="absolute inset-0 bg-accent-glow/20 blur-2xl rounded-full"></div>
                <Activity className="relative h-20 w-20 text-accent-glow/40 stroke-[1px]" />
              </div>
              <h4 className="text-primary font-bold">Your activity feed is empty</h4>
              <p className="text-tertiary text-xs mt-2 max-w-[180px]">Mark attendance or upload materials to see updates here.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Modal */}
      {showSessionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-300 p-0 border-white/10 shadow-glow">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <h2 className="text-xl font-display font-bold text-primary flex items-center gap-3">
                <div className="p-2 bg-accent-glow/10 rounded-lg"><CalendarIcon className="h-5 w-5 text-accent-glow" /></div>
                Session Archive
              </h2>
              <button 
                onClick={() => setShowSessionsModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all text-tertiary hover:text-primary"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {loadingSessions ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="h-10 w-10 border-4 border-accent-glow/20 border-t-accent-glow rounded-full animate-spin"></div>
                  <p className="text-sm font-bold text-tertiary uppercase tracking-widest">Loading History...</p>
                </div>
              ) : sessionsList.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-tertiary text-sm font-medium">No sessions found in the archive.</div>
                </div>
              ) : (
                sessionsList.map(session => (
                  <div key={session.id} className="p-5 border border-white/5 rounded-2xl bg-white/[0.02] hover:bg-white/5 hover:border-accent-glow/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                    <div>
                      <h3 className="font-bold text-primary group-hover:text-accent-glow transition-colors">{session.topic}</h3>
                      <div className="text-xs text-secondary mt-1.5 flex items-center gap-3">
                        <span className="flex items-center gap-1.5"><CalendarIcon className="h-3 w-3" /> {new Date(session.date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5 font-bold text-accent-glow/80"><Clock className="h-3 w-3" /> {session.duration_hours}h</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold px-3 py-1 bg-white/5 rounded-lg text-tertiary uppercase tracking-widest">
                        {session.session_type}
                      </span>
                      <button className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-accent-glow hover:text-white transition-all">
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
