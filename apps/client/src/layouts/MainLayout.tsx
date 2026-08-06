import { Outlet } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

interface MainLayoutProps {
  onLogout: () => void;
}

export default function MainLayout({ onLogout: _onLogout }: MainLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden relative">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
