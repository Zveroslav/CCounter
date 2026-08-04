interface PersonalInfoProps {
  name: string;
  setName: (name: string) => void;
  email: string | undefined;
  currentWeight: string;
  setCurrentWeight: (weight: string) => void;
}

export default function PersonalInfo({
  name, setName, email, currentWeight, setCurrentWeight
}: PersonalInfoProps) {
  return (
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
            {email ?? '—'}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Current Weight (kg/lbs)</label>
          <input
            type="number"
            value={currentWeight}
            onChange={e => setCurrentWeight(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            placeholder="e.g. 70"
          />
        </div>
      </div>
    </section>
  );
}
