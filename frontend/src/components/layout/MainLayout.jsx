import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import AccountModal from './AccountModal';

export default function MainLayout() {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen w-full bg-void overflow-hidden text-primary font-body selection:bg-accent-glow/30 selection:text-white">
      {/* Dynamic Cosmic Background */}
      <div className="cosmic-mesh"></div>
      <div className="cosmic-stars"></div>
      
      <Sidebar onOpenAccount={() => setIsAccountOpen(true)} />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        <TopBar onOpenAccount={() => setIsAccountOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 custom-scrollbar">
          <div className="max-w-[1440px] mx-auto w-full">
            <div key={location.pathname} className="page-entrance">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      <AccountModal 
        isOpen={isAccountOpen} 
        onClose={() => setIsAccountOpen(false)} 
      />
    </div>
  );
}
