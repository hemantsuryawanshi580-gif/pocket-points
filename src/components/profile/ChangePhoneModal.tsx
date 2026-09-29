import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { api } from '../../services/api.ts';
import { supabaseAuthService } from '../../services/supabase.ts';
import { normalizeIndianPhone, getFriendlyAuthErrorMessage } from '../../services/authErrors.ts';
import { Smartphone, CheckCircle2, AlertCircle, ArrowLeft, KeyRound, RefreshCw, X, ShieldCheck } from 'lucide-react';

interface ChangePhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: any) => void;
}

export const ChangePhoneModal: React.FC<ChangePhoneModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser, showToast } = useApp();
  const [step, setStep] = useState<'ENTER_PHONE' | 'VERIFY_OTP'>('ENTER_PHONE');
  const [rawPhone, setRawPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [formattedDisplay, setFormattedDisplay] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(30);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<{ hi: string; en: string } | null>(null);
  const [testOtp, setTestOtp] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setStep('ENTER_PHONE');
      setRawPhone('');
      setOtpDigits(['', '', '', '', '', '']);
      setErrorMessage(null);
      setTestOtp(null);
      setCountdown(30);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: any;
    if (step === 'VERIFY_OTP' && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const norm = normalizeIndianPhone(rawPhone);
    if (!norm.isValid) {
      setErrorMessage({
        hi: norm.error || 'कृपया मान्य भारतीय 10-अंकीय मोबाइल नंबर दर्ज करें',
        en: norm.error || 'Please enter a valid 10-digit Indian mobile number',
      });
      return;
    }

    setIsSending(true);
    try {
      setNormalizedPhone(norm.normalized);
      setFormattedDisplay(norm.formattedDisplay);

      // Official Supabase or verified server SMS dispatcher:
      await supabaseAuthService.sendChangePhoneOtp(norm.normalized);

      // ONLY transition if Supabase or SMS provider accepted the request
      showToast('OTP sent to your mobile number via SMS', 'info');
      setStep('VERIFY_OTP');
      setCountdown(30);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      const friendly = getFriendlyAuthErrorMessage(err.message || 'SMS provider is not configured. Real OTP cannot be sent yet.');
      setErrorMessage(friendly);
    } finally {
      setIsSending(false);
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    // Single digit entry
    const newDigits = [...otpDigits];
    newDigits[index] = cleaned.slice(-1);
    setOtpDigits(newDigits);

    // Auto advance
    if (index < 5 && cleaned) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setOtpDigits(newDigits);
    const nextIdx = Math.min(pasted.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage({
        hi: 'कृपया पूरा 6-अंकों का OTP दर्ज करें',
        en: 'Please enter the complete 6-digit OTP',
      });
      return;
    }

    setIsVerifying(true);
    try {
      const res = await supabaseAuthService.verifyChangePhoneOtp(normalizedPhone, fullOtp);
      showToast('मोबाइल नंबर सफलतापूर्वक बदल दिया गया (Mobile number updated successfully!)', 'success');
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      const friendly = getFriendlyAuthErrorMessage(err.message || 'OTP verification failed');
      setErrorMessage(friendly);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm text-white">
              {step === 'ENTER_PHONE' ? 'Change Mobile Number' : 'Verify New Number'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current number note */}
        <div className="mt-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between text-xs">
          <span className="text-slate-400">Current Number:</span>
          <span className="font-mono font-bold text-slate-200">
            {currentUser?.phoneNumber || 'Not linked'}
          </span>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mt-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 flex items-start space-x-2 text-rose-300 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-200">{errorMessage.hi}</p>
              <p className="text-[11px] text-rose-300/80 mt-0.5">{errorMessage.en}</p>
            </div>
          </div>
        )}

        {/* Step 1: Enter New Phone */}
        {step === 'ENTER_PHONE' && (
          <form onSubmit={handleSendOtp} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                New Mobile Number (नया मोबाइल नंबर)
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300 font-mono select-none">
                  <span>🇮🇳</span>
                  <span className="font-bold">+91</span>
                </div>
                <input
                  type="tel"
                  value={rawPhone}
                  onChange={e => setRawPhone(e.target.value)}
                  placeholder="98765 43210"
                  maxLength={13}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-colors"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                We will send a 6-digit OTP to verify ownership before updating your account.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSending || rawPhone.replace(/\D/g, '').length < 10}
              className="w-full h-11 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-transform active:scale-[0.98] disabled:opacity-40"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending OTP...</span>
                </>
              ) : (
                <span>SEND OTP (OTP भेजें)</span>
              )}
            </button>
          </form>
        )}

        {/* Step 2: Verify 6-digit OTP */}
        {step === 'VERIFY_OTP' && (
          <form onSubmit={handleVerifyOtp} className="mt-4 space-y-4">
            <div className="text-center space-y-1">
              <p className="text-xs text-slate-300">Enter the 6-digit OTP sent to</p>
              <p className="text-sm font-mono font-black text-amber-400">{formattedDisplay}</p>
            </div>

            {/* Split 6 digit input boxes */}
            <div className="flex justify-between gap-1.5" onPaste={handlePaste}>
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={el => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="w-11 h-12 bg-slate-800 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white font-mono text-center text-lg font-black rounded-xl focus:outline-none transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isVerifying || otpDigits.join('').length !== 6}
              className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-transform active:scale-[0.98] disabled:opacity-40"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying OTP...</span>
                </>
              ) : (
                <span>VERIFY & CHANGE NUMBER</span>
              )}
            </button>

            {/* Resend and Change Number actions */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep('ENTER_PHONE')}
                className="text-slate-400 hover:text-white flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Number</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={countdown > 0 || isSending}
                className="font-medium text-amber-400 disabled:text-slate-500 hover:underline"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'RESEND OTP'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
