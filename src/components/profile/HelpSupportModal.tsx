import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  HelpCircle,
  X,
  MessageCircle,
  Mail,
  Shield,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
} from 'lucide-react';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const faqs = [
    {
      q: 'हाउ डज़ पॉकेट पॉइंट्स वर्क? (How do Pocket Points work?)',
      a: 'Users earn points (100 points = ₹1.00) by watching short videos, completing verified partner tasks, and referring friends. Creators earn 23% of verified advertising revenue.',
    },
    {
      q: 'UPI निकासी कैसे करें? (How to withdraw via UPI?)',
      a: 'Go to Wallet tab, enter your registered UPI ID (e.g. yourname@okaxis, yourname@paytm), enter points (minimum 1,000 points = ₹10), and confirm with your 4-digit PIN. Withdrawals are processed instantly or within 2 hours.',
    },
    {
      q: 'मोबाइल नंबर कैसे बदलें? (How to change mobile number?)',
      a: 'Open Profile -> Settings -> Mobile Number. Enter your new 10-digit Indian number and verify the 6-digit SMS OTP. The authenticated phone identity is updated safely.',
    },
    {
      q: 'मेरा OTP प्राप्त नहीं हुआ? (Did not receive OTP?)',
      a: 'Ensure you have adequate cellular network reception and your SIM accepts promotional/transactional SMS. Wait 30 seconds to tap "Resend OTP". In test mode, use the highlighted test OTP.',
    },
  ];

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) {
      showToast('Please fill out both subject and message', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      showToast('Support ticket #PP-8492 created. We will reply within 24 hours.', 'success');
      setTimeout(() => {
        setSubmitted(false);
        setTicketSubject('');
        setTicketMessage('');
        onClose();
      }, 1500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-left">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h2 className="font-extrabold text-base text-white">Help & Support</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
          {/* Quick Contact Chips */}
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href="mailto:support@pocketpoints.in?subject=PocketPoints%20User%20Support"
              className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl flex items-center space-x-2.5 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Email Support</p>
                <p className="text-[10px] text-slate-400 truncate">support@pocketpoints.in</p>
              </div>
            </a>

            <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Instant AI Help</p>
                <p className="text-[10px] text-emerald-400">24/7 in 10+ languages</p>
              </div>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-2">
            <span className="text-xs font-extrabold text-slate-300 block uppercase tracking-wider">
              Frequently Asked Questions (FAQ)
            </span>
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
              {faqs.map((f, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i} className="p-3">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-200"
                    >
                      <span className="pr-2">{f.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <p className="mt-2 text-[11px] text-slate-300 leading-relaxed pl-1 border-l-2 border-amber-400">
                        {f.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grievance & Ticket Submission Form */}
          <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white">Raise Grievance / Ticket</h3>
            </div>

            {submitted ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-xs text-emerald-300 flex items-center justify-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ticket submitted successfully!</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitTicket} className="space-y-2.5">
                <div>
                  <input
                    type="text"
                    value={ticketSubject}
                    onChange={e => setTicketSubject(e.target.value)}
                    placeholder="Subject (e.g. Withdrawal pending, task issue)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <textarea
                    value={ticketMessage}
                    onChange={e => setTicketMessage(e.target.value)}
                    rows={3}
                    placeholder="Detailed explanation..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5 active:scale-98 transition-transform disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Support Ticket'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
