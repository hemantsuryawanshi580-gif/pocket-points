export type UserRole = 'USER' | 'CREATOR' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  phoneNumber?: string;
  email?: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  bio?: string;
  role: UserRole;
  isCreator: boolean;
  createdAt: string;
  isVerified: boolean;
  phoneVerified?: boolean;
  phoneDisplay?: string;
  language?: string;
  referralCode: string;
  referredBy?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETION_REQUESTED';
  riskScore: number;
  followersCount?: number;
  followingCount?: number;
  videosCount?: number;
  likesCount?: number;
  withdrawalPinSet?: boolean;
  updatedAt?: string;
}

export interface UserProfile extends User {
  followersCount: number;
  followingCount: number;
  videosCount: number;
  likesCount: number;
}

export interface AuthProviderStatus {
  phoneAuth: 'READY' | 'NOT_CONFIGURED';
  smsProvider: 'CONNECTED' | 'NOT_CONFIGURED';
  smsProviderName?: string;
  googleAuth: 'READY' | 'NOT_CONFIGURED';
  supabaseConfigured: boolean;
  supabaseUrlConfigured?: boolean;
  supabaseAnonKeyConfigured?: boolean;
  smsProviderConfigured?: boolean;
  missingEnvVars?: string[];
  exactRemainingConfig?: string[];
  adminWarning?: string;
}

export type VideoStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REMOVED';

export type VideoCategory =
  | 'Entertainment'
  | 'Education'
  | 'Comedy'
  | 'Gaming'
  | 'Tech'
  | 'Music'
  | 'Lifestyle'
  | 'Finance & Tips';

export interface Video {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatar: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  category: VideoCategory;
  hashtags: string[];
  durationSeconds: number;
  status: VideoStatus;
  moderationReason?: string;
  moderatedBy?: string;
  moderatedAt?: string;
  viewsCount: number;
  watchTimeSeconds: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  verifiedEligibleRevenue: number; // in INR
  creatorEarnings: number; // 23% of verified eligible revenue
  viewerRewardPool: number; // 7% of verified eligible revenue
  platformGrossShare: number; // 70% of verified eligible revenue
  createdAt: string;
  originalityCertified: boolean;
}

export interface VideoComment {
  id: string;
  videoId: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  createdAt: string;
  likesCount: number;
}

export interface VideoReport {
  id: string;
  videoId: string;
  reporterUserId: string;
  reason: 'SPAM' | 'COPYRIGHT' | 'INAPPROPRIATE' | 'MISLEADING' | 'HARMFUL' | 'OTHER';
  details?: string;
  createdAt: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
}

export interface WatchSession {
  sessionId: string;
  videoId: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  watchDurationSeconds: number;
  completionPercentage: number;
  eligibleEvent: boolean;
  rewardStatus: 'PENDING' | 'CREDITED' | 'INELIGIBLE' | 'RATE_LIMITED';
  riskSignals: string[];
  rewardPoints: number;
}

export type TransactionType =
  | 'VIDEO_REWARD'
  | 'VIEWER_REWARD'
  | 'AD_REWARD'
  | 'INSTALL_REWARD'
  | 'SURVEY_REWARD'
  | 'GAME_REWARD'
  | 'OFFER_REWARD'
  | 'REFERRAL_REWARD'
  | 'BONUS'
  | 'WITHDRAWAL'
  | 'WITHDRAWAL_FEE'
  | 'REVERSAL'
  | 'ADJUSTMENT';

export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  points: number;
  amountInr: number;
  source: string;
  status: TransactionStatus;
  referenceId: string;
  description: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface Wallet {
  userId: string;
  availablePoints: number;
  pendingPoints: number;
  reservedWithdrawalPoints: number;
  lifetimeEarnedPoints: number;
  lifetimeWithdrawnPoints: number;
}

export type WithdrawalStatus =
  | 'REQUESTED'
  | 'VERIFYING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  upiId: string;
  requestedPoints: number;
  grossAmountInr: number;
  feePercentage: number; // e.g. 3%
  feeAmountInr: number;
  netPayoutInr: number;
  status: WithdrawalStatus;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  payoutReference?: string;
  rejectionReason?: string;
  riskScore: number;
}

export type TaskCategory =
  | 'WATCH_EARN'
  | 'REWARDED_AD'
  | 'APP_INSTALL'
  | 'SURVEY'
  | 'GAME'
  | 'SHOPPING_OFFER'
  | 'DAILY_MISSION'
  | 'BONUS_CAMPAIGN';

export interface TaskCampaign {
  id: string;
  title: string;
  category: TaskCategory;
  description: string;
  requirements: string[];
  rewardPoints: number;
  rewardInr: number;
  eligibility: string;
  verificationMethod: 'AUTOMATIC_POSTBACK' | 'AD_SDK_CONFIRMATION' | 'TIME_TRACKER' | 'ADMIN_REVIEW';
  verificationTime: string;
  dailyLimit: number;
  userLimit: number;
  totalBudgetInr: number;
  consumedBudgetInr: number;
  minimumMarginPercentage: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FLAGGED_LOW_MARGIN';
  rules: string[];
  iconUrl?: string;
  targetPackageOrUrl?: string;
}

export interface TaskCompletion {
  id: string;
  campaignId: string;
  userId: string;
  category: TaskCategory;
  verifiedRevenueInr: number;
  userRewardPoints: number;
  userRewardInr: number;
  platformAllocationInr: number;
  status: 'VERIFYING' | 'COMPLETED' | 'REJECTED';
  completedAt: string;
  providerEventId: string;
}

export interface Referral {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  referredUsername: string;
  signupDate: string;
  status: 'INVITED' | 'PENDING_QUALIFICATION' | 'QUALIFIED' | 'REWARDED';
  rewardPoints: number;
  qualificationCriteria: string;
}

export type NotificationType =
  | 'FOLLOWER'
  | 'LIKE'
  | 'COMMENT'
  | 'VIDEO_APPROVED'
  | 'VIDEO_REJECTED'
  | 'REWARD_RECEIVED'
  | 'TASK_COMPLETED'
  | 'WITHDRAWAL_SUBMITTED'
  | 'WITHDRAWAL_APPROVED'
  | 'WITHDRAWAL_REJECTED'
  | 'REFERRAL_REWARD'
  | 'CAMPAIGN_ANNOUNCEMENT'
  | 'SECURITY_ALERT';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export interface SystemSettings {
  pointsPerInr: number; // 100 points = ₹1
  minimumWithdrawalPoints: number; // 1000 points = ₹10
  withdrawalFeePercentage: number; // 3%
  maxDailyWithdrawals: number; // 3

  // Video revenue distribution (for verified eligible revenue)
  videoCreatorPercentage: number; // 23%
  videoViewerPoolPercentage: number; // 7%
  videoPlatformGrossPercentage: number; // 70%

  // Ad reward distribution
  adUserRewardPercentage: number; // 30%
  adPlatformGrossPercentage: number; // 70%

  // Install reward distribution
  installUserRewardPercentage: number; // 30%
  installPlatformGrossPercentage: number; // 70%

  // Referral bonus
  referralPoints: number; // 500 points (₹5)

  // Emergency safety pauses
  pauseAllRewards: boolean;
  pauseAds: boolean;
  pauseInstallTasks: boolean;
  pauseVideoRewards: boolean;
  pauseWithdrawals: boolean;

  testModeEnabled: boolean;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  referenceId?: string;
  timestamp: string;
}

export interface AntiFraudFlag {
  id: string;
  userId: string;
  type: 'MULTI_ACCOUNT' | 'SUSPICIOUS_WATCH' | 'RAPID_TASKS' | 'SELF_REFERRAL' | 'BOT_SIGNALS';
  riskScore: number;
  description: string;
  evidence: string;
  createdAt: string;
  status: 'PENDING_REVIEW' | 'CLEARED' | 'ACTIONED';
  actionTaken?: string;
}

export interface FinancialSourceBreakdown {
  sourceName: string;
  verifiedRevenueInr: number;
  userRewardsInr: number;
  providerOperatingExpensesInr: number;
  grossPlatformShareInr: number;
  actualNetProfitInr: number;
}

export interface FinancialAnalytics {
  timeFilter: 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LIFETIME' | 'CUSTOM';
  totalVerifiedRevenue: number;
  totalUserRewards: number;
  totalProviderExpenses: number;
  grossPlatformShare: number;
  actualNetProfit: number;
  sourceBreakdown: FinancialSourceBreakdown[];
  totalWithdrawalsProcessed: number;
  pendingWithdrawalsAmount: number;
  fraudLossesPrevented: number;
  totalUsers: number;
  activeUsers: number;
  totalViews: number;
  totalWatchMinutes: number;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  feedback?: 'HELPFUL' | 'NOT_HELPFUL';
  feedbackComment?: string;
}

export interface AIFeedbackRecord {
  id: string;
  userId: string;
  question: string;
  aiResponseId: string;
  feedback: 'HELPFUL' | 'NOT_HELPFUL';
  feedbackText?: string;
  timestamp: string;
}

export type RewardLimitCategory =
  | 'WATCH_AND_EARN'
  | 'REWARDED_ADS'
  | 'APP_INSTALLS'
  | 'SURVEYS'
  | 'GAMES'
  | 'SHOPPING_OFFERS'
  | 'REFERRALS'
  | 'GLOBAL_TOTAL';

export type BreachAction = 'PAUSE_CATEGORY' | 'ALERT_ADMIN' | 'QUEUE_REVIEW';

export interface CategoryRewardLimit {
  category: RewardLimitCategory;
  categoryLabel: string;
  dailyCapPoints: number;
  weeklyCapPoints: number;
  monthlyCapPoints: number;
  perUserDailyCapPoints: number;
  perUserMonthlyCapPoints: number;
  currentDailyDistributed: number;
  currentWeeklyDistributed: number;
  currentMonthlyDistributed: number;
  actionOnBreach: BreachAction;
  enabled: boolean;
  notes?: string;
  updatedAt: string;
  updatedBy: string;
}

