import { useState } from 'react';
import { KeyRound } from 'lucide-react';

interface TokenGateProps {
  onAuthenticated: () => void;
}

export default function TokenGate({ onAuthenticated }: TokenGateProps) {
  const [token, setToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    localStorage.setItem('jwt_token', token.trim());
    onAuthenticated();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-100 rounded-full p-4">
            <KeyRound size={36} className="text-indigo-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Welcome to CCounter</h1>
        <p className="text-gray-500 text-center text-sm mb-8">
          Paste your JWT token to access the app
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Paste JWT token here..."
            rows={4}
            className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-sm"
          />
          <button
            type="submit"
            disabled={!token.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl p-4 font-bold text-base shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}
