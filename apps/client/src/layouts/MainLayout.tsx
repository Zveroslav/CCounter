import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, Camera, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { recognizeMeal } from '../api/meals';

interface MainLayoutProps {
  onLogout: () => void;
}

export default function MainLayout({ onLogout: _onLogout }: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleCaptureClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await recognizeMeal(file);
      // Navigate to refinement view
      navigate(`/refinement/${res.jobId}`);
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
            disabled={isUploading}
            className="bg-indigo-600 text-white rounded-full p-4 shadow-lg active:scale-95 transition-transform hover:bg-indigo-700 ring-4 ring-white disabled:opacity-75 disabled:active:scale-100"
          >
            {isUploading ? <Loader2 size={32} className="animate-spin" /> : <Camera size={32} />}
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
