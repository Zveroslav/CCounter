import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getJobStatus, updateMeal, deleteMeal, reanalyzeMeal, type JobStatusResponse } from '../../api/meals';

import { ErrorView, LoadingView } from './components/StatusViews';
import RefinementForm from './components/RefinementForm';
import EditModal from './components/EditModal';

export default function Refinement() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

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
      // Start exit animation
      setIsExiting(true);
      setTimeout(() => navigate('/'), 300);
    } catch (err) {
      console.error('Failed to save meal:', err);
      alert('Failed to save changes.');
      setIsSaving(false); // Only reset if failed
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
      setIsExiting(true);
      setTimeout(() => navigate('/'), 300);
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
    return <ErrorView error={error} />;
  }

  if (!job || job.status === 'PENDING') {
    return <LoadingView />;
  }

  return (
    <div 
      className="flex flex-col h-full bg-white relative transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ transform: (isVisible && !isExiting) ? 'translateY(0)' : 'translateY(100%)' }}
    >
      {/* Header */}
      <header className="flex items-center px-4 py-4 border-b border-gray-100">
        <button onClick={handleCancel} disabled={isCancelling} className="p-2 -ml-2 text-gray-600 hover:text-red-600">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1 text-center pr-8">Refine Meal</h1>
      </header>

      {/* Form Area */}
      <RefinementForm
        calories={calories} setCalories={setCalories}
        protein={protein} setProtein={setProtein}
        fat={fat} setFat={setFat}
        carbs={carbs} setCarbs={setCarbs}
        title={title} comments={comments}
        isSaving={isSaving} isCancelling={isCancelling}
        onSave={handleSave}
        onCancel={handleCancel}
        onOpenEditModal={() => setIsEditModalOpen(true)}
      />

      {/* Edit / Clarification Modal */}
      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editPrompt={editPrompt}
        setEditPrompt={setEditPrompt}
        isReanalyzing={isReanalyzing}
        onReanalyze={handleReanalyze}
      />
    </div>
  );
}
