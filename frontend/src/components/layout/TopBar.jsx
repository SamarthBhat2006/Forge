import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, CheckCircle2, FileText, Activity, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function TopBar({ onOpenAccount }) {
  const { userProfile, userRole } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(3);
  const notifRef = useRef(null);

  const initial = userProfile?.display_name?.charAt(0) || 'U';

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      alert(`Searching for: ${searchQuery}\n\nGlobal search functionality will be fully integrated in the next phase.`);
      setSearchQuery('');
    }
  };

  const handleClearNotifs = () => {
    setUnreadCount(0);
    setIsNotifOpen(false);
  };

  return (
    <div className="h-20 px-6 md:px-10 border-b border-white/5 bg-black/10 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between shrink-0">
      
      {/* Mobile Menu Button */}
      <button className="lg:hidden text-secondary hover:text-primary mr-4">
        <Menu className="h-6 w-6" />
      </button>

      {/* Breadcrumb / Page Title Area */}
      <div className="flex-1 flex items-center">
        <div className="text-sm font-medium hidden sm:flex items-center gap-2">
          <span className="text-tertiary">Platform</span>
          <span className="text-tertiary/30">/</span>
          <span className="text-primary font-semibold tracking-tight">Overview</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6 md:gap-8">
        {/* Search Bar */}
        <div className="relative hidden md:block w-72 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary group-focus-within:text-accent-glow transition-colors" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            className="input-premium w-full pl-11 h-11 text-sm"
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="text-tertiary hover:text-primary relative p-2 rounded-xl hover:bg-white/5 transition-all focus:outline-none"
          >
            <Bell className="h-5 w-5 stroke-[1.5px]" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent-glow shadow-[0_0_10px_var(--accent-glow)]"></span>
            )}
          </button>
          
          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-80 glass-card p-0 overflow-hidden animate-in fade-in slide-in-from-top-3">
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="font-bold text-primary">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleClearNotifs} className="text-xs font-bold text-accent-glow hover:underline">
                    Clear all
                  </button>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {unreadCount > 0 ? (
                  <div className="divide-y divide-white/5">
                    {[
                      { icon: <CheckCircle2 className="text-success" />, title: 'Attendance Saved', desc: 'Session 12 markers synced.', time: '10m ago' },
                      { icon: <FileText className="text-accent-glow" />, title: 'New Material', desc: 'React Hooks Guide added.', time: '2h ago' },
                      { icon: <Activity className="text-primary" />, title: 'System Update', desc: 'ForgeTrack v1.1 is live.', time: 'Yesterday' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 hover:bg-white/5 transition-colors cursor-pointer flex gap-4">
                        <div className="p-2 bg-white/5 rounded-xl h-fit">{item.icon}</div>
                        <div>
                          <p className="text-sm text-primary font-semibold">{item.title}</p>
                          <p className="text-xs text-secondary mt-0.5">{item.desc}</p>
                          <p className="text-[10px] text-tertiary mt-2 font-bold uppercase tracking-wider">{item.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center flex flex-col items-center">
                    <Bell className="h-10 w-10 mb-3 opacity-10" />
                    <p className="text-sm text-tertiary">All caught up!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div 
          onClick={onOpenAccount}
          className="flex items-center gap-3 pl-4 border-l border-white/10 cursor-pointer group"
        >
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-primary group-hover:text-accent-glow transition-colors">{userProfile?.display_name || 'User'}</div>
            <div className="text-[10px] font-bold text-tertiary uppercase tracking-widest">{userRole}</div>
          </div>
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-primary transition-all group-hover:border-accent-glow/50 shadow-lg">
              {initial}
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-success border-2 border-void rounded-full"></div>
          </div>
          <ChevronDown className="h-4 w-4 text-tertiary group-hover:text-primary transition-all" />
        </div>
      </div>
    </div>
  );
}
