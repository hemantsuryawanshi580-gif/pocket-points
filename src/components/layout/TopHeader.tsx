import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Bell,
  Coins,
  Sparkles,
  ShieldAlert,
  Smartphone,
  Maximize2,
  ChevronDown,
  UserCheck,
  Flame,
} from 'lucide-react';

export const TopHeader: React.FC = () => {
  const {
    currentUser,
    wallet,
    settings,
    unreadCount,
    setIsNotifOpen,
    setIsAIOpen,
    setActiveTab,
    isPhoneFrame,
    setIsPhoneFrame,
    switchUser,
  } = useApp();

  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);

  const availableInr = wallet && settings ? (wallet.availablePoints / settings.pointsPerInr).toFixed(2) : '0.00';

  const personas = [
    { id: 'usr_rahul', name: 'Rahul Sharma', role: 'USER', label: 'Regular User (Earning & Videos)' },
    { id: 'usr_priya', name: 'Priya Verma', role: 'CREATOR', label: 'Creator (23% Rev Share & Uploads)' },
    { id: 'usr_admin', name: 'Vikram Malhotra', role: 'SUPER_ADMIN', label: 'Super Admin (Finance & Moderation)' },
  ];

  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-3.5 py-2.5 flex items-center justify-between z-40 shrink-0 sticky top-0">
      {/* Brand & Test Mode indicator */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center space-x-1.5 focus:outline-none group text-left"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Coins className="w-4 h-4 text-slate-950 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="font-extrabold text-sm tracking-tight text-white">PocketPoints</span>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1 py-0.2 rounded">
                Test Mode
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Right Controls: Points, AI, Notif, Persona Switcher */}
      <div className="flex items-center space-x-1.5">
        {/* Wallet Pill */}
        <button
          onClick={() => setActiveTab('wallet')}
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 rounded-full px-2.5 py-1 transition-colors text-xs"
          title="Click to view Wallet & Withdraw UPI"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">₹{availableInr}</span>
          <span className="text-[10px] text-amber-400 font-mono">({wallet?.availablePoints || 0} pts)</span>
        </button>

        {/* AI Assistant Button */}
        <button
          onClick={() => setIsAIOpen(true)}
          className="relative p-1.5 rounded-full bg-gradient-to-tr from-indigo-900/60 to-purple-900/60 border border-indigo-500/40 text-indigo-300 hover:text-white hover:border-indigo-400 transition-colors shadow-sm"
          title="Ask Pocket Points AI Assistant"
        >
          <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300/30" />
        </button>

        {/* Notifications */}
        <button
          onClick={() => setIsNotifOpen(true)}
          className="relative p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-slate-900 animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Persona Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-full pl-1 pr-2 py-0.5 text-xs transition-colors"
            title="Switch Persona for testing (User / Creator / Admin)"
          >
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt="avatar"
              className="w-5 h-5 rounded-full object-cover border border-slate-600"
            />
            <span className="text-[10px] font-medium hidden sm:inline max-w-[60px] truncate">
              {currentUser?.displayName?.split(' ')[0]}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isPersonaMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1.5 border-b border-slate-800 text-left">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Switch Test Persona</p>
                <p className="text-[10px] text-slate-500">Test all User, Creator, & Admin flows</p>
              </div>

              {personas.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    switchUser(p.id);
                    setIsPersonaMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-slate-800/80 transition-colors ${
                    currentUser?.id === p.id ? 'bg-amber-500/10 border-l-2 border-amber-500' : ''
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-semibold text-white truncate">{p.name}</span>
                      <span className={`text-[9px] px-1 rounded font-bold ${
                        p.role === 'SUPER_ADMIN' ? 'bg-purple-500/20 text-purple-400' :
                        p.role === 'CREATOR' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {p.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">{p.label}</p>
                  </div>
                </button>
              ))}

              <div className="mt-1 pt-1 border-t border-slate-800 px-3 py-1 flex items-center justify-between">
                <button
                  onClick={() => {
                    setIsPhoneFrame(!isPhoneFrame);
                    setIsPersonaMenuOpen(false);
                  }}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1"
                >
                  {isPhoneFrame ? <Maximize2 className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                  <span>{isPhoneFrame ? 'Expand Fullscreen' : 'Android Frame'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
