import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Save, AlertTriangle, Edit3, X, Sparkles } from 'lucide-react';
import { getJobStatus, updateMeal, deleteMeal, reanalyzeMeal, type JobStatusResponse } from '../api/meals';

export default function RefinementView() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Edit / Re-analyze modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);

  // Form state
  const [calories, setCalories] = useState<number>(0);
  const [protein, setProtein] = useState<number>(0);
  const [fat, setFat] = useState<number>(0);
  const [carbs, setCarbs] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [comments, setComments] = useState<string>('');

  useEffect(() => {
    if (!jobId) return;

    let pollInterval: number;

    const pollStatus = async () => {
      try {
        const data = await getJobStatus(jobId);
        setJob(data);

        if (data.status === 'COMPLETED') {
          if (data.result) {
            setCalories(data.result.calories || 0);
            setProtein(data.result.protein || 0);
            setFat(data.result.fat || 0);
            setCarbs(data.result.carbs || 0);
            setTitle(data.result.title || '');
            setComments(data.result.description || '');
          }
          clearInterval(pollInterval);
        } else if (data.status === 'FAILED') {
          setError('AI analysis failed. Please try again with a clearer photo.');
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Polling error:', err);
        setError('Failed to get job status.');
        clearInterval(pollInterval);
      }
    };

    pollStatus(); // Initial call
    pollInterval = setInterval(pollStatus, 2000);

    return () => clearInterval(pollInterval);
  }, [jobId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job?.mealId) return;

    try {
      setIsSaving(true);
      await updateMeal(job.mealId, {
        title,
        calories,
        protein,
        fat,
        carbs,
        recognizedText: comments
      });
      // Return to dashboard
      navigate('/');
    } catch (err) {
      console.error('Failed to save meal:', err);
      alert('Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!job?.mealId) {
      navigate('/');
      return;
    }

    try {
      setIsCancelling(true);
      await deleteMeal(job.mealId);
      navigate('/');
    } catch (err) {
      console.error('Failed to cancel meal:', err);
      alert('Failed to cancel meal.');
      setIsCancelling(false);
    }
  };

  const handleReanalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job?.mealId || !editPrompt.trim()) return;

    try {
      setIsReanalyzing(true);
      const userMessage = `User request: ${editPrompt.trim()}`;
      const fullContextPrompt = [...promptHistory, userMessage].join('\n\n');
      
      const response = await reanalyzeMeal(job.mealId, fullContextPrompt);
      if (response.result) {
        setCalories(response.result.calories || 0);
        setProtein(response.result.protein || 0);
        setFat(response.result.fat || 0);
        setCarbs(response.result.carbs || 0);
        if (response.result.title) setTitle(response.result.title);
        if (response.result.description) setComments(response.result.description);
        
        // Append to history for future prompts
        setPromptHistory(prev => [
          ...prev, 
          userMessage, 
          `AI output (for context, do not duplicate exactly): Title - ${response.result.title || 'N/A'}, Macros - ${response.result.calories} kcal, ${response.result.protein}g protein, ${response.result.fat}g fat, ${response.result.carbs}g carbs. Description: ${response.result.description || ''}`
        ]);
      }
      setIsEditModalOpen(false);
      setEditPrompt('');
    } catch (err) {
      console.error('Failed to reanalyze meal:', err);
      alert('Failed to re-analyze meal with prompt.');
    } finally {
      setIsReanalyzing(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
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

  if (!job || job.status === 'PENDING') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Loader2 size={48} className="text-indigo-600 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Food</h2>
        <p className="text-gray-500">Our AI is determining the macros for your meal...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <header className="flex items-center px-4 py-4 border-b border-gray-100">
        <button onClick={handleCancel} disabled={isCancelling} className="p-2 -ml-2 text-gray-600 hover:text-red-600">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1 text-center pr-8">Refine Meal</h1>
      </header>

      {/* Form Area */}
      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 flex flex-col space-y-6">
        
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center">
          <label className="block text-sm font-semibold text-indigo-900 mb-1 uppercase tracking-wider">Calories</label>
          <input 
            type="number" 
            value={calories} 
            onChange={e => setCalories(Number(e.target.value))}
            className="text-5xl font-black text-indigo-600 bg-transparent text-center w-full focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 flex flex-col items-center justify-center border border-blue-100">
            <label className="block text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">Protein</label>
            <div className="flex items-baseline justify-center">
              <input 
                type="number" 
                value={protein} 
                onChange={e => setProtein(Number(e.target.value))}
                className="text-2xl font-bold text-gray-900 bg-transparent text-right w-10 pr-0.5 focus:outline-none"
              />
              <span className="text-sm font-bold text-gray-900">(g)</span>
            </div>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 flex flex-col items-center justify-center border border-amber-100">
            <label className="block text-xs font-semibold text-amber-600 mb-1 uppercase tracking-wider">Fat</label>
            <div className="flex items-baseline justify-center">
              <input 
                type="number" 
                value={fat} 
                onChange={e => setFat(Number(e.target.value))}
                className="text-2xl font-bold text-gray-900 bg-transparent text-right w-10 pr-0.5 focus:outline-none"
              />
              <span className="text-sm font-bold text-gray-900">(g)</span>
            </div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 flex flex-col items-center justify-center border border-emerald-100">
            <label className="block text-xs font-semibold text-emerald-600 mb-1 uppercase tracking-wider">Carbs</label>
            <div className="flex items-baseline justify-center">
              <input 
                type="number" 
                value={carbs} 
                onChange={e => setCarbs(Number(e.target.value))}
                className="text-2xl font-bold text-gray-900 bg-transparent text-right w-10 pr-0.5 focus:outline-none"
              />
              <span className="text-sm font-bold text-gray-900">(g)</span>
            </div>
          </div>
        </div>

        {/* Macros Progress Bar */}
        {(() => {
          const pCals = (protein || 0) * 4;
          const fCals = (fat || 0) * 9;
          const cCals = (carbs || 0) * 4;
          const totalCals = pCals + fCals + cCals;
          const pPercent = totalCals > 0 ? Math.round((pCals / totalCals) * 100) : 0;
          const fPercent = totalCals > 0 ? Math.round((fCals / totalCals) * 100) : 0;
          const cPercent = totalCals > 0 ? Math.round((cCals / totalCals) * 100) : 0;
          
          return (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
              <div className="flex justify-between text-xs font-semibold uppercase tracking-wider">
                <span className="text-blue-500">{pPercent}%</span>
                <span className="text-amber-500">{fPercent}%</span>
                <span className="text-emerald-500">{cPercent}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-gray-200 flex overflow-hidden">
                <div style={{ width: `${pPercent}%` }} className="h-full bg-blue-500 transition-all duration-300"></div>
                <div style={{ width: `${fPercent}%` }} className="h-full bg-amber-500 transition-all duration-300"></div>
                <div style={{ width: `${cPercent}%` }} className="h-full bg-emerald-500 transition-all duration-300"></div>
              </div>
            </div>
          );
        })()}

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">AI Analysis</label>
          <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800">
            {title && <h3 className="font-bold text-lg mb-2">{title}</h3>}
            {comments ? (
              <p className="text-sm leading-relaxed">{comments}</p>
            ) : (
              <p className="text-sm italic text-gray-400">No additional details.</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button 
            type="submit"
            disabled={isSaving || isCancelling}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-4 font-bold text-lg flex items-center justify-center space-x-2 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-75"
          >
            {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
            <span>Save to Journal</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              disabled={isSaving || isCancelling}
              className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl p-3.5 font-semibold text-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
            >
              <Edit3 size={18} />
              <span>Edit / Clarify AI</span>
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving || isCancelling}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 rounded-xl p-3.5 font-semibold text-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
            >
              {isCancelling ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
              <span>Cancel</span>
            </button>
          </div>
        </div>

      </form>

      {/* Edit / Clarification Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2 text-indigo-600">
                <Sparkles size={22} />
                <h3 className="font-bold text-lg text-gray-900">Clarify Dish Details</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)}
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
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleReanalyze}
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
      )}
    </div>
  );
}
