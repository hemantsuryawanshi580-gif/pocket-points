import React, { useState } from 'react';
import { api } from '../../services/api.ts';
import { useApp } from '../../context/AppContext.tsx';
import { AlertTriangle, X, Check } from 'lucide-react';

interface ReportModalProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ videoId, isOpen, onClose }) => {
  const { showToast } = useApp();
  const [reason, setReason] = useState<string>('SPAM');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const reasons = [
    { id: 'SPAM', label: 'Spam, scams or bot activity' },
    { id: 'COPYRIGHT', label: 'Copyright violation / Stolen video' },
    { id: 'INAPPROPRIATE', label: 'Inappropriate or adult content' },
    { id: 'MISLEADING', label: 'Misleading info or fake earning scheme' },
    { id: 'HARMFUL', label: 'Harmful or dangerous activities' },
    { id: 'OTHER', label: 'Other violation' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.reportVideo(videoId, reason, details);
      showToast('Report received. Our moderation team will investigate.', 'info');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-bold text-sm text-slate-100">Report Video</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <p className="text-xs text-slate-400">Why are you reporting this video?</p>

          <div className="space-y-1.5">
            {reasons.map(r => (
              <label
                key={r.id}
                className={`flex items-center space-x-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                  reason === r.id
                    ? 'border-amber-500/80 bg-amber-500/10 text-white font-medium'
                    : 'border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="reportReason"
                  value={r.id}
                  checked={reason === r.id}
                  onChange={() => setReason(r.id)}
                  className="hidden"
                />
                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  reason === r.id ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                }`}>
                  {reason === r.id && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                </div>
                <span>{r.label}</span>
              </label>
            ))}
          </div>

          <div>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Additional details (optional)..."
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-xs font-semibold bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
