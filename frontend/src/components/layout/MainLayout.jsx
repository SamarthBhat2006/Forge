import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function MainLayout() {
  return (
    <div className="flex h-screen w-full bg-void overflow-hidden text-primary font-body">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Cosmic Glow */}
        <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundImage: 'var(--glow-cosmic)' }}></div>
        
        <TopBar />
        
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative z-10">
          <div className="max-w-[1440px] mx-auto w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
