import { Search, Bell, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function TopBar() {
  const { userProfile } = useAuth();
  
  const initial = userProfile?.display_name?.charAt(0) || 'U';

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
            className="w-full h-9 bg-surface-inset border border-border-default rounded-md pl-9 pr-3 text-body-sm text-primary placeholder:text-tertiary focus:outline-none focus:border-accent-glow focus:ring-1 focus:ring-accent-glow"
          />
        </div>

        {/* Notifications */}
        <button className="text-tertiary hover:text-primary relative">
          <Bell className="h-5 w-5" />
          {/* Unread badge dot */}
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-danger"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-body-sm font-medium text-primary">{userProfile?.display_name || 'User'}</div>
          </div>
          <div className="h-9 w-9 rounded-full bg-surface-raised border border-border-default flex items-center justify-center text-body font-medium text-primary">
            {initial}
          </div>
        </div>
      </div>
    </div>
  );
}
