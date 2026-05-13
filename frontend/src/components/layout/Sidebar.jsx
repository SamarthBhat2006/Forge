import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  BookOpen,
  Upload,
  UserCheck,
  Calendar,
  User,
  LogOut,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Sidebar({ onOpenAccount }) {
  const { userRole, userProfile } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItemClass = ({ isActive }) => {
    return `group flex items-center gap-3 px-4 h-12 rounded-xl transition-all duration-300 relative ${
      isActive 
        ? 'bg-white/10 text-white shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)] border border-white/10' 
        : 'text-secondary hover:text-primary hover:bg-white/5'
    }`;
  };

  const NavGroup = ({ label, children }) => (
    <div className="mb-8">
      <div className="text-[10px] font-bold text-tertiary mb-4 px-4 uppercase tracking-[0.2em]">{label}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );

  return (
    <div className="w-[280px] h-screen bg-black/20 backdrop-blur-2xl border-r border-white/5 flex flex-col hidden lg:flex flex-shrink-0 relative z-20">
      {/* Glow effect behind logo */}
      <div className="absolute top-0 left-0 w-full h-32 bg-accent-glow/5 blur-[80px] pointer-events-none"></div>

      {/* Header */}
      <div className="h-20 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gradient-to-tr from-accent-glow to-accent-vibrant rounded-lg flex items-center justify-center shadow-lg shadow-accent-glow/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="text-xl font-display font-bold text-primary tracking-tight">ForgeTrack</div>
        </div>
      </div>

      {/* User Card */}
      <div className="mx-4 mb-8 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-accent-glow/10 border border-accent-glow/20 flex items-center justify-center text-accent-glow font-bold">
            {userProfile?.display_name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-primary truncate">
              {userProfile?.display_name || 'User'}
            </div>
            <div className="text-[10px] font-bold text-accent-glow uppercase tracking-wider">
              {userRole || 'Member'}
            </div>
          </div>
        </div>
        {userProfile?.is_bypass && (
          <div className="text-[10px] bg-warning/10 text-warning px-2 py-1 rounded-md border border-warning/20">
            Sync Required
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 px-4 custom-scrollbar">
        {userRole === 'mentor' && (
          <>
            <NavGroup label="Main Menu">
              <NavLink to="/dashboard" className={navItemClass}>
                <LayoutDashboard className="h-5 w-5 stroke-[1.5px]" />
                <span className="font-medium">Dashboard</span>
                <div className="absolute left-0 w-1 h-6 bg-accent-glow rounded-r-full scale-y-0 group-[.active]:scale-y-100 transition-transform duration-300"></div>
              </NavLink>
            </NavGroup>

            <NavGroup label="Attendance">
              <NavLink to="/attendance" className={navItemClass}>
                <CheckSquare className="h-5 w-5 stroke-[1.5px]" />
                <span className="font-medium">Mark New</span>
              </NavLink>
              <NavLink to="/history" className={navItemClass}>
                <Users className="h-5 w-5 stroke-[1.5px]" />
                <span className="font-medium">Student Data</span>
              </NavLink>
            </NavGroup>

            <NavGroup label="Resources">
              <NavLink to="/materials" className={navItemClass}>
                <BookOpen className="h-5 w-5 stroke-[1.5px]" />
                <span className="font-medium">Library</span>
              </NavLink>
              <NavLink to="/upload" className={navItemClass}>
                <Upload className="h-5 w-5 stroke-[1.5px]" />
                <span className="font-medium">Bulk Upload</span>
              </NavLink>
            </NavGroup>
          </>
        )}

        {userRole === 'student' && (
          <>
            <NavGroup label="Personal">
              <NavLink to="/me/attendance" className={navItemClass}>
                <UserCheck className="h-5 w-5 stroke-[1.5px]" />
                <span className="font-medium">My Stats</span>
              </NavLink>
              <NavLink to="/me/upcoming" className={navItemClass}>
                <Calendar className="h-5 w-5 stroke-[1.5px]" />
                <span className="font-medium">Schedule</span>
              </NavLink>
              <NavLink to="/me/materials" className={navItemClass}>
                <BookOpen className="h-5 w-5 stroke-[1.5px]" />
                <span className="font-medium">Learning Hub</span>
              </NavLink>
            </NavGroup>
          </>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 mt-auto border-t border-white/5 bg-black/10">
        <button 
          onClick={onOpenAccount}
          className="w-full flex items-center gap-3 px-4 h-11 rounded-xl transition-all text-secondary hover:text-primary hover:bg-white/5 mb-1"
        >
          <User className="h-5 w-5 stroke-[1.5px]" />
          <span className="text-sm font-medium">Settings</span>
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 h-11 rounded-xl transition-all text-danger/70 hover:text-danger hover:bg-danger/10"
        >
          <LogOut className="h-5 w-5 stroke-[1.5px]" />
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>
    </div>
  );
}
