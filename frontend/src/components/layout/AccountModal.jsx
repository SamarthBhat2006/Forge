import { X, User, Mail, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function AccountModal({ isOpen, onClose }) {
  const { userProfile, userRole } = useAuth();

  if (!isOpen) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-void/80 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-surface border border-border-subtle shadow-glow-sm rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-surface-raised/50">
          <h3 className="text-h3 text-primary flex items-center gap-2">
            <User className="h-5 w-5 text-accent-glow" />
            Account Details
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-full text-tertiary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="h-20 w-20 rounded-full bg-surface-inset border-2 border-accent-glow flex items-center justify-center text-h2 font-display text-primary shadow-glow-sm">
              {userProfile?.display_name?.charAt(0) || 'U'}
            </div>
            <div className="text-center">
              <h4 className="text-h4 text-primary">{userProfile?.display_name || 'User'}</h4>
              <span className="text-label text-accent uppercase tracking-widest">{userRole}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-surface-inset rounded-xl border border-border-default">
              <div className="h-10 w-10 bg-void rounded-lg flex items-center justify-center text-secondary">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-tertiary uppercase font-bold tracking-tight">Email Address</div>
                <div className="text-body-sm text-primary">{userProfile?.email || 'N/A'}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-surface-inset rounded-xl border border-border-default">
              <div className="h-10 w-10 bg-void rounded-lg flex items-center justify-center text-secondary">
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-tertiary uppercase font-bold tracking-tight">Access Level</div>
                <div className="text-body-sm text-primary">{userRole === 'mentor' ? 'Administrator / Mentor' : 'Student'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-surface-inset border-t border-border-subtle flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 h-11 border border-border-default rounded-lg text-secondary hover:text-primary hover:bg-surface transition-all"
          >
            Close
          </button>
          <button 
            onClick={handleLogout}
            className="flex-1 h-11 bg-danger/10 border border-danger/20 rounded-lg text-danger hover:bg-danger/20 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
