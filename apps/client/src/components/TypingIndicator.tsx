import { Loader2 } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center space-x-2">
        <Loader2 size={16} className="animate-spin text-indigo-600" />
        <span className="text-sm text-gray-500">Thinking...</span>
      </div>
    </div>
  );
}
