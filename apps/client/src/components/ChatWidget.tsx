import { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../api/chat';
import Button from './ui/Button';
import Input from './ui/Input';
import { Send } from 'lucide-react';
import type { Message } from '../types/chat';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

interface ChatWidgetProps {
  period: string;
  targetDate: string;
}

export default function ChatWidget({ period, targetDate }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: `Hi! I'm your AI Nutritionist. Ask me anything about your ${period === 'day' ? 'daily' : period} summary.` }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return; // don't scroll on mount
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const responseText = await sendChatMessage(userMessage.text, period, targetDate);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: responseText
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Sorry, I am having trouble connecting to the server. Please try again later.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white flex flex-col h-full overflow-hidden">
      

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isSending && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 pb-safe bg-white border-t border-gray-100 flex items-center space-x-2">
        <Input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question..."
          rounded="full"
          inputSize="sm"
          wrapperClassName="flex-1"
        />
        <Button 
          type="submit"
          disabled={!input.trim()}
          isLoading={isSending}
          size="icon"
          icon={<Send size={18} />}
        />
      </form>

    </div>
  );
}
