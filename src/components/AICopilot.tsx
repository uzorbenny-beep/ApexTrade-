import React, { useState, useRef, useEffect } from 'react';
import { Asset } from '../types';
import { BrainCircuit, Cpu, HelpCircle, RefreshCcw, Send, Sparkles } from 'lucide-react';

interface AICopilotProps {
  selectedAsset: Asset;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Custom Markdown to HTML formatter to render Gemini output cleanly without heavy node-libraries
function formatMarkdown(text: string) {
  return text.split('\n').map((line, idx) => {
    let cleanLine = line.trim();
    if (!cleanLine) return <div key={idx} className="h-2" />;

    // Headers
    if (cleanLine.startsWith('###')) {
      return (
        <h4 key={idx} className="text-xs font-bold text-blue-400 mt-3 mb-1 font-sans uppercase tracking-wide">
          {cleanLine.replace('###', '').trim()}
        </h4>
      );
    }
    if (cleanLine.startsWith('##')) {
      return (
        <h3 key={idx} className="text-sm font-bold text-white mt-4 mb-2 border-b border-white/5 pb-1">
          {cleanLine.replace('##', '').trim()}
        </h3>
      );
    }
    if (cleanLine.startsWith('#')) {
      return (
        <h2 key={idx} className="text-base font-extrabold text-blue-400 mt-4 mb-2">
          {cleanLine.replace('#', '').trim()}
        </h2>
      );
    }

    // Bullet points
    if (cleanLine.startsWith('*') || cleanLine.startsWith('-')) {
      return (
        <div key={idx} className="flex items-start gap-1.5 ml-2 my-1 text-gray-300 pl-1 border-l border-white/10">
          <span className="text-blue-400 text-[10px] mt-0.5">•</span>
          <span className="text-[11px] leading-relaxed">{parseInlineBold(cleanLine.substring(1).trim())}</span>
        </div>
      );
    }

    // Standard paragraph with inline bolding parsing
    return (
      <p key={idx} className="text-[11px] text-gray-300 leading-relaxed my-1.5">
        {parseInlineBold(cleanLine)}
      </p>
    );
  });
}

function parseInlineBold(text: string) {
  const parts = text.split('**');
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="text-white font-bold">{part}</strong>;
    }
    return part;
  });
}

export default function AICopilot({ selectedAsset }: AICopilotProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'analysis'>('analysis');
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I'm your **ApexTrade Quantum Advisor** powered by **Gemini 2.5**. 
I'm trained on technical patterns, leverage calculations, and risk models. Ask me anything about portfolio leverage or current trends.`
    }
  ]);
  const [userInput, setUserInput] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  const [quantReport, setQuantReport] = useState<string>('');
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const threshold = 120;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
    const lastMsg = chatMessages[chatMessages.length - 1];
    const isByUser = lastMsg?.role === 'user';

    if (isAtBottom || isByUser || chatLoading) {
      chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading]);

  // Request analysis from Gemini on the selected asset changes
  const handleGenerateReport = async () => {
    setReportLoading(true);
    setQuantReport('');
    
    try {
      // Collect close values for historical reference
      const historyClosePrices = selectedAsset.history.map(c => c.close).slice(-15);
      
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: selectedAsset.id,
          assetName: selectedAsset.name,
          currentPrice: selectedAsset.currentPrice,
          change24h: selectedAsset.change24h,
          historyClosePrices,
        }),
      });

      const resData = await response.json();
      if (resData.report) {
        setQuantReport(resData.report);
      } else {
        setQuantReport("Error generating asset analysis. Please verify server endpoints.");
      }
    } catch (err) {
      console.warn("Error calling quant analysis api:", err);
      setQuantReport("Connection error: Unable to load AI analytics.");
    } finally {
      setReportLoading(false);
    }
  };

  // Auto load report on asset change
  useEffect(() => {
    handleGenerateReport();
  }, [selectedAsset.id]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || chatLoading) return;

    const userMsgText = userInput;
    setUserInput('');
    
    const newMessages = [...chatMessages, { role: 'user' as const, content: userMsgText }];
    setChatMessages(newMessages);
    setChatLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          selectedAsset: selectedAsset.name,
        }),
      });

      const resData = await response.json();
      if (resData.text) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: resData.text }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I can't think of anything. Check console log." }]);
      }
    } catch (err) {
      console.warn("Chat co-pilot network error:", err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: "**Network Error**: Unable to link server-side client." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div id="ai-advisor-panel" className="bg-[#121212] border border-white/5 rounded-2xl flex flex-col h-[400px]">
      {/* Sub tabs header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 bg-black/10 rounded-t-2xl">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-200">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Apex AI Co-pilot</span>
        </div>
        <div className="flex gap-1" id="ai-advisor-tabs">
          <button
            id="ai-tab-analysis"
            onClick={() => setActiveTab('analysis')}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition duration-200 cursor-pointer ${
              activeTab === 'analysis' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/15' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Smarter Signal
          </button>
          <button
            id="ai-tab-chat"
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition duration-200 cursor-pointer ${
              activeTab === 'chat' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/15' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Ask Copilot
          </button>
        </div>
      </div>

      {/* ANALYSIS TAB PANEL */}
      {activeTab === 'analysis' && (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar flex flex-col justify-between" id="ai-analysis-viewport">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-blue-400" /> 
                Report for {selectedAsset.id}
              </span>
              <button
                id="regenerate-report-btn"
                onClick={handleGenerateReport}
                className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition cursor-pointer"
                title="Refresh AI Analysis"
                disabled={reportLoading}
              >
                <RefreshCcw className={`w-3 h-3 ${reportLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {reportLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3" id="ai-loading-indicator">
                <div className="relative">
                  <div className="w-10 h-10 border-2 border-white/5 border-t-blue-500 rounded-full animate-spin" />
                  <BrainCircuit className="w-4 h-4 text-blue-400 absolute top-3 left-3 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-200">Querying Gemini Quant Server...</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Calculating SMA, Bollinger divergence, entry zones.</p>
                </div>
              </div>
            ) : (
              <div className="border border-white/5 bg-black/35 rounded-xl p-3 pr-2 scrollbar-thin" id="ai-report-box">
                {quantReport ? formatMarkdown(quantReport) : (
                  <p className="text-xs text-gray-450 italic text-center py-4">
                    No signal preloaded. Click the refresh icon above to trigger.
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div className="text-[9px] text-gray-500 text-center flex items-center justify-center gap-1 opacity-70 border-t border-white/5 pt-2 shrink-0">
            <HelpCircle className="w-3 h-3" /> Financial models simulated using AI. Invest at your own risk.
          </div>
        </div>
      )}

      {/* CHAT CO-PILOT TAB PANEL */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col justify-between h-full overflow-hidden" id="ai-chat-viewport">
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar" id="ai-chat-messages-container" ref={scrollContainerRef}>
            {chatMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex gap-2.5 max-w-[85%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div className={`w-6 h-6 rounded-lg font-bold text-[9px] flex items-center justify-center shrink-0 uppercase ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#e5e7eb] text-black shadow'
                }`}>
                  {msg.role === 'user' ? 'ME' : 'AI'}
                </div>
                <div className={`p-2.5 rounded-xl text-[11px] leading-relaxed border ${
                  msg.role === 'user' 
                    ? 'bg-blue-600/10 border-blue-500/20 text-gray-200 rounded-tr-none' 
                    : 'bg-black/40 border-white/5 text-gray-300 rounded-tl-none'
                }`}>
                  {formatMarkdown(msg.content)}
                </div>
              </div>
            ))}
            
            {chatLoading && (
              <div className="flex gap-2.5 max-w-[80%]">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center animate-pulse">
                  AI
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-gray-500 italic flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                  Quant formulation active...
                </div>
              </div>
            )}
            <div ref={chatScrollRef} />
          </div>

          <form onSubmit={handleSendChatMessage} className="p-3 bg-black/10 border-t border-white/5" id="ai-chat-input-form">
            <div className="relative">
              <input
                id="ai-chat-user-input"
                type="text"
                placeholder={`Ask advisor about ${selectedAsset.id} or general strategies...`}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="w-full bg-black/40 border border-white/5 text-[11px] text-white placeholder-gray-500 rounded-xl pl-3 pr-10 py-2.5 focus:outline-none focus:border-blue-600 transition-colors"
              />
              <button
                id="submit-ai-chat-btn"
                type="submit"
                className="absolute right-1.5 top-1.5 h-7 w-7 bg-blue-600 rounded-lg hover:bg-blue-500 flex items-center justify-center text-white transition cursor-pointer"
                disabled={chatLoading}
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
