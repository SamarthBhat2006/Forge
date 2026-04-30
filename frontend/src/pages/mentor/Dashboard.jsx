import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Users, CheckCircle2, Clock, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { userProfile } = useAuth();
  
  // We would fetch these from Supabase
  const [stats, setStats] = useState({
    totalSessions: 0,
    overallAttendance: 0,
    activeStudents: 0,
    lastSession: '-'
  });

  const [todaySession, setTodaySession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder fetching logic
    // In a real implementation, we fetch today's session, total counts, etc.
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
        
        // Mock stats for now
        setStats({
          totalSessions: 12,
          overallAttendance: 84,
          activeStudents: 25,
          lastSession: 'Yesterday'
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <div>
        <h1 className="text-display-hero text-primary tracking-tight">
          Welcome Back, {userProfile?.display_name?.split(' ')[0]}
        </h1>
        <p className="text-body-sm text-secondary mt-2">
          Last login: Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Ticker Strip */}
      <div className="flex flex-nowrap items-center gap-6 overflow-x-auto pb-2">
        <div className="flex items-center gap-3 shrink-0">
          <CalendarIcon className="h-4 w-4 text-tertiary" />
          <div className="text-caption text-tertiary uppercase tracking-widest">Total Sessions</div>
          <div className="text-body-lg font-semibold text-primary font-variant-numeric">{stats.totalSessions}</div>
        </div>
        <div className="w-px h-4 bg-border-subtle shrink-0"></div>
        <div className="flex items-center gap-3 shrink-0">
          <CheckCircle2 className="h-4 w-4 text-tertiary" />
          <div className="text-caption text-tertiary uppercase tracking-widest">Overall Attendance</div>
          <div className="text-body-lg font-semibold text-primary font-variant-numeric">{stats.overallAttendance}%</div>
        </div>
        <div className="w-px h-4 bg-border-subtle shrink-0"></div>
        <div className="flex items-center gap-3 shrink-0">
          <Users className="h-4 w-4 text-tertiary" />
          <div className="text-caption text-tertiary uppercase tracking-widest">Active Students</div>
          <div className="text-body-lg font-semibold text-primary font-variant-numeric">{stats.activeStudents}</div>
        </div>
        <div className="w-px h-4 bg-border-subtle shrink-0"></div>
        <div className="flex items-center gap-3 shrink-0">
          <Clock className="h-4 w-4 text-tertiary" />
          <div className="text-caption text-tertiary uppercase tracking-widest">Last Session</div>
          <div className="text-body-lg font-semibold text-primary font-variant-numeric">{stats.lastSession}</div>
        </div>
      </div>

      {/* Hero Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today's Session Card */}
        <div className="card bg-surface rounded-2xl p-10 shadow-card relative overflow-hidden group border border-border-subtle">
          <div className="absolute inset-0 bg-[var(--card-gradient)] pointer-events-none"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="text-label text-tertiary mb-2 uppercase tracking-widest flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent-glow"></span>
                TODAY'S SESSION
              </div>
              <h2 className="text-display-sm text-primary leading-tight mt-4">
                {todaySession ? todaySession.topic : "No Session Scheduled"}
              </h2>
              {todaySession && (
                <div className="flex gap-3 mt-4">
                  <span className="pill pill-info bg-surface-inset border-border-default text-secondary">
                    {todaySession.session_type === 'online' ? 'Online' : 'Offline'}
                  </span>
                  <span className="pill pill-info bg-surface-inset border-border-default text-secondary">
                    {todaySession.duration_hours} Hours
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-8">
              {todaySession ? (
                <Link to="/attendance" className="btn-primary inline-flex items-center gap-2">
                  Mark Attendance <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link to="/attendance" className="btn-secondary inline-flex items-center gap-2">
                  Create Session
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Today's Attendance Card */}
        <div className="card bg-surface rounded-2xl p-10 shadow-card relative overflow-hidden border border-border-subtle">
          <div className="absolute inset-0 bg-[var(--card-gradient)] pointer-events-none"></div>
          <div className="relative z-10">
            <div className="text-label text-tertiary mb-2 uppercase tracking-widest">TODAY'S ATTENDANCE</div>
            
            <div className="flex items-end gap-4 mt-4">
              <div className="text-display-md text-primary tabular-nums">0 / 25</div>
              <div className="text-body text-secondary mb-2">Present</div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-surface-inset rounded-full mt-6 overflow-hidden border border-border-subtle">
              <div className="h-full bg-success rounded-full" style={{ width: '0%' }}></div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-surface-inset border border-border-subtle flex items-center justify-center">
              <span className="text-body-sm text-tertiary">Attendance not yet marked for today</span>
            </div>
          </div>
        </div>

      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-surface rounded-xl p-8 shadow-card border border-border-subtle">
          <h3 className="text-h3 text-primary mb-6">Program Overview</h3>
          <div className="text-body text-secondary">Aggregate stats will appear here.</div>
        </div>
        
        <div className="card bg-surface rounded-xl p-8 shadow-card border border-border-subtle">
          <h3 className="text-h3 text-primary mb-6">Recent Activity</h3>
          <div className="text-body text-secondary">Activity feed will appear here.</div>
        </div>
      </div>

    </div>
  );
}
