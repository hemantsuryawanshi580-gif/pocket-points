import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { CheckCircle2, AlertCircle, Coins, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 w-11/12 max-w-sm z-50 pointer-events-none flex flex-col space-y-2">
      {toasts.map(toast => {
        const isReward = toast.type === 'reward';
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full p-3 rounded-xl shadow-xl flex items-center space-x-2.5 backdrop-blur-md border animate-in fade-in slide-in-from-top-4 duration-200 ${
              isReward
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
                : isSuccess
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : isError
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : 'bg-slate-900/90 border-slate-700 text-slate-200'
            }`}
          >
            <div className="shrink-0">
              {isReward && <Coins className="w-5 h-5 text-amber-400 fill-amber-400/20" />}
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {!isReward && !isSuccess && !isError && <Info className="w-5 h-5 text-indigo-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold leading-tight">{toast.message}</p>
              {toast.points && (
                <span className="text-[10px] text-amber-300 font-mono font-bold">
                  +{toast.points} Points added to Wallet
                </span>
              )}
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
