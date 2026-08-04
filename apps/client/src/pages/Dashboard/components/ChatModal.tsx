import { Bot } from 'lucide-react';
import BottomSheetModal from '../../../components/BottomSheetModal';
import ChatWidget from '../../../components/ChatWidget';

export default function ChatModal({ period, targetDate, onClose }: { period: string; targetDate: string; onClose: () => void }) {
  return (
    <BottomSheetModal
      title={
        <div className="flex items-center space-x-2">
          <Bot size={20} />
          <span>AI Nutritionist</span>
        </div>
      }
      onClose={onClose}
      bgClass="bg-gray-50"
      zIndex="z-[60]"
    >
      <div className="flex-1 overflow-hidden pt-4">
        <ChatWidget period={period} targetDate={targetDate} />
      </div>
    </BottomSheetModal>
  );
}
