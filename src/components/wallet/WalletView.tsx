import React, { useState, useEffect } from 'react';
import { WalletTransaction, WithdrawalRequest } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useApp } from '../../context/AppContext.tsx';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Copy,
  Check,
  Percent,
  RefreshCw,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export const WalletView: React.FC = () => {
  const { wallet, settings, showToast, refreshUserData, currentUser } = useApp();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Withdrawal Drawer
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawPoints, setWithdrawPoints] = useState<number>(1000);
  const [upiId, setUpiId] = useState('');
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);

  // Selected Transaction for receipt view
  const [selectedTxn, setSelectedTxn] = useState<WalletTransaction | null>(null);

  const loadWallet = async () => {
    setIsLoading(true);
    try {
      const data = await api.getWalletData();
      setTransactions(data.transactions || []);
      setWithdrawals(data.withdrawals || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load wallet transactions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const pointsPerInr = settings?.pointsPerInr || 100;
  const minPoints = settings?.minimumWithdrawalPoints || 1000;
  const feePercentage = settings?.withdrawalFeePercentage || 3;

  const availableInr = wallet ? (wallet.availablePoints / pointsPerInr).toFixed(2) : '0.00';
  const pendingInr = wallet ? (wallet.pendingPoints / pointsPerInr).toFixed(2) : '0.00';
  const reservedInr = wallet ? (wallet.reservedWithdrawalPoints / pointsPerInr).toFixed(2) : '0.00';
  const lifetimeEarnedInr = wallet ? (wallet.lifetimeEarnedPoints / pointsPerInr).toFixed(2) : '0.00';
  const lifetimeWithdrawnInr = wallet ? (wallet.lifetimeWithdrawnPoints / pointsPerInr).toFixed(2) : '0.00';

  // Fee calculation for current withdraw input
  const grossInr = withdrawPoints / pointsPerInr;
  const feeInr = Math.round((grossInr * (feePercentage / 100)) * 100) / 100;
  const netInr = Math.round((grossInr - feeInr) * 100) / 100;

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId.trim()) {
      return showToast('Please enter a valid UPI ID', 'error');
    }
    if (withdrawPoints < minPoints) {
      return showToast(`Minimum withdrawal is ${minPoints} points (₹${(minPoints / pointsPerInr).toFixed(2)})`, 'error');
    }
    if ((wallet?.availablePoints || 0) < withdrawPoints) {
      return showToast('Insufficient available balance', 'error');
    }

    setIsSubmittingWithdrawal(true);
    try {
      const res = await api.requestWithdrawal(withdrawPoints, upiId.trim());
      showToast('Withdrawal queued! Points reserved atomically.', 'success');
      setIsWithdrawModalOpen(false);
      await refreshUserData();
      await loadWallet();
    } catch (err: any) {
      showToast(err.message || 'Withdrawal request failed', 'error');
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const filteredTxns = transactions.filter(t => {
    if (filterType === 'REWARDS') return t.points > 0;
    if (filterType === 'WITHDRAWALS') return t.type === 'WITHDRAWAL';
    if (filterType === 'REFUNDS') return t.type === 'REVERSAL' || t.type === 'ADJUSTMENT';
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto no-scrollbar p-3 max-w-md mx-auto w-full space-y-4">
      {/* Primary Wallet Balance Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider">Available Balance</span>
          <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
            100 pts = ₹1.00
          </span>
        </div>

        <div className="flex items-baseline space-x-2 mt-2">
          <span className="text-3xl font-black text-white">₹{availableInr}</span>
          <span className="text-sm font-bold text-amber-400 font-mono">
            {wallet?.availablePoints || 0} pts
          </span>
        </div>

        {/* Breakdown: Pending & Escrow */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Pending Verification</span>
            <span className="text-xs font-bold text-slate-200 font-mono mt-0.5 block">
              {wallet?.pendingPoints || 0} pts (₹{pendingInr})
            </span>
          </div>

          <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Reserved for Payout</span>
            <span className="text-xs font-bold text-amber-400 font-mono mt-0.5 block">
              {wallet?.reservedWithdrawalPoints || 0} pts (₹{reservedInr})
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-1">
          <button
            onClick={() => setIsWithdrawModalOpen(true)}
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/25 transition-transform active:scale-98"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[3]" />
            <span>Withdraw via UPI (Min ₹10)</span>
          </button>
        </div>

        {/* Lifetime summary */}
        <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400">
          <span>Lifetime Earned: ₹{lifetimeEarnedInr}</span>
          <span>Lifetime Withdrawn: ₹{lifetimeWithdrawnInr}</span>
        </div>
      </div>

      {/* UPI Withdrawal Rules & Notice */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-left space-y-1.5">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Controlled Payout Policy</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          • Minimum: 1,000 points (₹10.00). Maximum 3 requests/day.<br />
          • Payout fee: 3% deducted for banking verification.<br />
          • Points are reserved atomically in escrow. If declined, points are 100% refunded.
        </p>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-3 text-left">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Immutable Ledger ({transactions.length})</span>
          </h3>

          <button
            onClick={loadWallet}
            className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          {['ALL', 'REWARDS', 'WITHDRAWALS', 'REFUNDS'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                filterType === type
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading ledger...</div>
          ) : filteredTxns.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
              No transactions recorded in this category.
            </div>
          ) : (
            filteredTxns.map(t => {
              const isCredit = t.points > 0;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTxn(t)}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isCredit
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block truncate">{t.source}</span>
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-mono">
                          {new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>•</span>
                        <span
                          className={`font-semibold ${
                            t.status === 'COMPLETED'
                              ? 'text-emerald-400'
                              : t.status === 'PENDING'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-extrabold font-mono block ${
                        isCredit ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {isCredit ? '+' : ''}
                      {t.points} pts
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      {isCredit ? '+' : '-'}₹{Math.abs(t.amountInr).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Withdrawal Modal (UPI) */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  ₹
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Withdraw to UPI</h3>
                  <span className="text-[10px] text-amber-400 font-mono">Test Mode Provider</span>
                </div>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="mt-4 space-y-4">
              {/* UPI ID Field */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  UPI ID (Virtual Payment Address)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  placeholder="e.g. 9876543210@paytm or user@okhdfcbank"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Supports Google Pay, PhonePe, Paytm, BHIM, or any bank UPI handle.
                </span>
              </div>

              {/* Points Amount Picker */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-200">Points to Withdraw</label>
                  <span className="text-[10px] text-amber-400 font-mono">
                    Avail: {wallet?.availablePoints || 0} pts
                  </span>
                </div>

                <input
                  type="number"
                  min={minPoints}
                  step={100}
                  value={withdrawPoints}
                  onChange={e => setWithdrawPoints(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-extrabold text-white font-mono focus:outline-none focus:border-amber-500"
                />

                {/* Quick select chips */}
                <div className="flex items-center space-x-1.5 mt-2">
                  {[1000, 2000, 5000].map(amt => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setWithdrawPoints(amt)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                        withdrawPoints === amt
                          ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                          : 'border-slate-800 bg-slate-800 text-slate-400'
                      }`}
                    >
                      {amt} pts (₹{amt / pointsPerInr})
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee Breakdown Card */}
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Value:</span>
                  <span className="font-mono text-slate-200">₹{grossInr.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Verification & Bank Fee (3%):</span>
                  <span className="font-mono text-rose-400">-₹{feeInr.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-1.5 border-t border-slate-700">
                  <span className="text-amber-400">Net Payout to Bank:</span>
                  <span className="font-mono text-emerald-400 text-sm">₹{netInr.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-start space-x-2 text-[10px] text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  {withdrawPoints} points will be atomically placed in escrow. You will be notified once bank transfer is confirmed.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmittingWithdrawal || withdrawPoints < minPoints || (wallet?.availablePoints || 0) < withdrawPoints}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-95"
              >
                {isSubmittingWithdrawal ? 'Queuing Escrow...' : `Confirm Withdrawal of ₹${netInr.toFixed(2)}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Receipt Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction Receipt</span>
              <button onClick={() => setSelectedTxn(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="text-center py-2">
                <span className="text-2xl font-black text-white font-mono block">
                  {selectedTxn.points > 0 ? '+' : ''}{selectedTxn.points} Points
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  (₹{Math.abs(selectedTxn.amountInr).toFixed(2)})
                </span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="font-mono text-slate-200 font-semibold">{selectedTxn.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="font-mono text-amber-400 font-bold">{selectedTxn.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-emerald-400">{selectedTxn.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reference:</span>
                  <span className="font-mono text-slate-300">{selectedTxn.referenceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="font-mono text-slate-300">
                    {new Date(selectedTxn.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic bg-slate-850 p-2 rounded-lg border border-slate-800">
                "{selectedTxn.description}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
