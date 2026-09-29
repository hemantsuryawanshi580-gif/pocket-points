import { Router } from 'express';
import { db } from './db.ts';
import { upiProvider, adProvider } from './providers.ts';
import { askPocketPointsAssistant } from './gemini.ts';
import { sendRealSmsOtp, isRealSmsProviderConfigured } from './sms.ts';
import { VideoComment, RewardLimitCategory } from '../src/types/index.ts';

export const apiRouter = Router();

// Current active session tracker (Defaults to Rahul Sharma)
let currentSessionUserId = 'usr_rahul';

// Helper to get active user
function getActiveUser() {
  return db.users.get(currentSessionUserId) || Array.from(db.users.values())[0];
}

// Check provider configurations
function getProviderStatus() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  const supabaseUrlConfigured = Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project')
  );

  const supabaseAnonKeyConfigured = Boolean(
    supabaseAnonKey &&
    !supabaseAnonKey.includes('your-anon-key') &&
    supabaseAnonKey.length > 20
  );

  const supabaseConfigured = supabaseUrlConfigured && supabaseAnonKeyConfigured;
  const smsCheck = isRealSmsProviderConfigured();
  const smsProviderConnected = smsCheck.configured;

  const missingEnvVars: string[] = [];
  if (!supabaseUrlConfigured) missingEnvVars.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKeyConfigured) missingEnvVars.push('VITE_SUPABASE_ANON_KEY');
  if (!smsProviderConnected) {
    missingEnvVars.push('SMS_PROVIDER_CREDENTIALS (Twilio / MSG91 / Supabase Phone Provider)');
  }

  const exactRemainingConfig: string[] = [];
  if (!supabaseUrlConfigured) {
    exactRemainingConfig.push('Configure VITE_SUPABASE_URL with your active Supabase project URL');
  }
  if (!supabaseAnonKeyConfigured) {
    exactRemainingConfig.push('Configure VITE_SUPABASE_ANON_KEY with your Supabase anonymous/publishable key');
  }
  if (!smsProviderConnected) {
    exactRemainingConfig.push('In Supabase Dashboard -> Authentication -> Providers -> Phone: Enable Phone Auth & configure SMS Provider (Twilio/MessageBird/Vonage), or provide server-side TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN');
  }

  return {
    phoneAuth: supabaseConfigured ? ('READY' as const) : ('NOT_CONFIGURED' as const),
    smsProvider: smsProviderConnected ? ('CONNECTED' as const) : ('NOT_CONFIGURED' as const),
    smsProviderName: smsCheck.providerName,
    googleAuth: supabaseConfigured && process.env.GOOGLE_AUTH_CONFIGURED === 'true' ? ('READY' as const) : ('NOT_CONFIGURED' as const),
    supabaseConfigured,
    supabaseUrlConfigured,
    supabaseAnonKeyConfigured,
    smsProviderConfigured: smsProviderConnected,
    missingEnvVars,
    exactRemainingConfig,
    adminWarning: !smsProviderConnected
      ? 'SMS provider is not configured. Real OTP cannot be sent yet.'
      : undefined,
  };
}

// ---------------- AUTH & USER ----------------
apiRouter.get('/auth/provider-status', (req, res) => {
  res.json(getProviderStatus());
});

apiRouter.get('/auth/me', (req, res) => {
  const user = getActiveUser();
  const enrichedProfile = db.getUserProfile(user.id);
  const wallet = db.wallets.get(user.id);
  const unreadNotifs = db.notifications.filter(n => n.userId === user.id && !n.read).length;
  res.json({
    user: enrichedProfile || user,
    wallet,
    unreadNotificationsCount: unreadNotifs,
    settings: db.settings,
    providerStatus: getProviderStatus(),
  });
});

apiRouter.post('/auth/switch-user', (req, res) => {
  const { userId } = req.body;
  if (!db.users.has(userId)) {
    return res.status(404).json({ error: 'User not found' });
  }
  currentSessionUserId = userId;
  const user = db.getUserProfile(userId)!;
  const wallet = db.wallets.get(userId);
  res.json({ success: true, user, wallet });
});

// Send OTP for Mobile Login
apiRouter.post('/auth/send-phone-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'मोबाइल नंबर आवश्यक है (Mobile number required)' });
  }

  // Validate format (+91 followed by 10 digits starting with 6-9)
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 12 || !digits.startsWith('91') || !['6', '7', '8', '9'].includes(digits.charAt(2))) {
    return res.status(400).json({
      error: 'मान्य 10-अंकीय भारतीय मोबाइल नंबर दर्ज करें (Enter valid 10-digit Indian mobile number)',
    });
  }

  const normalizedPhone = `+${digits}`;
  const providerStatus = getProviderStatus();

  // If real SMS provider is not configured, do NOT fake OTP or pretend SMS was sent!
  if (providerStatus.smsProvider === 'NOT_CONFIGURED') {
    return res.status(400).json({
      error: 'SMS provider is not configured. Real OTP cannot be sent yet.',
      missingConfig: providerStatus.exactRemainingConfig,
    });
  }

  // Rate limiting & OTP generation
  const result = db.generatePhoneOtp(normalizedPhone);
  if (!result.success) {
    return res.status(429).json({ error: result.error });
  }

  // Dispatch real SMS through configured provider
  const smsResult = await sendRealSmsOtp(normalizedPhone, result.otp!);
  if (!smsResult.sent) {
    return res.status(500).json({
      error: smsResult.error || 'Failed to dispatch SMS through provider. Check provider credentials.',
    });
  }

  res.json({
    success: true,
    message: 'OTP sent to your mobile number via SMS',
    expiresAt: result.expiresAt,
  });
});

// Verify OTP for Mobile Login
apiRouter.post('/auth/verify-phone-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'मोबाइल नंबर और 6-अंकों का OTP दोनों आवश्यक हैं' });
  }

  const digits = phone.replace(/\D/g, '');
  const normalizedPhone = `+${digits}`;

  const verifyRes = db.verifyPhoneOtp(normalizedPhone, otp);
  if (!verifyRes.success) {
    return res.status(400).json({ error: verifyRes.error });
  }

  // Find existing user or create a new user profile
  const raw10Digits = digits.slice(-10);
  let user = Array.from(db.users.values()).find(
    u => u.phoneNumber && u.phoneNumber.replace(/\D/g, '').endsWith(raw10Digits)
  );

  if (!user) {
    const newId = `usr_${Date.now()}`;
    const formattedDisplay = `+91 ${raw10Digits.slice(0, 5)} ${raw10Digits.slice(5)}`;
    user = {
      id: newId,
      phoneNumber: formattedDisplay,
      displayName: `User ${raw10Digits.slice(-4)}`,
      username: `user_${raw10Digits.slice(-4)}`,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${newId}`,
      role: 'USER',
      isCreator: false,
      createdAt: new Date().toISOString(),
      isVerified: true,
      phoneVerified: true,
      referralCode: `PP${raw10Digits.slice(-4)}`,
      status: 'ACTIVE',
      riskScore: 0,
      language: 'en',
    };
    db.users.set(newId, user);

    // Initial Wallet with 100 Welcome Points
    db.wallets.set(newId, {
      userId: newId,
      availablePoints: 100,
      pendingPoints: 0,
      reservedWithdrawalPoints: 0,
      lifetimeEarnedPoints: 100,
      lifetimeWithdrawnPoints: 0,
    });

    db.addTransaction({
      userId: newId,
      type: 'BONUS',
      points: 100,
      amountInr: 1.0,
      source: 'Welcome Bonus',
      referenceId: `wel_${newId}`,
      description: 'Welcome bonus for joining Pocket Points',
      status: 'COMPLETED',
    });

    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      adminId: newId,
      adminName: user.displayName,
      action: 'USER_REGISTERED_OTP',
      oldValue: '',
      newValue: `Registered phone ${formattedDisplay}`,
      reason: 'Verified Mobile OTP onboarding',
      referenceId: newId,
      timestamp: new Date().toISOString(),
    });
  } else {
    // Ensure verified flag is true
    user.isVerified = true;
    user.phoneVerified = true;
  }

  currentSessionUserId = user.id;
  const enriched = db.getUserProfile(user.id);
  res.json({ success: true, user: enriched || user, wallet: db.wallets.get(user.id) });
});

// Client-side Supabase Sync after successful Supabase phone verification
apiRouter.post('/auth/supabase-sync', (req, res) => {
  const { supabaseUserId, phone, email } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number required' });
  }

  const raw10Digits = phone.replace(/\D/g, '').slice(-10);
  let user = Array.from(db.users.values()).find(
    u => u.phoneNumber && u.phoneNumber.replace(/\D/g, '').endsWith(raw10Digits)
  );

  if (!user) {
    const newId = supabaseUserId || `usr_${Date.now()}`;
    const formattedDisplay = `+91 ${raw10Digits.slice(0, 5)} ${raw10Digits.slice(5)}`;
    user = {
      id: newId,
      phoneNumber: formattedDisplay,
      email: email || undefined,
      displayName: `User ${raw10Digits.slice(-4)}`,
      username: `user_${raw10Digits.slice(-4)}`,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${newId}`,
      role: 'USER',
      isCreator: false,
      createdAt: new Date().toISOString(),
      isVerified: true,
      phoneVerified: true,
      referralCode: `PP${raw10Digits.slice(-4)}`,
      status: 'ACTIVE',
      riskScore: 0,
      language: 'en',
    };
    db.users.set(newId, user);
    db.wallets.set(newId, {
      userId: newId,
      availablePoints: 100,
      pendingPoints: 0,
      reservedWithdrawalPoints: 0,
      lifetimeEarnedPoints: 100,
      lifetimeWithdrawnPoints: 0,
    });
  } else {
    user.isVerified = true;
    user.phoneVerified = true;
    if (email && !user.email) user.email = email;
  }

  currentSessionUserId = user.id;
  const enriched = db.getUserProfile(user.id);
  res.json({ success: true, user: enriched || user, wallet: db.wallets.get(user.id) });
});

// Change Mobile Number - Initiate OTP
apiRouter.post('/auth/send-change-phone-otp', async (req, res) => {
  const user = getActiveUser();
  const { newPhone } = req.body;

  if (!newPhone) {
    return res.status(400).json({ error: 'नया मोबाइल नंबर दर्ज करें (New phone number required)' });
  }

  const digits = newPhone.replace(/\D/g, '');
  if (digits.length !== 12 || !digits.startsWith('91') || !['6', '7', '8', '9'].includes(digits.charAt(2))) {
    return res.status(400).json({
      error: 'मान्य 10-अंकीय भारतीय मोबाइल नंबर दर्ज करें (Enter valid 10-digit Indian mobile number)',
    });
  }

  const normalizedPhone = `+${digits}`;
  const providerStatus = getProviderStatus();

  if (providerStatus.smsProvider === 'NOT_CONFIGURED') {
    return res.status(400).json({
      error: 'SMS provider is not configured. Real OTP cannot be sent yet.',
      missingConfig: providerStatus.exactRemainingConfig,
    });
  }

  const result = db.initiateChangePhone(user.id, normalizedPhone);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  const smsResult = await sendRealSmsOtp(normalizedPhone, result.otp!);
  if (!smsResult.sent) {
    return res.status(500).json({
      error: smsResult.error || 'Failed to dispatch SMS through provider. Check provider credentials.',
    });
  }

  res.json({
    success: true,
    message: 'OTP sent to verify your new mobile number',
  });
});

// Change Mobile Number - Verify OTP
apiRouter.post('/auth/verify-change-phone-otp', (req, res) => {
  const user = getActiveUser();
  const { newPhone, otp } = req.body;

  if (!newPhone || !otp) {
    return res.status(400).json({ error: 'नया मोबाइल नंबर और OTP दोनों आवश्यक हैं' });
  }

  const digits = newPhone.replace(/\D/g, '');
  const normalizedPhone = `+${digits}`;

  const result = db.verifyChangePhone(user.id, normalizedPhone, otp);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  const updatedProfile = db.getUserProfile(user.id);
  res.json({ success: true, user: updatedProfile || user });
});

// Confirm phone change after client Supabase verification
apiRouter.post('/auth/confirm-phone-change', (req, res) => {
  const user = getActiveUser();
  const { newPhone } = req.body;
  if (!newPhone) return res.status(400).json({ error: 'Missing phone' });

  const digits = newPhone.replace(/\D/g, '').slice(-10);
  const formatted = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  user.phoneNumber = formatted;
  user.isVerified = true;
  user.phoneVerified = true;
  user.updatedAt = new Date().toISOString();
  db.users.set(user.id, user);

  res.json({ success: true, user: db.getUserProfile(user.id) });
});

// Set or Update Withdrawal PIN
apiRouter.post('/auth/withdrawal-pin', (req, res) => {
  const user = getActiveUser();
  const { pin } = req.body;

  const result = db.setWithdrawalPin(user.id, pin);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminId: user.id,
    adminName: user.displayName,
    action: 'WITHDRAWAL_PIN_UPDATED',
    oldValue: '',
    newValue: 'PIN_SET',
    reason: 'User updated withdrawal security PIN',
    referenceId: user.id,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, message: 'Withdrawal PIN updated successfully' });
});

// Logout
apiRouter.post('/auth/logout', (req, res) => {
  // Reset session to default regular user for testing or empty
  currentSessionUserId = 'usr_rahul';
  res.json({ success: true, message: 'Logged out successfully' });
});

// ---------------- PROFILE ENDPOINTS ----------------
apiRouter.get('/profile', (req, res) => {
  const user = getActiveUser();
  const profile = db.getUserProfile(user.id);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json({ profile });
});

apiRouter.get('/profile/:userId', (req, res) => {
  const { userId } = req.params;
  const profile = db.getUserProfile(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json({ profile });
});

apiRouter.put('/profile', (req, res) => {
  const user = getActiveUser();
  const { displayName, username, bio, avatarUrl, language } = req.body;

  const result = db.updateUserProfile(user.id, {
    displayName,
    username,
    bio,
    avatarUrl,
    language,
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  const enriched = db.getUserProfile(user.id);
  res.json({ success: true, profile: enriched || result.user });
});

apiRouter.post('/auth/request-deletion', (req, res) => {
  const user = getActiveUser();
  user.status = 'DELETION_REQUESTED';
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminId: user.id,
    adminName: user.displayName,
    action: 'USER_DELETION_REQUESTED',
    oldValue: 'ACTIVE',
    newValue: 'DELETION_REQUESTED',
    reason: 'User submitted in-app GDPR/DPDP account deletion request',
    referenceId: user.id,
    timestamp: new Date().toISOString(),
  });
  res.json({ success: true, message: 'Account deletion request queued. Processing will complete within 30 days.' });
});

// ---------------- SOCIAL VIDEOS & FEED ----------------
apiRouter.get('/videos', (req, res) => {
  const { tab = 'for_you', search = '', category } = req.query;
  const user = getActiveUser();

  let list = Array.from(db.videos.values());

  // Non-admins only see APPROVED videos
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    list = list.filter(v => v.status === 'APPROVED');
  }

  if (category) {
    list = list.filter(v => v.category === category);
  }

  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(
      v =>
        v.caption.toLowerCase().includes(q) ||
        v.creatorName.toLowerCase().includes(q) ||
        v.hashtags.some(h => h.toLowerCase().includes(q))
    );
  }

  if (tab === 'following') {
    const following = db.follows.get(user.id) || new Set();
    list = list.filter(v => following.has(v.creatorId));
  } else if (tab === 'trending') {
    list = list.sort((a, b) => b.viewsCount - a.viewsCount);
  }

  // Include user's like status
  const enriched = list.map(v => {
    const likesSet = db.likes.get(v.id) || new Set();
    const isLiked = likesSet.has(user.id);
    const followingSet = db.follows.get(user.id) || new Set();
    const isFollowing = followingSet.has(v.creatorId);
    return {
      ...v,
      isLiked,
      isFollowing,
    };
  });

  res.json({ videos: enriched });
});

apiRouter.post('/videos/:id/like', (req, res) => {
  const { id } = req.params;
  const user = getActiveUser();
  const video = db.videos.get(id);
  if (!video) return res.status(404).json({ error: 'Video not found' });

  if (!db.likes.has(id)) {
    db.likes.set(id, new Set());
  }
  const likesSet = db.likes.get(id)!;
  const alreadyLiked = likesSet.has(user.id);

  if (alreadyLiked) {
    likesSet.delete(user.id);
    video.likesCount = Math.max(0, video.likesCount - 1);
  } else {
    likesSet.add(user.id);
    video.likesCount += 1;

    // Trigger notification to creator
    if (video.creatorId !== user.id) {
      db.notifications.unshift({
        id: `notif_${Date.now()}`,
        userId: video.creatorId,
        type: 'LIKE',
        title: 'New Like on your Video ❤️',
        message: `${user.displayName} liked "${video.caption.substring(0, 30)}..."`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  res.json({ success: true, isLiked: !alreadyLiked, likesCount: video.likesCount });
});

apiRouter.get('/videos/:id/comments', (req, res) => {
  const { id } = req.params;
  const comments = db.comments.get(id) || [];
  res.json({ comments });
});

apiRouter.post('/videos/:id/comments', (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const user = getActiveUser();
  const video = db.videos.get(id);
  if (!video) return res.status(404).json({ error: 'Video not found' });
  if (!content || !content.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });

  if (!db.comments.has(id)) {
    db.comments.set(id, []);
  }

  const comment: VideoComment = {
    id: `cmt_${Date.now()}`,
    videoId: id,
    userId: user.id,
    username: user.username,
    userAvatar: user.avatarUrl,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    likesCount: 0,
  };

  db.comments.get(id)!.unshift(comment);
  video.commentsCount += 1;

  if (video.creatorId !== user.id) {
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: video.creatorId,
      type: 'COMMENT',
      title: 'New Comment on your Video 💬',
      message: `${user.displayName} commented: "${content.substring(0, 40)}"`,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  res.json({ success: true, comment, commentsCount: video.commentsCount });
});

apiRouter.post('/videos/:id/report', (req, res) => {
  const { id } = req.params;
  const { reason, details } = req.body;
  const user = getActiveUser();

  const report = {
    id: `rep_${Date.now()}`,
    videoId: id,
    reporterUserId: user.id,
    reason: reason || 'SPAM',
    details: details || '',
    createdAt: new Date().toISOString(),
    status: 'PENDING' as const,
  };
  db.reports.unshift(report);

  res.json({ success: true, message: 'Report submitted for moderation review. Thank you for keeping Pocket Points safe.' });
});

// Watch tracking & Reward Pool Distribution
apiRouter.post('/videos/:id/watch', (req, res) => {
  const { id } = req.params;
  const { watchDurationSeconds, videoDurationSeconds } = req.body;
  const user = getActiveUser();

  const result = db.recordWatchSession({
    userId: user.id,
    videoId: id,
    watchDurationSeconds: Number(watchDurationSeconds) || 0,
    videoDurationSeconds: Number(videoDurationSeconds) || 15,
  });

  const wallet = db.wallets.get(user.id);
  res.json({
    ...result,
    wallet,
  });
});

// Creator Video Upload
apiRouter.post('/videos/upload', (req, res) => {
  const { caption, category, hashtags, videoUrl, thumbnailUrl, originalityCertified } = req.body;
  const user = getActiveUser();

  if (!caption || !category) {
    return res.status(400).json({ error: 'Caption and category are required' });
  }

  if (!originalityCertified) {
    return res.status(400).json({ error: 'You must certify that you own or are authorized to publish this video content' });
  }

  const tags = Array.isArray(hashtags)
    ? hashtags
    : (hashtags as string).split(/[ ,]+/).map(t => (t.startsWith('#') ? t : `#${t}`)).filter(Boolean);

  const newVideo = {
    id: `vid_${Date.now()}`,
    creatorId: user.id,
    creatorName: user.displayName,
    creatorUsername: user.username,
    creatorAvatar: user.avatarUrl,
    videoUrl: videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    caption: caption.trim(),
    category,
    hashtags: tags,
    durationSeconds: 15,
    status: 'PENDING' as const, // Strict moderation: all uploads begin as PENDING
    viewsCount: 0,
    watchTimeSeconds: 0,
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    verifiedEligibleRevenue: 0,
    creatorEarnings: 0,
    viewerRewardPool: 0,
    platformGrossShare: 0,
    createdAt: new Date().toISOString(),
    originalityCertified: true,
  };

  db.videos.set(newVideo.id, newVideo);

  // Notify creator
  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: user.id,
    type: 'CAMPAIGN_ANNOUNCEMENT',
    title: 'Video Submitted for Moderation ⏳',
    message: `"${caption.substring(0, 30)}..." was uploaded successfully and is currently under review by our moderation team.`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.json({ success: true, video: newVideo });
});

// Follow / Unfollow Creator
apiRouter.post('/creators/:id/follow', (req, res) => {
  const { id } = req.params;
  const user = getActiveUser();

  if (id === user.id) {
    return res.status(400).json({ error: 'You cannot follow yourself' });
  }

  if (!db.follows.has(user.id)) {
    db.follows.set(user.id, new Set());
  }
  const followSet = db.follows.get(user.id)!;
  const isFollowing = followSet.has(id);

  if (isFollowing) {
    followSet.delete(id);
  } else {
    followSet.add(id);

    // Notify creator
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: id,
      type: 'FOLLOWER',
      title: 'New Follower! 👤',
      message: `${user.displayName} started following you.`,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  // Count followers of creator
  let followersCount = 0;
  for (const set of db.follows.values()) {
    if (set.has(id)) followersCount++;
  }

  res.json({ success: true, isFollowing: !isFollowing, followersCount });
});

apiRouter.get('/creators/:id', (req, res) => {
  const { id } = req.params;
  const creator = db.users.get(id);
  if (!creator) return res.status(404).json({ error: 'Creator not found' });

  const creatorVideos = Array.from(db.videos.values()).filter(v => v.creatorId === id);
  let followersCount = 0;
  for (const set of db.follows.values()) {
    if (set.has(id)) followersCount++;
  }
  const followingCount = (db.follows.get(id) || new Set()).size;

  const totalViews = creatorVideos.reduce((sum, v) => sum + v.viewsCount, 0);
  const totalEarningsInr = creatorVideos.reduce((sum, v) => sum + v.creatorEarnings, 0);

  res.json({
    creator,
    followersCount,
    followingCount,
    totalViews,
    totalEarningsInr,
    videos: creatorVideos,
  });
});

// ---------------- EARNING CAMPAIGNS & TASKS ----------------
apiRouter.get('/campaigns', (req, res) => {
  const list = Array.from(db.campaigns.values());
  res.json({ campaigns: list });
});

// Complete / Verify Task (Rewarded Ad, Install, Survey, Game)
apiRouter.post('/campaigns/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { durationSeconds = 15, clientToken = 'tok_test' } = req.body;
  const user = getActiveUser();
  const campaign = db.campaigns.get(id);

  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  if (db.settings.pauseAllRewards) {
    return res.status(403).json({ error: 'Reward distributions are temporarily paused by administration.' });
  }

  if (campaign.category === 'REWARDED_AD' && db.settings.pauseAds) {
    return res.status(403).json({ error: 'Rewarded ads are currently paused.' });
  }

  if (campaign.category === 'APP_INSTALL' && db.settings.pauseInstallTasks) {
    return res.status(403).json({ error: 'Install tasks are currently paused.' });
  }

  let verified = true;
  let revenueInr = campaign.rewardInr / (db.settings.adUserRewardPercentage / 100);
  let userRewardPoints = campaign.rewardPoints;
  let userRewardInr = campaign.rewardInr;

  // If Rewarded Ad, verify through AdNetwork provider interface
  if (campaign.category === 'REWARDED_AD') {
    const adResult = await adProvider.verifyRewardedAd({
      userId: user.id,
      adUnitId: campaign.id,
      clientCompletionToken: clientToken,
      durationWatchedSeconds: Number(durationSeconds) || 15,
    });
    if (!adResult.verified) {
      return res.status(400).json({ error: adResult.errorMessage || 'Ad verification failed' });
    }
    revenueInr = adResult.verifiedRevenueInr;
    userRewardPoints = adResult.userRewardPoints;
    userRewardInr = userRewardPoints / db.settings.pointsPerInr;
  }

  // Controlled Economics: Check and enforce Global Reward Limits
  const categoryLimitMap: Record<string, RewardLimitCategory> = {
    REWARDED_AD: 'REWARDED_ADS',
    APP_INSTALL: 'APP_INSTALLS',
    SURVEY: 'SURVEYS',
    GAME: 'GAMES',
    SHOPPING_OFFER: 'SHOPPING_OFFERS',
    DAILY_MISSION: 'WATCH_AND_EARN',
  };
  const limitCategory = categoryLimitMap[campaign.category] || 'GLOBAL_TOTAL';

  const limitCheck = db.checkAndConsumeRewardLimit(limitCategory, userRewardPoints, user.id);
  if (!limitCheck.allowed) {
    return res.status(403).json({ error: limitCheck.reason || 'Reward limit reached for this category.' });
  }

  // Credit user wallet atomically
  const txnType =
    campaign.category === 'REWARDED_AD'
      ? 'AD_REWARD'
      : campaign.category === 'APP_INSTALL'
      ? 'INSTALL_REWARD'
      : campaign.category === 'SURVEY'
      ? 'SURVEY_REWARD'
      : campaign.category === 'GAME'
      ? 'GAME_REWARD'
      : campaign.category === 'DAILY_MISSION'
      ? 'BONUS'
      : 'OFFER_REWARD';

  const txn = db.addTransaction({
    userId: user.id,
    type: txnType,
    points: userRewardPoints,
    amountInr: userRewardInr,
    source: campaign.title,
    referenceId: campaign.id,
    description: `Verified completion of "${campaign.title}"`,
    status: 'COMPLETED',
  });

  campaign.consumedBudgetInr += userRewardInr;

  // Send notification
  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: user.id,
    type: 'TASK_COMPLETED',
    title: 'Reward Credited! 🎯',
    message: `+${userRewardPoints} points (₹${userRewardInr.toFixed(2)}) added for completing "${campaign.title}".`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    pointsCredited: userRewardPoints,
    amountInr: userRewardInr,
    wallet: db.wallets.get(user.id),
    transaction: txn,
  });
});

// Referrals
apiRouter.get('/referrals', (req, res) => {
  const user = getActiveUser();
  const list = db.referrals.filter(r => r.referrerUserId === user.id);
  const totalEarnedPoints = list
    .filter(r => r.status === 'REWARDED')
    .reduce((sum, r) => sum + r.rewardPoints, 0);

  res.json({
    referralCode: user.referralCode,
    referralLink: `https://pocketpoints.in/join?ref=${user.referralCode}`,
    referralPointsPerInvite: db.settings.referralPoints,
    totalInvited: list.length,
    qualifiedCount: list.filter(r => r.status === 'QUALIFIED' || r.status === 'REWARDED').length,
    totalEarnedPoints,
    referrals: list,
  });
});

// ---------------- WALLET & WITHDRAWALS ----------------
apiRouter.get('/wallet', (req, res) => {
  const user = getActiveUser();
  const wallet = db.wallets.get(user.id);
  const userTxns = db.transactions.filter(t => t.userId === user.id);
  const userWithdrawals = db.withdrawals.filter(w => w.userId === user.id);

  res.json({
    wallet,
    transactions: userTxns,
    withdrawals: userWithdrawals,
    settings: {
      pointsPerInr: db.settings.pointsPerInr,
      minimumWithdrawalPoints: db.settings.minimumWithdrawalPoints,
      withdrawalFeePercentage: db.settings.withdrawalFeePercentage,
      maxDailyWithdrawals: db.settings.maxDailyWithdrawals,
    },
  });
});

// Submit UPI Withdrawal Request (with atomic points reservation & 3% fee)
apiRouter.post('/withdrawals/request', async (req, res) => {
  const { points, upiId } = req.body;
  const user = getActiveUser();

  if (!points || !upiId) {
    return res.status(400).json({ error: 'Points amount and UPI ID are required' });
  }

  // Validate VPA format via UpiPayoutProvider interface
  const vpaCheck = await upiProvider.validateVpa(upiId);
  if (!vpaCheck.valid) {
    return res.status(400).json({ error: vpaCheck.message });
  }

  const result = db.reserveWithdrawal({
    userId: user.id,
    points: Number(points),
    upiId: upiId.trim(),
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  // Notify user
  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: user.id,
    type: 'WITHDRAWAL_SUBMITTED',
    title: 'Withdrawal Submitted ⏳',
    message: `Your request to withdraw ₹${result.withdrawal!.netPayoutInr.toFixed(2)} to ${result.withdrawal!.upiId} has been queued for verification.`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    withdrawal: result.withdrawal,
    wallet: db.wallets.get(user.id),
  });
});

// ---------------- POCKET POINTS AI ASSISTANT ----------------
apiRouter.post('/ai/chat', async (req, res) => {
  const { prompt } = req.body;
  const user = getActiveUser();

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const reply = await askPocketPointsAssistant({
      userId: user.id,
      prompt: prompt.trim(),
    });

    res.json({
      success: true,
      reply,
      aiResponseId: `ai_resp_${Date.now()}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'AI Assistant temporarily unavailable' });
  }
});

// AI Feedback (Helpful / Not Helpful + Comment)
apiRouter.post('/ai/feedback', (req, res) => {
  const { question, aiResponseId, feedback, feedbackText } = req.body;
  const user = getActiveUser();

  const record = {
    id: `fb_${Date.now()}`,
    userId: user.id,
    question: question || '',
    aiResponseId: aiResponseId || '',
    feedback: feedback || 'HELPFUL',
    feedbackText: feedbackText || '',
    timestamp: new Date().toISOString(),
  };

  db.aiFeedback.unshift(record);
  res.json({ success: true, message: 'Thank you for your feedback!' });
});

// ---------------- NOTIFICATIONS ----------------
apiRouter.get('/notifications', (req, res) => {
  const user = getActiveUser();
  const list = db.notifications.filter(n => n.userId === user.id);
  res.json({ notifications: list });
});

apiRouter.post('/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const user = getActiveUser();
  const notif = db.notifications.find(n => n.id === id && n.userId === user.id);
  if (notif) notif.read = true;
  res.json({ success: true });
});

apiRouter.post('/notifications/mark-all-read', (req, res) => {
  const user = getActiveUser();
  db.notifications.forEach(n => {
    if (n.userId === user.id) n.read = true;
  });
  res.json({ success: true });
});

// ---------------- ADMIN CONTROLS & REVENUE ANALYTICS ----------------
// Middleware for admin verification
function requireAdmin(req: any, res: any, next: any) {
  const user = getActiveUser();
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
  }
  next();
}

apiRouter.get('/admin/financials', requireAdmin, (req, res) => {
  const { filter = 'LAST_30_DAYS' } = req.query;
  const analytics = db.calculateFinancials(filter as string);
  res.json(analytics);
});

apiRouter.get('/admin/moderation', requireAdmin, (req, res) => {
  const pendingVideos = Array.from(db.videos.values()).filter(v => v.status === 'PENDING');
  res.json({ pendingVideos, reports: db.reports.filter(r => r.status === 'PENDING') });
});

apiRouter.post('/admin/moderation/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { action, reason } = req.body; // 'APPROVE' | 'REJECT' | 'REMOVE'
  const admin = getActiveUser();
  const video = db.videos.get(id);

  if (!video) return res.status(404).json({ error: 'Video not found' });

  const oldStatus = video.status;
  if (action === 'APPROVE') {
    video.status = 'APPROVED';
    video.moderatedBy = admin.id;
    video.moderatedAt = new Date().toISOString();

    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: video.creatorId,
      type: 'VIDEO_APPROVED',
      title: 'Video Approved! 🎉',
      message: `Your video "${video.caption.substring(0, 30)}..." has passed moderation and is now public in the feed.`,
      read: false,
      createdAt: new Date().toISOString(),
    });
  } else if (action === 'REJECT') {
    video.status = 'REJECTED';
    video.moderationReason = reason || 'Content violated guidelines';
    video.moderatedBy = admin.id;
    video.moderatedAt = new Date().toISOString();

    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: video.creatorId,
      type: 'VIDEO_REJECTED',
      title: 'Video Upload Declined',
      message: `Your video "${video.caption.substring(0, 30)}..." was declined. Reason: ${video.moderationReason}`,
      read: false,
      createdAt: new Date().toISOString(),
    });
  } else if (action === 'REMOVE') {
    video.status = 'REMOVED';
    video.moderationReason = reason || 'Removed by administrator';
  }

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminId: admin.id,
    adminName: admin.displayName,
    action: `VIDEO_${action}`,
    oldValue: oldStatus,
    newValue: video.status,
    reason: reason || 'Video moderation review',
    referenceId: video.id,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, video });
});

apiRouter.get('/admin/withdrawals', requireAdmin, (req, res) => {
  res.json({ withdrawals: db.withdrawals });
});

apiRouter.post('/admin/withdrawals/:id/resolve', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { action, reason } = req.body; // 'APPROVE' | 'REJECT'
  const admin = getActiveUser();

  const result = db.resolveWithdrawal(id, action, reason, admin.id);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ success: true, withdrawal: result.withdrawal });
});

apiRouter.get('/admin/settings', requireAdmin, (req, res) => {
  res.json({ settings: db.settings });
});

apiRouter.post('/admin/settings', requireAdmin, (req, res) => {
  const { settings, reason } = req.body;
  const admin = getActiveUser();

  const oldVal = JSON.stringify(db.settings);
  db.settings = { ...db.settings, ...settings };

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminId: admin.id,
    adminName: admin.displayName,
    action: 'SETTINGS_UPDATED',
    oldValue: oldVal,
    newValue: JSON.stringify(db.settings),
    reason: reason || 'Configuration adjusted by administrator',
    referenceId: 'sys_settings',
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, settings: db.settings });
});

apiRouter.post('/admin/emergency-pause', requireAdmin, (req, res) => {
  const { target, state, reason } = req.body;
  const admin = getActiveUser();

  if (target === 'ALL') db.settings.pauseAllRewards = state;
  if (target === 'ADS') db.settings.pauseAds = state;
  if (target === 'INSTALLS') db.settings.pauseInstallTasks = state;
  if (target === 'VIDEOS') db.settings.pauseVideoRewards = state;
  if (target === 'WITHDRAWALS') db.settings.pauseWithdrawals = state;

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    adminId: admin.id,
    adminName: admin.displayName,
    action: `EMERGENCY_${state ? 'PAUSE' : 'RESUME'}_${target}`,
    reason: reason || 'Emergency risk mitigation trigger',
    referenceId: target,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, settings: db.settings });
});

apiRouter.get('/admin/audit-logs', requireAdmin, (req, res) => {
  res.json({ logs: db.auditLogs });
});

apiRouter.get('/admin/fraud-flags', requireAdmin, (req, res) => {
  res.json({ flags: db.antiFraudFlags });
});

apiRouter.get('/admin/ai-feedback', requireAdmin, (req, res) => {
  res.json({ feedback: db.aiFeedback });
});

// ---------------- GLOBAL REWARD LIMITS ADMIN ----------------
apiRouter.get('/admin/reward-limits', requireAdmin, (req, res) => {
  const limits = Array.from(db.rewardLimits.values());
  res.json({ limits });
});

apiRouter.post('/admin/reward-limits/:category', requireAdmin, (req, res) => {
  const { category } = req.params;
  const { updates, reason } = req.body;
  const admin = getActiveUser();

  try {
    const updated = db.updateRewardLimit(category as RewardLimitCategory, updates, admin.id, reason);
    res.json({ success: true, limit: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/admin/reward-limits/:category/toggle', requireAdmin, (req, res) => {
  const { category } = req.params;
  const admin = getActiveUser();
  const existing = db.rewardLimits.get(category as RewardLimitCategory);
  if (!existing) return res.status(404).json({ error: 'Category not found' });

  const updated = db.updateRewardLimit(
    category as RewardLimitCategory,
    { enabled: !existing.enabled },
    admin.id,
    `Toggled ${existing.categoryLabel} status to ${!existing.enabled ? 'ACTIVE' : 'PAUSED'}`
  );
  res.json({ success: true, limit: updated });
});

apiRouter.post('/admin/reward-limits/reset-counters', requireAdmin, (req, res) => {
  const { category, period } = req.body;
  db.resetRewardLimitCounters(category, period);
  res.json({ success: true, limits: Array.from(db.rewardLimits.values()) });
});

apiRouter.post('/admin/reward-limits/preset', requireAdmin, (req, res) => {
  const { preset } = req.body;
  const admin = getActiveUser();
  if (!['CONSERVATIVE', 'BALANCED', 'GROWTH'].includes(preset)) {
    return res.status(400).json({ error: 'Invalid preset name' });
  }

  const limits = db.applyRewardLimitPreset(preset, admin.id);
  res.json({ success: true, limits });
});

apiRouter.post('/admin/reward-limits/simulate-load', requireAdmin, (req, res) => {
  const { category, points } = req.body;
  const admin = getActiveUser();

  if (!category || !points) {
    return res.status(400).json({ error: 'Category and points are required' });
  }

  try {
    const result = db.simulateRewardLimitLoad(category as RewardLimitCategory, Number(points), admin.id);
    res.json({
      success: true,
      limit: result.limit,
      globalLimit: result.globalLimit,
      breached: result.breached,
      limits: Array.from(db.rewardLimits.values()),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});


