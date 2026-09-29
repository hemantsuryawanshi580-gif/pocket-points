import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { api } from '../../services/api.ts';
import { UserProfile, Video } from '../../types/index.ts';
import {
  User as UserIcon,
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
  Settings as SettingsIcon,
  HelpCircle,
  Edit3,
  Play,
  Heart,
  Eye,
  Coins,
  Share2,
  Sparkles,
  Users,
  Grid,
  Award,
  Lock,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { EditProfileModal } from './EditProfileModal.tsx';
import { SettingsView } from './SettingsView.tsx';
import { HelpSupportModal } from './HelpSupportModal.tsx';
import { LoginModal } from '../auth/LoginModal.tsx';
import { ChangePhoneModal } from './ChangePhoneModal.tsx';

export const ProfileView: React.FC = () => {
  const { currentUser, wallet, settings, showToast, refreshUserData, switchUser, setActiveTab } = useApp();

  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [userVideos, setUserVideos] = useState<Video[]>([]);
  const [likedVideos, setLikedVideos] = useState<Video[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'videos' | 'liked' | 'rewards'>('videos');
  const [isLoading, setIsLoading] = useState(false);

  // Modals & Navigation
  const [viewState, setViewState] = useState<'PROFILE' | 'SETTINGS'>('PROFILE');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isChangePhoneOpen, setIsChangePhoneOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const loadProfileAndContent = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const data = await api.getProfile(currentUser.id);
      setProfileData(data.profile);

      // Load all videos to extract user's videos and liked videos
      const videoRes = await api.getVideos();
      const myVids = videoRes.videos.filter(v => v.creatorId === currentUser.id);
      const myLiked = videoRes.videos.filter(v => v.isLiked);
      setUserVideos(myVids);
      setLikedVideos(myLiked);
    } catch (err) {
      console.error('Failed to load profile details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfileAndContent();
  }, [currentUser?.id]);

  const handleCopyCode = () => {
    if (!currentUser) return;
    navigator.clipboard.writeText(currentUser.referralCode);
    setCopiedCode(true);
    showToast('Referral code copied to clipboard!', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // If currently in Settings View
  if (viewState === 'SETTINGS') {
    return (
      <SettingsView
        onBack={() => setViewState('PROFILE')}
        onEditProfile={() => setIsEditModalOpen(true)}
      />
    );
  }

  const followersCount = profileData?.followersCount ?? currentUser?.followersCount ?? 0;
  const followingCount = profileData?.followingCount ?? currentUser?.followingCount ?? 0;
  const videosCount = userVideos.length || profileData?.videosCount || 0;
  const likesCount = profileData?.likesCount ?? currentUser?.likesCount ?? 0;

  const phoneVerified = Boolean(currentUser?.phoneVerified || currentUser?.isVerified);
  const phoneDisplay = currentUser?.phoneNumber;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto no-scrollbar max-w-md mx-auto w-full text-left pb-6">
      {/* 1. Profile Hero Section */}
      <div className="relative pt-6 pb-4 px-4 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-b border-slate-800/80">
        <div className="flex flex-col items-center text-center">
          {/* Large circular profile photo with verified ring */}
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-yellow-400 to-indigo-500 shadow-xl shadow-amber-500/10">
              <img
                src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'}
                alt={currentUser?.displayName || 'User profile'}
                className="w-full h-full rounded-full object-cover border-2 border-slate-950"
              />
            </div>

            {/* Creator / Role status badge */}
            <span
              className={`absolute bottom-0 right-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border-2 border-slate-950 shadow-md ${
                currentUser?.role === 'SUPER_ADMIN'
                  ? 'bg-purple-500 text-white'
                  : currentUser?.role === 'CREATOR'
                  ? 'bg-blue-500 text-white'
                  : 'bg-emerald-500 text-slate-950'
              }`}
            >
              {currentUser?.role === 'SUPER_ADMIN' ? 'Admin' : currentUser?.role === 'CREATOR' ? 'Creator' : 'User'}
            </span>
          </div>

          {/* Name & Username */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-center space-x-1.5">
              <h1 className="text-lg font-black text-white tracking-tight">{currentUser?.displayName}</h1>
              {phoneVerified && (
                <span title="Verified Mobile Account">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </span>
              )}
            </div>
            <p className="text-xs text-amber-400 font-mono">@{currentUser?.username}</p>
          </div>

          {/* Bio */}
          <p className="text-xs text-slate-300 max-w-xs mt-2 leading-relaxed">
            {currentUser?.bio || 'Watching & creating content on Pocket Points. Earning honest rewards every day! 🇮🇳'}
          </p>

          {/* 4 Primary Stats: Followers, Following, Videos, Likes */}
          <div className="grid grid-cols-4 gap-2 w-full max-w-xs mt-4 pt-3 border-t border-slate-800/80 text-center">
            <div className="p-1">
              <div className="text-sm font-black text-white font-mono">{followersCount.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 font-medium">Followers</div>
            </div>
            <div className="p-1">
              <div className="text-sm font-black text-white font-mono">{followingCount.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 font-medium">Following</div>
            </div>
            <div className="p-1">
              <div className="text-sm font-black text-white font-mono">{videosCount}</div>
              <div className="text-[10px] text-slate-400 font-medium">Videos</div>
            </div>
            <div className="p-1">
              <div className="text-sm font-black text-white font-mono">{likesCount.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 font-medium">Likes</div>
            </div>
          </div>

          {/* 3 Action Buttons: EDIT PROFILE, SETTINGS, HELP & SUPPORT */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-sm mt-4">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="py-2.5 px-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/15 flex items-center justify-center space-x-1.5 active:scale-95 transition-transform"
            >
              <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>EDIT PROFILE</span>
            </button>

            <button
              onClick={() => setViewState('SETTINGS')}
              className="py-2.5 px-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 active:scale-95 transition-transform"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>SETTINGS</span>
            </button>

            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="py-2.5 px-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 active:scale-95 transition-transform"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>HELP & SUPPORT</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-3.5 space-y-4">
        {/* 2. Mobile Number Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Mobile Number</p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-xs font-mono font-bold text-white">
                  {phoneDisplay || 'Not verified'}
                </span>
                {phoneVerified ? (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-0.5">
                    <span>Verified ✓</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-rose-400 font-medium">Unverified</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsChangePhoneOpen(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700 hover:border-amber-400/40 rounded-xl text-xs font-bold transition-transform active:scale-95"
          >
            {phoneDisplay ? 'Change' : 'VERIFY MOBILE NUMBER'}
          </button>
        </div>

        {/* 3. Mobile OTP Login / Account Switch trigger */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-500/20 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Mobile OTP Login Flow</p>
              <p className="text-[10px] text-indigo-300/80">Real Supabase Phone OTP Architecture</p>
            </div>
          </div>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95"
          >
            Test OTP Login
          </button>
        </div>

        {/* 4. Sub-Tabs: Videos | Liked | Rewards */}
        <div className="flex items-center border-b border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('videos')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center space-x-1.5 ${
              activeSubTab === 'videos'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>My Videos ({userVideos.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('liked')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center space-x-1.5 ${
              activeSubTab === 'liked'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Liked ({likedVideos.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('rewards')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center space-x-1.5 ${
              activeSubTab === 'rewards'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Rewards</span>
          </button>
        </div>

        {/* Tab 1: My Videos */}
        {activeSubTab === 'videos' && (
          <div>
            {userVideos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5">
                {userVideos.map(video => (
                  <div
                    key={video.id}
                    className="group relative aspect-[9/14] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-sm"
                  >
                    <img
                      src={video.thumbnailUrl}
                      alt={video.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2.5 flex flex-col justify-between">
                      <span className="self-end px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-bold text-amber-400 uppercase">
                        {video.status}
                      </span>
                      <div>
                        <p className="text-[11px] font-bold text-white line-clamp-2 leading-tight">
                          {video.caption}
                        </p>
                        <div className="flex items-center space-x-2.5 text-[10px] text-slate-300 mt-1">
                          <span className="flex items-center space-x-0.5">
                            <Eye className="w-3 h-3 text-slate-400" />
                            <span>{video.viewsCount.toLocaleString()}</span>
                          </span>
                          <span className="flex items-center space-x-0.5">
                            <Heart className="w-3 h-3 text-rose-400" />
                            <span>{video.likesCount.toLocaleString()}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <Play className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">No videos published yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Share your daily creativity, earn 23% revenue share, and inspire others!
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-transform active:scale-95 inline-flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Upload Your First Video</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Liked Videos */}
        {activeSubTab === 'liked' && (
          <div>
            {likedVideos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5">
                {likedVideos.map(video => (
                  <div
                    key={video.id}
                    className="relative aspect-[9/14] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-sm"
                  >
                    <img
                      src={video.thumbnailUrl}
                      alt={video.caption}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2.5 flex flex-col justify-end">
                      <p className="text-[11px] font-bold text-white line-clamp-2 leading-tight">
                        {video.caption}
                      </p>
                      <p className="text-[10px] text-amber-400 font-mono mt-0.5">
                        @{video.creatorUsername}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-2">
                <Heart className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs font-bold text-white">No liked videos</p>
                <p className="text-[11px] text-slate-400">
                  Tap the heart icon while watching shorts in the feed to save favorites here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Rewards & Referral */}
        {activeSubTab === 'rewards' && (
          <div className="space-y-3">
            {/* Referral Code Card */}
            <div className="bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                    Your Referral Code
                  </span>
                  <div className="text-xl font-mono font-black text-white mt-0.5">
                    {currentUser?.referralCode}
                  </div>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-transform active:scale-95 shadow-md shadow-amber-500/20"
                >
                  {copiedCode ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Earn 500 points (₹5.00) when a friend joins with your code and completes 1 verified task.
              </p>
            </div>

            {/* Anti-Fraud Trust Score Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="font-bold text-white">Anti-Fraud Trust Score</p>
                  <p className="text-[10px] text-slate-400">Verified honest activity status</p>
                </div>
              </div>
              <span className="font-bold font-mono text-emerald-400 text-sm">
                {100 - (currentUser?.riskScore || 0)}/100 (Safe)
              </span>
            </div>

            {/* Persona Switcher Quick Card for Dev Evaluation */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <span className="text-xs font-bold text-slate-300 block">Switch Demo Evaluation Persona</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => switchUser('usr_rahul')}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition-colors ${
                    currentUser?.id === 'usr_rahul'
                      ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                      : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  Regular User
                </button>

                <button
                  onClick={() => switchUser('usr_priya')}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition-colors ${
                    currentUser?.id === 'usr_priya'
                      ? 'border-blue-400 bg-blue-500/10 text-blue-300'
                      : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  Creator
                </button>

                <button
                  onClick={() => {
                    switchUser('usr_admin');
                    setActiveTab('admin');
                  }}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition-colors ${
                    currentUser?.id === 'usr_admin'
                      ? 'border-purple-400 bg-purple-500/10 text-purple-300'
                      : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Modals */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onProfileUpdated={() => loadProfileAndContent()}
      />

      <HelpSupportModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => loadProfileAndContent()}
      />

      <ChangePhoneModal
        isOpen={isChangePhoneOpen}
        onClose={() => setIsChangePhoneOpen(false)}
        onSuccess={() => {
          refreshUserData();
          loadProfileAndContent();
        }}
      />
    </div>
  );
};
