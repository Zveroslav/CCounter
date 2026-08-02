import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { getJobStatus, updateMeal, type JobStatusResponse } from '../api/meals';

export default function RefinementView() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [calories, setCalories] = useState<number>(0);
  const [protein, setProtein] = useState<number>(0);
  const [fat, setFat] = useState<number>(0);
  const [carbs, setCarbs] = useState<number>(0);
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
            setComments(data.result.health_warnings || '');
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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="flex items-center px-4 py-4 border-b border-gray-100">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-600">
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
          <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Protein (g)</label>
            <input 
              type="number" 
              value={protein} 
              onChange={e => setProtein(Number(e.target.value))}
              className="text-xl font-bold text-gray-900 bg-transparent text-center w-full focus:outline-none"
            />
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Fat (g)</label>
            <input 
              type="number" 
              value={fat} 
              onChange={e => setFat(Number(e.target.value))}
              className="text-xl font-bold text-gray-900 bg-transparent text-center w-full focus:outline-none"
            />
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Carbs (g)</label>
            <input 
              type="number" 
              value={carbs} 
              onChange={e => setCarbs(Number(e.target.value))}
              className="text-xl font-bold text-gray-900 bg-transparent text-center w-full focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Health Warnings & Comments</label>
          <textarea
            value={comments}
            onChange={e => setComments(e.target.value)}
            rows={4}
            placeholder="Add any notes about this meal..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          ></textarea>
        </div>

        <button 
          type="submit"
          disabled={isSaving}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-4 font-bold text-lg flex items-center justify-center space-x-2 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] mt-4 disabled:opacity-75"
        >
          {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
          <span>Save to Journal</span>
        </button>

      </form>
    </div>
  );
}
