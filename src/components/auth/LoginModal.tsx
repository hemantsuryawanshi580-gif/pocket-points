import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { api } from '../../services/api.ts';
import { supabaseAuthService } from '../../services/supabase.ts';
import { normalizeIndianPhone, getFriendlyAuthErrorMessage } from '../../services/authErrors.ts';
import { AuthProviderStatus } from '../../types/index.ts';
import {
  Coins,
  Smartphone,
  Check,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  X,
  HelpCircle,
  ShieldCheck,
  Flame,
  Sparkles,
} from 'lucide-react';
import { HelpSupportModal } from '../profile/HelpSupportModal.tsx';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { showToast, refreshUserData, setActiveTab } = useApp();

  const [step, setStep] = useState<'PHONE_INPUT' | 'OTP_INPUT'>('PHONE_INPUT');
  const [rawPhone, setRawPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [formattedDisplay, setFormattedDisplay] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<{ hi: string; en: string } | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<AuthProviderStatus | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      api.getProviderStatus()
        .then(status => setProviderStatus(status))
        .catch(() => {});
      setStep('PHONE_INPUT');
      setRawPhone('');
      setOtpDigits(['', '', '', '', '', '']);
      setErrorMessage(null);
      setGoogleError(null);
      setCountdown(30);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: any;
    if (step === 'OTP_INPUT' && countdown > 0) {
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

    setIsLoading(true);
    try {
      setNormalizedPhone(norm.normalized);
      setFormattedDisplay(norm.formattedDisplay);

      // Official Supabase signInWithOtp flow or server-side verified SMS dispatcher:
      await supabaseAuthService.sendPhoneOtp(norm.normalized);

      // ONLY REACHED IF SUPABASE / SMS PROVIDER CONFIRMED OTP REQUEST WAS ACCEPTED
      showToast('OTP sent to your mobile number via SMS', 'info');
      setStep('OTP_INPUT');
      setCountdown(30);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      const friendly = getFriendlyAuthErrorMessage(err.message || 'SMS provider is not configured. Real OTP cannot be sent yet.');
      setErrorMessage(friendly);
      // REMAINS ON PHONE_INPUT STEP! Never shows OTP screen when OTP request failed!
    } finally {
      setIsLoading(false);
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

    const newDigits = [...otpDigits];
    newDigits[index] = cleaned.slice(-1);
    setOtpDigits(newDigits);

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

    setIsLoading(true);
    try {
      const res = await supabaseAuthService.verifyPhoneOtp(normalizedPhone, fullOtp);
      showToast(`लॉगिन सफल! स्वागत है, ${res.user?.displayName || 'User'}`, 'success');
      await refreshUserData();
      setActiveTab('home');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const friendly = getFriendlyAuthErrorMessage(err.message || 'OTP verification failed');
      setErrorMessage(friendly);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleError(null);
    const res = await supabaseAuthService.signInWithGoogle();
    if (res.error) {
      setGoogleError(res.error);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-left overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo & Brand Header */}
          <div className="text-center space-y-2 pt-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Coins className="w-7 h-7 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">POCKET POINTS</h2>
              <p className="text-xs text-slate-400 mt-0.5">Watch, Create & Earn Daily Rewards</p>
            </div>
          </div>

          {/* SMS Provider Configuration Status Notice */}
          {providerStatus && providerStatus.smsProvider === 'NOT_CONFIGURED' && (
            <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-xs text-amber-300 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-[10px] text-amber-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>SMS Provider Status</span>
              </div>
              <p className="text-xs font-bold text-amber-200">
                SMS provider is not configured. Real OTP cannot be sent yet.
              </p>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                Supabase Phone Auth or SMS gateway (Twilio / MSG91) credentials must be configured to dispatch real carrier SMS.
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 flex items-start space-x-2 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-rose-200">{errorMessage.hi}</p>
                <p className="text-[11px] text-rose-300/80 mt-0.5">{errorMessage.en}</p>
              </div>
            </div>
          )}

          {/* Step 1: Mobile Number Input */}
          {step === 'PHONE_INPUT' && (
            <div className="mt-5 space-y-4">
              <div className="text-left">
                <h3 className="text-sm font-extrabold text-white">Welcome back!</h3>
                <p className="text-xs text-slate-400 mt-0.5">Enter your 10-digit mobile number to login</p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Mobile Number (मोबाइल नंबर)
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
                </div>

                <button
                  type="submit"
                  disabled={isLoading || rawPhone.replace(/\D/g, '').length < 10}
                  className="w-full h-11 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-transform active:scale-[0.98] disabled:opacity-40"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <span>SEND OTP (OTP भेजें)</span>
                  )}
                </button>
              </form>

              {/* OR Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-900 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  OR
                </span>
              </div>

              {/* Google Login Option */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full h-10 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl flex items-center justify-center space-x-2 text-xs font-semibold text-white transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {googleError && (
                  <p className="text-[11px] text-amber-400 text-center mt-2 font-medium">
                    {googleError}
                  </p>
                )}
              </div>

              {/* Help link */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(true)}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center justify-center space-x-1 mx-auto"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Need help logging in?</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: 6-Digit OTP Screen */}
          {step === 'OTP_INPUT' && (
            <div className="mt-5 space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-extrabold text-white">Enter the 6-digit OTP</h3>
                <p className="text-xs text-slate-400">
                  OTP sent to <span className="font-mono font-bold text-amber-400">{formattedDisplay}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {/* 6 Split Digit Boxes */}
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
                  disabled={isLoading || otpDigits.join('').length !== 6}
                  className="w-full h-11 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-transform active:scale-[0.98] disabled:opacity-40"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying OTP...</span>
                    </>
                  ) : (
                    <span>VERIFY OTP & LOGIN</span>
                  )}
                </button>

                {/* Resend and Change Number */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStep('PHONE_INPUT')}
                    className="text-slate-400 hover:text-white flex items-center space-x-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change Number</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={countdown > 0 || isLoading}
                    className="font-medium text-amber-400 disabled:text-slate-500 hover:underline"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'RESEND OTP'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <HelpSupportModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
};
