import Input from '../../../components/ui/Input';

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
        <Input
          label="Name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter your name"
        />
        
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</label>
          <div className="w-full bg-gray-100 border border-gray-100 rounded-xl p-4 text-gray-500 font-medium select-all">
            {email ?? '—'}
          </div>
        </div>

        <Input
          label="Current Weight (kg/lbs)"
          type="number"
          value={currentWeight}
          onChange={e => setCurrentWeight(e.target.value)}
          placeholder="e.g. 70"
        />
      </div>
    </section>
  );
}
