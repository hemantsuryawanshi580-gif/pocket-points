import React, { useState, useEffect } from 'react';
import { Video, VideoCategory } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useApp } from '../../context/AppContext.tsx';
import {
  Upload,
  Film,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Eye,
  Heart,
  MessageSquare,
  TrendingUp,
  Percent,
} from 'lucide-react';

export const CreateView: React.FC = () => {
  const { currentUser, showToast, refreshUserData } = useApp();
  const [activeTab, setActiveTab] = useState<'upload' | 'dashboard'>('upload');

  // Form Fields
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<VideoCategory>('Finance & Tips');
  const [hashtags, setHashtags] = useState('#PocketPoints #Learn #Tips');
  const [selectedSampleVideo, setSelectedSampleVideo] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  const [thumbnailUrl, setThumbnailUrl] = useState('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&auto=format&fit=crop&q=80');
  const [originalityCertified, setOriginalityCertified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Creator uploaded videos
  const [creatorVideos, setCreatorVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categories: VideoCategory[] = [
    'Finance & Tips',
    'Tech',
    'Education',
    'Entertainment',
    'Gaming',
    'Lifestyle',
    'Comedy',
    'Music',
  ];

  const sampleVideos = [
    {
      label: 'Budgeting & Finance Hack (15s)',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumb: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&auto=format&fit=crop&q=80',
    },
    {
      label: 'Android Hidden Feature (15s)',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      thumb: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
    },
    {
      label: 'Street Food Review (15s)',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      thumb: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const loadCreatorData = async () => {
    setIsLoading(true);
    try {
      if (currentUser) {
        const data = await api.getCreator(currentUser.id);
        setCreatorVideos(data.videos || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCreatorData();
  }, [currentUser]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) {
      return showToast('Please enter a video caption', 'error');
    }
    if (!originalityCertified) {
      return showToast('You must certify ownership or authorized rights to upload', 'error');
    }

    setIsSubmitting(true);
    try {
      const res = await api.uploadVideo({
        caption: caption.trim(),
        category,
        hashtags: hashtags.split(/[ ,]+/).filter(Boolean),
        videoUrl: selectedSampleVideo,
        thumbnailUrl,
        originalityCertified: true,
      });

      showToast('Video uploaded! It is queued for admin moderation.', 'success');
      setCaption('');
      setOriginalityCertified(false);
      await loadCreatorData();
      setActiveTab('dashboard');
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCreatorEarnings = creatorVideos.reduce((sum, v) => sum + v.creatorEarnings, 0);
  const totalViews = creatorVideos.reduce((sum, v) => sum + v.viewsCount, 0);
  const totalWatchMinutes = Math.round(creatorVideos.reduce((sum, v) => sum + v.watchTimeSeconds, 0) / 60);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto no-scrollbar p-3 max-w-md mx-auto w-full space-y-4">
      {/* Top Studio Switcher */}
      <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'upload' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
          }`}
        >
          Upload Video
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'dashboard' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
          }`}
        >
          Creator Studio ({creatorVideos.length})
        </button>
      </div>

      {/* 1. UPLOAD VIEW */}
      {activeTab === 'upload' && (
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-left">
          {/* Revenue Model Callout */}
          <div className="p-3 bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl">
            <div className="flex items-center space-x-1.5 text-amber-400 text-xs font-bold">
              <Percent className="w-4 h-4" />
              <span>23% Creator Revenue Allocation</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              When your approved video receives verified advertiser impressions, 23% of verified eligible revenue is allocated directly to your creator balance.
            </p>
          </div>

          {/* Sample Video Selection (Test Mode CDN) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <label className="block text-xs font-bold text-slate-200">Select Video Clip</label>
            <div className="space-y-2">
              {sampleVideos.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedSampleVideo(s.url);
                    setThumbnailUrl(s.thumb);
                  }}
                  className={`p-2.5 rounded-xl border flex items-center space-x-2.5 cursor-pointer transition-colors ${
                    selectedSampleVideo === s.url
                      ? 'border-amber-400 bg-amber-500/10'
                      : 'border-slate-800 bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <img src={s.thumb} alt={s.label} className="w-12 h-8 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-white block truncate">{s.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">15 seconds • 720p Mobile</span>
                  </div>
                  {selectedSampleVideo === s.url && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
            <label className="block text-xs font-bold text-slate-200">Video Caption</label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Write an engaging caption explaining your video..."
              maxLength={280}
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <div className="text-right text-[10px] text-slate-500 font-mono">{caption.length}/280</div>
          </div>

          {/* Category */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <label className="block text-xs font-bold text-slate-200">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold text-left transition-colors truncate ${
                    category === cat
                      ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                      : 'border-slate-800 bg-slate-850 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Hashtags */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
            <label className="block text-xs font-bold text-slate-200">Hashtags</label>
            <input
              type="text"
              value={hashtags}
              onChange={e => setHashtags(e.target.value)}
              placeholder="#PocketPoints #Tips #Tech"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Originality & Moderation Notice */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-start space-x-2 text-[11px] text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Moderation Queue:</strong> Every uploaded video is reviewed by platform administrators before public feed visibility. We do not claim perfect automated copyright detection.
              </span>
            </div>

            <label className="flex items-start space-x-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={originalityCertified}
                onChange={e => setOriginalityCertified(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0"
              />
              <span className="text-[11px] text-slate-200 font-medium leading-tight">
                I certify that this video is my original creation or that I possess all necessary authorization to publish and monetize it on Pocket Points.
              </span>
            </label>
          </div>

          {/* Upload Button */}
          <button
            type="submit"
            disabled={!originalityCertified || isSubmitting || !caption.trim()}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>{isSubmitting ? 'Uploading & Validating...' : 'Submit Video for Moderation'}</span>
          </button>
        </form>
      )}

      {/* 2. CREATOR DASHBOARD VIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4 text-left">
          {/* Performance Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Creator Analytics</h3>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="block text-base font-extrabold text-white">{totalViews.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400">Total Views</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="block text-base font-extrabold text-white">{totalWatchMinutes} min</span>
                <span className="text-[10px] text-slate-400">Watch Time</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="block text-base font-extrabold text-amber-400">₹{totalCreatorEarnings.toFixed(2)}</span>
                <span className="text-[10px] text-slate-400">23% Rev Share</span>
              </div>
            </div>
          </div>

          {/* Uploaded Videos List with Status */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-300">Uploaded Videos ({creatorVideos.length})</h4>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-500">Loading your videos...</div>
            ) : creatorVideos.length === 0 ? (
              <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 text-center">
                <Film className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-300">No videos uploaded yet</p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="mt-3 px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
                >
                  Upload Your First Video
                </button>
              </div>
            ) : (
              creatorVideos.map(v => (
                <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex space-x-3">
                  <div className="relative w-20 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                    <img src={v.thumbnailUrl} alt={v.caption} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                        {v.category}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          v.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : v.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-200 line-clamp-1 mt-1">{v.caption}</p>

                    <div className="flex items-center space-x-3 text-[10px] text-slate-400 mt-1.5">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{v.viewsCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-3 h-3" />
                        <span>{v.likesCount}</span>
                      </div>
                      <div className="text-emerald-400 font-semibold font-mono">
                        Earned: ₹{v.creatorEarnings.toFixed(2)}
                      </div>
                    </div>

                    {v.moderationReason && (
                      <p className="text-[10px] text-rose-400 mt-1">Note: {v.moderationReason}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
