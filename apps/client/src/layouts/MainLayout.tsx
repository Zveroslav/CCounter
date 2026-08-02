import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, User, Camera } from 'lucide-react';
import { useRef } from 'react';

export default function MainLayout() {
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCaptureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Handle file upload and redirect to refinement screen
      console.log('File captured:', file);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden relative">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 px-6 py-2 pb-safe flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
        <Link 
          to="/" 
          className={`flex flex-col items-center p-2 transition-colors ${location.pathname === '/' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Home size={24} />
          <span className="text-xs font-medium mt-1">Dashboard</span>
        </Link>

        {/* Floating Capture Button (Center) */}
        <div className="relative -top-6">
          <button 
            onClick={handleCaptureClick}
            className="bg-indigo-600 text-white rounded-full p-4 shadow-lg active:scale-95 transition-transform hover:bg-indigo-700 ring-4 ring-white"
          >
            <Camera size={32} />
          </button>
          
          {/* Hidden File Input for Camera */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <Link 
          to="/profile" 
          className={`flex flex-col items-center p-2 transition-colors ${location.pathname === '/profile' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <User size={24} />
          <span className="text-xs font-medium mt-1">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
