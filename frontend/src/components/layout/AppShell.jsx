import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setMobileSidebarOpen(false); }, [location.pathname]);

  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-background transition-colors duration-200">
      <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />

      <div className="flex min-w-0 grow flex-col">
        <Topbar mobileSidebarOpen={mobileSidebarOpen} onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
        <main className="grow overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
