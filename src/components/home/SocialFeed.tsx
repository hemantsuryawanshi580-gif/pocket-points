import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoCategory } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useApp } from '../../context/AppContext.tsx';
import {
  Heart,
  MessageCircle,
  Share2,
  AlertTriangle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Eye,
  CheckCircle2,
  UserPlus,
  UserCheck,
  Search,
  Sparkles,
  TrendingUp,
  Clock,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import { CommentsSheet } from './CommentsSheet.tsx';
import { ReportModal } from './ReportModal.tsx';
import { ShareModal } from './ShareModal.tsx';
import { CreatorProfileModal } from './CreatorProfileModal.tsx';

export const SocialFeed: React.FC = () => {
  const { showToast, refreshUserData, currentUser } = useApp();
  const [feedTab, setFeedTab] = useState<'for_you' | 'following' | 'trending'>('for_you');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [videos, setVideos] = useState<(Video & { isLiked?: boolean; isFollowing?: boolean })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Modals
  const [activeCommentVideoId, setActiveCommentVideoId] = useState<string | null>(null);
  const [activeReportVideoId, setActiveReportVideoId] = useState<string | null>(null);
  const [activeShareVideo, setActiveShareVideo] = useState<{ id: string; caption: string } | null>(null);
  const [activeCreatorId, setActiveCreatorId] = useState<string | null>(null);

  const categories: VideoCategory[] = [
    'Entertainment',
    'Finance & Tips',
    'Education',
    'Tech',
    'Gaming',
    'Lifestyle',
    'Comedy',
    'Music',
  ];

  const loadFeed = async () => {
    setIsLoading(true);
    try {
      const res = await api.getVideos({
        tab: feedTab,
        search: searchQuery,
        category: selectedCategory || undefined,
      });
      setVideos(res.videos || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load video feed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [feedTab, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFeed();
  };

  const handleToggleLike = async (videoId: string) => {
    try {
      const res = await api.toggleLike(videoId);
      setVideos(prev =>
        prev.map(v =>
          v.id === videoId ? { ...v, isLiked: res.isLiked, likesCount: res.likesCount } : v
        )
      );
    } catch (err: any) {
      showToast('Failed to like video', 'error');
    }
  };

  const handleToggleFollow = async (creatorId: string) => {
    try {
      const res = await api.toggleFollowCreator(creatorId);
      setVideos(prev =>
        prev.map(v => (v.creatorId === creatorId ? { ...v, isFollowing: res.isFollowing } : v))
      );
      showToast(res.isFollowing ? 'Following creator!' : 'Unfollowed creator', 'info');
    } catch (err: any) {
      showToast('Failed to update follow status', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto no-scrollbar">
      {/* Top Feed Navigation & Search Bar */}
      <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-900/80 px-3 py-2 flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setFeedTab('for_you');
                setSelectedCategory('');
              }}
              className={`text-xs font-extrabold pb-0.5 relative transition-colors ${
                feedTab === 'for_you' ? 'text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              For You
              {feedTab === 'for_you' && (
                <div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => {
                setFeedTab('following');
                setSelectedCategory('');
              }}
              className={`text-xs font-extrabold pb-0.5 relative transition-colors ${
                feedTab === 'following' ? 'text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Following
              {feedTab === 'following' && (
                <div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => {
                setFeedTab('trending');
                setSelectedCategory('');
              }}
              className={`text-xs font-extrabold pb-0.5 relative flex items-center space-x-1 transition-colors ${
                feedTab === 'trending' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trending</span>
              {feedTab === 'trending' && (
                <div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
              )}
            </button>
          </div>

          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-900 border border-slate-800"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search Input (Expandable) */}
        {isSearchOpen && (
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 pt-1 animate-in fade-in">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search captions, creators, #hashtags..."
                className="w-full bg-slate-900 border border-slate-800 text-xs rounded-full pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-full bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Search
            </button>
          </form>
        )}

        {/* Category Pills (Horizontal Scroll) */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 transition-colors ${
              selectedCategory === ''
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Topics
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Controlled Economics Banner */}
      <div className="mx-3 my-2 p-2 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/20 flex items-center justify-between text-[11px]">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-slate-300">
            <strong className="text-amber-300">Controlled Rewards:</strong> 23% Creator • 7% Viewer Pool • 70% Platform Share
          </span>
        </div>
      </div>

      {/* Videos List */}
      <div className="flex-1 p-3 space-y-4 max-w-md mx-auto w-full">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading approved videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="py-16 text-center space-y-2 bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
            <p className="text-sm font-semibold text-slate-300">No videos found</p>
            <p className="text-xs text-slate-500">
              {feedTab === 'following'
                ? "You aren't following any creators with uploads yet. Explore 'For You' to discover creators!"
                : 'Check back soon or upload your original authorized video.'}
            </p>
          </div>
        ) : (
          videos.map(video => (
            <VideoCard
              key={video.id}
              video={video}
              onToggleLike={() => handleToggleLike(video.id)}
              onToggleFollow={() => handleToggleFollow(video.creatorId)}
              onOpenComments={() => setActiveCommentVideoId(video.id)}
              onOpenReport={() => setActiveReportVideoId(video.id)}
              onOpenShare={() => setActiveShareVideo({ id: video.id, caption: video.caption })}
              onOpenCreator={() => setActiveCreatorId(video.creatorId)}
              onRewardEarned={() => refreshUserData()}
            />
          ))
        )}
      </div>

      {/* Modals & Bottom Sheets */}
      {activeCommentVideoId && (
        <CommentsSheet
          videoId={activeCommentVideoId}
          isOpen={Boolean(activeCommentVideoId)}
          onClose={() => setActiveCommentVideoId(null)}
          onCommentAdded={() => {
            setVideos(prev =>
              prev.map(v =>
                v.id === activeCommentVideoId ? { ...v, commentsCount: v.commentsCount + 1 } : v
              )
            );
          }}
        />
      )}

      {activeReportVideoId && (
        <ReportModal
          videoId={activeReportVideoId}
          isOpen={Boolean(activeReportVideoId)}
          onClose={() => setActiveReportVideoId(null)}
        />
      )}

      {activeShareVideo && (
        <ShareModal
          videoId={activeShareVideo.id}
          caption={activeShareVideo.caption}
          isOpen={Boolean(activeShareVideo)}
          onClose={() => setActiveShareVideo(null)}
        />
      )}

      {activeCreatorId && (
        <CreatorProfileModal
          creatorId={activeCreatorId}
          isOpen={Boolean(activeCreatorId)}
          onClose={() => setActiveCreatorId(null)}
          onFollowToggle={() => loadFeed()}
        />
      )}
    </div>
  );
};

// Video Card Item with Interactive Video Player & Watch Tracking
interface VideoCardProps {
  video: Video & { isLiked?: boolean; isFollowing?: boolean };
  onToggleLike: () => void;
  onToggleFollow: () => void;
  onOpenComments: () => void;
  onOpenReport: () => void;
  onOpenShare: () => void;
  onOpenCreator: () => void;
  onRewardEarned: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onToggleLike,
  onToggleFollow,
  onOpenComments,
  onOpenReport,
  onOpenShare,
  onOpenCreator,
  onRewardEarned,
}) => {
  const { showToast, currentUser } = useApp();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.durationSeconds || 15);
  const [hasEarnedReward, setHasEarnedReward] = useState(false);
  const watchSecondsRef = useRef<number>(0);

  // Play / Pause Toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Sound Toggle
  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Watch Time Tracker & Controlled Reward Pool Check
  const handleTimeUpdate = async () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);
    watchSecondsRef.current += 0.25;

    // Trigger watch verification when user reaches 15s or 80% of video
    if (!hasEarnedReward && (watchSecondsRef.current >= 14 || cur >= duration * 0.8)) {
      setHasEarnedReward(true);
      try {
        const res = await api.recordWatch(video.id, Math.round(watchSecondsRef.current), duration);
        if (res.eligible && res.pointsCredited) {
          showToast(res.message, 'reward', res.pointsCredited);
          onRewardEarned();
        } else if (res.message && !res.eligible) {
          // If rate limited or spam prevented
          console.log(res.message);
        }
      } catch (err) {
        console.error('Watch session recording error', err);
      }
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
      {/* Creator Header */}
      <div className="p-3 flex items-center justify-between border-b border-slate-800/60">
        <button
          onClick={onOpenCreator}
          className="flex items-center space-x-2 text-left group focus:outline-none"
        >
          <img
            src={video.creatorAvatar}
            alt={video.creatorName}
            className="w-8 h-8 rounded-full object-cover border border-slate-700 group-hover:border-amber-400 transition-colors"
          />
          <div>
            <div className="flex items-center space-x-1">
              <span className="text-xs font-bold text-slate-100 group-hover:text-amber-300">
                {video.creatorName}
              </span>
              <CheckCircle2 className="w-3 h-3 text-amber-400 fill-amber-400/20" />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">@{video.creatorUsername}</span>
          </div>
        </button>

        {currentUser?.id !== video.creatorId && (
          <button
            onClick={onToggleFollow}
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 transition-colors ${
              video.isFollowing
                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs'
            }`}
          >
            {video.isFollowing ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
            <span>{video.isFollowing ? 'Following' : 'Follow'}</span>
          </button>
        )}
      </div>

      {/* Video Container */}
      <div
        onClick={togglePlay}
        className="relative aspect-video bg-black flex items-center justify-center cursor-pointer group select-none overflow-hidden"
      >
        <video
          ref={videoRef}
          src={video.videoUrl}
          poster={video.thumbnailUrl}
          playsInline
          muted={isMuted}
          loop
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (videoRef.current) setDuration(videoRef.current.duration || 15);
          }}
          className="w-full h-full object-contain"
        />

        {/* Play/Pause Overlay indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/90 text-slate-950 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
            </div>
          </div>
        )}

        {/* Video Overlays: Sound button, Watch & Earn progress badge */}
        <div className="absolute top-2 right-2 flex items-center space-x-1.5 z-20">
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
          </button>
        </div>

        {/* Watch & Earn Progress Tag */}
        <div className="absolute top-2 left-2 z-20">
          <div className="flex items-center space-x-1 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full border border-amber-500/30 text-[10px]">
            <Coins className="w-3 h-3 text-amber-400" />
            <span className={hasEarnedReward ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
              {hasEarnedReward ? 'Reward Pool Credited (+5 pts)' : `Watch 15s to earn`}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800 z-20">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Caption & Hashtags */}
      <div className="p-3 text-left">
        <div className="flex items-center space-x-2 mb-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
            {video.category}
          </span>
          <div className="flex items-center space-x-1 text-[11px] text-slate-400">
            <Eye className="w-3 h-3" />
            <span>{video.viewsCount.toLocaleString()} views</span>
          </div>
        </div>

        <p className="text-xs text-slate-200 leading-relaxed font-medium">{video.caption}</p>

        {video.hashtags && video.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {video.hashtags.map((tag, i) => (
              <span key={i} className="text-[11px] font-semibold text-amber-400/90 hover:underline">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Social Action Rail */}
      <div className="px-3 pb-3 pt-1 border-t border-slate-800/60 flex items-center justify-between text-slate-400">
        <div className="flex items-center space-x-4">
          {/* Like */}
          <button
            onClick={onToggleLike}
            className={`flex items-center space-x-1 text-xs font-semibold transition-colors ${
              video.isLiked ? 'text-rose-500' : 'hover:text-slate-200'
            }`}
          >
            <Heart className={`w-4 h-4 ${video.isLiked ? 'fill-rose-500' : ''}`} />
            <span>{video.likesCount}</span>
          </button>

          {/* Comment */}
          <button
            onClick={onOpenComments}
            className="flex items-center space-x-1 text-xs font-semibold hover:text-slate-200 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{video.commentsCount}</span>
          </button>

          {/* Share */}
          <button
            onClick={onOpenShare}
            className="flex items-center space-x-1 text-xs font-semibold hover:text-slate-200 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>

        {/* Report */}
        <button
          onClick={onOpenReport}
          className="text-slate-500 hover:text-rose-400 p-1 rounded-md"
          title="Report content"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
