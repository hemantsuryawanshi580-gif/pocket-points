import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { api } from '../../services/api.ts';
import { supabaseAuthService } from '../../services/supabase.ts';
import {
  Settings,
  User as UserIcon,
  Smartphone,
  Lock,
  Globe,
  Bell,
  Shield,
  HelpCircle,
  Info,
  Download,
  LogOut,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Trash2,
  RefreshCw,
  X,
} from 'lucide-react';
import { ChangePhoneModal } from './ChangePhoneModal.tsx';
import { HelpSupportModal } from './HelpSupportModal.tsx';

interface SettingsViewProps {
  onBack: () => void;
  onEditProfile: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack, onEditProfile }) => {
  const { currentUser, showToast, refreshUserData, setActiveTab } = useApp();

  const [isChangePhoneOpen, setIsChangePhoneOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // PIN state
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Notification toggles
  const [notifReward, setNotifReward] = useState(true);
  const [notifCreator, setNotifCreator] = useState(true);
  const [notifTasks, setNotifTasks] = useState(true);

  // Privacy toggles
  const [privateProfile, setPrivateProfile] = useState(false);

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (!/^\d{4}$/.test(pin)) {
      setPinError('पिन ठीक 4 अंकों का होना चाहिए (PIN must be exactly 4 digits)');
      return;
    }
    if (pin !== confirmPin) {
      setPinError('पिन मेल नहीं खाते (PINs do not match)');
      return;
    }

    setIsSavingPin(true);
    try {
      await api.setWithdrawalPin(pin);
      showToast('निकासी पिन सफलतापूर्वक सेट किया गया (Withdrawal PIN set successfully!)', 'success');
      setIsPinModalOpen(false);
      setPin('');
      setConfirmPin('');
      await refreshUserData();
    } catch (err: any) {
      setPinError(err.message || 'Failed to set withdrawal PIN');
    } finally {
      setIsSavingPin(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabaseAuthService.signOut();
      showToast('Logged out successfully', 'info');
      await refreshUserData();
      onBack();
    } catch (err: any) {
      showToast(err.message || 'Logout failed', 'error');
    }
  };

  const handleDeleteRequest = async () => {
    setIsDeleting(true);
    try {
      await api.requestAccountDeletion();
      showToast('DPDP/GDPR account deletion request queued for 30-day processing', 'info');
      setIsDeleteModalOpen(false);
      await refreshUserData();
    } catch (err: any) {
      showToast(err.message || 'Deletion request failed', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto no-scrollbar p-3 max-w-md mx-auto w-full text-left space-y-4">
      {/* Top Bar */}
      <div className="flex items-center space-x-3 pb-2 border-b border-slate-800">
        <button
          onClick={onBack}
          className="p-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-extrabold text-white">Settings</h1>
          <p className="text-[11px] text-slate-400">Account, security & preferences</p>
        </div>
      </div>

      {/* Account Section */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider px-1">
          Account & Identity
        </span>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden shadow-sm">
          <button
            onClick={onEditProfile}
            className="w-full p-3.5 flex items-center justify-between hover:bg-slate-850 transition-colors text-xs text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <UserIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white">{currentUser?.displayName}</p>
                <p className="text-[11px] text-slate-400 font-mono">@{currentUser?.username}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-400">
              <span className="text-[11px]">Edit</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* Mobile Number Row */}
          <div className="p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <p className="font-bold text-white">Mobile Number</p>
                  {currentUser?.phoneVerified || currentUser?.phoneNumber ? (
                    <span className="text-[9px] font-bold text-emerald-400">Verified ✓</span>
                  ) : (
                    <span className="text-[9px] text-rose-400 font-bold">Unverified</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  {currentUser?.phoneNumber || 'No phone linked'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsChangePhoneOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700 hover:border-amber-500/40 text-[11px] font-bold transition-colors"
            >
              {currentUser?.phoneNumber ? 'Change' : 'Verify'}
            </button>
          </div>

          {/* Withdrawal PIN */}
          <button
            onClick={() => setIsPinModalOpen(true)}
            className="w-full p-3.5 flex items-center justify-between hover:bg-slate-850 transition-colors text-xs text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white">Withdrawal Security PIN</p>
                <p className="text-[11px] text-slate-400">
                  {currentUser?.withdrawalPinSet ? '4-digit PIN is active' : 'Set 4-digit UPI PIN'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-slate-400">
              <span className="text-[11px] text-amber-400 font-bold">
                {currentUser?.withdrawalPinSet ? 'Update' : 'Set PIN'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider px-1">
          Preferences & Notifications
        </span>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden shadow-sm">
          <div className="p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white">Language / भाषा</p>
                <p className="text-[11px] text-slate-400">
                  {currentUser?.language === 'hi' ? 'हिंदी (Hindi)' : 'English (English)'}
                </p>
              </div>
            </div>
            <button
              onClick={onEditProfile}
              className="text-[11px] font-bold text-amber-400 hover:underline"
            >
              Switch
            </button>
          </div>

          <div className="p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white">Reward & Payout Alerts</p>
                <p className="text-[11px] text-slate-400">Notifications on verified earnings</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifReward}
              onChange={e => setNotifReward(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          <div className="p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white">Private Profile Mode</p>
                <p className="text-[11px] text-slate-400">Hide watch history and liked reels</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={privateProfile}
              onChange={e => setPrivateProfile(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Support & App Section */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider px-1">
          Support & About
        </span>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden shadow-sm">
          <button
            onClick={() => setIsHelpOpen(true)}
            className="w-full p-3.5 flex items-center justify-between hover:bg-slate-850 transition-colors text-xs text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white">Help & Support</p>
                <p className="text-[11px] text-slate-400">FAQ, ticket submission & WhatsApp</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => setIsApkModalOpen(true)}
            className="w-full p-3.5 flex items-center justify-between hover:bg-slate-850 transition-colors text-xs text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white">Download Android APK</p>
                <p className="text-[11px] text-slate-400">Direct install for Android 10+</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <div className="p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white">About Pocket Points</p>
                <p className="text-[11px] text-slate-400">v1.0.4-prod • Made with pride in India 🇮🇳</p>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Build 2026.09</span>
          </div>
        </div>
      </div>

      {/* Danger Zone: Deletion & Logout */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="w-full p-3.5 flex items-center justify-between text-xs text-rose-400 hover:bg-rose-950/20 transition-colors text-left"
        >
          <div className="flex items-center space-x-3">
            <Trash2 className="w-4 h-4" />
            <span className="font-semibold">Request Account Deletion (DPDP)</span>
          </div>
          <ChevronRight className="w-4 h-4 opacity-70" />
        </button>

        <button
          onClick={handleLogout}
          className="w-full p-3.5 flex items-center justify-between text-xs text-slate-300 hover:bg-slate-800 transition-colors text-left"
        >
          <div className="flex items-center space-x-3">
            <LogOut className="w-4 h-4 text-slate-400" />
            <span className="font-bold">Log Out of Pocket Points</span>
          </div>
          <span className="text-[11px] text-slate-500">End Session</span>
        </button>
      </div>

      {/* Modals */}
      <ChangePhoneModal
        isOpen={isChangePhoneOpen}
        onClose={() => setIsChangePhoneOpen(false)}
        onSuccess={() => refreshUserData()}
      />

      <HelpSupportModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Withdrawal PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Set 4-Digit Withdrawal PIN</h3>
              </div>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mt-3">
              This PIN protects your wallet earnings and is required whenever requesting UPI cash withdrawals.
            </p>

            {pinError && (
              <div className="mt-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl">
                {pinError}
              </div>
            )}

            <form onSubmit={handleSetPin} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Enter 4-Digit PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-lg text-center tracking-widest text-white font-mono focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Confirm 4-Digit PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-lg text-center tracking-widest text-white font-mono focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSavingPin || pin.length !== 4 || confirmPin.length !== 4}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-transform active:scale-95 disabled:opacity-40"
              >
                {isSavingPin ? 'Saving PIN...' : 'SAVE WITHDRAWAL PIN'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* APK Download Modal */}
      {isApkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-green-400">
                <Download className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">Download Android APK</h3>
              </div>
              <button
                onClick={() => setIsApkModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">PocketPoints-v1.0.4.apk</span>
                <span className="text-[10px] text-slate-400 font-mono">18.4 MB</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Supports Android 10, 11, 12, 13, 14 & 15. Requires permission to install from browser.
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <a
                href="#download"
                onClick={e => {
                  e.preventDefault();
                  showToast('Starting Pocket Points APK download package...', 'success');
                  setIsApkModalOpen(false);
                }}
                className="w-full py-2.5 bg-green-500 hover:bg-green-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-transform active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD APK (18.4 MB)</span>
              </a>
              <p className="text-[10px] text-center text-slate-500">
                SHA-256 verified package with Play Protect compatibility.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-left">
            <div className="flex items-center space-x-2 text-rose-400 pb-3 border-b border-slate-800">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-xs text-white">Confirm Deletion Request</h3>
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              In accordance with India DPDP Act and GDPR, your account data, watch history, and wallet records will be queued for permanent deletion within 30 days. Any pending withdrawals will be settled or cancelled.
            </p>

            <div className="flex items-center space-x-2 mt-4">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRequest}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold disabled:opacity-50"
              >
                {isDeleting ? 'Queuing...' : 'Request Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
