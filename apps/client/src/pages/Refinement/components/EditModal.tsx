import { Sparkles, X, Loader2 } from 'lucide-react';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editPrompt: string;
  setEditPrompt: (prompt: string) => void;
  isReanalyzing: boolean;
  onReanalyze: (e: React.FormEvent) => void;
}

export default function EditModal({
  isOpen, onClose, editPrompt, setEditPrompt, isReanalyzing, onReanalyze
}: EditModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2 text-indigo-600">
            <Sparkles size={22} />
            <h3 className="font-bold text-lg text-gray-900">Clarify Dish Details</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600">
          Specify what needs to be updated on this photo (e.g. &quot;Add 50g olive oil&quot;, &quot;This is skimmed milk&quot;).
        </p>

        <textarea
          value={editPrompt}
          onChange={e => setEditPrompt(e.target.value)}
          rows={4}
          placeholder="What details would you like to clarify for AI?"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          autoFocus
        />

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onReanalyze}
            disabled={isReanalyzing || !editPrompt.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center space-x-2 shadow-md disabled:opacity-50"
          >
            {isReanalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Recalculating...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Recalculate</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
