import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { api } from '../../services/api.ts';
import {
  Sparkles,
  Send,
  ThumbsUp,
  ThumbsDown,
  X,
  Bot,
  User,
  ShieldAlert,
  HelpCircle,
  MessageSquare,
  Check,
} from 'lucide-react';
import { AIChatMessage } from '../../types/index.ts';

export const AIAssistantModal: React.FC = () => {
  const { isAIOpen, setIsAIOpen, currentUser, wallet, settings, showToast } = useApp();
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: `Hello ${currentUser?.displayName?.split(' ')[0] || 'there'}! I am **Pocket Points AI Assistant**. I can help you with:\n\n• **Wallet & Withdrawals:** Check your balance and 3% UPI payout rules.\n• **Watch & Earn:** Understand the 23% creator / 7% viewer reward pool.\n• **Tasks & Referrals:** Verification times and how to earn 500 pts per invite.\n\nHow can I help you today?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [feedbackPromptId, setFeedbackPromptId] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'HELPFUL' | 'NOT_HELPFUL'>('HELPFUL');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isAIOpen) return null;

  const quickPrompts = [
    'What is my current balance & pending points?',
    'How do I withdraw to UPI & what is the fee?',
    'How does the 7% viewer reward pool work?',
    'How do I earn 500 pts from referral?',
  ];

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isTyping) return;

    const userMsg: AIChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsTyping(true);

    try {
      const res = await api.askAI(prompt);
      const assistantMsg: AIChatMessage = {
        id: res.aiResponseId || `msg_a_${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'assistant',
          text: 'I am experiencing a momentary connection delay. Please note that points conversion is 100 pts = ₹1.00 and minimum withdrawal is 1,000 pts (₹10.00). Please try asking again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const openFeedbackDialog = (msgId: string, type: 'HELPFUL' | 'NOT_HELPFUL') => {
    setFeedbackPromptId(msgId);
    setFeedbackType(type);
    setFeedbackComment('');
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackPromptId) return;
    setIsSubmittingFeedback(true);
    try {
      const targetMsg = messages.find(m => m.id === feedbackPromptId);
      const questionIndex = messages.findIndex(m => m.id === feedbackPromptId);
      const question = questionIndex > 0 ? messages[questionIndex - 1].text : 'General FAQ';

      await api.submitAIFeedback({
        question,
        aiResponseId: feedbackPromptId,
        feedback: feedbackType,
        feedbackText: feedbackComment.trim(),
      });

      setMessages(prev =>
        prev.map(m =>
          m.id === feedbackPromptId
            ? { ...m, feedback: feedbackType, feedbackComment: feedbackComment.trim() }
            : m
        )
      );

      showToast('Thank you for rating the response!', 'success');
      setFeedbackPromptId(null);
    } catch (err) {
      showToast('Failed to record feedback', 'error');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <Sparkles className="w-4 h-4 fill-slate-950" />
            </div>
            <div className="text-left">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-extrabold text-white">Pocket Points AI Assistant</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-400 font-bold px-1 rounded border border-amber-500/30">
                  Gemini 3.8
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Grounded in Live Server State</span>
            </div>
          </div>

          <button
            onClick={() => setIsAIOpen(false)}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="bg-indigo-950/40 border-b border-indigo-500/20 px-3 py-1.5 flex items-center justify-between text-[10px] text-indigo-300">
          <div className="flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>AI cannot modify balances, authorize payouts, or change economics.</span>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 no-scrollbar text-left">
          {messages.map(m => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex space-x-2 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-3.5 h-3.5 text-slate-950" />
                  </div>
                )}

                <div className={`max-w-[85%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-xs'
                        : 'bg-slate-800 text-slate-100 rounded-tl-xs border border-slate-700/80 shadow-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.text}</div>
                  </div>

                  {/* Feedback Buttons for Assistant responses */}
                  {!isUser && m.id !== 'msg_welcome' && (
                    <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-400 pl-1">
                      <span>Was this helpful?</span>
                      <button
                        onClick={() => openFeedbackDialog(m.id, 'HELPFUL')}
                        className={`p-1 rounded hover:text-emerald-400 ${
                          m.feedback === 'HELPFUL' ? 'text-emerald-400 font-bold' : ''
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => openFeedbackDialog(m.id, 'NOT_HELPFUL')}
                        className={`p-1 rounded hover:text-rose-400 ${
                          m.feedback === 'NOT_HELPFUL' ? 'text-rose-400 font-bold' : ''
                        }`}
                        title="Not Helpful"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                      {m.feedback && (
                        <span className="text-[9px] text-emerald-400 font-semibold">Feedback saved</span>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs pl-8">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-[10px]">Consulting server rules & live balance...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-1.5 bg-slate-950/70 border-t border-slate-800 flex items-center space-x-1.5 overflow-x-auto no-scrollbar shrink-0">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-[10px] shrink-0 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={e => setInputPrompt(e.target.value)}
              placeholder="Ask about rewards, UPI withdrawal, rules..."
              className="flex-1 bg-slate-900 text-xs text-white rounded-full px-4 py-2.5 border border-slate-700 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isTyping}
              className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-amber-500/20 shrink-0 transition-transform active:scale-95"
            >
              <Send className="w-4 h-4 -ml-0.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Feedback Dialog */}
      {feedbackPromptId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl text-left">
            <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
              {feedbackType === 'HELPFUL' ? (
                <ThumbsUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <ThumbsDown className="w-4 h-4 text-rose-400" />
              )}
              <span>Rate AI Answer: {feedbackType === 'HELPFUL' ? 'Helpful' : 'Needs Improvement'}</span>
            </h4>

            <p className="text-[11px] text-slate-400 mt-1">Optional: Leave brief feedback for admin review.</p>

            <textarea
              value={feedbackComment}
              onChange={e => setFeedbackComment(e.target.value)}
              placeholder="Tell us what was good or what can be improved..."
              rows={2}
              className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />

            <div className="flex items-center space-x-2 mt-3">
              <button
                type="button"
                onClick={() => setFeedbackPromptId(null)}
                className="flex-1 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleFeedbackSubmit}
                disabled={isSubmittingFeedback}
                className="flex-1 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold disabled:opacity-50"
              >
                {isSubmittingFeedback ? 'Saving...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
