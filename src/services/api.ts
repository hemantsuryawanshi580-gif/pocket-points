import {
  User,
  Wallet,
  Video,
  TaskCampaign,
  WithdrawalRequest,
  SystemSettings,
  FinancialAnalytics,
  Notification,
  CategoryRewardLimit,
  RewardLimitCategory,
  UserProfile,
  AuthProviderStatus,
} from '../types/index.ts';

// Typed API client communicating with backend Express endpoints
export const api = {
  // Current user & authentication
  async getMe(): Promise<{
    user: User;
    wallet: Wallet;
    unreadNotificationsCount: number;
    settings: SystemSettings;
    providerStatus?: AuthProviderStatus;
  }> {
    const res = await fetch('/api/auth/me');
    if (!res.ok) throw new Error('Failed to load user state');
    return res.json();
  },

  async getProviderStatus(): Promise<AuthProviderStatus> {
    const res = await fetch('/api/auth/provider-status');
    if (!res.ok) throw new Error('Failed to load auth provider status');
    return res.json();
  },

  async switchUser(userId: string): Promise<{ success: boolean; user: User; wallet: Wallet }> {
    const res = await fetch('/api/auth/switch-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to switch user');
    return res.json();
  },

  async sendPhoneOtp(phone: string): Promise<{ success: boolean; message: string; testMode?: boolean; testOtp?: string; expiresAt?: number }> {
    const res = await fetch('/api/auth/send-phone-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
    return data;
  },

  async verifyPhoneOtp(phone: string, otp: string): Promise<{ success: boolean; user: User; wallet: Wallet }> {
    const res = await fetch('/api/auth/verify-phone-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'OTP verification failed');
    return data;
  },

  async sendChangePhoneOtp(newPhone: string): Promise<{ success: boolean; message: string; testMode?: boolean; testOtp?: string }> {
    const res = await fetch('/api/auth/send-change-phone-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPhone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP for phone change');
    return data;
  },

  async verifyChangePhoneOtp(newPhone: string, otp: string): Promise<{ success: boolean; user: User }> {
    const res = await fetch('/api/auth/verify-change-phone-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPhone, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to verify phone change');
    return data;
  },

  async setWithdrawalPin(pin: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/withdrawal-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to set withdrawal PIN');
    return data;
  },

  async logout(): Promise<{ success: boolean }> {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    return res.json();
  },

  async getProfile(userId?: string): Promise<{ profile: UserProfile }> {
    const url = userId ? `/api/profile/${userId}` : '/api/profile';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load profile');
    return res.json();
  },

  async updateProfile(payload: {
    displayName?: string;
    username?: string;
    bio?: string;
    avatarUrl?: string;
    language?: string;
  }): Promise<{ success: boolean; profile: UserProfile }> {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    return data;
  },

  async loginWithOtp(phoneNumber: string, otp: string) {
    return this.verifyPhoneOtp(phoneNumber, otp);
  },

  async requestAccountDeletion() {
    const res = await fetch('/api/auth/request-deletion', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to request deletion');
    return data;
  },

  // Videos
  async getVideos(params: { tab?: string; search?: string; category?: string } = {}): Promise<{ videos: (Video & { isLiked?: boolean; isFollowing?: boolean })[] }> {
    const q = new URLSearchParams();
    if (params.tab) q.set('tab', params.tab);
    if (params.search) q.set('search', params.search);
    if (params.category) q.set('category', params.category);
    const res = await fetch(`/api/videos?${q.toString()}`);
    if (!res.ok) throw new Error('Failed to load videos');
    return res.json();
  },

  async toggleLike(videoId: string) {
    const res = await fetch(`/api/videos/${videoId}/like`, { method: 'POST' });
    return res.json();
  },

  async getComments(videoId: string) {
    const res = await fetch(`/api/videos/${videoId}/comments`);
    return res.json();
  },

  async postComment(videoId: string, content: string) {
    const res = await fetch(`/api/videos/${videoId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to post comment');
    return data;
  },

  async reportVideo(videoId: string, reason: string, details?: string) {
    const res = await fetch(`/api/videos/${videoId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, details }),
    });
    return res.json();
  },

  async recordWatch(videoId: string, watchDurationSeconds: number, videoDurationSeconds: number) {
    const res = await fetch(`/api/videos/${videoId}/watch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ watchDurationSeconds, videoDurationSeconds }),
    });
    return res.json();
  },

  async uploadVideo(payload: {
    caption: string;
    category: string;
    hashtags: string[];
    videoUrl?: string;
    thumbnailUrl?: string;
    originalityCertified: boolean;
  }) {
    const res = await fetch('/api/videos/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload video');
    return data;
  },

  async toggleFollowCreator(creatorId: string) {
    const res = await fetch(`/api/creators/${creatorId}/follow`, { method: 'POST' });
    return res.json();
  },

  async getCreator(creatorId: string) {
    const res = await fetch(`/api/creators/${creatorId}`);
    return res.json();
  },

  // Earning Tasks
  async getCampaigns(): Promise<{ campaigns: TaskCampaign[] }> {
    const res = await fetch('/api/campaigns');
    return res.json();
  },

  async completeCampaign(campaignId: string, durationSeconds = 15) {
    const res = await fetch(`/api/campaigns/${campaignId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ durationSeconds }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Task completion failed');
    return data;
  },

  async getReferrals() {
    const res = await fetch('/api/referrals');
    return res.json();
  },

  // Wallet & Withdrawals
  async getWalletData() {
    const res = await fetch('/api/wallet');
    return res.json();
  },

  async requestWithdrawal(points: number, upiId: string): Promise<{ success: boolean; withdrawal: WithdrawalRequest; wallet: Wallet }> {
    const res = await fetch('/api/withdrawals/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points, upiId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Withdrawal request failed');
    return data;
  },

  // AI Assistant
  async askAI(prompt: string): Promise<{ success: boolean; reply: string; aiResponseId: string }> {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'AI Assistant unavailable');
    return data;
  },

  async submitAIFeedback(payload: {
    question: string;
    aiResponseId: string;
    feedback: 'HELPFUL' | 'NOT_HELPFUL';
    feedbackText?: string;
  }) {
    const res = await fetch('/api/ai/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: Notification[] }> {
    const res = await fetch('/api/notifications');
    return res.json();
  },

  async markNotificationRead(id: string) {
    const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    return res.json();
  },

  async markAllNotificationsRead() {
    const res = await fetch('/api/notifications/mark-all-read', { method: 'POST' });
    return res.json();
  },

  // Admin
  async getAdminFinancials(filter = 'LAST_30_DAYS'): Promise<FinancialAnalytics> {
    const res = await fetch(`/api/admin/financials?filter=${filter}`);
    if (!res.ok) throw new Error('Admin privileges required');
    return res.json();
  },

  async getAdminModeration() {
    const res = await fetch('/api/admin/moderation');
    return res.json();
  },

  async resolveModeration(videoId: string, action: 'APPROVE' | 'REJECT' | 'REMOVE', reason?: string) {
    const res = await fetch(`/api/admin/moderation/${videoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason }),
    });
    return res.json();
  },

  async getAdminWithdrawals() {
    const res = await fetch('/api/admin/withdrawals');
    return res.json();
  },

  async resolveWithdrawal(withdrawalId: string, action: 'APPROVE' | 'REJECT', reason?: string) {
    const res = await fetch(`/api/admin/withdrawals/${withdrawalId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update withdrawal');
    return data;
  },

  async getAdminSettings() {
    const res = await fetch('/api/admin/settings');
    return res.json();
  },

  async updateAdminSettings(settings: Partial<SystemSettings>, reason?: string) {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings, reason }),
    });
    return res.json();
  },

  async setEmergencyPause(target: string, state: boolean, reason?: string) {
    const res = await fetch('/api/admin/emergency-pause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, state, reason }),
    });
    return res.json();
  },

  async getAdminAuditLogs() {
    const res = await fetch('/api/admin/audit-logs');
    return res.json();
  },

  async getAdminFraudFlags() {
    const res = await fetch('/api/admin/fraud-flags');
    return res.json();
  },

  async getAdminAIFeedback() {
    const res = await fetch('/api/admin/ai-feedback');
    return res.json();
  },

  async getAdminRewardLimits(): Promise<{ limits: CategoryRewardLimit[] }> {
    const res = await fetch('/api/admin/reward-limits');
    if (!res.ok) throw new Error('Failed to load reward limits');
    return res.json();
  },

  async updateAdminRewardLimit(
    category: RewardLimitCategory,
    updates: Partial<CategoryRewardLimit>,
    reason?: string
  ): Promise<{ success: boolean; limit: CategoryRewardLimit }> {
    const res = await fetch(`/api/admin/reward-limits/${category}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates, reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update reward limit');
    return data;
  },

  async toggleAdminRewardLimit(category: RewardLimitCategory): Promise<{ success: boolean; limit: CategoryRewardLimit }> {
    const res = await fetch(`/api/admin/reward-limits/${category}/toggle`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to toggle reward limit');
    return data;
  },

  async resetAdminRewardLimitCounters(category?: RewardLimitCategory, period: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'DAILY') {
    const res = await fetch('/api/admin/reward-limits/reset-counters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, period }),
    });
    return res.json();
  },

  async applyAdminRewardLimitPreset(preset: 'CONSERVATIVE' | 'BALANCED' | 'GROWTH'): Promise<{ success: boolean; limits: CategoryRewardLimit[] }> {
    const res = await fetch('/api/admin/reward-limits/preset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to apply preset');
    return data;
  },

  async simulateAdminRewardLimitLoad(
    category: RewardLimitCategory,
    points: number
  ): Promise<{ success: boolean; limit: CategoryRewardLimit; globalLimit: CategoryRewardLimit; breached: boolean; limits: CategoryRewardLimit[] }> {
    const res = await fetch('/api/admin/reward-limits/simulate-load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, points }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to simulate load');
    return data;
  },
};


