import React from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { AndroidStatusBar } from './components/layout/AndroidStatusBar.tsx';
import { TopHeader } from './components/layout/TopHeader.tsx';
import { BottomNavigation } from './components/layout/BottomNavigation.tsx';
import { ToastContainer } from './components/layout/ToastContainer.tsx';
import { SocialFeed } from './components/home/SocialFeed.tsx';
import { EarnView } from './components/earn/EarnView.tsx';
import { CreateView } from './components/create/CreateView.tsx';
import { WalletView } from './components/wallet/WalletView.tsx';
import { ProfileView } from './components/profile/ProfileView.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { AIAssistantModal } from './components/ai/AIAssistantModal.tsx';
import { NotificationDrawer } from './components/notifications/NotificationDrawer.tsx';
import { Sparkles, Smartphone, Maximize2, ShieldCheck, Flame } from 'lucide-react';

const MainShell: React.FC = () => {
  const { activeTab, isPhoneFrame, setIsPhoneFrame, setIsAIOpen, currentUser } = useApp();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center sm:p-4 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Frame Container */}
      <div
        className={`w-full flex flex-col transition-all duration-300 ${
          isPhoneFrame
            ? 'max-w-[420px] h-[92vh] max-h-[880px] rounded-[42px] border-[8px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden relative bg-slate-950 ring-1 ring-slate-700/50'
            : 'max-w-xl h-screen max-h-screen sm:rounded-2xl border-x border-slate-800/60 bg-slate-950 overflow-hidden'
        }`}
      >
        {/* Android Punch Hole Camera cutout (visible in phone frame mode) */}
        {isPhoneFrame && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-60 ring-1 ring-slate-800/80 pointer-events-none" />
        )}

        {/* 1. Android Status Bar */}
        <AndroidStatusBar />

        {/* 2. Top Header Navigation */}
        <TopHeader />

        {/* 3. Main Screen Viewport */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'home' && <SocialFeed />}
          {activeTab === 'earn' && <EarnView />}
          {activeTab === 'create' && <CreateView />}
          {activeTab === 'wallet' && <WalletView />}
          {activeTab === 'profile' && <ProfileView />}
          {activeTab === 'admin' && <AdminDashboard />}
        </main>

        {/* 4. Bottom Android Navigation */}
        <BottomNavigation />

        {/* Floating AI Button (Quick Tap) */}
        <button
          onClick={() => setIsAIOpen(true)}
          className="absolute bottom-16 right-4 z-40 p-2.5 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 text-slate-950 font-bold shadow-xl shadow-amber-500/30 border border-amber-300/40 hover:scale-105 active:scale-95 transition-transform"
          title="Pocket Points AI Assistant"
        >
          <Sparkles className="w-5 h-5 fill-slate-950 text-slate-950" />
        </button>
      </div>

      {/* Global Modals & Overlays */}
      <ToastContainer />
      <AIAssistantModal />
      <NotificationDrawer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainShell />
    </AppProvider>
  );
}
