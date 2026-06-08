import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { MessageSquare, Send, Zap } from 'lucide-react';

interface CommunityChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export default function CommunityChat({ messages, onSendMessage }: CommunityChatProps) {
  const [inputText, setInputText] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat only if user is already near the bottom or if they sent a message
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const threshold = 120; // Allow being within 120px of the bottom
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
    const lastMsg = messages[messages.length - 1];
    const isByUser = lastMsg?.isCustomUser;

    if (isAtBottom || isByUser) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div id="community-chat-card" className="bg-[#121212] border border-white/5 rounded-2xl flex flex-col h-[400px]">
      {/* Title block */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <h2 className="font-bold text-sm tracking-tight flex items-center gap-1.5 text-gray-200">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            Social Feed & Chat Room
          </h2>
        </div>
        <span className="text-[10px] bg-black/40 border border-white/5 text-gray-400 font-mono px-2 py-0.5 rounded-lg">
          {messages.length + 120} Active Brokers
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar" id="chat-messages-scroll" ref={scrollContainerRef}>
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            id={`chat-msg-${msg.id}`}
            className={`flex items-start gap-2.5 max-w-[85%] ${msg.isCustomUser ? 'ml-auto flex-row-reverse text-right' : ''}`}
          >
            {/* User Avatar icon */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 ${
              msg.avatarColor || 'bg-slate-700'
            }`}>
              {msg.sender.slice(0, 2)}
            </div>

            <div className="flex flex-col">
              {/* Sender & timestamp labels */}
              <div className="flex items-baseline gap-1.5 mb-1 justify-start">
                <span className={`text-xs font-semibold ${msg.isCustomUser ? 'text-blue-400' : 'text-gray-300'}`}>
                  {msg.sender}
                </span>
                <span className="text-[9px] text-gray-550 font-mono">
                  {msg.time}
                </span>
              </div>

              {/* Message text bubble */}
              <div className={`p-2.5 rounded-xl text-xs break-words leading-relaxed ${
                msg.isCustomUser 
                  ? 'bg-blue-600/10 border border-blue-500/10 text-gray-100 rounded-tr-none' 
                  : 'bg-black/40 border border-white/5 text-gray-300 rounded-tl-none'
              }`}>
                {msg.text}

                {/* Optional attachments like specific asset links or Pnl percentage */}
                {(msg.assetMention || msg.pnlPercentage) && (
                  <div className="mt-2 pt-1.5 border-t border-white/5 flex flex-wrap items-center gap-1.5 text-[10px]">
                    {msg.assetMention && (
                      <span className="px-1.5 py-0.5 rounded bg-black/50 text-indigo-400 font-mono border border-white/5">
                        #{msg.assetMention.id}
                      </span>
                    )}
                    {msg.pnlPercentage && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 font-mono border border-emerald-500/10">
                        <Zap className="w-2.5 h-2.5 text-emerald-450" /> +{msg.pnlPercentage.toFixed(1)}% P&L
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Message Inputs Submit Panel */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/5 bg-black/10 rounded-b-2xl" id="chat-input-form">
        <div className="relative">
          <input
            id="chat-user-input"
            type="text"
            placeholder="Type stock insight or buy call..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full bg-black/40 border border-white/5 text-xs text-white placeholder-gray-500 rounded-xl pl-3 pr-10 py-2.5 focus:outline-none focus:border-blue-600 transition-colors"
          />
          <button
            id="send-chat-message-btn"
            type="submit"
            className="absolute right-1.5 top-1.5 h-7 w-7 bg-blue-600 rounded-lg hover:bg-blue-500 flex items-center justify-center text-white transition cursor-pointer"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </form>
    </div>
  );
}
