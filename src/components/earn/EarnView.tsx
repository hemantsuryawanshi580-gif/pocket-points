import React, { useState, useEffect } from 'react';
import { TaskCampaign } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useApp } from '../../context/AppContext.tsx';
import {
  Gift,
  Tv,
  Download,
  FileQuestion,
  Gamepad2,
  ShoppingBag,
  Users,
  CalendarCheck,
  Sparkles,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Play,
  X,
} from 'lucide-react';

export const EarnView: React.FC = () => {
  const { wallet, settings, showToast, refreshUserData, currentUser, setActiveTab } = useApp();
  const [campaigns, setCampaigns] = useState<TaskCampaign[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Active Task Simulators
  const [activeAdCampaign, setActiveAdCampaign] = useState<TaskCampaign | null>(null);
  const [activeSurveyCampaign, setActiveSurveyCampaign] = useState<TaskCampaign | null>(null);
  const [activeInstallCampaign, setActiveInstallCampaign] = useState<TaskCampaign | null>(null);

  // Referral state
  const [referralData, setReferralData] = useState<{
    referralCode: string;
    referralLink: string;
    referralPointsPerInvite: number;
    totalInvited: number;
    qualifiedCount: number;
    totalEarnedPoints: number;
    referrals: any[];
  } | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cRes, rRes] = await Promise.all([api.getCampaigns(), api.getReferrals()]);
      setCampaigns(cRes.campaigns || []);
      setReferralData(rRes);
    } catch (err) {
      console.error(err);
      showToast('Failed to load campaigns', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyReferral = () => {
    if (!referralData) return;
    navigator.clipboard.writeText(referralData.referralLink);
    setCopiedRef(true);
    showToast('Referral link copied!', 'success');
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const filteredCampaigns =
    selectedCategory === 'ALL'
      ? campaigns
      : campaigns.filter(c => c.category === selectedCategory);

  const categories = [
    { id: 'ALL', label: 'All Tasks', icon: <Gift className="w-3.5 h-3.5" /> },
    { id: 'REWARDED_AD', label: 'Video Ads', icon: <Tv className="w-3.5 h-3.5" /> },
    { id: 'APP_INSTALL', label: 'App Installs', icon: <Download className="w-3.5 h-3.5" /> },
    { id: 'SURVEY', label: 'Surveys', icon: <FileQuestion className="w-3.5 h-3.5" /> },
    { id: 'GAME', label: 'Games', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
    { id: 'DAILY_MISSION', label: 'Missions', icon: <CalendarCheck className="w-3.5 h-3.5" /> },
    { id: 'SHOPPING_OFFER', label: 'Offers', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto no-scrollbar p-3 max-w-md mx-auto w-full space-y-4">
      {/* Wallet Points Summary Bar */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Available Balance</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-2xl font-black text-white">
                ₹{((wallet?.availablePoints || 0) / (settings?.pointsPerInr || 100)).toFixed(2)}
              </span>
              <span className="text-xs text-amber-400 font-mono font-bold">
                ({wallet?.availablePoints || 0} pts)
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('wallet')}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
          >
            Withdraw UPI
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
          <div>
            <span className="text-slate-500">Pending Verification:</span>
            <span className="ml-1 text-slate-300 font-semibold font-mono">
              {wallet?.pendingPoints || 0} pts
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-500">Rate:</span>
            <span className="ml-1 text-emerald-400 font-semibold">
              {settings?.pointsPerInr || 100} pts = ₹1.00
            </span>
          </div>
        </div>
      </div>

      {/* Controlled Rewards Transparency Banner */}
      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start space-x-2 text-[11px] text-slate-300">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="leading-snug">
          <strong className="text-slate-100">Reward Verification Policy:</strong> Rewards are credited only after eligible provider postback confirmation. Opening alone does not grant points.
        </div>
      </div>

      {/* Referral Program Highlight Card */}
      <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 rounded-2xl p-4 shadow-lg text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Refer Friends & Earn</h3>
              <p className="text-[10px] text-indigo-300">500 points (₹5.00) per qualified invite</p>
            </div>
          </div>
          <span className="text-xs font-bold font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30">
            {referralData?.referralCode || currentUser?.referralCode}
          </span>
        </div>

        <div className="flex items-center space-x-2 mt-3">
          <div className="flex-1 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-700/80 text-xs font-mono text-slate-300 truncate">
            {referralData?.referralLink}
          </div>
          <button
            onClick={handleCopyReferral}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1 shrink-0"
          >
            {copiedRef ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedRef ? 'Copied' : 'Share'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between mt-2.5 text-[10px] text-slate-400">
          <span>Invited: {referralData?.totalInvited || 0} friends</span>
          <span>Earned: {referralData?.totalEarnedPoints || 0} pts</span>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors ${
              selectedCategory === cat.id
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Task Campaigns List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading verified earning campaigns...</div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No campaigns available in this category.</div>
        ) : (
          filteredCampaigns.map(camp => (
            <TaskCard
              key={camp.id}
              campaign={camp}
              onStartTask={() => {
                if (camp.category === 'REWARDED_AD') setActiveAdCampaign(camp);
                else if (camp.category === 'SURVEY') setActiveSurveyCampaign(camp);
                else if (camp.category === 'APP_INSTALL') setActiveInstallCampaign(camp);
                else {
                  // Direct simulated completion for missions or games
                  handleDirectCompletion(camp);
                }
              }}
            />
          ))
        )}
      </div>

      {/* Interactive Ad Viewer Modal */}
      {activeAdCampaign && (
        <RewardedAdSimulator
          campaign={activeAdCampaign}
          isOpen={Boolean(activeAdCampaign)}
          onClose={() => setActiveAdCampaign(null)}
          onSuccess={() => {
            refreshUserData();
            loadData();
          }}
        />
      )}

      {/* Interactive Survey Modal */}
      {activeSurveyCampaign && (
        <SurveySimulator
          campaign={activeSurveyCampaign}
          isOpen={Boolean(activeSurveyCampaign)}
          onClose={() => setActiveSurveyCampaign(null)}
          onSuccess={() => {
            refreshUserData();
            loadData();
          }}
        />
      )}

      {/* Interactive Install Simulator */}
      {activeInstallCampaign && (
        <AppInstallSimulator
          campaign={activeInstallCampaign}
          isOpen={Boolean(activeInstallCampaign)}
          onClose={() => setActiveInstallCampaign(null)}
          onSuccess={() => {
            refreshUserData();
            loadData();
          }}
        />
      )}
    </div>
  );

  async function handleDirectCompletion(camp: TaskCampaign) {
    try {
      showToast(`Initiating "${camp.title}"...`, 'info');
      const res = await api.completeCampaign(camp.id);
      showToast(`Task verified! +${res.pointsCredited} points credited!`, 'reward', res.pointsCredited);
      refreshUserData();
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Verification failed', 'error');
    }
  }
};

// Task Card Item
interface TaskCardProps {
  campaign: TaskCampaign;
  onStartTask: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ campaign, onStartTask }) => {
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'REWARDED_AD':
        return <Tv className="w-4 h-4 text-amber-400" />;
      case 'APP_INSTALL':
        return <Download className="w-4 h-4 text-blue-400" />;
      case 'SURVEY':
        return <FileQuestion className="w-4 h-4 text-emerald-400" />;
      case 'GAME':
        return <Gamepad2 className="w-4 h-4 text-purple-400" />;
      case 'DAILY_MISSION':
        return <CalendarCheck className="w-4 h-4 text-rose-400" />;
      default:
        return <ShoppingBag className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 hover:border-slate-700 transition-colors shadow-md text-left">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2.5">
          <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/80 shrink-0">
            {getCategoryIcon(campaign.category)}
          </div>
          <div>
            <h4 className="text-xs font-bold text-white leading-snug">{campaign.title}</h4>
            <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mt-0.5">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{campaign.verificationTime}</span>
              <span>•</span>
              <span className="text-slate-400 font-mono">Limit: {campaign.dailyLimit}/day</span>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs font-extrabold text-amber-400 font-mono block">
            +{campaign.rewardPoints} pts
          </span>
          <span className="text-[10px] text-slate-400 font-semibold block">
            (₹{campaign.rewardInr.toFixed(2)})
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-300 mt-2 leading-relaxed">{campaign.description}</p>

      {campaign.requirements && campaign.requirements.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1">
          {campaign.requirements.map((req, i) => (
            <div key={i} className="flex items-center space-x-1.5 text-[10px] text-slate-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{req}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between pt-1">
        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">
          Verification: {campaign.verificationMethod.replace('_', ' ')}
        </span>
        <button
          onClick={onStartTask}
          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1 shadow-sm transition-transform active:scale-95"
        >
          <span>Start Task</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

// 1. Rewarded Ad Viewer Simulator (Simulates Google AdMob / Unity Ads completion callback)
const RewardedAdSimulator: React.FC<{
  campaign: TaskCampaign;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ campaign, isOpen, onClose, onSuccess }) => {
  const { showToast } = useApp();
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [isVerifying, setIsVerifying] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSecondsRemaining(15);
    setCanSkip(false);

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleClaim = async () => {
    setIsVerifying(true);
    try {
      const res = await api.completeCampaign(campaign.id, 15);
      showToast(`Ad completion verified! +${res.pointsCredited} points credited.`, 'reward', res.pointsCredited);
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Ad verification failed', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Ad Header */}
        <div className="bg-slate-950 px-3 py-2 flex items-center justify-between border-b border-slate-800 text-xs text-slate-300">
          <div className="flex items-center space-x-1.5">
            <span className="bg-amber-500 text-slate-950 font-bold px-1 rounded text-[9px]">AD</span>
            <span>Google AdMob Rewarded Video (Test Mode)</span>
          </div>
          <span className="font-mono text-amber-400 font-bold">
            {secondsRemaining > 0 ? `Reward in ${secondsRemaining}s` : 'Reward Ready!'}
          </span>
        </div>

        {/* Video Canvas Simulation */}
        <div className="aspect-video bg-gradient-to-tr from-indigo-900 via-slate-900 to-purple-900 flex flex-col items-center justify-center p-6 text-center relative">
          <Sparkles className="w-10 h-10 text-amber-300 animate-bounce mb-2" />
          <h4 className="font-extrabold text-sm text-white">FinTrack - Smart Automated Budgeting</h4>
          <p className="text-[11px] text-slate-300 mt-1 max-w-[200px]">
            Save up to ₹3,000 monthly with auto expense tracking. Download free on Play Store!
          </p>

          <div className="mt-3 flex items-center space-x-2">
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
              4.8 ★ (120k reviews)
            </span>
          </div>
        </div>

        {/* Action Bottom */}
        <div className="p-3 bg-slate-950 flex items-center space-x-2 border-t border-slate-800">
          {canSkip ? (
            <button
              onClick={handleClaim}
              disabled={isVerifying}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20"
            >
              <Check className="w-4 h-4" />
              <span>{isVerifying ? 'Verifying SDK Event...' : 'Claim 15 Points'}</span>
            </button>
          ) : (
            <div className="w-full py-2 bg-slate-800 text-slate-400 font-semibold text-xs rounded-xl text-center">
              Please watch the full 15s sponsor video...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 2. Survey Simulator Modal
const SurveySimulator: React.FC<{
  campaign: TaskCampaign;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ campaign, isOpen, onClose, onSuccess }) => {
  const { showToast } = useApp();
  const [step, setStep] = useState(1);
  const [q1, setQ1] = useState('Daily');
  const [q2, setQ2] = useState('UPI Scan & Pay');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.completeCampaign(campaign.id);
      showToast(`Survey answers verified! +${res.pointsCredited} points credited!`, 'reward', res.pointsCredited);
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Survey submission failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <FileQuestion className="w-4 h-4" />
            <span className="font-bold text-xs text-white">{campaign.title}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 space-y-3 text-left">
          {step === 1 ? (
            <>
              <p className="text-xs text-slate-300 font-semibold">1. How often do you make UPI payments?</p>
              <div className="space-y-1.5">
                {['Daily (multiple times)', '2-3 times a week', 'Rarely', 'Never'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setQ1(opt)}
                    className={`w-full text-left p-2 rounded-xl border text-xs ${
                      q1 === opt ? 'border-amber-400 bg-amber-500/10 text-white font-bold' : 'border-slate-800 text-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl mt-2"
              >
                Next Question
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-300 font-semibold">2. What is your preferred UPI app?</p>
              <div className="space-y-1.5">
                {['Google Pay', 'PhonePe', 'Paytm UPI', 'Cred / Bank App'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setQ2(opt)}
                    className={`w-full text-left p-2 rounded-xl border text-xs ${
                      q2 === opt ? 'border-amber-400 bg-amber-500/10 text-white font-bold' : 'border-slate-800 text-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl mt-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Verifying Answers...' : 'Submit & Claim 100 Points'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// 3. App Install Simulator Modal
const AppInstallSimulator: React.FC<{
  campaign: TaskCampaign;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ campaign, isOpen, onClose, onSuccess }) => {
  const { showToast } = useApp();
  const [installStep, setInstallStep] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSimulateInstall = async () => {
    setIsVerifying(true);
    setTimeout(async () => {
      try {
        const res = await api.completeCampaign(campaign.id);
        showToast(`App install & verification confirmed! +${res.pointsCredited} points credited!`, 'reward', res.pointsCredited);
        onSuccess();
        onClose();
      } catch (err: any) {
        showToast(err.message || 'Install postback failed', 'error');
      } finally {
        setIsVerifying(false);
      }
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl text-left">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-1.5 text-blue-400">
            <Download className="w-4 h-4" />
            <span className="font-bold text-xs text-white">{campaign.title}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 space-y-3">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80">
            <h4 className="text-xs font-bold text-white">Campaign Rules & Attribution</h4>
            <ul className="text-[11px] text-slate-300 space-y-1 mt-1.5 list-disc list-inside">
              <li>First time install on this device only.</li>
              <li>Complete mobile number signup inside the app.</li>
              <li>Keep installed for at least 24 hours.</li>
            </ul>
          </div>

          <div className="flex items-center space-x-2 text-[10px] text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Test Mode: Simulates Google Play Store install & attribution postback.</span>
          </div>

          <button
            onClick={handleSimulateInstall}
            disabled={isVerifying}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isVerifying ? 'Verifying Attribution Postback...' : 'Simulate Install & Claim 150 pts'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
