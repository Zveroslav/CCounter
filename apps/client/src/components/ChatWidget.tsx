import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { sendChatMessage } from '../api/chat';

interface ChatWidgetProps {
  period: string;
  targetDate: string;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
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
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`whitespace-pre-wrap max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
              msg.sender === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-sm' 
                : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center space-x-2">
              <Loader2 size={16} className="animate-spin text-indigo-600" />
              <span className="text-sm text-gray-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 pb-safe bg-white border-t border-gray-100 flex items-center space-x-2">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button 
          type="submit"
          disabled={!input.trim() || isSending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-md transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          <Send size={18} />
        </button>
      </form>

    </div>
  );
}
