import React from 'react';
import { useApp, AppTab } from '../../context/AppContext.tsx';
import {
  PlaySquare,
  Gift,
  PlusCircle,
  Wallet as WalletIcon,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab, currentUser } = useApp();
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const navItems: { tab: AppTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      tab: 'home',
      label: 'Home',
      icon: <PlaySquare className="w-5 h-5" />,
    },
    {
      tab: 'earn',
      label: 'Earn',
      icon: <Gift className="w-5 h-5" />,
      badge: 'Tasks',
    },
    {
      tab: 'create',
      label: 'Create',
      icon: (
        <div className="w-10 h-10 -mt-3 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 transform active:scale-95 transition-transform">
          <PlusCircle className="w-6 h-6 stroke-[2.5]" />
        </div>
      ),
    },
    {
      tab: 'wallet',
      label: 'Wallet',
      icon: <WalletIcon className="w-5 h-5" />,
    },
    {
      tab: 'profile',
      label: 'Profile',
      icon: <UserIcon className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="w-full bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around z-40 shrink-0 sticky bottom-0 select-none pb-safe">
      {navItems.map(item => {
        const isActive = activeTab === item.tab;
        return (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            className={`flex flex-col items-center justify-center relative py-1 px-3 min-w-[56px] transition-colors ${
              isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              {item.icon}
              {item.badge && !isActive && (
                <span className="absolute -top-1 -right-3 text-[8px] font-extrabold uppercase bg-amber-500 text-slate-950 px-1 rounded-full leading-none py-0.5">
                  {item.badge}
                </span>
              )}
            </div>
            {item.tab !== 'create' && (
              <span className={`text-[10px] mt-0.5 ${isActive ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                {item.label}
              </span>
            )}
            {item.tab === 'create' && (
              <span className="text-[10px] font-semibold text-amber-300 mt-0.5">
                Upload
              </span>
            )}
            {isActive && item.tab !== 'create' && (
              <div className="w-1 h-1 rounded-full bg-amber-400 mt-0.5" />
            )}
          </button>
        );
      })}

      {/* Admin Quick Entry if current user has admin role */}
      {isAdmin && (
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center justify-center relative py-1 px-2.5 transition-colors ${
            activeTab === 'admin' ? 'text-purple-400 font-bold' : 'text-purple-400/70 hover:text-purple-300'
          }`}
          title="Admin Cockpit & Controls"
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold">Admin</span>
          {activeTab === 'admin' && <div className="w-1 h-1 rounded-full bg-purple-400 mt-0.5" />}
        </button>
      )}
    </nav>
  );
};
