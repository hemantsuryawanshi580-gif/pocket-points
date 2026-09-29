import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { api } from '../../services/api.ts';
import { Notification, NotificationType } from '../../types/index.ts';
import {
  Bell,
  X,
  CheckCircle2,
  Heart,
  MessageCircle,
  Coins,
  ArrowUpRight,
  ShieldAlert,
  Users,
  Film,
  CheckCheck,
} from 'lucide-react';

export const NotificationDrawer: React.FC = () => {
  const { isNotifOpen, setIsNotifOpen, refreshUserData, showToast } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isNotifOpen) {
      loadNotifications();
    }
  }, [isNotifOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      refreshUserData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showToast('All notifications marked as read', 'info');
      refreshUserData();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isNotifOpen) return null;

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'LIKE':
        return <Heart className="w-4 h-4 text-rose-400" />;
      case 'COMMENT':
        return <MessageCircle className="w-4 h-4 text-blue-400" />;
      case 'FOLLOWER':
        return <Users className="w-4 h-4 text-purple-400" />;
      case 'REWARD_RECEIVED':
      case 'TASK_COMPLETED':
      case 'REFERRAL_REWARD':
        return <Coins className="w-4 h-4 text-amber-400" />;
      case 'WITHDRAWAL_APPROVED':
      case 'WITHDRAWAL_SUBMITTED':
        return <ArrowUpRight className="w-4 h-4 text-emerald-400" />;
      case 'VIDEO_APPROVED':
      case 'VIDEO_REJECTED':
        return <Film className="w-4 h-4 text-indigo-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl h-[80vh] flex flex-col shadow-2xl overflow-hidden text-left">
        {/* Header */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-xs text-white">Notifications</span>
            <span className="text-[10px] text-slate-400">
              ({notifications.filter(n => !n.read).length} unread)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <button
              onClick={() => setIsNotifOpen(false)}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 no-scrollbar">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No notifications yet. You'll see rewards, task updates, and social alerts here.
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleMarkAsRead(n.id)}
                className={`p-3 rounded-2xl border transition-colors cursor-pointer flex items-start space-x-3 ${
                  n.read
                    ? 'bg-slate-900 border-slate-800/80 text-slate-300'
                    : 'bg-slate-850 border-amber-500/30 text-white shadow-sm'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-800 shrink-0 mt-0.5">{getIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold leading-tight">{n.title}</h4>
                    <span className="text-[10px] text-slate-500 shrink-0 ml-2 font-mono">
                      {new Date(n.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5" />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
