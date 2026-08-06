import { AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ErrorView({ error }: { error: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] w-full p-6 text-center">
      <AlertTriangle size={48} className="text-red-500 mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">Analysis Failed</h2>
      <p className="text-gray-600 mb-6">{error}</p>
      <button 
        onClick={() => navigate('/')}
        className="bg-gray-900 text-white px-6 py-2 rounded-full font-medium"
      >
        Go Back
      </button>
    </div>
  );
}

export function LoadingView() {
  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] w-full p-6 text-center">
      <Loader2 size={48} className="text-indigo-600 animate-spin mb-6" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Food</h2>
      <p className="text-gray-500">Our AI is determining the macros for your meal...</p>
    </div>
  );
}
