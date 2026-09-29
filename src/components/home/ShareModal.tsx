import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Share2, Copy, Check, X, MessageSquare } from 'lucide-react';

interface ShareModalProps {
  videoId: string;
  caption: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ videoId, caption, isOpen, onClose }) => {
  const { showToast, currentUser } = useApp();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `https://pocketpoints.in/video/${videoId}?ref=${currentUser?.referralCode || 'APP'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast('Video link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Watch this video on Pocket Points and earn rewards with me! 💰\n\n"${caption}"\n\n${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-amber-400">
            <Share2 className="w-5 h-5" />
            <span className="font-bold text-sm text-slate-100">Share Video</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <p className="text-xs text-slate-300 line-clamp-2 italic">"{caption}"</p>

          <div className="flex items-center space-x-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-transparent text-xs text-slate-300 flex-1 truncate outline-none select-all font-mono"
            />
            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center space-x-1 hover:bg-amber-400 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleWhatsApp}
              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handleCopy}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </button>
          </div>

          <p className="text-[10px] text-center text-slate-500">
            Shares include your referral code ({currentUser?.referralCode}). When new friends join and qualify, you get 500 points!
          </p>
        </div>
      </div>
    </div>
  );
};
