import type { Message } from '../types/chat';

import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm overflow-hidden ${
        isUser 
          ? 'bg-indigo-600 text-white rounded-br-sm whitespace-pre-wrap' 
          : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
      }`}>
        {isUser ? (
          message.text
        ) : (
          <ReactMarkdown
            components={{
              h3: ({node, ...props}) => <h3 className="font-bold text-base mt-4 mb-1 first:mt-0" {...props} />,
              p: ({node, ...props}) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
              strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-3" {...props} />,
              li: ({node, ...props}) => <li className="mb-1" {...props} />
            }}
          >
            {message.text}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
