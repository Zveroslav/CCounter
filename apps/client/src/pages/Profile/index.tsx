import { useEffect, useState } from 'react';
import { getProfile, updateProfile, logWeight, type UserProfile } from '../../api/user';
import { Loader2, Save, LogOut } from 'lucide-react';
import PersonalInfo from './components/PersonalInfo';
import DailyGoals from './components/DailyGoals';

interface ProfileProps {
  onLogout: () => void;
}

export default function Profile({ onLogout }: ProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State — stored as strings so user can fully clear inputs
  const [name, setName] = useState('');
  const [targetCalories, setTargetCalories] = useState('2000');
  const [targetProteinPct, setTargetProteinPct] = useState('30');
  const [targetFatPct, setTargetFatPct] = useState('30');
  const [targetCarbsPct, setTargetCarbsPct] = useState('40');
  const [currentWeight, setCurrentWeight] = useState('');

  const numCalories = Number(targetCalories) || 0;
  const numProtein = Number(targetProteinPct) || 0;
  const numFat = Number(targetFatPct) || 0;
  const numCarbs = Number(targetCarbsPct) || 0;

  const macroSum = numProtein + numFat + numCarbs;
  const isMacroValid = Math.abs(macroSum - 100) < 0.01;

  // Derived gram values
  const proteinGrams = Math.round((numCalories * (numProtein / 100)) / 4);
  const fatGrams = Math.round((numCalories * (numFat / 100)) / 9);
  const carbsGrams = Math.round((numCalories * (numCarbs / 100)) / 4);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!localStorage.getItem('jwt_token')) {
          setIsLoading(false);
          return;
        }
        const data = await getProfile();
        setProfile(data);
        setName(data.name || '');
        setTargetCalories(String(data.targetCalories));
        setTargetProteinPct(String(data.targetProteinPct ?? 30));
        setTargetFatPct(String(data.targetFatPct ?? 30));
        setTargetCarbsPct(String(data.targetCarbsPct ?? 40));
        if (data.latestWeight) setCurrentWeight(String(data.latestWeight));
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);


  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    onLogout();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMacroValid) return;
    try {
      setIsSaving(true);
      await updateProfile({
        name,
        targetCalories: numCalories,
        targetProteinPct: numProtein,
        targetFatPct: numFat,
        targetCarbsPct: numCarbs,
      });

      if (currentWeight !== '' && Number(currentWeight) !== profile?.latestWeight) {
        await logWeight(Number(currentWeight));
      }

      alert('Profile saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <button onClick={handleLogout} className="text-red-500 p-2">
          <LogOut size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <form onSubmit={handleSaveProfile} className="space-y-8">

          <PersonalInfo
            name={name} setName={setName}
            email={profile?.email}
            currentWeight={currentWeight} setCurrentWeight={setCurrentWeight}
          />

          <DailyGoals
            targetCalories={targetCalories} setTargetCalories={setTargetCalories}
            targetProteinPct={targetProteinPct} setTargetProteinPct={setTargetProteinPct}
            targetFatPct={targetFatPct} setTargetFatPct={setTargetFatPct}
            targetCarbsPct={targetCarbsPct} setTargetCarbsPct={setTargetCarbsPct}
            proteinGrams={proteinGrams} fatGrams={fatGrams} carbsGrams={carbsGrams}
          />

          {isMacroValid ? (
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-4 font-bold text-lg shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-70 disabled:active:scale-100"
            >
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              <span>Save Settings</span>
            </button>
          ) : (
            <div className="w-full bg-red-50 border border-red-200 rounded-xl p-4 font-bold text-lg text-red-600 text-center">
              Total macros must equal 100% (currently {Math.round(macroSum)}%)
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
