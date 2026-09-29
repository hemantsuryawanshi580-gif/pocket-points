import React, { useState, useEffect } from 'react';
import { User, Video } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useApp } from '../../context/AppContext.tsx';
import { X, CheckCircle2, UserPlus, UserCheck, Eye, Film, ShieldAlert } from 'lucide-react';

interface CreatorProfileModalProps {
  creatorId: string;
  isOpen: boolean;
  onClose: () => void;
  onFollowToggle?: () => void;
}

export const CreatorProfileModal: React.FC<CreatorProfileModalProps> = ({
  creatorId,
  isOpen,
  onClose,
  onFollowToggle,
}) => {
  const { currentUser, showToast } = useApp();
  const [creator, setCreator] = useState<User | null>(null);
  const [stats, setStats] = useState<{
    followersCount: number;
    followingCount: number;
    totalViews: number;
    totalEarningsInr: number;
    videos: Video[];
  } | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && creatorId) {
      loadCreator();
    }
  }, [isOpen, creatorId]);

  const loadCreator = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCreator(creatorId);
      setCreator(data.creator);
      setStats(data);
      // Check if current user is following
      const videos = await api.getVideos();
      const thisVid = videos.videos.find(v => v.creatorId === creatorId);
      setIsFollowing(Boolean(thisVid?.isFollowing));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const res = await api.toggleFollowCreator(creatorId);
      setIsFollowing(res.isFollowing);
      if (stats) {
        setStats({ ...stats, followersCount: res.followersCount });
      }
      showToast(res.isFollowing ? `Following @${creator?.username}` : `Unfollowed @${creator?.username}`, 'info');
      if (onFollowToggle) onFollowToggle();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleBlock = () => {
    setIsBlocked(!isBlocked);
    showToast(isBlocked ? `Unblocked @${creator?.username}` : `Blocked @${creator?.username}. You will not see their videos.`, 'info');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Creator Profile</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {isLoading || !creator ? (
            <div className="text-center py-8 text-xs text-slate-500">Loading creator details...</div>
          ) : (
            <>
              {/* Profile Card */}
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <img
                    src={creator.avatarUrl}
                    alt={creator.displayName}
                    className="w-20 h-20 rounded-full object-cover border-2 border-amber-500/50 shadow-lg"
                  />
                  {creator.isVerified && (
                    <CheckCircle2 className="w-5 h-5 text-amber-400 fill-amber-400/20 absolute bottom-0 right-0 bg-slate-900 rounded-full" />
                  )}
                </div>

                <h3 className="font-extrabold text-base text-white mt-2 flex items-center space-x-1">
                  <span>{creator.displayName}</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">@{creator.username}</p>

                {creator.bio && (
                  <p className="text-xs text-slate-300 mt-2 px-2 leading-relaxed">{creator.bio}</p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 w-full mt-4 bg-slate-800/60 p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="block text-sm font-bold text-slate-100">{stats?.followersCount || 0}</span>
                    <span className="text-[10px] text-slate-400">Followers</span>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-100">{stats?.followingCount || 0}</span>
                    <span className="text-[10px] text-slate-400">Following</span>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-100">
                      {(stats?.totalViews || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">Total Views</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 w-full mt-4">
                  {currentUser?.id !== creator.id && (
                    <>
                      <button
                        onClick={handleFollow}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors ${
                          isFollowing
                            ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                        }`}
                      >
                        {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        <span>{isFollowing ? 'Following' : 'Follow Creator'}</span>
                      </button>

                      <button
                        onClick={handleBlock}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700"
                        title={isBlocked ? 'Unblock creator' : 'Block creator'}
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Creator Economics Badge */}
                <div className="w-full mt-3 p-2 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-left">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-indigo-300">Creator Revenue Share:</span>
                    <span className="font-bold text-indigo-200">23% Verified Pool</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    Pocket Points distributes 23% of verified advertising revenue directly to original creators.
                  </p>
                </div>
              </div>

              {/* Creator Videos List */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-1.5 mb-2">
                  <Film className="w-3.5 h-3.5 text-amber-400" />
                  <span>Uploaded Content ({stats?.videos.length || 0})</span>
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  {stats?.videos.map(v => (
                    <div
                      key={v.id}
                      className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 relative aspect-video flex flex-col justify-end p-1.5 group"
                    >
                      <img
                        src={v.thumbnailUrl}
                        alt={v.caption}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform"
                      />
                      <div className="relative z-10">
                        <span className="text-[9px] font-bold bg-slate-900/80 px-1 py-0.5 rounded text-amber-300">
                          {v.category}
                        </span>
                        <p className="text-[10px] text-white line-clamp-1 font-medium mt-0.5">{v.caption}</p>
                        <div className="flex items-center space-x-1 text-[9px] text-slate-300 mt-0.5">
                          <Eye className="w-2.5 h-2.5" />
                          <span>{v.viewsCount} views</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
