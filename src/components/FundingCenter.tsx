import React, { useState } from 'react';
import { Wallet, ArrowDown, ArrowUp, CheckCircle, Clock, XCircle, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { UserProfile, FundingTransaction } from '../types';

interface FundingCenterProps {
  balance: number;
  freeMargin: number;
  userProfile: UserProfile;
  fundingTransactions: FundingTransaction[];
  onSubmitTransaction: (tx: { type: 'deposit' | 'withdrawal'; amount: number; method: string; destinationDetails: string }) => void;
}

export default function FundingCenter({
  balance,
  freeMargin,
  userProfile,
  fundingTransactions,
  onSubmitTransaction
}: FundingCenterProps) {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState<string>('1000');
  const [method, setMethod] = useState<string>('USDT (TRC20)');
  const [address, setAddress] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [bankAccount, setBankAccount] = useState<string>('');
  const [txNote, setTxNote] = useState<string>('');

  const cryptoAddresses: Record<string, string> = {
    'USDT (TRC20)': 'TYD98xP7A6v5SdfS8A9Q3mD6k1oPvLwRbc',
    'USDT (ERC20)': '0x7a6be68d998d35f470bf2cd909873d6bb6c1234c',
    'Bitcoin (BTC)': '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
    'Ethereum (ETH)': '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
  };

  const myTransactions = fundingTransactions.filter(
    tx => tx.email.toLowerCase() === userProfile.email.toLowerCase()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    if (activeTab === 'withdraw' && amt > freeMargin) {
      alert(`Insufficient available collateral. Maximum withdrawable right now is $${freeMargin.toFixed(2)}`);
      return;
    }

    let destinationDetails = '';
    if (method.includes('USDT') || method.includes('Bitcoin') || method.includes('Ethereum')) {
      destinationDetails = address || cryptoAddresses[method] || 'Dynamic Crypto Wallet';
    } else if (method.includes('Wire')) {
      destinationDetails = `Bank: ${bankName}, Acc: ${bankAccount}`;
    } else {
      destinationDetails = `Card: **** **** **** ${cardNumber.slice(-4) || '9872'}, Holder: ${cardHolder || 'Self'}`;
    }

    if (txNote) {
      destinationDetails += ` | Note: ${txNote}`;
    }

    onSubmitTransaction({
      type: activeTab,
      amount: amt,
      method,
      destinationDetails
    });

    // Reset fields
    setAmount('1000');
    setAddress('');
    setBankName('');
    setBankAccount('');
    setCardNumber('');
    setCardHolder('');
    setTxNote('');
  };

  return (
    <div className="space-y-6 font-sans animation-fade-in" id="funding-center-view">
      {/* WALLET METRICS BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute right-4 top-4 text-emerald-500/10">
            <Wallet className="w-16 h-16" />
          </div>
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Trading Escrow Balance</span>
          <h2 className="text-2xl font-mono font-bold text-white mt-1">
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
          <p className="text-[10px] text-gray-400 mt-2">Available ledger margin for live trading collateral.</p>
        </div>

        <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Withdrawable Available Cash</span>
          <h2 className="text-2xl font-mono font-bold text-[#34d399] mt-1">
            ${freeMargin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
          <p className="text-[10px] text-gray-400 mt-2">Free capital not locked in open trades or copy trading strategies.</p>
        </div>

        <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Account Security Escrow</span>
          <div className="flex items-center gap-1.5 mt-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-emerald-450 uppercase">Tier-1 Cold Vault Verified</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-3.5">Brokerage backed by multichain algorithmic proof of reserves.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ACTION PANEL FORM */}
        <div className="lg:col-span-2 bg-[#121212] border border-white/5 rounded-2xl p-5">
          <div className="flex bg-black/40 p-1 rounded-xl mb-5">
            <button
              onClick={() => {
                setActiveTab('deposit');
                setMethod('USDT (TRC20)');
              }}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg cursor-pointer transition ${
                activeTab === 'deposit' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <ArrowDown className="w-3.5 h-3.5 inline mr-1.5 align-middle" />
              Deposit Funds
            </button>
            <button
              onClick={() => {
                setActiveTab('withdraw');
                setMethod('USDT (TRC20)');
              }}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg cursor-pointer transition ${
                activeTab === 'withdraw' ? 'bg-rose-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5 inline mr-1.5 align-middle" />
              Withdraw Cash
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">
                Funding Protocol Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="USDT (TRC20)">USDT (TRC20) - Instant Blockchain</option>
                <option value="USDT (ERC20)">USDT (ERC20) - Ethereum ERC20</option>
                <option value="Bitcoin (BTC)">Bitcoin (BTC) - Decoupled Network</option>
                <option value="Ethereum (ETH)">Ethereum (ETH) - Ethereum Network</option>
                <option value="Bank Wire Transfer">Bank Wire Swift Transfer (1-3 Days)</option>
                <option value="Credit / Debit Card">Credit / Debit Card (Visa/Master)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-500">
                  Amount to transfer ($)
                </label>
                {activeTab === 'withdraw' && (
                  <span className="text-[9px] text-[#34d399] font-mono">
                    Max: ${freeMargin.toFixed(2)}
                  </span>
                )}
              </div>
              <input
                type="number"
                min="10"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-sm font-mono tracking-tight text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* DYNAMIC SUBSECTION FOR METHODS */}
            {(method.includes('USDT') || method.includes('Bitcoin') || method.includes('Ethereum')) && (
              <div className="bg-black/25 p-3 rounded-xl border border-white/5">
                {activeTab === 'deposit' ? (
                  <div className="space-y-3">
                    <span className="text-[9px] block text-amber-400 font-bold uppercase tracking-wider">
                      ★ Send Exactly to our Brokerage Vault:
                    </span>
                    <div className="bg-black/80 px-2 py-1.5 rounded border border-white/5 text-[10px] font-mono select-all text-white break-all">
                      {cryptoAddresses[method] || 'No address loaded'}
                    </div>
                    <p className="text-[9px] text-gray-500">
                      Submit your transaction details below after making payment from your crypto wallet.
                    </p>
                    <div>
                      <span className="text-[9px] block text-gray-400 uppercase font-bold mb-1">
                        Your Wallet Address / TX Hash
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. TxHash or Wallet ID address"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-[9px] block text-rose-400 font-bold uppercase">
                      ★ Enter Your Private Receiving Address:
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Your TRC20 address or BTC mainnet ID"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                    <p className="text-[9px] text-gray-550 leading-relaxed">
                      Funds will clear automatically to this exact address once authorized by the auditing desk.
                    </p>
                  </div>
                )}
              </div>
            )}

            {method.includes('Wire') && (
              <div className="bg-black/25 p-3 rounded-xl border border-white/5 space-y-3">
                <span className="text-[9px] block text-amber-400 font-bold uppercase">
                  Bank Swift Routing details
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] text-gray-400 block uppercase font-bold mb-0.5">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. JPMorgan Chase"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-gray-400 block uppercase font-bold mb-0.5">Account / IBAN</label>
                    <input
                      type="text"
                      placeholder="e.g. US98 2121 ..."
                      required
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {method.includes('Card') && (
              <div className="bg-black/25 p-3 rounded-xl border border-white/5 space-y-3">
                <span className="text-[9px] block text-blue-400 font-bold uppercase">
                  Card Holder Credentials
                </span>
                <div className="space-y-2">
                  <div>
                    <label className="text-[8px] text-gray-400 block uppercase font-bold mb-0.5">Full Name</label>
                    <input
                      type="text"
                      placeholder="Full Name as on Visa card"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full bg-black/50 border border-white/5 rounded-lg px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-gray-400 block uppercase font-bold mb-0.5">Card Number</label>
                    <input
                      type="text"
                      placeholder="4000 1234 5678 9010"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-black/50 border border-white/5 rounded-lg px-2 py-1 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">
                Auditor memorandum / reference reference
              </label>
              <input
                type="text"
                placeholder="optional memo comment for prompt audit"
                value={txNote}
                onChange={(e) => setTxNote(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-2.5 py-2 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition shadow hover:brightness-110 active:scale-[0.98] ${
                activeTab === 'deposit' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-rose-600 text-white'
              }`}
            >
              Submit Transfer request
            </button>
          </form>
        </div>

        {/* LEDGER OF USER TRANSACTIONS */}
        <div className="lg:col-span-3 bg-[#121212] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-gray-250">
                Funding & Withdrawals Log
              </h3>
              <span className="text-[10px] text-gray-500 font-mono">
                {myTransactions.length} items logged
              </span>
            </div>

            {myTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-8 h-8 text-slate-650 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400">No funding operations in system yet.</p>
                <p className="text-[10px] text-slate-550 max-w-xs mx-auto mt-1">
                  Deposited assets are verified securely by our administrator desk for live account backing.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse mt-3">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                      <th className="pb-2">Date / Time</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Method</th>
                      <th className="pb-2 text-right">Amount</th>
                      <th className="pb-2 text-center pl-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 pt-1 text-xs">
                    {myTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-white/[0.01]">
                        <td className="py-3 text-[10px] text-gray-400 font-mono whitespace-nowrap">
                          {tx.timestamp}
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            tx.type === 'deposit' ? 'text-blue-400 bg-blue-500/10' : 'text-rose-450 bg-rose-500/10'
                          }`}>
                            {tx.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                          </span>
                        </td>
                        <td className="py-3 font-medium text-slate-200">
                          <span className="block text-xs">{tx.method}</span>
                          <span className="block text-[9px] text-slate-500 truncate max-w-[140px]" title={tx.destinationDetails}>
                            {tx.destinationDetails}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-slate-350 font-mono">
                          ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-col items-center">
                            {tx.status === 'pending' && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold animate-pulse">
                                Pending Approval
                              </span>
                            )}
                            {tx.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                <CheckCircle className="w-2.5 h-2.5 shrink-0" /> Approved
                              </span>
                            )}
                            {tx.status === 'declined' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-450 text-[10px] font-bold">
                                <XCircle className="w-2.5 h-2.5 shrink-0" /> Declined
                              </span>
                            )}
                            {tx.comment && (
                              <span className="block text-[8px] text-slate-450 mt-1 max-w-[120px] text-center italic truncate" title={tx.comment}>
                                "{tx.comment}"
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 bg-black/10 p-3 rounded-xl flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-500 leading-normal">
              <strong>Need help with credit audit?</strong> Deposits and withdrawals submit directly to the platform auditor module. To practice balance management, navigate to the <span className="text-white">Admin Control Room</span> and click "Approve" next to your pending operations. Balance shifts instantly!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
