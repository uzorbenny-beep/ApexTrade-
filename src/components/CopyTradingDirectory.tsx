import { useState } from 'react';
import { CopyTrader } from '../types';
import { initialCopyTraders } from '../data';
import { Award, Copy, Users, Wallet, X, Zap } from 'lucide-react';

interface CopyTradingDirectoryProps {
  freeMargin: number;
  copiedTraderIds: string[];
  onStartCopy: (trader: CopyTrader, amount: number) => void;
  onStopCopy: (traderId: string) => void;
  copiedAllocations: Record<string, number>;
}

export default function CopyTradingDirectory({
  freeMargin,
  copiedTraderIds,
  onStartCopy,
  onStopCopy,
  copiedAllocations,
}: CopyTradingDirectoryProps) {
  const [selectedTrader, setSelectedTrader] = useState<CopyTrader | null>(null);
  const [allocationAmount, setAllocationAmount] = useState<string>('500');
  const [errorText, setErrorText] = useState<string>('');

  const handleOpenModal = (trader: CopyTrader) => {
    setSelectedTrader(trader);
    setErrorText('');
    setAllocationAmount(Math.min(1000, Math.floor(freeMargin * 0.5)).toString());
  };

  const handleConfirmCopy = () => {
    const amount = parseFloat(allocationAmount);
    if (isNaN(amount) || amount <= 0) {
      setErrorText('Please enter a valid positive capital allocation.');
      return;
    }
    if (amount < 100) {
      setErrorText('Minimum copying allocation is $100.');
      return;
    }
    if (amount > freeMargin) {
      setErrorText(`Insufficient Free Margin. Maximum you can allocate is $${freeMargin.toFixed(2)}.`);
      return;
    }

    if (selectedTrader) {
      onStartCopy(selectedTrader, amount);
      setSelectedTrader(null);
    }
  };

  return (
    <div id="copy-trading-section" className="bg-[#121212] border border-white/5 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2 text-gray-200">
            <Users className="w-5 h-5 text-blue-400" /> 
            Social Leaders Directory (Exness Copy)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Auto-copy trades from top-ranking global quantitative investors.</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-gray-550 block">Your Copyable Capital</span>
          <span className="text-xs font-mono font-bold text-emerald-400">${freeMargin.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="copy-traders-grid">
        {initialCopyTraders.map((trader) => {
          const isCopied = copiedTraderIds.includes(trader.id);
          const allocated = copiedAllocations[trader.id] || 0;

          return (
            <div 
              key={trader.id} 
              id={`copytrader-card-${trader.id}`}
              className={`border rounded-xl p-4 flex flex-col justify-between transition duration-200 hover:border-white/10 ${
                isCopied ? 'border-blue-500/30 bg-blue-600/[0.03]' : 'border-white/5 bg-black/20'
              }`}
            >
              <div>
                {/* Header Info */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${trader.avatarColor} flex items-center justify-center text-white font-bold text-xs shadow-inner`}>
                    {trader.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-gray-200 flex items-center gap-1">
                      {trader.name}
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                    </h3>
                    <span className="text-[10px] text-blue-400 font-bold">{trader.specialty}</span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 leading-relaxed mb-4 h-12 overflow-hidden overflow-ellipsis">
                  {trader.bio}
                </p>

                {/* Performance Metrics */}
                <div className="grid grid-cols-3 gap-2 bg-black/45 p-2 rounded-lg border border-white/5 mb-4 text-center">
                  <div>
                    <span className="block text-[8px] text-gray-600 uppercase">30d ROI</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">+{trader.roi30d}%</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-gray-600 uppercase">Win Rate</span>
                    <span className="text-xs font-mono font-semibold text-gray-300">{trader.winRate}%</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-gray-600 uppercase">Risk</span>
                    <span className="text-xs font-mono font-bold text-blue-400">{trader.riskScore}/10</span>
                  </div>
                </div>

                {/* Copier parameters */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 px-1 mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-gray-650" /> 
                    {trader.copiersCount.toLocaleString()}
                  </span>
                  <span className="font-mono">
                    AUM: ${(trader.aum / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>

              {/* Status Action CTAs */}
              <div>
                {isCopied ? (
                  <div className="bg-black/35 p-2 rounded-lg border border-white/5 mb-2">
                    <div className="flex items-center justify-between text-[10px] mb-2">
                      <span className="text-gray-500">Allocated capital:</span>
                      <span className="font-mono font-bold text-gray-200">${allocated.toFixed(2)}</span>
                    </div>
                    <button
                      id={`stop-copy-btn-${trader.id}`}
                      onClick={() => onStopCopy(trader.id)}
                      className="w-full py-1.5 bg-rose-600 text-white hover:bg-rose-500 text-xs font-bold rounded-md transition duration-150 cursor-pointer flex items-center justify-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Stop Copying
                    </button>
                  </div>
                ) : (
                  <button
                    id={`start-copy-btn-${trader.id}`}
                    onClick={() => handleOpenModal(trader)}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/5 hover:border-white/10 transition duration-150 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-gray-400" /> Copy Trades
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Copy Capital Allocation Modal Overlay */}
      {selectedTrader && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/5 max-w-sm w-full rounded-2xl p-6 shadow-2xl relative" id="copy-allocation-modal">
            <button
              onClick={() => setSelectedTrader(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition cursor-pointer font-bold text-lg"
            >
              ×
            </button>

            <div className="text-center mb-5">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-2.5 border border-blue-500/20">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-extrabold text-white text-base">Copy Strategy Leader</h3>
              <p className="text-xs text-gray-500 mt-1">Configuring investment allocation for copy strategy.</p>
            </div>

            {/* Target master overview */}
            <div className="bg-black/35 border border-white/5 rounded-xl p-3.5 mb-4 text-xs">
              <div className="flex items-center justify-between font-bold text-white mb-1.5">
                <span>{selectedTrader.name}</span>
                <span className="text-emerald-400">ROI: +{selectedTrader.roi30d}%</span>
              </div>
              <p className="text-gray-500 text-[10px] leading-relaxed">{selectedTrader.bio.slice(0, 100)}...</p>
            </div>

            {/* Allocation Input */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-400 mb-1.5 flex justify-between">
                <span>Allocation Funds ($)</span>
                <span className="font-mono text-[10px] text-gray-500">Free Margin: ${freeMargin.toFixed(2)}</span>
              </label>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 text-xs font-mono font-bold">
                  $
                </div>
                <input
                  id="copy-allocation-input"
                  type="number"
                  placeholder="Minimum 100"
                  value={allocationAmount}
                  onChange={(e) => setAllocationAmount(e.target.value)}
                  className="w-full bg-black/45 border border-white/5 rounded-lg pl-7 pr-3 py-2 text-sm font-mono tracking-tight text-white focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>

              {/* Error handle label */}
              {errorText && (
                <p className="text-xs text-rose-450 font-bold mt-1.5 leading-snug">
                  {errorText}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                onClick={() => setSelectedTrader(null)}
                className="py-2.5 border border-white/5 text-gray-400 rounded-lg text-xs hover:bg-white/5 hover:text-white transition font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="copy-confirm-action"
                onClick={handleConfirmCopy}
                className="py-2.5 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-blue-500 transition duration-150 cursor-pointer shadow-lg shadow-blue-500/10"
              >
                Confirm Copying
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
