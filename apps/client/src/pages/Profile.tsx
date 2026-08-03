import { useEffect, useState } from 'react';
import { getProfile, updateProfile, logWeight, type UserProfile } from '../api/user';
import { Loader2, Save, LogOut } from 'lucide-react';

interface ProfileProps {
  onLogout: () => void;
}

export default function Profile({ onLogout }: ProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [targetCalories, setTargetCalories] = useState(2000);
  const [targetProtein, setTargetProtein] = useState(150);
  const [targetFat, setTargetFat] = useState(65);
  const [targetCarbs, setTargetCarbs] = useState(200);
  const [currentWeight, setCurrentWeight] = useState<number | ''>('');

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
        setTargetCalories(data.targetCalories);
        setTargetProtein(data.targetProtein);
        setTargetFat(data.targetFat);
        setTargetCarbs(data.targetCarbs);
        if (data.latestWeight) setCurrentWeight(data.latestWeight);
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
    try {
      setIsSaving(true);
      await updateProfile({
        name,
        targetCalories,
        targetProtein,
        targetFat,
        targetCarbs,
      });

      if (currentWeight !== '' && currentWeight !== profile?.latestWeight) {
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
          
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Personal Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                <div className="w-full bg-gray-100 border border-gray-100 rounded-xl p-4 text-gray-500 font-medium select-all">
                  {profile?.email ?? '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Current Weight (kg/lbs)</label>
                <input 
                  type="number" 
                  value={currentWeight} 
                  onChange={e => setCurrentWeight(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="e.g. 70"
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Daily Goals</h2>
            <div className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <label className="block text-xs font-semibold text-indigo-800 uppercase tracking-wider mb-1">Target Calories</label>
                <input 
                  type="number" 
                  value={targetCalories} 
                  onChange={e => setTargetCalories(Number(e.target.value))}
                  className="w-full bg-transparent text-indigo-900 font-bold text-2xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Protein (g)</label>
                  <input 
                    type="number" 
                    value={targetProtein} 
                    onChange={e => setTargetProtein(Number(e.target.value))}
                    className="w-full bg-transparent text-gray-900 font-bold text-center focus:outline-none"
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fat (g)</label>
                  <input 
                    type="number" 
                    value={targetFat} 
                    onChange={e => setTargetFat(Number(e.target.value))}
                    className="w-full bg-transparent text-gray-900 font-bold text-center focus:outline-none"
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Carbs (g)</label>
                  <input 
                    type="number" 
                    value={targetCarbs} 
                    onChange={e => setTargetCarbs(Number(e.target.value))}
                    className="w-full bg-transparent text-gray-900 font-bold text-center focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          <button 
            type="submit"
            disabled={isSaving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-4 font-bold text-lg shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-70 disabled:active:scale-100"
          >
            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            <span>Save Settings</span>
          </button>
        </form>
      </div>
    </div>
  );
}
