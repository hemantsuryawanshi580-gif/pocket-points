import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { api } from '../../services/api.ts';
import {
  User as UserIcon,
  Camera,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Smartphone,
  Mail,
  Languages,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { ChangePhoneModal } from './ChangePhoneModal.tsx';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const { currentUser, showToast, refreshUserData } = useApp();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [language, setLanguage] = useState(currentUser?.language || 'en');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isChangePhoneOpen, setIsChangePhoneOpen] = useState(false);

  // Avatar presets
  const AVATAR_PRESETS = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  ];

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('फोटो का आकार 2MB से कम होना चाहिए (Photo must be under 2MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate Display Name
    if (!displayName.trim() || displayName.trim().length < 2) {
      setErrorMsg('नाम कम से कम 2 अक्षरों का होना चाहिए (Name must be at least 2 characters)');
      return;
    }

    // Validate Username
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      setErrorMsg('यूजरनेम 3 से 30 अक्षरों का होना चाहिए (Username must be 3-30 characters)');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setErrorMsg('यूजरनेम में केवल अंग्रेजी अक्षर, संख्याएं और _ मान्य हैं (Only letters, numbers, and _ are allowed)');
      return;
    }

    // Validate Bio
    if (bio.length > 160) {
      setErrorMsg('बायो अधिकतम 160 अक्षरों का हो सकता है (Bio cannot exceed 160 characters)');
      return;
    }

    setIsSaving(true);
    try {
      await api.updateProfile({
        displayName: displayName.trim(),
        username: cleanUsername,
        bio: bio.trim(),
        avatarUrl,
        language,
      });

      showToast('प्रोफ़ाइल सफलतापूर्वक अपडेट की गई (Profile updated successfully!)', 'success');
      await refreshUserData();
      onProfileUpdated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'प्रोफ़ाइल सहेजने में विफल (Failed to save profile)');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-left">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
            <div className="flex items-center space-x-2">
              <UserIcon className="w-5 h-5 text-amber-400" />
              <h2 className="font-extrabold text-base text-white">Edit Profile</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 flex items-start space-x-2 text-rose-300 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-tight">{errorMsg}</span>
              </div>
            )}

            {/* Profile Photo Section */}
            <div className="flex flex-col items-center justify-center space-y-2.5 pb-3 border-b border-slate-800">
              <div className="relative group">
                <img
                  src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                  alt="Avatar preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-amber-500/80 shadow-lg"
                />
                <label className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white text-[10px] font-bold">
                  <Camera className="w-5 h-5 mb-0.5 text-amber-400" />
                  <span>Change</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Avatar Presets */}
              <div className="w-full text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Or select preset avatar:
                </span>
                <div className="flex justify-center gap-2 mt-1.5 flex-wrap">
                  {AVATAR_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatarUrl(preset)}
                      className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 ${
                        avatarUrl === preset ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-700 opacity-70'
                      }`}
                    >
                      <img src={preset} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Display Name (नाम) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={50}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                required
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Username (@यूजरनेम) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  maxLength={30}
                  placeholder="rahul_s"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-7 pr-3.5 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Unique identifier across Pocket Points. 3–30 characters (letters, numbers, underscore).
              </p>
            </div>

            {/* Bio with Character Counter */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">Bio (बायो / विवरण)</label>
                <span className={`text-[10px] font-mono ${bio.length > 150 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                  {bio.length}/160
                </span>
              </div>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value.slice(0, 160))}
                rows={3}
                placeholder="Tell the Pocket Points community about yourself..."
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 resize-none transition-colors"
              />
            </div>

            {/* Verified Mobile Number Section */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">Mobile Number</span>
                </div>
                {currentUser?.phoneVerified || currentUser?.phoneNumber ? (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified ✓</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-rose-400 font-medium">Not verified</span>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-mono font-bold text-slate-200">
                  {currentUser?.phoneNumber || 'No phone linked'}
                </span>

                <button
                  type="button"
                  onClick={() => setIsChangePhoneOpen(true)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 hover:border-amber-500/40 rounded-lg text-[11px] font-bold transition-colors"
                >
                  {currentUser?.phoneNumber ? 'Change Number' : 'Verify Mobile Number'}
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                Secured by Supabase Auth Phone OTP. Phone changes require real 6-digit OTP verification.
              </p>
            </div>

            {/* Email (Read-Only) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Email Address (ईमेल)
              </label>
              <div className="flex items-center space-x-2 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2">
                <Mail className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-400 font-mono">
                  {currentUser?.email || 'No email attached'}
                </span>
              </div>
            </div>

            {/* Preferred Language */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                App Language (भाषा)
              </label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
              >
                <option value="en">English (English)</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="bn">বাংলা (Bengali)</option>
              </select>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full h-11 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-transform active:scale-[0.98] disabled:opacity-40"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>SAVE PROFILE CHANGES</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Change Phone Modal */}
      <ChangePhoneModal
        isOpen={isChangePhoneOpen}
        onClose={() => setIsChangePhoneOpen(false)}
        onSuccess={() => {
          refreshUserData();
          onProfileUpdated();
        }}
      />
    </>
  );
};
