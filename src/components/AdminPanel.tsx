import { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  Users, 
  LineChart, 
  TrendingUp, 
  TrendingDown, 
  Check, 
  X, 
  ArrowDownUp, 
  Coins, 
  DollarSign, 
  Sliders, 
  Volume2, 
  History, 
  ShieldCheck, 
  UserPlus, 
  AlertTriangle 
} from 'lucide-react';
import { Asset, FundingTransaction, UserProfile, Position, TradeLog } from '../types';

interface AdminPanelProps {
  assets: Asset[];
  registeredUsers: any[];
  fundingTransactions: FundingTransaction[];
  userProfile: UserProfile;
  onAdjustUserBalance: (email: string, amount: number, absoluteValue?: boolean) => void;
  onForceCloseUserPosition: (email: string, positionId: string) => void;
  onSetUserStatus: (email: string, status: string) => void;
  onApproveTransaction: (txId: string, comment: string) => void;
  onDeclineTransaction: (txId: string, comment: string) => void;
  onSetPriceOverride: (assetId: string, trendMode: 'pump' | 'dump' | 'normal') => void;
  onBroadcastAnnouncement: (text: string) => void;
  priceOverrides: Record<string, 'pump' | 'dump' | 'normal'>;
}

export default function AdminPanel({
  assets,
  registeredUsers,
  fundingTransactions,
  userProfile,
  onAdjustUserBalance,
  onForceCloseUserPosition,
  onSetUserStatus,
  onApproveTransaction,
  onDeclineTransaction,
  onSetPriceOverride,
  onBroadcastAnnouncement,
  priceOverrides
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'trades' | 'funding' | 'rigger' | 'broadcaster'>('users');
  
  // Selected user for details view or balance editing
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');
  const [balanceChangeInput, setBalanceChangeInput] = useState<string>('');
  const [balanceSetInput, setBalanceSetInput] = useState<string>('');
  
  // Custom announcement broadcast text
  const [announcementText, setAnnouncementText] = useState<string>('');
  const [chatBotName, setChatBotName] = useState<string>('Exness Broker Bot');
  
  // Pending Audit Decline comment
  const [auditComment, setAuditComment] = useState<Record<string, string>>({});

  // Helper to load other users' positions dynamically from localStorage
  const loadedUserPositionsMap = useMemo(() => {
    const results: Record<string, Position[]> = {};
    registeredUsers.forEach(u => {
      try {
        const str = localStorage.getItem(`apex_positions_${u.email.toLowerCase()}`);
        results[u.email] = str ? JSON.parse(str) : [];
      } catch (e) {
        results[u.email] = [];
      }
    });
    return results;
  }, [registeredUsers, fundingTransactions]); // recalculate when actions hit

  // Helper to load other users' trading logs
  const loadedTradeLogsMap = useMemo(() => {
    const results: Record<string, TradeLog[]> = {};
    registeredUsers.forEach(u => {
      try {
        const str = localStorage.getItem(`apex_tradelog_${u.email.toLowerCase()}`);
        results[u.email] = str ? JSON.parse(str) : [];
      } catch (e) {
        results[u.email] = [];
      }
    });
    return results;
  }, [registeredUsers]);

  // Aggregate stats
  const totalPlatformDeposits = useMemo(() => {
    return fundingTransactions
      .filter(t => t.type === 'deposit' && t.status === 'approved')
      .reduce((s, t) => s + t.amount, 0);
  }, [fundingTransactions]);

  const totalPlatformWithdrawals = useMemo(() => {
    return fundingTransactions
      .filter(t => t.type === 'withdrawal' && t.status === 'approved')
      .reduce((s, t) => s + t.amount, 0);
  }, [fundingTransactions]);

  const platformOpenPositionsCount = useMemo(() => {
    return (Object.values(loadedUserPositionsMap) as Position[][]).reduce((s, arr) => s + arr.length, 0);
  }, [loadedUserPositionsMap]);

  return (
    <div className="space-y-6 font-sans select-none animation-fade-in" id="admin-panel-control">
      {/* GLOWING ADMIN TITLE METRICS BAR */}
      <div className="bg-[#1e152a] border border-purple-500/20 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-400 shrink-0" />
            <h2 className="text-base font-extrabold text-purple-100">Brokerage Controller Terminal & Administration Console</h2>
            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[9px] rounded font-mono font-bold">SUPER ADMINISTRATOR</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Settle user accounts, override equity margin allocations, force close live operations, and configure pricing trends.</p>
        </div>
        <div className="flex gap-2.5">
          <div className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/5 text-right">
            <span className="text-[8px] text-gray-500 uppercase block">Total Platform Approved Cash Deposits</span>
            <span className="text-xs font-mono font-bold text-emerald-400">${totalPlatformDeposits.toLocaleString()}</span>
          </div>
          <div className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/5 text-right">
            <span className="text-[8px] text-gray-500 uppercase block">Total Approved Cash Withdrawals</span>
            <span className="text-xs font-mono font-bold text-rose-400">${totalPlatformWithdrawals.toLocaleString()}</span>
          </div>
          <div className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/5 text-right font-mono">
            <span className="text-[8px] text-gray-500 uppercase block">Global Open Exposure Positions</span>
            <span className="text-xs font-mono font-bold text-blue-400">{platformOpenPositionsCount} trades</span>
          </div>
        </div>
      </div>

      {/* ADMIN LEVEL SCREEN SELECTOR TABS */}
      <div className="flex flex-wrap bg-black/40 p-1 rounded-2xl gap-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'users' ? 'bg-[#9333ea] text-white shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          Registered Users ({registeredUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('trades')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'trades' ? 'bg-[#9333ea] text-white shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <LineChart className="w-4 h-4 shrink-0" />
          Risk Exposure Close ({platformOpenPositionsCount})
        </button>
        <button
          onClick={() => setActiveTab('funding')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'funding' ? 'bg-[#9333ea] text-white shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ArrowDownUp className="w-4 h-4 shrink-0" />
          Audit Ledger Requests ({fundingTransactions.filter(f=>f.status==='pending').length} pending)
        </button>
        <button
          onClick={() => setActiveTab('rigger')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'rigger' ? 'bg-[#9333ea] text-white shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders className="w-4 h-4 shrink-0" />
          Market Rate Manipulation
        </button>
        <button
          onClick={() => setActiveTab('broadcaster')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'broadcaster' ? 'bg-[#9333ea] text-white shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Volume2 className="w-4 h-4 shrink-0" />
          Announce Dispatcher
        </button>
      </div>

      {/* TAB SCREEN CONTENTS */}

      {/* TAB A: REGISTERED USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#121212] border border-white/5 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-gray-250 mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-400" /> Platform Investors Database
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="pb-2">User Details</th>
                    <th className="pb-2">Ledger Balance</th>
                    <th className="pb-2">Open Trades</th>
                    <th className="pb-2">Affiliation status</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {registeredUsers.map(user => {
                    const userPositions = loadedUserPositionsMap[user.email] || [];
                    const isSelf = user.email.toLowerCase() === userProfile.email.toLowerCase();
                    return (
                      <tr 
                        key={user.email} 
                        onClick={() => setSelectedUserEmail(user.email)}
                        className={`hover:bg-white/[0.02] cursor-pointer transition ${
                          selectedUserEmail === user.email ? 'bg-purple-500/5' : ''
                        }`}
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${user.avatarColor || 'bg-slate-700'}`}>
                              {user.displayName ? user.displayName.split(' ').map((n:any)=>n[0]).join('') : 'U'}
                            </div>
                            <div>
                              <span className="block font-bold text-slate-200">
                                {user.displayName} {isSelf && <span className="text-[9px] text-purple-400 font-normal ml-1">(Active You)</span>}
                              </span>
                              <span className="block text-[10px] text-gray-500">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 font-mono font-bold text-white">
                          ${user.balance !== undefined ? user.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '$0.00'}
                        </td>
                        <td className="py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-lg font-mono text-[10px] ${
                            userPositions.length > 0 ? 'bg-blue-600/10 text-blue-400 font-bold' : 'bg-slate-800 text-slate-500'
                          }`}>
                            {userPositions.length} active
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                            user.status === 'Suspended' ? 'bg-rose-500/10 border border-rose-500/20 text-rose-450' :
                            user.status === 'KYC Pending' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500' :
                            'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          }`}>
                            {user.status || 'Verified KYC'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUserEmail(user.email);
                            }}
                            className="px-2.5 py-1 bg-white/5 hover:bg-purple-550 hover:text-white rounded text-[10px] font-bold transition"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* BALANCE ADJUSTMENT DRAWER */}
          <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
            {selectedUserEmail ? (
              <div className="space-y-5">
                {(() => {
                  const focusedUser = registeredUsers.find(u => u.email === selectedUserEmail);
                  if (!focusedUser) return <p>User lost</p>;
                  const userPositions = loadedUserPositionsMap[focusedUser.email] || [];
                  const userLogs = loadedTradeLogsMap[focusedUser.email] || [];
                  return (
                    <>
                      {/* USER MINICARD SUMMARY */}
                      <div className="border-b border-white/5 pb-4">
                        <span className="text-[9px] text-purple-400 font-bold uppercase block tracking-wider">Modifying Target Wallet:</span>
                        <h4 className="text-base font-extrabold text-white mt-1">{focusedUser.displayName}</h4>
                        <p className="text-[10px] text-gray-500 font-mono select-all">{focusedUser.email}</p>
                        
                        <div className="grid grid-cols-2 gap-2 mt-3 text-sans">
                          <div className="bg-black/30 p-2 rounded-xl text-center">
                            <span className="text-[8px] text-gray-500 block">Current Balance</span>
                            <span className="text-xs font-mono font-bold text-white">${focusedUser.balance?.toLocaleString()}</span>
                          </div>
                          <div className="bg-black/30 p-2 rounded-xl text-center">
                            <span className="text-[8px] text-gray-500 block">Total trades</span>
                            <span className="text-xs font-mono font-bold text-white">{userLogs.length} completed</span>
                          </div>
                        </div>
                      </div>

                      {/* ACTIONS FORM */}
                      <div className="space-y-4">
                        <span className="text-[10px] font-bold text-slate-300 uppercase block mb-1">Financial Intervention:</span>
                        
                        {/* Adjustment Additive */}
                        <div className="space-y-2">
                          <label className="block text-[10px] text-gray-400">Add or Subtract Funds ($)</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="e.g. 5000 or -2000"
                              value={balanceChangeInput}
                              onChange={(e) => setBalanceChangeInput(e.target.value)}
                              className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none"
                            />
                            <button
                              onClick={() => {
                                const val = parseFloat(balanceChangeInput);
                                if (!isNaN(val)) {
                                  onAdjustUserBalance(focusedUser.email, val, false);
                                  setBalanceChangeInput('');
                                }
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-[10px] cursor-pointer"
                            >
                              Dispatch
                            </button>
                          </div>
                          <span className="text-[8px] text-gray-550 block">Positive to add, negative value to deduct collateral.</span>
                        </div>

                        {/* Force Set Balance Override */}
                        <div className="space-y-2">
                          <label className="block text-[10px] text-gray-400">Overwrite Absolute Balance ($)</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="e.g. 25000"
                              value={balanceSetInput}
                              onChange={(e) => setBalanceSetInput(e.target.value)}
                              className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none"
                            />
                            <button
                              onClick={() => {
                                const val = parseFloat(balanceSetInput);
                                if (!isNaN(val) && val >= 0) {
                                  onAdjustUserBalance(focusedUser.email, val, true);
                                  setBalanceSetInput('');
                                }
                              }}
                              className="px-3 py-1.5 bg-purple-650 hover:bg-purple-600 text-white font-bold rounded-xl text-[10px] cursor-pointer"
                            >
                              Overwrite
                            </button>
                          </div>
                        </div>

                        {/* User Status Verification */}
                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <label className="block text-[10px] text-gray-400 uppercase font-bold">Restrict or Verify Account Status</label>
                          <div className="grid grid-cols-3 gap-1">
                            {['Active Verified', 'KYC Pending', 'Suspended'].map(st => (
                              <button
                                key={st}
                                onClick={() => onSetUserStatus(focusedUser.email, st)}
                                className={`py-1 rounded text-[9px] font-bold cursor-pointer transition uppercase ${
                                  focusedUser.status === st || (!focusedUser.status && st === 'Active Verified')
                                    ? 'bg-purple-650 text-white'
                                    : 'bg-black/30 text-gray-400 hover:text-white'
                                }`}
                              >
                                {st.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* OPEN TRADES AND HIST LOGS OF FOCUSED USER */}
                      <div className="pt-3 border-t border-white/5 space-y-2.5">
                        <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Focus User Active Risk Position ({userPositions.length})</h4>
                        {userPositions.length === 0 ? (
                          <p className="text-[10px] text-gray-500 italic">No open risk positions currently.</p>
                        ) : (
                          <div className="max-h-[140px] overflow-y-auto space-y-1.5 bg-black/30 p-2.5 rounded-lg border border-white/5 font-mono text-[9px]">
                            {userPositions.map(pos => (
                              <div key={pos.id} className="flex justify-between items-center bg-white/[0.02] p-1.5 rounded">
                                <div>
                                  <span className={pos.side === 'buy' ? 'text-emerald-450 font-bold' : 'text-rose-455 font-bold'}>
                                    {pos.side.toUpperCase()}
                                  </span>{' '}
                                  <span>{pos.assetId}</span>{' '}
                                  <span className="text-gray-500">{pos.leverage}x (${pos.margin})</span>
                                </div>
                                <button
                                  onClick={() => onForceCloseUserPosition(focusedUser.email, pos.id)}
                                  className="px-1.5 py-0.5 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white rounded transition text-[8px]"
                                >
                                  Close
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-20 font-sans">
                <ShieldCheck className="w-10 h-10 text-purple-500/20 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-400">Auditor Sidebar Unloaded</p>
                <p className="text-[10px] text-gray-500 max-w-[200px] mx-auto mt-1">Select an investor from the table to inject manual adjustments and read logs.</p>
              </div>
            )}
            
            <button
              onClick={() => {
                // Ensure default admin override exists in localStorage
                localStorage.setItem('apex_admin_mode', 'true');
                alert("Super Admin mode permanent bypass confirmed. Inactive logins will now automatically recognize administrative controls!");
              }}
              className="mt-6 w-full py-2 border border-purple-500/20 hover:border-purple-500/50 bg-purple-950/10 text-purple-400 hover:text-white rounded-xl text-[10px] font-bold transition uppercase tracking-wider cursor-pointer"
            >
              Commit Local Admin Cookie
            </button>
          </div>
        </div>
      )}

      {/* TAB B: GLOBAL EXPOSURE AND POSITIONS MONITOR */}
      {activeTab === 'trades' && (
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
            <h3 className="text-sm font-bold text-gray-250 flex items-center gap-1.5">
              <LineChart className="w-4 h-4 text-purple-400" /> Active Platform High-Rigor Exposure Positions
            </h3>
            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
              REAL-TIME RISK COMPLIANCE INTERVENE
            </span>
          </div>

          {platformOpenPositionsCount === 0 ? (
            <div className="text-center py-20">
              <ShieldCheck className="w-10 h-10 text-slate-650 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-400">Market Risk Neutral. Zero user exposure open currently.</p>
              <p className="text-[10px] text-slate-550 max-w-sm mx-auto mt-1">
                When live investors place high leverage Buy/Sell terminal orders, they will appear on this control screen for supervisory margin assessment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <th className="pb-2">User account</th>
                    <th className="pb-2">Asset Symbol</th>
                    <th className="pb-2">Strategy Side</th>
                    <th className="pb-2 text-right">Commit Margin</th>
                    <th className="pb-2 text-right">Leverage Ratio</th>
                    <th className="pb-2 text-right">Entry / Current Rate</th>
                    <th className="pb-2 text-right">Floating profit/loss</th>
                    <th className="pb-2 text-center">Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {registeredUsers.map(user => {
                    const userPositions = loadedUserPositionsMap[user.email] || [];
                    return userPositions.map((pos: Position) => {
                      const priceDiff = pos.side === 'buy' 
                        ? pos.currentPrice - pos.entryPrice 
                        : pos.entryPrice - pos.currentPrice;
                      const percentageReturn = priceDiff / pos.entryPrice;
                      const pnl = percentageReturn * pos.leverage * pos.margin;
                      const isProfit = pnl >= 0;

                      return (
                        <tr key={pos.id} className="hover:bg-white/[0.01]">
                          <td className="py-3 text-sans font-sans">
                            <span className="block font-bold text-slate-200">{user.displayName}</span>
                            <span className="block text-[9px] text-[#8651f5] truncate max-w-[120px] font-mono">{user.email}</span>
                          </td>
                          <td className="py-3 font-bold text-slate-350">{pos.assetId}</td>
                          <td className="py-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold font-sans uppercase ${
                              pos.side === 'buy' ? 'bg-emerald-500/10 text-emerald-450' : 'bg-rose-500/10 text-rose-455'
                            }`}>
                              {pos.side}
                            </span>
                          </td>
                          <td className="py-3 text-right font-bold text-slate-250">${pos.margin}</td>
                          <td className="py-3 text-right font-bold text-slate-350">{pos.leverage}x</td>
                          <td className="py-3 text-right text-slate-400 text-[11px]">
                            {pos.entryPrice.toFixed(pos.assetType === 'forex' ? 5 : 2)} →{' '}
                            <span className="text-white font-bold">{pos.currentPrice.toFixed(pos.assetType === 'forex' ? 5 : 2)}</span>
                          </td>
                          <td className={`py-3 text-right font-bold text-[11px] ${isProfit ? 'text-emerald-400' : 'text-rose-455'}`}>
                            {isProfit ? '+' : ''}${pnl.toFixed(2)}
                          </td>
                          <td className="py-3 text-center pl-3">
                            <button
                              onClick={() => {
                                onForceCloseUserPosition(user.email, pos.id);
                              }}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-sans text-[10px] font-bold cursor-pointer transition active:scale-95"
                            >
                              Force Settle Close
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB C: TRANSACTION AND FUNDING AUDIT LEDGER */}
      {activeTab === 'funding' && (
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <h3 className="text-sm font-bold text-gray-250 flex items-center gap-1.5">
              <ArrowDownUp className="w-4 h-4 text-purple-400" /> Pending Transfers auditing Queue
            </h3>
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] rounded font-bold animate-pulse">
              AUDIT INTERFACES READY
            </span>
          </div>

          {fundingTransactions.filter(f => f.status === 'pending').length === 0 ? (
            <div className="text-center py-20 font-sans">
              <ShieldCheck className="w-10 h-10 text-emerald-500/20 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-400">Audits Clear. Zero pending operations.</p>
              <p className="text-[10px] text-gray-500 max-w-sm mx-auto mt-1">
                When users deposit crypto tokens or initiate USD wire cash outs, they will be registered instantly in this grid. Try depositing from the client page!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto font-sans">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                    <th className="pb-2">User / Email</th>
                    <th className="pb-2">Operation Date</th>
                    <th className="pb-2">Funding Action</th>
                    <th className="pb-2">Selected Protocol</th>
                    <th className="pb-2">Payment / Address Details</th>
                    <th className="pb-2 text-right">Transfer Amount</th>
                    <th className="pb-2 pl-4">Custom Auditor Memo</th>
                    <th className="pb-2 text-right pr-2">Audits Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {fundingTransactions.filter(f => f.status === 'pending').map(tx => (
                    <tr key={tx.id} className="hover:bg-white/[0.01]">
                      <td className="py-3 font-semibold text-slate-200">
                        {tx.email}
                      </td>
                      <td className="py-3 font-mono text-[10px] text-gray-500">{tx.timestamp}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 text-[10px] rounded-lg font-bold uppercase tracking-wider ${
                          tx.type === 'deposit' ? 'bg-blue-600/10 text-blue-400' : 'bg-rose-600/10 text-rose-450'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-slate-350">{tx.method}</td>
                      <td className="py-3 text-[10px] text-gray-400 font-mono truncate max-w-[150px]" title={tx.destinationDetails}>
                        {tx.destinationDetails || 'No receipt details'}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-white text-[13px]">
                        ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-center pl-4">
                        <input
                          type="text"
                          placeholder="e.g. Approved instantly"
                          value={auditComment[tx.id] || ''}
                          onChange={(e) => setAuditComment(prev => ({ ...prev, [tx.id]: e.target.value }))}
                          className="bg-black/35 border border-white/5 rounded px-2 py-0.5 text-[10px] text-white w-28 focus:outline-none focus:border-purple-500 font-sans"
                        />
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => {
                              onApproveTransaction(tx.id, auditComment[tx.id] || 'Audit verified. Released instantly.');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded p-1 cursor-pointer transition active:scale-95"
                            title="Approve & Settlement Balance"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              onDeclineTransaction(tx.id, auditComment[tx.id] || 'Declined. Please contact support.');
                            }}
                            className="bg-rose-600 hover:bg-rose-500 text-white rounded p-1 cursor-pointer transition active:scale-95"
                            title="Decline Audit request"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* HISTORICAL RESOLVED TRANSACTIONS */}
          <div className="mt-8 pt-5 border-t border-white/5">
            <h3 className="text-xs uppercase font-extrabold text-gray-400 tracking-wider mb-2 flex items-center gap-1.5 font-sans">
              <History className="w-3.5 h-3.5 text-purple-400" /> Historical Audit Archive Ledger
            </h3>
            {fundingTransactions.filter(f=>f.status !== 'pending').length === 0 ? (
              <p className="text-[10px] text-gray-500 italic font-sans">No settled operations archived yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] font-bold text-gray-500 uppercase tracking-widest font-sans">
                      <th className="pb-1">Investor</th>
                      <th className="pb-1">Type</th>
                      <th className="pb-1">Method</th>
                      <th className="pb-1 text-right">Amount ($)</th>
                      <th className="pb-1 text-center">Status Decision</th>
                      <th className="pb-1 pl-4">Audited comment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {fundingTransactions.filter(f=>f.status !== 'pending').slice(-8).map(tx => (
                      <tr key={tx.id} className="hover:bg-white/[0.005]">
                        <td className="py-2.5 font-sans text-[11px] text-gray-400">{tx.email}</td>
                        <td className="py-2.5">
                          <span className={`text-[10px] capitalize font-bold ${tx.type === 'deposit' ? 'text-blue-400' : 'text-rose-450'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-2.5 font-sans text-slate-350">{tx.method}</td>
                        <td className="py-2.5 text-right font-bold text-slate-200">${tx.amount.toLocaleString()}</td>
                        <td className="py-2.5 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold font-sans ${
                            tx.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-455'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-2.5 pl-4 font-sans text-[10px] text-gray-500 italic">"{tx.comment || 'N/A'}"</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB D: RATE MANIPULATION OVERRIDES BOARD (PUMP/DUMP ENGINE) */}
      {activeTab === 'rigger' && (
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-5">
            <div>
              <h3 className="text-sm font-bold text-gray-250 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-400" /> Market Price intervention & Volatility Rigger
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">Override live trading rates! Click Pump to force continuous bullish hikes, Dump to trigger institutional crashes.</p>
            </div>
            <span className="text-[9px] bg-red-500/10 border border-red-500/20 text-red-500 px-2 py-0.5 font-bold uppercase tracking-widest rounded">
              RIGGING SIMULATOR ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map(asset => {
              const currentOverride = priceOverrides[asset.id] || 'normal';
              return (
                <div key={asset.id} className="bg-black/35 p-3.5 rounded-2xl border border-white/5 flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-gray-500 text-[10px] font-bold block">{asset.type.toUpperCase()}</span>
                      <h4 className="text-sm font-extrabold text-white">{asset.name}</h4>
                      <span className="text-xs font-mono font-bold text-purple-300">{asset.id}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-white block">
                        ${asset.currentPrice.toFixed(asset.type === 'forex' ? 5 : 2)}
                      </span>
                      <span className={`text-[10px] font-mono font-bold block ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-455'}`}>
                        {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-white/5 flex flex-col space-y-3 font-sans">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Trend Force:</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider ${
                        currentOverride === 'pump' ? 'bg-emerald-500/10 text-emerald-440 animate-pulse' :
                        currentOverride === 'dump' ? 'bg-rose-500/10 text-rose-450 animate-pulse' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {currentOverride.toUpperCase()} LOBBY
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => onSetPriceOverride(asset.id, 'pump')}
                        className={`py-1 rounded text-[9px] font-extrabold transition cursor-pointer flex items-center justify-center gap-0.5 uppercase ${
                          currentOverride === 'pump' 
                            ? 'bg-emerald-600 text-white shadow shadow-emerald-600/30' 
                            : 'bg-black/30 text-emerald-500 hover:bg-emerald-950/20'
                        }`}
                      >
                        <TrendingUp className="w-2.5 h-2.5" /> Pump
                      </button>
                      <button
                        onClick={() => onSetPriceOverride(asset.id, 'normal')}
                        className={`py-1 rounded text-[9px] font-extrabold transition cursor-pointer flex items-center justify-center uppercase ${
                          currentOverride === 'normal' 
                            ? 'bg-purple-650 text-white' 
                            : 'bg-black/30 text-gray-400 hover:text-white'
                        }`}
                      >
                        Sync
                      </button>
                      <button
                        onClick={() => onSetPriceOverride(asset.id, 'dump')}
                        className={`py-1 rounded text-[9px] font-extrabold transition cursor-pointer flex items-center justify-center gap-0.5 uppercase ${
                          currentOverride === 'dump' 
                            ? 'bg-rose-600 text-white shadow shadow-rose-600/30' 
                            : 'bg-black/30 text-rose-550 hover:bg-rose-950/20'
                        }`}
                      >
                        <TrendingDown className="w-2.5 h-2.5" /> Dump
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB E: PUBLIC ANNOUNCEMENT DISPATCHER */}
      {activeTab === 'broadcaster' && (
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 space-y-5">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-gray-250 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-purple-400" /> Global Chat Announcement Dispatcher
            </h3>
            <p className="text-[10px] text-gray-500 mt-1">Inject global notifications or dispatch a micro AI-bot chatter to show up instantly on all traders' live feeds.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/25 p-4 rounded-xl border border-white/5 space-y-3 font-sans">
              <span className="text-[10px] text-purple-400 font-extrabold uppercase">1. Inject Chat Message Alias</span>
              <div>
                <label className="text-[9px] text-gray-500 block mb-1 uppercase font-bold">Bot Sender Name</label>
                <input
                  type="text"
                  value={chatBotName}
                  onChange={(e) => setChatBotName(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white"
                  placeholder="Exness Corporate Bot"
                />
              </div>

              <div>
                <label className="text-[9px] text-gray-500 block mb-1 uppercase font-bold">Message Text</label>
                <textarea
                  rows={2}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-600"
                  placeholder="e.g. BTC undergoes a heavy quantitative breakout! Position liquidations impending!"
                />
              </div>

              <button
                onClick={() => {
                  if (announcementText.trim()) {
                    onBroadcastAnnouncement(announcementText);
                    setAnnouncementText('');
                    alert("Message broadcasted successfully to active lobby board!");
                  }
                }}
                className="w-full py-2 bg-purple-600 hover:bg-purple-550 text-white font-extrabold text-[10px] rounded-lg tracking-wider transition uppercase"
              >
                Send global lobby chat
              </button>
            </div>

            <div className="bg-black/25 p-4 rounded-xl border border-white/5 space-y-3 font-sans flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-purple-400 font-extrabold uppercase block mb-2">2. Fast Broadcast Presets</span>
                <p className="text-[10px] text-gray-500 mb-3">Click any preset to broadcast dynamic messages to all open trade logs instantly.</p>
                
                <div className="space-y-1.5">
                  {[
                    "⚠️ Platform Alert: Swift bank wire accounts settlement completed for the day.",
                    "📈 ApexTrade Intelligence: Standard Gold options represent overbuy RSI anomalies.",
                    "⚡ Trading Notice: Multi-currency copy allocations undergo custom margin checks today."
                  ].map(pst => (
                    <button
                      key={pst}
                      onClick={() => {
                        onBroadcastAnnouncement(pst);
                        alert("Preset broadcast dispatched.");
                      }}
                      className="w-full text-left p-2 bg-[#121212]/50 hover:bg-[#1f162e] border border-white/5 rounded-lg text-[9px] text-slate-300 transition block truncate"
                    >
                      {pst}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-purple-950/20 p-2.5 rounded-lg border border-purple-550/10 text-[9px] text-purple-400">
                ⭐ Broadcaster injects the messages directly into the community chat feed state so active traders will respond to artificial announcements in real-time!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
