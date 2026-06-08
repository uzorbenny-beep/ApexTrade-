import { Position } from '../types';
import { DollarSign, ShieldAlert, TrendingUp, Wallet, Percent, PieChart } from 'lucide-react';

interface MetricCardsProps {
  balance: number;
  positions: Position[];
}

export default function MetricCards({ balance, positions }: MetricCardsProps) {
  // Calculate P&L for open positions in real time
  const totalPL = positions.reduce((acc, pos) => {
    const priceDiff = pos.side === 'buy' 
      ? pos.currentPrice - pos.entryPrice 
      : pos.entryPrice - pos.currentPrice;
    
    // P&L = (difference / entryPrice) * leverage * margin
    const percentageReturn = priceDiff / pos.entryPrice;
    const posPnl = percentageReturn * pos.leverage * pos.margin;
    return acc + posPnl;
  }, 0);

  const nav = balance + totalPL;
  
  // Margin Used is the sum of margin of all open positions
  const marginUsed = positions.reduce((acc, pos) => acc + pos.margin, 0);
  const freeMargin = nav - marginUsed;
  
  // Margin level = (NAV / Margin Used) * 100
  const marginLevel = marginUsed > 0 ? (nav / marginUsed) * 100 : 100;
  
  const formattedNav = nav.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedBalance = balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedPL = totalPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedMarginUsed = marginUsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedFreeMargin = freeMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const plColor = totalPL >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-450 font-bold';
  const marginLevelColor = marginLevel > 200 
    ? 'text-emerald-400 font-bold' 
    : marginLevel > 100 
    ? 'text-amber-400 font-bold' 
    : 'text-rose-450 font-bold';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6" id="trading-metrics-bar">
      {/* CARD 1: NET ASSET VALUE */}
      <div className="bg-[#121212] border border-white/5 rounded-xl p-3 flex flex-col justify-between transition hover:border-white/10" id="metric-nav">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Net Asset Value (NAV)</span>
          <PieChart className="w-4 h-4 text-gray-600" />
        </div>
        <div>
          <span className="text-xl font-bold font-mono tracking-tight text-white">${formattedNav}</span>
          <div className={`text-xs font-mono font-medium mt-0.5 ${plColor}`}>
            {totalPL >= 0 ? '+' : ''}${formattedPL} P&L
          </div>
        </div>
      </div>

      {/* CARD 2: FREE BALANCE */}
      <div className="bg-[#121212] border border-white/5 rounded-xl p-3 flex flex-col justify-between transition hover:border-white/10" id="metric-balance">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Cash Wallet</span>
          <Wallet className="w-4 h-4 text-blue-500" />
        </div>
        <div>
          <span className="text-xl font-bold font-mono tracking-tight text-white">${formattedBalance}</span>
          <span className="block text-[10px] text-gray-550 mt-1">Available for withdraw</span>
        </div>
      </div>

      {/* CARD 3: FREE MARGIN */}
      <div className="bg-[#121212] border border-white/5 rounded-xl p-3 flex flex-col justify-between transition hover:border-white/10" id="metric-free-margin">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Free Margin</span>
          <DollarSign className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <span className="text-xl font-bold font-mono tracking-tight text-white">${formattedFreeMargin}</span>
          <span className="block text-[10px] text-gray-550 mt-1">Available for opening trades</span>
        </div>
      </div>

      {/* CARD 4: USED MARGIN */}
      <div className="bg-[#121212] border border-white/5 rounded-xl p-3 flex flex-col justify-between transition hover:border-white/10" id="metric-margin-used">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Margin Used</span>
          <ShieldAlert className="w-4 h-4 text-gray-600" />
        </div>
        <div>
          <span className="text-xl font-bold font-mono tracking-tight text-gray-300">${formattedMarginUsed}</span>
          <span className="block text-[10px] text-gray-550 mt-1">Total collateral locked</span>
        </div>
      </div>

      {/* CARD 5: MARGIN LEVEL % */}
      <div className="bg-[#121212] border border-white/5 rounded-xl p-3 flex flex-col justify-between transition hover:border-white/10" id="metric-margin-level">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Margin Level</span>
          <Percent className="w-4 h-4 text-gray-650" />
        </div>
        <div>
          <span className={`text-xl font-bold font-mono tracking-tight ${marginLevelColor}`}>
            {marginUsed > 0 ? `${marginLevel.toFixed(1)}%` : '∞'}
          </span>
          <span className="block text-[10px] text-gray-550 mt-1">Stop-out threshold: 50%</span>
        </div>
      </div>

      {/* CARD 6: OPEN POSITIONS */}
      <div className="bg-[#121212] border border-white/5 rounded-xl p-3 flex flex-col justify-between transition hover:border-white/10" id="metric-open-trades">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Positions</span>
          <TrendingUp className="w-4 h-4 text-gray-600" />
        </div>
        <div>
          <span className="text-xl font-bold font-mono tracking-tight text-white">{positions.length}</span>
          <span className="block text-[10px] text-gray-550 mt-1">
            {positions.filter(p => !p.copiedFromTraderId).length} Active | {positions.filter(p => p.copiedFromTraderId).length} Social Copied
          </span>
        </div>
      </div>
    </div>
  );
}
