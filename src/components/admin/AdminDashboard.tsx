import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { api } from '../../services/api.ts';
import {
  FinancialAnalytics,
  Video,
  WithdrawalRequest,
  SystemSettings,
  AuditLog,
  AntiFraudFlag,
  AIFeedbackRecord,
  CategoryRewardLimit,
  RewardLimitCategory,
  BreachAction,
  AuthProviderStatus,
} from '../../types/index.ts';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Film,
  ArrowUpRight,
  Settings,
  Sliders,
  Activity,
  CheckCircle2,
  XCircle,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  Check,
  X,
  FileText,
  DollarSign,
  PieChart,
  Eye,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Gauge,
  SlidersHorizontal,
  Layers,
  Lock,
  Unlock,
  Tv,
  Download,
  FileQuestion,
  Gamepad2,
  ShoppingBag,
  Users,
  Coins,
  Zap,
  Flame,
  ShieldAlert,
  Smartphone,
  BarChart3,
  Radio,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { currentUser, showToast, refreshUserData, settings } = useApp();
  const [adminTab, setAdminTab] = useState<
    'financials' | 'reward_limits' | 'auth_status' | 'moderation' | 'withdrawals' | 'settings' | 'emergency' | 'audit' | 'fraud' | 'ai_feedback'
  >('financials');

  const [providerStatus, setProviderStatus] = useState<AuthProviderStatus | null>(null);

  const [timeFilter, setTimeFilter] = useState<'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LIFETIME'>('LAST_30_DAYS');
  const [financials, setFinancials] = useState<FinancialAnalytics | null>(null);
  const [pendingVideos, setPendingVideos] = useState<Video[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<WithdrawalRequest[]>([]);
  const [settingsState, setSettingsState] = useState<SystemSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [fraudFlags, setFraudFlags] = useState<AntiFraudFlag[]>([]);
  const [aiFeedback, setAiFeedback] = useState<AIFeedbackRecord[]>([]);
  const [rewardLimits, setRewardLimits] = useState<CategoryRewardLimit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Global Reward Limits editing state
  const [editingLimit, setEditingLimit] = useState<CategoryRewardLimit | null>(null);
  const [categoryLimitFilter, setCategoryLimitFilter] = useState<'ALL' | RewardLimitCategory>('ALL');
  const [isApplyingPreset, setIsApplyingPreset] = useState(false);
  const [autoRefreshLimits, setAutoRefreshLimits] = useState(false);
  const [simulatingCategory, setSimulatingCategory] = useState<string | null>(null);
  const [simulatingAmount, setSimulatingAmount] = useState<number>(5000);
  const [editLimitForm, setEditLimitForm] = useState<{
    dailyCapPoints: number;
    weeklyCapPoints: number;
    monthlyCapPoints: number;
    perUserDailyCapPoints: number;
    perUserMonthlyCapPoints: number;
    actionOnBreach: BreachAction;
    notes: string;
    reason: string;
  }>({
    dailyCapPoints: 50000,
    weeklyCapPoints: 300000,
    monthlyCapPoints: 1200000,
    perUserDailyCapPoints: 150,
    perUserMonthlyCapPoints: 3000,
    actionOnBreach: 'PAUSE_CATEGORY',
    notes: '',
    reason: '',
  });
  const [isSavingLimit, setIsSavingLimit] = useState(false);

  // Rejection modal
  const [rejectingItem, setRejectingItem] = useState<{ type: 'VIDEO' | 'WITHDRAWAL'; id: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fin, mod, withdr, sett, logs, fraud, aiFb, limitsRes, provStatus] = await Promise.all([
        api.getAdminFinancials(timeFilter),
        api.getAdminModeration(),
        api.getAdminWithdrawals(),
        api.getAdminSettings(),
        api.getAdminAuditLogs(),
        api.getAdminFraudFlags(),
        api.getAdminAIFeedback(),
        api.getAdminRewardLimits(),
        api.getProviderStatus().catch(() => null),
      ]);

      setFinancials(fin);
      setPendingVideos(mod.pendingVideos || []);
      setWithdrawalsList(withdr.withdrawals || []);
      setSettingsState(sett.settings);
      setAuditLogs(logs.logs || []);
      setFraudFlags(fraud.flags || []);
      setAiFeedback(aiFb.feedback || []);
      setRewardLimits(limitsRes.limits || []);
      if (provStatus) setProviderStatus(provStatus);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to load admin data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeFilter]);

  // Reward Limits Handlers
  const handleOpenEditLimit = (limit: CategoryRewardLimit) => {
    setEditingLimit(limit);
    setEditLimitForm({
      dailyCapPoints: limit.dailyCapPoints,
      weeklyCapPoints: limit.weeklyCapPoints,
      monthlyCapPoints: limit.monthlyCapPoints,
      perUserDailyCapPoints: limit.perUserDailyCapPoints,
      perUserMonthlyCapPoints: limit.perUserMonthlyCapPoints,
      actionOnBreach: limit.actionOnBreach,
      notes: limit.notes || '',
      reason: `Adjusted caps for ${limit.categoryLabel}`,
    });
  };

  const handleSaveLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLimit) return;
    setIsSavingLimit(true);
    try {
      const res = await api.updateAdminRewardLimit(
        editingLimit.category,
        {
          dailyCapPoints: Number(editLimitForm.dailyCapPoints),
          weeklyCapPoints: Number(editLimitForm.weeklyCapPoints),
          monthlyCapPoints: Number(editLimitForm.monthlyCapPoints),
          perUserDailyCapPoints: Number(editLimitForm.perUserDailyCapPoints),
          perUserMonthlyCapPoints: Number(editLimitForm.perUserMonthlyCapPoints),
          actionOnBreach: editLimitForm.actionOnBreach,
          notes: editLimitForm.notes,
        },
        editLimitForm.reason || 'Admin updated reward caps'
      );

      setRewardLimits(prev =>
        prev.map(l => (l.category === editingLimit.category ? res.limit : l))
      );
      showToast(`Saved reward caps for ${res.limit.categoryLabel}!`, 'success');
      setEditingLimit(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save reward limits', 'error');
    } finally {
      setIsSavingLimit(false);
    }
  };

  const handleToggleLimit = async (category: RewardLimitCategory) => {
    try {
      const res = await api.toggleAdminRewardLimit(category);
      setRewardLimits(prev =>
        prev.map(l => (l.category === category ? res.limit : l))
      );
      showToast(
        `${res.limit.categoryLabel} rewards ${res.limit.enabled ? 'Enabled' : 'Paused'}`,
        res.limit.enabled ? 'success' : 'info'
      );
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle category', 'error');
    }
  };

  const handleResetCounters = async (period: 'DAILY' | 'WEEKLY' | 'MONTHLY') => {
    try {
      const res = await api.resetAdminRewardLimitCounters(undefined, period);
      setRewardLimits(res.limits);
      showToast(`Reset ${period.toLowerCase()} counters for testing`, 'info');
      await loadData();
    } catch (err: any) {
      showToast('Failed to reset counters', 'error');
    }
  };

  const handleResetSingleCategory = async (category: RewardLimitCategory) => {
    try {
      const res = await api.resetAdminRewardLimitCounters(category, 'DAILY');
      setRewardLimits(res.limits);
      showToast(`Reset daily distribution counter for ${category}`, 'info');
    } catch (err: any) {
      showToast('Failed to reset counter', 'error');
    }
  };

  const handleApplyPreset = async (preset: 'CONSERVATIVE' | 'BALANCED' | 'GROWTH') => {
    setIsApplyingPreset(true);
    try {
      const res = await api.applyAdminRewardLimitPreset(preset);
      setRewardLimits(res.limits);
      showToast(`Applied ${preset} economic limits preset!`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to apply preset', 'error');
    } finally {
      setIsApplyingPreset(false);
    }
  };

  const handleSimulateLoad = async (category: RewardLimitCategory, points: number) => {
    setSimulatingCategory(category);
    try {
      const res = await api.simulateAdminRewardLimitLoad(category, points);
      setRewardLimits(res.limits);
      if (res.breached) {
        showToast(`⚠️ Cap Breached! ${res.limit.categoryLabel} circuit breaker triggered.`, 'error');
      } else {
        showToast(`+${points.toLocaleString()} pts test load applied to ${res.limit.categoryLabel}`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to simulate load', 'error');
    } finally {
      setSimulatingCategory(null);
    }
  };

  // Real-time telemetry auto-refresh
  useEffect(() => {
    if (!autoRefreshLimits || adminTab !== 'reward_limits') return;
    const interval = setInterval(async () => {
      try {
        const res = await api.getAdminRewardLimits();
        if (res.limits) setRewardLimits(res.limits);
      } catch (e) {}
    }, 3500);
    return () => clearInterval(interval);
  }, [autoRefreshLimits, adminTab]);

  // Economic pressure calculator
  const getEconomicPressure = (dailyPct: number, weeklyPct: number, isEnabled: boolean) => {
    if (!isEnabled) {
      return {
        level: 'BREACHED',
        label: 'CIRCUIT BREAKER (PAUSED)',
        badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
        borderClass: 'border-rose-900/60 bg-rose-950/20',
        barColor: 'bg-rose-500',
        textColor: 'text-rose-400',
        description: 'Category distribution paused to protect gross margin and prevent deficit risk.',
      };
    }
    const maxPct = Math.max(dailyPct, weeklyPct);
    if (maxPct >= 100) {
      return {
        level: 'BREACHED',
        label: 'CAP EXHAUSTED (100%+)',
        badgeClass: 'bg-rose-500/25 text-rose-300 border border-rose-500/50 animate-pulse',
        borderClass: 'border-rose-700 bg-rose-950/20 shadow-rose-900/30',
        barColor: 'bg-rose-500',
        textColor: 'text-rose-400',
        description: 'Allocated budget fully consumed. Circuit breaker active to halt further unbudgeted payouts.',
      };
    }
    if (maxPct >= 85) {
      return {
        level: 'CRITICAL',
        label: 'CRITICAL PRESSURE',
        badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
        borderClass: 'border-rose-700/60 bg-slate-900',
        barColor: 'bg-rose-500',
        textColor: 'text-rose-400',
        description: 'High velocity burn rate. Exceeding 85% of ceiling. Automatic circuit breaker imminent.',
      };
    }
    if (maxPct >= 65) {
      return {
        level: 'HIGH',
        label: 'HIGH PRESSURE',
        badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        borderClass: 'border-amber-700/50 bg-slate-900',
        barColor: 'bg-amber-500',
        textColor: 'text-amber-400',
        description: 'Elevated distribution pace. Exceeding 65% of cap. Monitor user acquisition and eCPM yield.',
      };
    }
    if (maxPct >= 40) {
      return {
        level: 'MODERATE',
        label: 'MODERATE PRESSURE',
        badgeClass: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
        borderClass: 'border-slate-800 bg-slate-900',
        barColor: 'bg-blue-500',
        textColor: 'text-blue-400',
        description: 'Normal economic distribution pace. Well within projected gross margin targets.',
      };
    }
    return {
      level: 'LOW',
      label: 'LOW PRESSURE (OPTIMAL)',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      borderClass: 'border-slate-800 bg-slate-900',
      barColor: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      description: 'Optimal economics. Deep platform margin buffer intact. Zero financial deficit risk.',
    };
  };

  // Video Moderation Actions
  const handleModerateVideo = async (videoId: string, action: 'APPROVE' | 'REJECT' | 'REMOVE', reason?: string) => {
    try {
      await api.resolveModeration(videoId, action, reason);
      showToast(`Video ${action.toLowerCase()}d successfully`, 'success');
      setPendingVideos(prev => prev.filter(v => v.id !== videoId));
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  // Withdrawal Actions
  const handleResolveWithdrawal = async (id: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
    try {
      await api.resolveWithdrawal(id, action, reason);
      showToast(
        action === 'APPROVE'
          ? 'Withdrawal approved & payout simulated!'
          : 'Withdrawal rejected and points refunded to user available balance.',
        action === 'APPROVE' ? 'success' : 'info'
      );
      setWithdrawalsList(prev =>
        prev.map(w =>
          w.id === id ? { ...w, status: action === 'APPROVE' ? 'COMPLETED' : 'REJECTED' } : w
        )
      );
      await loadData();
      await refreshUserData();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  // Emergency Pause Toggles
  const handleEmergencyToggle = async (target: string, currentState: boolean) => {
    try {
      await api.setEmergencyPause(target, !currentState, 'Admin toggled emergency switch');
      showToast(`Emergency control updated for ${target}`, 'info');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle pause', 'error');
    }
  };

  // Settings Update
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsState) return;
    try {
      await api.updateAdminSettings(settingsState, 'Updated via Admin Settings panel');
      showToast('Settings saved and recorded in audit log!', 'success');
      await refreshUserData();
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    }
  };

  const pendingWithdrawalsCount = withdrawalsList.filter(w => w.status === 'REQUESTED').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto no-scrollbar p-3 max-w-2xl mx-auto w-full space-y-4 text-left">
      {/* Admin Cockpit Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-extrabold text-white">Platform Admin Cockpit</h2>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-1.5 py-0.2 rounded border border-purple-500/30">
                Authorized
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Economics, Moderation, Loss Protection & Audit Logs</p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 border border-slate-700"
          title="Refresh metrics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'financials', label: 'Financials & Profit', icon: <TrendingUp className="w-3.5 h-3.5" /> },
          { id: 'reward_limits', label: 'Global Reward Limits', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
          { id: 'auth_status', label: 'Auth & SMS Provider', icon: <Smartphone className="w-3.5 h-3.5" /> },
          { id: 'moderation', label: `Video Moderation (${pendingVideos.length})`, icon: <Film className="w-3.5 h-3.5" /> },
          { id: 'withdrawals', label: `UPI Withdrawals (${pendingWithdrawalsCount})`, icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
          { id: 'emergency', label: 'Loss & Emergency', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
          { id: 'settings', label: 'Settings & Rates', icon: <Settings className="w-3.5 h-3.5" /> },
          { id: 'audit', label: 'Audit Logs', icon: <FileText className="w-3.5 h-3.5" /> },
          { id: 'ai_feedback', label: 'AI Analytics', icon: <MessageSquare className="w-3.5 h-3.5" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setAdminTab(tab.id as any)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors ${
              adminTab === tab.id
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 1. FINANCIALS & NET PROFIT VIEW */}
      {adminTab === 'financials' && (
        <div className="space-y-4">
          {/* Time Filter Pills */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-semibold">Filter:</span>
            {(['TODAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'LIFETIME'] as const).map(f => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                  timeFilter === f
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {f.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* High-Level P&L Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Verified Revenue</span>
              <span className="text-lg font-black text-white block mt-1">
                ₹{(financials?.totalVerifiedRevenue || 0).toLocaleString()}
              </span>
              <span className="text-[9px] text-emerald-400">100% Verified Events</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">User Rewards Paid</span>
              <span className="text-lg font-black text-amber-400 block mt-1">
                ₹{(financials?.totalUserRewards || 0).toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-400">Controlled allocation</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Platform Gross Share</span>
              <span className="text-lg font-black text-blue-400 block mt-1">
                ₹{(financials?.grossPlatformShare || 0).toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-400">70% Platform cut</span>
            </div>

            <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 p-3 rounded-2xl">
              <span className="text-[10px] text-emerald-400 uppercase font-bold">Actual Net Profit</span>
              <span className="text-xl font-black text-emerald-300 block mt-1">
                ₹{(financials?.actualNetProfit || 0).toLocaleString()}
              </span>
              <span className="text-[9px] text-emerald-400 font-semibold">After all expenses</span>
            </div>
          </div>

          {/* Critical Accounting Clarification */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <p className="font-bold text-amber-400">Accounting Accuracy Notice:</p>
            <p>
              • <strong>Gross Platform Share (₹{(financials?.grossPlatformShare || 0).toLocaleString()}):</strong> Total retained after rewarding creators and viewers.
              <br />
              • <strong>Operating Expenses (₹{(financials?.totalProviderExpenses || 0).toLocaleString()}):</strong> Video CDN bandwidth, cloud database, MMP attribution SDKs, and banking IMPS charges.
              <br />
              • <strong>Actual Net Profit (₹{(financials?.actualNetProfit || 0).toLocaleString()}):</strong> Platform Gross Share minus Provider Operating Expenses. (Gross Platform Share is NEVER mislabeled as Net Profit).
            </p>
          </div>

          {/* Source-wise Revenue & Profit Breakdown Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <PieChart className="w-4 h-4 text-purple-400" />
              <span>Source-Wise Revenue & Profit Breakdown</span>
            </h3>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                    <th className="pb-2">Revenue Source</th>
                    <th className="pb-2 text-right">Verified Rev</th>
                    <th className="pb-2 text-right">User Rewards</th>
                    <th className="pb-2 text-right">Expenses</th>
                    <th className="pb-2 text-right text-emerald-400">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {financials?.sourceBreakdown.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-850/50">
                      <td className="py-2.5 font-sans font-semibold text-slate-200">{s.sourceName}</td>
                      <td className="py-2.5 text-right text-white">₹{s.verifiedRevenueInr.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-amber-400">₹{s.userRewardsInr.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-slate-400">₹{s.providerOperatingExpensesInr.toLocaleString()}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-400">₹{s.actualNetProfitInr.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. GLOBAL REWARD LIMITS DASHBOARD VIEW */}
      {adminTab === 'reward_limits' && (
        <div className="space-y-4">
          {/* Header Policy Banner & Real-Time Sync Controls */}
          <div className="p-4 bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/30 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Global Reward Limits & Controlled Economics
                  </h3>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                    Live Enforced
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  Real-time economic monitoring across earning channels (Watch & Earn, Ads, Tasks, Surveys, Games, Referrals). Daily, weekly, and monthly caps guarantee platform solvency, positive gross margins, and per-user velocity protection.
                </p>
              </div>
            </div>

            {/* Telemetry Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setAutoRefreshLimits(!autoRefreshLimits)}
                className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold flex items-center space-x-1.5 transition-colors ${
                  autoRefreshLimits
                    ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="Toggle continuous live telemetry polling every 3.5s"
              >
                <Radio className={`w-3 h-3 ${autoRefreshLimits ? 'animate-pulse text-emerald-400' : 'text-slate-400'}`} />
                <span>{autoRefreshLimits ? 'Auto-Sync: ON (3.5s)' : 'Auto-Sync: OFF'}</span>
              </button>

              <button
                onClick={loadData}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold flex items-center space-x-1"
                title="Refresh metrics immediately"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>

              <button
                onClick={() => handleResetCounters('DAILY')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold"
                title="Reset daily test counters to zero for simulation"
              >
                Reset Daily Counts
              </button>
            </div>
          </div>

          {/* Economic Presets & Global Risk Profiles */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-white block">Economic Risk Profiles (Quick Presets)</span>
                <span className="text-[10px] text-slate-400 block">Apply standardized margin protection ceilings across all 8 earning channels</span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                disabled={isApplyingPreset}
                onClick={() => handleApplyPreset('CONSERVATIVE')}
                className="px-2.5 py-1.2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40 text-[10px] font-bold transition-all disabled:opacity-50"
              >
                🛡️ Conservative (-40% Caps)
              </button>
              <button
                disabled={isApplyingPreset}
                onClick={() => handleApplyPreset('BALANCED')}
                className="px-2.5 py-1.2 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 border border-blue-800/40 text-[10px] font-bold transition-all disabled:opacity-50"
              >
                ⚖️ Balanced (Baseline)
              </button>
              <button
                disabled={isApplyingPreset}
                onClick={() => handleApplyPreset('GROWTH')}
                className="px-2.5 py-1.2 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-800/40 text-[10px] font-bold transition-all disabled:opacity-50"
              >
                🚀 Growth (+50% Caps)
              </button>
            </div>
          </div>

          {/* Master Platform Safety Gauges */}
          {(() => {
            const globalLimit = rewardLimits.find(l => l.category === 'GLOBAL_TOTAL');
            const dailyDist = globalLimit?.currentDailyDistributed || 0;
            const dailyCap = globalLimit?.dailyCapPoints || 400000;
            const dailyPct = Math.min(100, Math.round((dailyDist / dailyCap) * 100));

            const weeklyDist = globalLimit?.currentWeeklyDistributed || 0;
            const weeklyCap = globalLimit?.weeklyCapPoints || 2500000;
            const weeklyPct = Math.min(100, Math.round((weeklyDist / weeklyCap) * 100));

            const monthlyDist = globalLimit?.currentMonthlyDistributed || 0;
            const monthlyCap = globalLimit?.monthlyCapPoints || 10000000;
            const monthlyPct = Math.min(100, Math.round((monthlyDist / monthlyCap) * 100));

            const globalPressure = getEconomicPressure(dailyPct, weeklyPct, globalLimit?.enabled ?? true);

            return (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Daily Total Gauge */}
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Today's Global Distribution</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${globalPressure.badgeClass}`}>
                        {dailyPct}% Daily Used
                      </span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-lg font-black text-white font-mono">
                        {dailyDist.toLocaleString()} pts
                      </span>
                      <span className="text-xs text-slate-400">
                        / {dailyCap.toLocaleString()} pts
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>₹{(dailyDist / 100).toFixed(2)} / ₹{(dailyCap / 100).toFixed(2)} INR</span>
                      <span className="text-emerald-400 font-semibold">+{(dailyCap - dailyDist).toLocaleString()} pts headroom</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          dailyPct > 85 ? 'bg-rose-500' : dailyPct > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${dailyPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Weekly Total Gauge */}
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Weekly Ceiling Monitor</span>
                      <span className="text-[9px] font-bold bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded-full">
                        {weeklyPct}% Weekly Used
                      </span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-lg font-black text-white font-mono">
                        {weeklyDist.toLocaleString()} pts
                      </span>
                      <span className="text-xs text-slate-400">
                        / {weeklyCap.toLocaleString()} pts
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>₹{(weeklyDist / 100).toFixed(2)} / ₹{(weeklyCap / 100).toFixed(2)} INR</span>
                      <span className="text-blue-400 font-semibold">+{(weeklyCap - weeklyDist).toLocaleString()} pts headroom</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${weeklyPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Monthly Total Gauge */}
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Monthly Safety Ceiling</span>
                      <span className="text-[9px] font-bold bg-purple-500/20 text-purple-400 px-1.5 py-0.2 rounded-full">
                        {monthlyPct}% Monthly Used
                      </span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-lg font-black text-white font-mono">
                        {monthlyDist.toLocaleString()} pts
                      </span>
                      <span className="text-xs text-slate-400">
                        / {monthlyCap.toLocaleString()} pts
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>₹{(monthlyDist / 100).toFixed(2)} / ₹{(monthlyCap / 100).toFixed(2)} INR</span>
                      <span className="text-purple-400 font-semibold">+{(monthlyCap - monthlyDist).toLocaleString()} pts headroom</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all duration-300"
                        style={{ width: `${monthlyPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Global Status Advisory */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${globalPressure.borderClass}`}>
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white">Platform Solvency Status: </span>
                      <span className={`font-bold ${globalPressure.textColor}`}>{globalPressure.label}</span>
                      <span className="text-slate-400 ml-1.5 text-[11px]">— {globalPressure.description}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Real-Time Economic Pressure Summary Matrix */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Real-Time Channel Pressure Matrix
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Click any tile to jump to channel
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {rewardLimits.map(lim => {
                const dailyPct = Math.min(100, Math.round((lim.currentDailyDistributed / (lim.dailyCapPoints || 1)) * 100));
                const weeklyPct = Math.min(100, Math.round((lim.currentWeeklyDistributed / (lim.weeklyCapPoints || 1)) * 100));
                const pressure = getEconomicPressure(dailyPct, weeklyPct, lim.enabled);

                const getShortName = (cat: string) => {
                  switch (cat) {
                    case 'WATCH_AND_EARN': return 'Watch & Earn';
                    case 'REWARDED_ADS': return 'Ads';
                    case 'APP_INSTALLS': return 'Tasks';
                    case 'SURVEYS': return 'Surveys';
                    case 'GAMES': return 'Games';
                    case 'SHOPPING_OFFERS': return 'Offers';
                    case 'REFERRALS': return 'Referrals';
                    case 'GLOBAL_TOTAL': return 'Master Cap';
                    default: return cat;
                  }
                };

                return (
                  <button
                    key={lim.category}
                    onClick={() => setCategoryLimitFilter(lim.category)}
                    className={`p-2 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      categoryLimitFilter === lim.category
                        ? 'border-purple-500 bg-purple-950/30'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-white truncate">{getShortName(lim.category)}</span>
                      <span className={`text-[8px] font-black px-1 rounded ${pressure.badgeClass}`}>
                        {pressure.level}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-slate-400">D: <strong className={pressure.textColor}>{dailyPct}%</strong></span>
                      <span className="text-slate-400">W: <strong className="text-blue-300">{weeklyPct}%</strong></span>
                    </div>

                    {/* Progress preview */}
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${pressure.barColor}`}
                        style={{ width: `${Math.max(dailyPct, weeklyPct)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setCategoryLimitFilter('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                categoryLimitFilter === 'ALL'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              All Channels ({rewardLimits.length})
            </button>
            {rewardLimits.map(l => (
              <button
                key={l.category}
                onClick={() => setCategoryLimitFilter(l.category)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  categoryLimitFilter === l.category
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {l.category === 'WATCH_AND_EARN'
                  ? 'Watch & Earn'
                  : l.category === 'REWARDED_ADS'
                  ? 'Ads'
                  : l.category === 'APP_INSTALLS'
                  ? 'Tasks'
                  : l.category === 'GLOBAL_TOTAL'
                  ? 'Global Master'
                  : l.categoryLabel.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Visual Category Limit Cards */}
          <div className="grid grid-cols-1 gap-3.5">
            {rewardLimits
              .filter(lim => categoryLimitFilter === 'ALL' || lim.category === categoryLimitFilter)
              .map(lim => {
                const dailyPct = Math.min(100, Math.round((lim.currentDailyDistributed / (lim.dailyCapPoints || 1)) * 100));
                const weeklyPct = Math.min(100, Math.round((lim.currentWeeklyDistributed / (lim.weeklyCapPoints || 1)) * 100));
                const monthlyPct = Math.min(100, Math.round((lim.currentMonthlyDistributed / (lim.monthlyCapPoints || 1)) * 100));
                const pressure = getEconomicPressure(dailyPct, weeklyPct, lim.enabled);

                const getIcon = (cat: string) => {
                  switch (cat) {
                    case 'WATCH_AND_EARN':
                      return <Film className="w-4 h-4 text-amber-400" />;
                    case 'REWARDED_ADS':
                      return <Tv className="w-4 h-4 text-blue-400" />;
                    case 'APP_INSTALLS':
                      return <Download className="w-4 h-4 text-emerald-400" />;
                    case 'SURVEYS':
                      return <FileQuestion className="w-4 h-4 text-purple-400" />;
                    case 'GAMES':
                      return <Gamepad2 className="w-4 h-4 text-indigo-400" />;
                    case 'SHOPPING_OFFERS':
                      return <ShoppingBag className="w-4 h-4 text-rose-400" />;
                    case 'REFERRALS':
                      return <Users className="w-4 h-4 text-amber-400" />;
                    default:
                      return <ShieldCheck className="w-4 h-4 text-purple-400" />;
                  }
                };

                const dailyHeadroom = Math.max(0, lim.dailyCapPoints - lim.currentDailyDistributed);
                const weeklyHeadroom = Math.max(0, lim.weeklyCapPoints - lim.currentWeeklyDistributed);

                return (
                  <div
                    key={lim.category}
                    className={`p-4 rounded-3xl border transition-all ${
                      !lim.enabled
                        ? 'bg-slate-900/70 border-rose-900/40 opacity-85'
                        : lim.category === 'GLOBAL_TOTAL'
                        ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 border-purple-500/50 shadow-xl'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-lg'
                    }`}
                  >
                    {/* Header: Title, Category Icon, Status Pill & Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2.5">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0">
                          {getIcon(lim.category)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-xs font-bold text-white">{lim.categoryLabel}</h4>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                !lim.enabled
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {lim.enabled ? 'ACTIVE' : 'PAUSED'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Category Code: {lim.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        <button
                          onClick={() => handleToggleLimit(lim.category)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                            lim.enabled
                              ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/50'
                              : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/50'
                          }`}
                        >
                          {lim.enabled ? 'Pause Channel' : 'Enable Channel'}
                        </button>

                        <button
                          onClick={() => handleOpenEditLimit(lim)}
                          className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] shadow-xs flex items-center space-x-1"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          <span>Configure Caps</span>
                        </button>
                      </div>
                    </div>

                    {/* Real-Time Economic Pressure Indicator Banner */}
                    <div className={`mt-3 p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5 ${pressure.borderClass}`}>
                      <div className="flex items-center space-x-2">
                        <Activity className={`w-4 h-4 shrink-0 ${pressure.textColor}`} />
                        <div>
                          <span className="font-bold text-slate-300 text-[11px]">Real-Time Economic Pressure: </span>
                          <span className={`font-black text-[11px] ${pressure.textColor}`}>{pressure.label}</span>
                          <span className="text-[10px] text-slate-400 block sm:inline sm:ml-1.5">
                            {pressure.description}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* DUAL REAL-TIME CAP USAGE METERS (Daily & Weekly Cards) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                      {/* 1. Daily Cap Usage Card */}
                      <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1">
                            <span>Daily Cap Utilization</span>
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            dailyPct > 85 ? 'bg-rose-500/20 text-rose-300' : dailyPct > 65 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {dailyPct}% Daily Used
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-base font-extrabold text-white font-mono">
                              {lim.currentDailyDistributed.toLocaleString()} pts
                            </span>
                            <span className="text-xs text-slate-400 ml-1">
                              / {lim.dailyCapPoints.toLocaleString()} pts
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ₹{(lim.currentDailyDistributed / 100).toFixed(2)} / ₹{(lim.dailyCapPoints / 100).toFixed(2)} INR
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              dailyPct > 85 ? 'bg-rose-500' : dailyPct > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${dailyPct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>Today's Headroom:</span>
                          <span className="text-emerald-400 font-semibold">
                            +{dailyHeadroom.toLocaleString()} pts (₹{(dailyHeadroom / 100).toFixed(2)}) left
                          </span>
                        </div>
                      </div>

                      {/* 2. Weekly Cap Usage Card */}
                      <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1">
                            <span>Weekly Cap Utilization</span>
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                            {weeklyPct}% Weekly Used
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-base font-extrabold text-white font-mono">
                              {lim.currentWeeklyDistributed.toLocaleString()} pts
                            </span>
                            <span className="text-xs text-slate-400 ml-1">
                              / {lim.weeklyCapPoints.toLocaleString()} pts
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ₹{(lim.currentWeeklyDistributed / 100).toFixed(2)} / ₹{(lim.weeklyCapPoints / 100).toFixed(2)} INR
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${weeklyPct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>Weekly Headroom:</span>
                          <span className="text-blue-400 font-semibold">
                            +{weeklyHeadroom.toLocaleString()} pts (₹{(weeklyHeadroom / 100).toFixed(2)}) left
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Defined Caps & Velocity Ceilings Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 text-xs">
                      <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Daily Platform Cap</span>
                        <span className="font-extrabold text-white font-mono mt-0.5 block">
                          {lim.dailyCapPoints.toLocaleString()} pts
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold block">
                          (₹{(lim.dailyCapPoints / 100).toFixed(2)})
                        </span>
                      </div>

                      <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Weekly Platform Cap</span>
                        <span className="font-extrabold text-white font-mono mt-0.5 block">
                          {lim.weeklyCapPoints.toLocaleString()} pts
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold block">
                          (₹{(lim.weeklyCapPoints / 100).toFixed(2)})
                        </span>
                      </div>

                      <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Monthly Platform Cap</span>
                        <span className="font-extrabold text-white font-mono mt-0.5 block">
                          {lim.monthlyCapPoints.toLocaleString()} pts
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold block">
                          (₹{(lim.monthlyCapPoints / 100).toFixed(2)})
                        </span>
                      </div>

                      <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Per-User Daily Cap</span>
                        <span className="font-extrabold text-amber-300 font-mono mt-0.5 block">
                          {lim.perUserDailyCapPoints.toLocaleString()} pts
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block">
                          (₹{(lim.perUserDailyCapPoints / 100).toFixed(2)})
                        </span>
                      </div>

                      <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-400 block">Per-User Monthly Cap</span>
                        <span className="font-extrabold text-amber-300 font-mono mt-0.5 block">
                          {lim.perUserMonthlyCapPoints.toLocaleString()} pts
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block">
                          (₹{(lim.perUserMonthlyCapPoints / 100).toFixed(2)})
                        </span>
                      </div>
                    </div>

                    {/* Interactive Real-Time Load Testing Simulator */}
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-semibold text-slate-300">Real-Time Load Simulator:</span>
                        <span className="text-[10px] text-slate-500">Inject test traffic to observe economic pressure gauges</span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          disabled={simulatingCategory === lim.category}
                          onClick={() => handleSimulateLoad(lim.category, 2500)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono font-bold transition-all disabled:opacity-50"
                          title="Simulate +2,500 points distribution load"
                        >
                          +2,500 pts
                        </button>
                        <button
                          disabled={simulatingCategory === lim.category}
                          onClick={() => handleSimulateLoad(lim.category, 10000)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono font-bold transition-all disabled:opacity-50"
                          title="Simulate +10,000 points distribution load"
                        >
                          +10,000 pts
                        </button>
                        <button
                          disabled={simulatingCategory === lim.category}
                          onClick={() => handleSimulateLoad(lim.category, 25000)}
                          className="px-2 py-1 rounded bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 border border-purple-700/50 text-[10px] font-mono font-bold transition-all disabled:opacity-50"
                          title="Simulate heavy volume surge (+25,000 pts)"
                        >
                          +25k Surge
                        </button>
                        <button
                          onClick={() => handleResetSingleCategory(lim.category)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-semibold transition-all"
                          title="Reset daily counter for this channel"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    {/* Breach Action & Policy Footnote */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] gap-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-400">Action on Breach:</span>
                        <span
                          className={`font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                            lim.actionOnBreach === 'PAUSE_CATEGORY'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : lim.actionOnBreach === 'QUEUE_REVIEW'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {lim.actionOnBreach}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {lim.actionOnBreach === 'PAUSE_CATEGORY'
                            ? '(Automated Circuit Breaker Pause)'
                            : lim.actionOnBreach === 'QUEUE_REVIEW'
                            ? '(Surplus Held in Moderation)'
                            : '(Dispatch Audit Warning)'}
                        </span>
                      </div>

                      {lim.updatedBy && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Updated: {new Date(lim.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} by {lim.updatedBy}
                        </span>
                      )}
                    </div>

                    {lim.notes && (
                      <p className="text-[10px] text-slate-400 italic mt-2 bg-slate-850 p-2 rounded-lg border border-slate-800/60">
                        Rationale: "{lim.notes}"
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 2.1 AUTH & SMS PROVIDER CONFIGURATION STATUS VIEW */}
      {adminTab === 'auth_status' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Auth & SMS Provider Status</h3>
                <p className="text-xs text-slate-400">
                  Supabase Phone Auth, SMS Gateway Connectivity & Security Audit
                </p>
              </div>
            </div>

            {/* Warning Banner if SMS provider not configured */}
            {(!providerStatus || providerStatus.smsProvider === 'NOT_CONFIGURED') && (
              <div className="mt-4 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start space-x-3 text-amber-300 text-xs">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <p className="font-extrabold text-amber-200">
                    Mobile OTP requires a configured SMS provider.
                  </p>
                  <p className="text-[11px] text-amber-300/80 mt-1 leading-relaxed">
                    Real SMS delivery requires configuring Twilio, MSG91, or Supabase Phone Auth SMS provider.
                    The platform never displays CONNECTED unless real gateway credentials are authenticated.
                  </p>
                </div>
              </div>
            )}

            {/* Provider Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {/* Phone Auth Card */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    PHONE AUTH
                  </span>
                  <span
                    className={`text-xs font-mono font-black px-2 py-0.5 rounded-full border ${
                      providerStatus?.phoneAuth === 'READY'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {providerStatus?.phoneAuth === 'READY' ? 'READY' : 'NOT CONFIGURED'}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-semibold">
                  Supabase Phone OTP Architecture
                </p>
                <p className="text-[11px] text-slate-400">
                  Uses <code className="text-amber-400 font-mono">supabase.auth.signInWithOtp</code> and{' '}
                  <code className="text-amber-400 font-mono">verifyOtp</code> official SDK methods.
                </p>
              </div>

              {/* SMS Provider Card */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    SMS PROVIDER
                  </span>
                  <span
                    className={`text-xs font-mono font-black px-2 py-0.5 rounded-full border ${
                      providerStatus?.smsProvider === 'CONNECTED'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {providerStatus?.smsProvider === 'CONNECTED' ? 'CONNECTED' : 'NOT CONFIGURED'}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-semibold">
                  {providerStatus?.smsProviderName || 'External SMS Gateway'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {providerStatus?.smsProvider === 'CONNECTED'
                    ? 'Direct carrier SMS dispatch active.'
                    : 'Carrier gateway not connected. Test mode is active.'}
                </p>
              </div>

              {/* Google Auth Card */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    GOOGLE AUTH
                  </span>
                  <span
                    className={`text-xs font-mono font-black px-2 py-0.5 rounded-full border ${
                      providerStatus?.googleAuth === 'READY'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {providerStatus?.googleAuth === 'READY' ? 'READY' : 'NOT CONFIGURED'}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-semibold">
                  OAuth 2.0 Identity Provider
                </p>
                <p className="text-[11px] text-slate-400">
                  {providerStatus?.googleAuth === 'READY'
                    ? 'Google single-sign-on available.'
                    : 'Google login will display "Google login is currently unavailable."'}
                </p>
              </div>

              {/* Test Mode Card */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    RUNTIME MODE
                  </span>
                  <span className="text-xs font-mono font-black px-2 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/30">
                    TEST MODE — NO REAL SMS
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-semibold">
                  Transparent Evaluation Environment
                </p>
                <p className="text-[11px] text-slate-400">
                  Separated from production login. No fake OTP delivery; test OTPs are explicitly declared in the UI.
                </p>
              </div>
            </div>

            {/* Architecture Standards Checklist */}
            <div className="mt-4 p-4 bg-slate-800/40 border border-slate-800 rounded-2xl space-y-2.5">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                Pocket Points Mobile Auth Architecture Rules
              </h4>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>India +91 Normalization:</strong> Strips whitespace, requires strictly 10 digits starting with 6-9, prevents duplicate verified numbers.
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Mobile Number Change:</strong> Uses <code className="text-amber-400 font-mono">supabase.auth.updateUser</code> and never updates phone before OTP verification.
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Rate Limiting & Resend:</strong> Enforces 30-second cooldown timer, prevents spamming, handles expired OTPs gracefully.
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Bilingual Localized Errors:</strong> User-friendly Hindi/English messages for invalid OTP, expired tokens, and network failures. Raw database errors are never exposed.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 3. VIDEO MODERATION VIEW */}
      {adminTab === 'moderation' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200">
              Pending Video Moderation Queue ({pendingVideos.length})
            </h3>
            <span className="text-[10px] text-slate-400">Review before public visibility</span>
          </div>

          {pendingVideos.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-xs text-slate-400">
              No pending uploads in the moderation queue. All videos are reviewed!
            </div>
          ) : (
            pendingVideos.map(v => (
              <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-24 aspect-video rounded-lg overflow-hidden bg-black shrink-0 relative">
                    <img src={v.thumbnailUrl} alt={v.caption} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{v.creatorName}</span>
                      <span className="text-[9px] font-bold bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded border border-slate-700">
                        {v.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-snug">{v.caption}</p>
                    <span className="text-[10px] text-slate-500 font-mono block mt-1">
                      Uploaded: {new Date(v.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleModerateVideo(v.id, 'APPROVE')}
                    className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve to Feed</span>
                  </button>

                  <button
                    onClick={() => {
                      setRejectingItem({ type: 'VIDEO', id: v.id });
                      setRejectionReason('Does not adhere to community content quality standards');
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-900 text-rose-300 font-bold text-xs flex items-center justify-center space-x-1 border border-rose-700/50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Decline Upload</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. WITHDRAWAL PROCESSING QUEUE */}
      {adminTab === 'withdrawals' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200">
              UPI Withdrawal Payout Queue ({withdrawalsList.length})
            </h3>
            <span className="text-[10px] text-slate-400">Atomic Escrow & Verification</span>
          </div>

          <div className="space-y-2.5">
            {withdrawalsList.map(w => {
              const isPending = w.status === 'REQUESTED' || w.status === 'VERIFYING';
              return (
                <div key={w.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-slate-200 font-bold">VPA: {w.upiId}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                          w.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : w.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {w.status}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-white text-sm">
                      ₹{w.netPayoutInr.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>
                      Gross: {w.requestedPoints} pts (₹{w.grossAmountInr.toFixed(2)}) • Fee (3%): ₹
                      {w.feeAmountInr.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(w.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {w.payoutReference && (
                    <span className="text-[10px] text-emerald-400 font-mono block">
                      Ref: {w.payoutReference}
                    </span>
                  )}
                  {w.rejectionReason && (
                    <span className="text-[10px] text-rose-400 block">
                      Declined reason: {w.rejectionReason} (Points refunded)
                    </span>
                  )}

                  {isPending && (
                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleResolveWithdrawal(w.id, 'APPROVE')}
                        className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Disburse Payout</span>
                      </button>

                      <button
                        onClick={() => {
                          setRejectingItem({ type: 'WITHDRAWAL', id: w.id });
                          setRejectionReason('VPA verification failed or abnormal velocity threshold reached');
                        }}
                        className="flex-1 py-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-900 text-rose-300 font-bold text-xs flex items-center justify-center space-x-1 border border-rose-700/50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject & Refund Points</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. EMERGENCY & LOSS CONTROLS */}
      {adminTab === 'emergency' && (
        <div className="space-y-4">
          <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-2xl flex items-start space-x-2.5 text-xs text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-white">Loss & Margin Protection Architecture</strong>
              Emergency circuit breakers instantly halt point creation and payouts if advertising margin drops or unusual abuse is detected.
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 divide-y divide-slate-800">
            {[
              {
                id: 'ALL',
                label: 'PAUSE ALL REWARDS (Global Circuit Breaker)',
                state: settingsState?.pauseAllRewards,
                desc: 'Instantly stops all point issuance across video views, ads, and tasks.',
              },
              {
                id: 'WITHDRAWALS',
                label: 'PAUSE UPI WITHDRAWALS',
                state: settingsState?.pauseWithdrawals,
                desc: 'Halt new withdrawal requests while maintaining existing escrow.',
              },
              {
                id: 'ADS',
                label: 'PAUSE REWARDED ADS',
                state: settingsState?.pauseAds,
                desc: 'Temporarily pause AdMob & rewarded video completions.',
              },
              {
                id: 'INSTALLS',
                label: 'PAUSE APP INSTALL TASKS',
                state: settingsState?.pauseInstallTasks,
                desc: 'Pause CPA app installation campaigns.',
              },
              {
                id: 'VIDEOS',
                label: 'PAUSE VIDEO WATCH REWARDS',
                state: settingsState?.pauseVideoRewards,
                desc: 'Pause viewer reward pool distribution while keeping video streaming active.',
              },
            ].map(ctrl => (
              <div key={ctrl.id} className="py-3 flex items-center justify-between">
                <div className="pr-4">
                  <h4 className="text-xs font-bold text-white">{ctrl.label}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{ctrl.desc}</p>
                </div>
                <button
                  onClick={() => handleEmergencyToggle(ctrl.id, Boolean(ctrl.state))}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 flex items-center space-x-1.5 transition-colors ${
                    ctrl.state
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  {ctrl.state ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                  <span>{ctrl.state ? 'PAUSED' : 'ACTIVE'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. SYSTEM SETTINGS & CONFIGURATION */}
      {adminTab === 'settings' && settingsState && (
        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Configurable Reward Economics</h3>
            <span className="text-[10px] text-slate-400">All changes logged to audit trail</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-slate-400 font-medium block mb-1">Points per ₹1.00</label>
              <input
                type="number"
                value={settingsState.pointsPerInr}
                onChange={e => setSettingsState({ ...settingsState, pointsPerInr: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Minimum Withdrawal Points</label>
              <input
                type="number"
                value={settingsState.minimumWithdrawalPoints}
                onChange={e => setSettingsState({ ...settingsState, minimumWithdrawalPoints: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">UPI Withdrawal Fee (%)</label>
              <input
                type="number"
                step="0.5"
                value={settingsState.withdrawalFeePercentage}
                onChange={e => setSettingsState({ ...settingsState, withdrawalFeePercentage: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Max Daily Withdrawals</label>
              <input
                type="number"
                value={settingsState.maxDailyWithdrawals}
                onChange={e => setSettingsState({ ...settingsState, maxDailyWithdrawals: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Creator Revenue Share (%)</label>
              <input
                type="number"
                value={settingsState.videoCreatorPercentage}
                onChange={e => setSettingsState({ ...settingsState, videoCreatorPercentage: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Viewer Reward Pool (%)</label>
              <input
                type="number"
                value={settingsState.videoViewerPoolPercentage}
                onChange={e => setSettingsState({ ...settingsState, videoViewerPoolPercentage: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95"
          >
            Save Configuration Changes
          </button>
        </form>
      )}

      {/* 6. AUDIT LOGS */}
      {adminTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Immutable Admin Audit Trail ({auditLogs.length})</span>
          </h3>

          <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
            {auditLogs.map(log => (
              <div key={log.id} className="p-3 bg-slate-850 rounded-xl border border-slate-800 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-400 font-mono">{log.action}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">By: {log.adminName}</p>
                {log.reason && <p className="text-[11px] text-slate-400 italic">"{log.reason}"</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. AI FEEDBACK ANALYTICS */}
      {adminTab === 'ai_feedback' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>Pocket Points AI Assistant User Ratings ({aiFeedback.length})</span>
          </h3>

          <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
            {aiFeedback.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No AI ratings submitted yet.</div>
            ) : (
              aiFeedback.map(fb => (
                <div key={fb.id} className="p-3 bg-slate-850 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 truncate">Q: {fb.question}</span>
                    <span className={`text-[10px] font-bold flex items-center space-x-1 ${
                      fb.feedback === 'HELPFUL' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {fb.feedback === 'HELPFUL' ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
                      <span>{fb.feedback}</span>
                    </span>
                  </div>
                  {fb.feedbackText && (
                    <p className="text-[11px] text-slate-400 italic">Comment: "{fb.feedbackText}"</p>
                  )}
                  <span className="text-[9px] text-slate-500 font-mono block">
                    {new Date(fb.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl text-left">
            <h4 className="text-xs font-bold text-rose-400 flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Decline {rejectingItem.type === 'VIDEO' ? 'Video Upload' : 'Withdrawal Request'}</span>
            </h4>

            <p className="text-[11px] text-slate-400 mt-1">
              Provide a clear reason for the user:
            </p>

            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              rows={3}
              className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />

            <div className="flex items-center space-x-2 mt-3">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="flex-1 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (rejectingItem.type === 'VIDEO') {
                    handleModerateVideo(rejectingItem.id, 'REJECT', rejectionReason);
                  } else {
                    handleResolveWithdrawal(rejectingItem.id, 'REJECT', rejectionReason);
                  }
                  setRejectingItem(null);
                }}
                className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Global Reward Limit Modal */}
      {editingLimit && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-left max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Configure Caps: {editingLimit.categoryLabel}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Category: {editingLimit.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingLimit(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLimit} className="mt-4 space-y-3.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800 text-[11px] text-slate-300">
                Points to INR conversion: <strong>{settings?.pointsPerInr || 100} points = ₹1.00</strong>. Cap changes are recorded in the immutable audit trail.
              </div>

              {/* Platform-wide Caps */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Platform-Wide Volume Ceilings
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Daily Cap (pts)
                    </label>
                    <input
                      type="number"
                      step={500}
                      value={editLimitForm.dailyCapPoints}
                      onChange={e =>
                        setEditLimitForm({ ...editLimitForm, dailyCapPoints: Number(e.target.value) })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                    />
                    <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
                      = ₹{(editLimitForm.dailyCapPoints / (settings?.pointsPerInr || 100)).toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Weekly Cap (pts)
                    </label>
                    <input
                      type="number"
                      step={1000}
                      value={editLimitForm.weeklyCapPoints}
                      onChange={e =>
                        setEditLimitForm({ ...editLimitForm, weeklyCapPoints: Number(e.target.value) })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                    />
                    <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
                      = ₹{(editLimitForm.weeklyCapPoints / (settings?.pointsPerInr || 100)).toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Monthly Cap (pts)
                    </label>
                    <input
                      type="number"
                      step={5000}
                      value={editLimitForm.monthlyCapPoints}
                      onChange={e =>
                        setEditLimitForm({ ...editLimitForm, monthlyCapPoints: Number(e.target.value) })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                    />
                    <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
                      = ₹{(editLimitForm.monthlyCapPoints / (settings?.pointsPerInr || 100)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Per-User Velocity Caps */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Per-User Anti-Abuse Velocity Caps
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Per-User Daily (pts)
                    </label>
                    <input
                      type="number"
                      step={10}
                      value={editLimitForm.perUserDailyCapPoints}
                      onChange={e =>
                        setEditLimitForm({
                          ...editLimitForm,
                          perUserDailyCapPoints: Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                    />
                    <span className="text-[10px] text-amber-400 font-mono mt-0.5 block">
                      = ₹{(editLimitForm.perUserDailyCapPoints / (settings?.pointsPerInr || 100)).toFixed(2)} / user / day
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Per-User Monthly (pts)
                    </label>
                    <input
                      type="number"
                      step={100}
                      value={editLimitForm.perUserMonthlyCapPoints}
                      onChange={e =>
                        setEditLimitForm({
                          ...editLimitForm,
                          perUserMonthlyCapPoints: Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                    />
                    <span className="text-[10px] text-amber-400 font-mono mt-0.5 block">
                      = ₹{(editLimitForm.perUserMonthlyCapPoints / (settings?.pointsPerInr || 100)).toFixed(2)} / user / mo
                    </span>
                  </div>
                </div>
              </div>

              {/* Action on Breach */}
              <div className="pt-2 border-t border-slate-800">
                <label className="text-slate-300 font-semibold block mb-1">
                  Enforcement Action on Cap Breach
                </label>
                <select
                  value={editLimitForm.actionOnBreach}
                  onChange={e =>
                    setEditLimitForm({
                      ...editLimitForm,
                      actionOnBreach: e.target.value as BreachAction,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
                >
                  <option value="PAUSE_CATEGORY">
                    PAUSE_CATEGORY — Auto-pause category rewards until reset (Recommended for Ads & Video)
                  </option>
                  <option value="QUEUE_REVIEW">
                    QUEUE_REVIEW — Place subsequent earnings in verification queue for manual admin signoff
                  </option>
                  <option value="ALERT_ADMIN">
                    ALERT_ADMIN — Dispatch immediate priority notification while continuing distribution
                  </option>
                </select>
              </div>

              {/* Strategy Notes */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Economic Strategy Notes
                </label>
                <input
                  type="text"
                  value={editLimitForm.notes}
                  onChange={e => setEditLimitForm({ ...editLimitForm, notes: e.target.value })}
                  placeholder="e.g. 7% viewer pool limit tied to quarterly ad contracts"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                />
              </div>

              {/* Audit Reason */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Reason for Modification (Logged to Audit Trail)
                </label>
                <input
                  type="text"
                  required
                  value={editLimitForm.reason}
                  onChange={e => setEditLimitForm({ ...editLimitForm, reason: e.target.value })}
                  placeholder="e.g. Scaling daily ad budget based on new sponsor campaign"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLimit(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingLimit}
                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 disabled:opacity-50"
                >
                  {isSavingLimit ? 'Saving Caps...' : 'Save & Enforce Limits'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
