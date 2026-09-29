import React, { useState, useEffect } from 'react';
import { VideoComment } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useApp } from '../../context/AppContext.tsx';
import { X, Send, Heart } from 'lucide-react';

interface CommentsSheetProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: () => void;
}

export const CommentsSheet: React.FC<CommentsSheetProps> = ({
  videoId,
  isOpen,
  onClose,
  onCommentAdded,
}) => {
  const { showToast } = useApp();
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && videoId) {
      loadComments();
    }
  }, [isOpen, videoId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const res = await api.getComments(videoId);
      setComments(res.comments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await api.postComment(videoId, newComment.trim());
      if (res.comment) {
        setComments(prev => [res.comment, ...prev]);
        setNewComment('');
        showToast('Comment posted!', 'success');
        if (onCommentAdded) onCommentAdded();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to post comment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-t border-slate-800 rounded-t-2xl max-h-[70vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm text-slate-100">Comments</span>
            <span className="text-xs text-slate-400">({comments.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
          {isLoading ? (
            <div className="text-center py-8 text-xs text-slate-500">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No comments yet. Be the first to share your thoughts!
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex space-x-2.5 items-start">
                <img
                  src={c.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                  alt={c.username}
                  className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-slate-200">@{c.username}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 break-words">{c.content}</p>
                </div>
                <button className="text-slate-500 hover:text-rose-400 p-1 flex flex-col items-center shrink-0">
                  <Heart className="w-3.5 h-3.5" />
                  <span className="text-[9px] mt-0.5">{c.likesCount || 0}</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Post Comment Input */}
        <form onSubmit={handlePost} className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center space-x-2">
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a constructive comment..."
            maxLength={250}
            className="flex-1 bg-slate-800 text-xs text-slate-200 rounded-full px-3.5 py-2 border border-slate-700 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-400 shrink-0 font-bold transition-transform active:scale-95"
          >
            <Send className="w-4 h-4 -ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
