import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, CheckCircle2, FileText, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function TopBar({ onOpenAccount }) {
  const { userProfile } = useAuth();
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
    <div className="h-16 px-6 md:px-8 border-b border-border-subtle bg-canvas/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between shrink-0">
      
      {/* Mobile Menu Button */}
      <button className="md:hidden text-secondary hover:text-primary mr-4">
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb / Page Title Area */}
      <div className="flex-1 flex items-center">
        {/* We can dynamically set this based on route later, for now placeholder */}
        <div className="text-body font-medium text-primary hidden sm:block">
          <span className="text-tertiary">Overview / </span>Dashboard
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        {/* Search Bar */}
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
          <input 
            type="text" 
            placeholder="Search students, topics..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            className="w-full h-9 bg-surface-inset border border-border-default rounded-md pl-9 pr-3 text-body-sm text-primary placeholder:text-tertiary focus:outline-none focus:border-accent-glow focus:ring-1 focus:ring-accent-glow"
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="text-tertiary hover:text-primary relative p-1 focus:outline-none"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-danger border-2 border-canvas box-content"></span>
            )}
          </button>
          
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-surface border border-border-subtle rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-surface-hover/30">
                <h3 className="font-semibold text-primary">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleClearNotifs} className="text-xs text-accent hover:text-accent-glow">
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {unreadCount > 0 ? (
                  <div className="divide-y divide-border-subtle">
                    <div className="p-4 hover:bg-surface-hover transition-colors cursor-pointer flex gap-3">
                      <div className="p-1.5 bg-success/10 rounded-full h-fit"><CheckCircle2 className="h-4 w-4 text-success" /></div>
                      <div>
                        <p className="text-sm text-primary font-medium">Attendance Saved</p>
                        <p className="text-xs text-secondary mt-0.5">You successfully marked attendance for Session 12.</p>
                        <p className="text-xs text-tertiary mt-1">10 minutes ago</p>
                      </div>
                    </div>
                    <div className="p-4 hover:bg-surface-hover transition-colors cursor-pointer flex gap-3">
                      <div className="p-1.5 bg-accent/10 rounded-full h-fit"><FileText className="h-4 w-4 text-accent" /></div>
                      <div>
                        <p className="text-sm text-primary font-medium">New Material Uploaded</p>
                        <p className="text-xs text-secondary mt-0.5">"React Hooks Guide" was added to Month 4.</p>
                        <p className="text-xs text-tertiary mt-1">2 hours ago</p>
                      </div>
                    </div>
                    <div className="p-4 hover:bg-surface-hover transition-colors cursor-pointer flex gap-3">
                      <div className="p-1.5 bg-primary/10 rounded-full h-fit"><Activity className="h-4 w-4 text-primary" /></div>
                      <div>
                        <p className="text-sm text-primary font-medium">System Update</p>
                        <p className="text-xs text-secondary mt-0.5">ForgeTrack v1.0 has been deployed successfully.</p>
                        <p className="text-xs text-tertiary mt-1">Yesterday</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-tertiary flex flex-col items-center">
                    <Bell className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div 
          onClick={onOpenAccount}
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="text-right hidden sm:block">
            <div className="text-body-sm font-medium text-primary">{userProfile?.display_name || 'User'}</div>
          </div>
          <div className="h-9 w-9 rounded-full bg-surface-raised border border-border-default flex items-center justify-center text-body font-medium text-primary uppercase">
            {initial}
          </div>
        </div>
      </div>
    </div>
  );
}
