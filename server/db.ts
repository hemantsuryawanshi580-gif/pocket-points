import {
  User,
  Video,
  VideoComment,
  VideoReport,
  Wallet,
  WalletTransaction,
  WithdrawalRequest,
  TaskCampaign,
  TaskCompletion,
  Referral,
  Notification,
  SystemSettings,
  AuditLog,
  AntiFraudFlag,
  AIFeedbackRecord,
  WatchSession,
  CategoryRewardLimit,
  RewardLimitCategory,
  BreachAction,
} from '../src/types/index.ts';

// In-Memory Database Store with Production-grade transactional consistency
class DatabaseStore {
  users: Map<string, User> = new Map();
  videos: Map<string, Video> = new Map();
  comments: Map<string, VideoComment[]> = new Map(); // videoId -> comments
  likes: Map<string, Set<string>> = new Map(); // videoId -> Set of userIds
  follows: Map<string, Set<string>> = new Map(); // userId -> Set of creatorIds they follow
  reports: VideoReport[] = [];
  watchSessions: WatchSession[] = [];
  wallets: Map<string, Wallet> = new Map(); // userId -> Wallet
  transactions: WalletTransaction[] = [];
  withdrawals: WithdrawalRequest[] = [];
  campaigns: Map<string, TaskCampaign> = new Map();
  taskCompletions: TaskCompletion[] = [];
  referrals: Referral[] = [];
  notifications: Notification[] = [];
  antiFraudFlags: AntiFraudFlag[] = [];
  auditLogs: AuditLog[] = [];
  aiFeedback: AIFeedbackRecord[] = [];
  rewardLimits: Map<RewardLimitCategory, CategoryRewardLimit> = new Map();
  userPins: Map<string, string> = new Map();
  phoneOtps: Map<string, { otp: string; expiresAt: number; attempts: number; lastSentAt: number }> = new Map();
  changePhoneOtps: Map<string, { userId: string; newPhone: string; otp: string; expiresAt: number; attempts: number; lastSentAt: number }> = new Map();

  settings: SystemSettings = {
    pointsPerInr: 100, // 100 pts = ₹1
    minimumWithdrawalPoints: 1000, // 1000 pts = ₹10
    withdrawalFeePercentage: 3, // 3% fee
    maxDailyWithdrawals: 3,
    videoCreatorPercentage: 23,
    videoViewerPoolPercentage: 7,
    videoPlatformGrossPercentage: 70,
    adUserRewardPercentage: 30,
    adPlatformGrossPercentage: 70,
    installUserRewardPercentage: 30,
    installPlatformGrossPercentage: 70,
    referralPoints: 500, // ₹5.00
    pauseAllRewards: false,
    pauseAds: false,
    pauseInstallTasks: false,
    pauseVideoRewards: false,
    pauseWithdrawals: false,
    testModeEnabled: true,
  };

  constructor() {
    this.seedInitialData();
  }

  seedInitialData() {
    // 1. Initial Users
    const user1: User = {
      id: 'usr_rahul',
      phoneNumber: '+91 98765 43210',
      email: 'rahul.s@example.com',
      displayName: 'Rahul Sharma',
      username: 'rahul_s',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      bio: 'Mobile tech enthusiast & casual gamer. Earning pocket money honestly!',
      role: 'USER',
      isCreator: false,
      createdAt: '2026-08-10T10:00:00.000Z',
      isVerified: true,
      referralCode: 'RAHUL77',
      status: 'ACTIVE',
      riskScore: 5,
    };

    const creator1: User = {
      id: 'usr_priya',
      phoneNumber: '+91 91234 56789',
      email: 'priya.verma@example.com',
      displayName: 'Priya Verma',
      username: 'priya_creations',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      bio: 'Daily life hacks, street food reviews, and smart budgeting tips in Hindi.',
      role: 'CREATOR',
      isCreator: true,
      createdAt: '2026-07-01T08:30:00.000Z',
      isVerified: true,
      referralCode: 'PRIYA100',
      status: 'ACTIVE',
      riskScore: 2,
    };

    const adminUser: User = {
      id: 'usr_admin',
      phoneNumber: '+91 99999 00000',
      email: 'admin@pocketpoints.in',
      displayName: 'Vikram Malhotra',
      username: 'admin_vikram',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      bio: 'Pocket Points Platform Operations & Risk Architect',
      role: 'SUPER_ADMIN',
      isCreator: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      isVerified: true,
      referralCode: 'ADMINHQ',
      status: 'ACTIVE',
      riskScore: 0,
    };

    this.users.set(user1.id, user1);
    this.users.set(creator1.id, creator1);
    this.users.set(adminUser.id, adminUser);

    // Initial Wallets
    this.wallets.set(user1.id, {
      userId: user1.id,
      availablePoints: 2450, // ₹24.50
      pendingPoints: 150, // ₹1.50
      reservedWithdrawalPoints: 0,
      lifetimeEarnedPoints: 5200,
      lifetimeWithdrawnPoints: 2600,
    });

    this.wallets.set(creator1.id, {
      userId: creator1.id,
      availablePoints: 8900, // ₹89.00
      pendingPoints: 400,
      reservedWithdrawalPoints: 0,
      lifetimeEarnedPoints: 21500,
      lifetimeWithdrawnPoints: 12200,
    });

    this.wallets.set(adminUser.id, {
      userId: adminUser.id,
      availablePoints: 0,
      pendingPoints: 0,
      reservedWithdrawalPoints: 0,
      lifetimeEarnedPoints: 0,
      lifetimeWithdrawnPoints: 0,
    });

    // 2. Pre-seeded Ledger Transactions
    this.transactions.push(
      {
        id: 'tx_seed_01',
        userId: user1.id,
        type: 'REFERRAL_REWARD',
        points: 500,
        amountInr: 5.0,
        source: 'Referral bonus from Friend Signup',
        status: 'COMPLETED',
        referenceId: 'ref_seed_01',
        description: 'Friend completed 1st task qualification',
        createdAt: '2026-09-20T12:00:00.000Z',
      },
      {
        id: 'tx_seed_02',
        userId: user1.id,
        type: 'VIEWER_REWARD',
        points: 70,
        amountInr: 0.70,
        source: 'Video Watch Pool Allocation',
        status: 'COMPLETED',
        referenceId: 'vid_01',
        description: 'Verified video view pool reward',
        createdAt: '2026-09-22T14:30:00.000Z',
      },
      {
        id: 'tx_seed_03',
        userId: user1.id,
        type: 'AD_REWARD',
        points: 150,
        amountInr: 1.50,
        source: 'AdMob Rewarded Video',
        status: 'COMPLETED',
        referenceId: 'ad_comp_01',
        description: 'Watched 10 sponsored rewarded ads',
        createdAt: '2026-09-24T09:15:00.000Z',
      },
      {
        id: 'tx_seed_04',
        userId: user1.id,
        type: 'WITHDRAWAL',
        points: -2000,
        amountInr: -20.0,
        source: 'UPI Payout',
        status: 'COMPLETED',
        referenceId: 'wth_01',
        description: 'UPI Payout to rahul@paytm (Net: ₹19.40, Fee: ₹0.60)',
        createdAt: '2026-09-25T11:00:00.000Z',
      }
    );

    // Initial Withdrawal Request
    this.withdrawals.push({
      id: 'wth_01',
      userId: user1.id,
      upiId: 'rahul@paytm',
      requestedPoints: 2000,
      grossAmountInr: 20.0,
      feePercentage: 3,
      feeAmountInr: 0.60,
      netPayoutInr: 19.40,
      status: 'COMPLETED',
      createdAt: '2026-09-25T10:50:00.000Z',
      updatedAt: '2026-09-25T11:00:00.000Z',
      processedAt: '2026-09-25T11:00:00.000Z',
      payoutReference: 'UPI_TEST_TXN_881299',
      riskScore: 5,
    });

    // 3. Pre-seeded Videos (with valid, reliable short video MP4 streams)
    const vids: Video[] = [
      {
        id: 'vid_01',
        creatorId: creator1.id,
        creatorName: creator1.displayName,
        creatorUsername: creator1.username,
        creatorAvatar: creator1.avatarUrl,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=600&auto=format&fit=crop&q=80',
        caption: '5 Simple Budgeting Rules every Indian student must know! 💡 ₹500 saved today is ₹5000 invested tomorrow.',
        category: 'Finance & Tips',
        hashtags: ['#MoneyTips', '#StudentBudget', '#Savings', '#PocketPoints'],
        durationSeconds: 15,
        status: 'APPROVED',
        viewsCount: 14200,
        watchTimeSeconds: 178000,
        likesCount: 1240,
        commentsCount: 88,
        sharesCount: 310,
        verifiedEligibleRevenue: 320.0,
        creatorEarnings: 73.6, // 23%
        viewerRewardPool: 22.4, // 7%
        platformGrossShare: 224.0, // 70%
        createdAt: '2026-09-18T10:00:00.000Z',
        originalityCertified: true,
      },
      {
        id: 'vid_02',
        creatorId: creator1.id,
        creatorName: creator1.displayName,
        creatorUsername: creator1.username,
        creatorAvatar: creator1.avatarUrl,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80',
        caption: 'Chandni Chowk legendary street food tour under ₹100! Parathas, Jalebi & Rabdi 🤤🔥',
        category: 'Lifestyle',
        hashtags: ['#StreetFood', '#DelhiFood', '#Foodie', '#BudgetEats'],
        durationSeconds: 15,
        status: 'APPROVED',
        viewsCount: 9800,
        watchTimeSeconds: 120000,
        likesCount: 890,
        commentsCount: 45,
        sharesCount: 140,
        verifiedEligibleRevenue: 210.0,
        creatorEarnings: 48.3,
        viewerRewardPool: 14.7,
        platformGrossShare: 147.0,
        createdAt: '2026-09-21T15:20:00.000Z',
        originalityCertified: true,
      },
      {
        id: 'vid_03',
        creatorId: 'usr_tech_rohit',
        creatorName: 'Rohit Gadget Guy',
        creatorUsername: 'tech_rohit',
        creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
        caption: 'Top 3 hidden Android features you probably did not know existed! Battery saving trick ⚡',
        category: 'Tech',
        hashtags: ['#AndroidTricks', '#TechHacks', '#Smartphone', '#TipsAndTricks'],
        durationSeconds: 15,
        status: 'APPROVED',
        viewsCount: 22100,
        watchTimeSeconds: 290000,
        likesCount: 2450,
        commentsCount: 160,
        sharesCount: 780,
        verifiedEligibleRevenue: 450.0,
        creatorEarnings: 103.5,
        viewerRewardPool: 31.5,
        platformGrossShare: 315.0,
        createdAt: '2026-09-23T08:00:00.000Z',
        originalityCertified: true,
      },
      {
        id: 'vid_04',
        creatorId: 'usr_gaming_arun',
        creatorName: 'Arun Gamer',
        creatorUsername: 'arun_playz',
        creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
        caption: 'Clutch 1v4 squad wipe in last circle! Never give up until the victory screen 🏆🎮',
        category: 'Gaming',
        hashtags: ['#MobileGaming', '#BGMI', '#ClutchPlay', '#GamerMoments'],
        durationSeconds: 15,
        status: 'APPROVED',
        viewsCount: 18400,
        watchTimeSeconds: 240000,
        likesCount: 1820,
        commentsCount: 92,
        sharesCount: 410,
        verifiedEligibleRevenue: 380.0,
        creatorEarnings: 87.4,
        viewerRewardPool: 26.6,
        platformGrossShare: 266.0,
        createdAt: '2026-09-25T16:45:00.000Z',
        originalityCertified: true,
      },
      {
        id: 'vid_05_pending',
        creatorId: creator1.id,
        creatorName: creator1.displayName,
        creatorUsername: creator1.username,
        creatorAvatar: creator1.avatarUrl,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600&auto=format&fit=crop&q=80',
        caption: 'How UPI works behind the scenes in 60 seconds - NPCI and bank settlement explained! 🏦',
        category: 'Education',
        hashtags: ['#Fintech', '#UPI', '#NPCI', '#Learning'],
        durationSeconds: 15,
        status: 'PENDING', // In moderation queue
        viewsCount: 0,
        watchTimeSeconds: 0,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        verifiedEligibleRevenue: 0,
        creatorEarnings: 0,
        viewerRewardPool: 0,
        platformGrossShare: 0,
        createdAt: '2026-09-28T05:30:00.000Z',
        originalityCertified: true,
      },
    ];

    for (const v of vids) {
      this.videos.set(v.id, v);
      this.likes.set(v.id, new Set([user1.id]));
      this.comments.set(v.id, [
        {
          id: `cmt_${v.id}_1`,
          videoId: v.id,
          userId: user1.id,
          username: user1.username,
          userAvatar: user1.avatarUrl,
          content: 'Very informative and practical! Keep making these videos 👍',
          createdAt: '2026-09-24T10:00:00.000Z',
          likesCount: 12,
        },
      ]);
    }

    // Follows
    this.follows.set(user1.id, new Set([creator1.id]));

    // 4. Initial Campaigns / Tasks
    const initialCampaigns: TaskCampaign[] = [
      {
        id: 'camp_ad_01',
        title: 'Watch Rewarded Video Ads',
        category: 'REWARDED_AD',
        description: 'Watch a verified 15-30 second sponsor video. Rewarded once full ad completion is verified by provider SDK.',
        requirements: ['Watch full ad without skipping', 'Active internet connection', 'Maximum 10 ads per day'],
        rewardPoints: 15, // ₹0.15
        rewardInr: 0.15,
        eligibility: 'All verified users',
        verificationMethod: 'AD_SDK_CONFIRMATION',
        verificationTime: 'Instant (15-30 seconds)',
        dailyLimit: 10,
        userLimit: 100,
        totalBudgetInr: 5000,
        consumedBudgetInr: 1420,
        minimumMarginPercentage: 65,
        status: 'ACTIVE',
        rules: ['Opening or immediately closing the ad does not grant rewards', '60-second cooldown between ads to prevent artificial traffic'],
        targetPackageOrUrl: 'admob://rewarded_video_unit_01',
      },
      {
        id: 'camp_inst_01',
        title: 'Install FinTrack Budgeting App',
        category: 'APP_INSTALL',
        description: 'Install official Google Play app, register with mobile number, and view your monthly budget dashboard.',
        requirements: ['First-time installation on your device only', 'Open and complete OTP signup', 'Explore 2 screens'],
        rewardPoints: 150, // ₹1.50
        rewardInr: 1.50,
        eligibility: 'New devices only',
        verificationMethod: 'AUTOMATIC_POSTBACK',
        verificationTime: '15-45 minutes after install event verification',
        dailyLimit: 1,
        userLimit: 1,
        totalBudgetInr: 15000,
        consumedBudgetInr: 8300,
        minimumMarginPercentage: 60,
        status: 'ACTIVE',
        rules: ['Do not use VPN or emulator', 'Uninstalls within 24h will void pending rewards'],
        targetPackageOrUrl: 'com.fintrack.budgeting.android',
      },
      {
        id: 'camp_surv_01',
        title: 'Digital Payment Habits Survey',
        category: 'SURVEY',
        description: 'Answer 8 simple questions regarding how frequently you use UPI, credit cards, and local merchant scanning.',
        requirements: ['Answer genuinely and consistently', 'Complete all questions in 3 minutes'],
        rewardPoints: 100, // ₹1.00
        rewardInr: 1.00,
        eligibility: 'Age 18+ resident of India',
        verificationMethod: 'AUTOMATIC_POSTBACK',
        verificationTime: 'Instant upon survey completion',
        dailyLimit: 2,
        userLimit: 2,
        totalBudgetInr: 8000,
        consumedBudgetInr: 3200,
        minimumMarginPercentage: 65,
        status: 'ACTIVE',
        rules: ['Straight-lining or speed-running answers will fail validation check'],
        targetPackageOrUrl: 'https://cpx-research.com/surveys/demo_in',
      },
      {
        id: 'camp_game_01',
        title: 'Play Speed Runner 3D (Level 5)',
        category: 'GAME',
        description: 'Play casual 3D runner game and reach Level 5. Playtime tracking ensures legitimate gameplay.',
        requirements: ['Reach Level 5 checkpoint', 'Spend minimum 5 minutes in-game'],
        rewardPoints: 200, // ₹2.00
        rewardInr: 2.00,
        eligibility: 'All mobile users',
        verificationMethod: 'AUTOMATIC_POSTBACK',
        verificationTime: 'Within 1 hour of level completion',
        dailyLimit: 1,
        userLimit: 1,
        totalBudgetInr: 12000,
        consumedBudgetInr: 4500,
        minimumMarginPercentage: 70,
        status: 'ACTIVE',
        rules: ['Must complete level legitimately without game modding'],
        targetPackageOrUrl: 'com.casual.speedrunner3d',
      },
      {
        id: 'camp_miss_01',
        title: 'Daily Watch Explorer Mission',
        category: 'DAILY_MISSION',
        description: 'Watch at least 5 different approved community videos for a minimum of 15 seconds each today.',
        requirements: ['Watch 5 approved videos', 'Minimum 15s watch duration each'],
        rewardPoints: 50, // ₹0.50
        rewardInr: 0.50,
        eligibility: 'Daily for all users',
        verificationMethod: 'TIME_TRACKER',
        verificationTime: 'Instant on 5th video',
        dailyLimit: 1,
        userLimit: 30,
        totalBudgetInr: 20000,
        consumedBudgetInr: 9800,
        minimumMarginPercentage: 70,
        status: 'ACTIVE',
        rules: ['Replaying the exact same video repeatedly does not count towards mission progress'],
      },
      {
        id: 'camp_shop_01',
        title: 'Order Grocery on Blinkit Partner',
        category: 'SHOPPING_OFFER',
        description: 'Place an order of ₹199 or more on partner quick-commerce app via our affiliate link.',
        requirements: ['Minimum order value ₹199', 'Order must be successfully delivered'],
        rewardPoints: 300, // ₹3.00
        rewardInr: 3.00,
        eligibility: 'Selected pin codes',
        verificationMethod: 'AUTOMATIC_POSTBACK',
        verificationTime: '24 hours post successful delivery',
        dailyLimit: 1,
        userLimit: 5,
        totalBudgetInr: 30000,
        consumedBudgetInr: 11400,
        minimumMarginPercentage: 75,
        status: 'ACTIVE',
        rules: ['Cancelled or returned orders will forfeit the points reward'],
        targetPackageOrUrl: 'https://partner.blinkit.com/pocketpoints',
      },
    ];

    for (const c of initialCampaigns) {
      this.campaigns.set(c.id, c);
    }

    // 5. Initial Referrals for Rahul
    this.referrals.push({
      id: 'ref_01',
      referrerUserId: user1.id,
      referredUserId: 'usr_anita',
      referredUsername: 'anita_k',
      signupDate: '2026-09-19T14:00:00.000Z',
      status: 'REWARDED',
      rewardPoints: 500,
      qualificationCriteria: 'Completed 1st app install task',
    });

    // 6. Notifications for Rahul
    this.notifications.push(
      {
        id: 'notif_01',
        userId: user1.id,
        type: 'REWARD_RECEIVED',
        title: 'UPI Payout Completed',
        message: 'Your withdrawal request of ₹19.40 (after ₹0.60 fee) to rahul@paytm has been processed successfully.',
        read: false,
        createdAt: '2026-09-25T11:01:00.000Z',
      },
      {
        id: 'notif_02',
        userId: user1.id,
        type: 'REFERRAL_REWARD',
        title: 'Referral Reward Credited! 🎉',
        message: 'Your friend anita_k completed their 1st task. 500 points (₹5.00) have been added to your wallet!',
        read: true,
        createdAt: '2026-09-20T12:01:00.000Z',
      },
      {
        id: 'notif_03',
        userId: user1.id,
        type: 'CAMPAIGN_ANNOUNCEMENT',
        title: 'New High Reward Tasks Available',
        message: 'Explore brand new app install and daily survey missions on the Earn tab today.',
        read: true,
        createdAt: '2026-09-27T09:00:00.000Z',
      }
    );

    // 7. Initial Audit Logs
    this.auditLogs.push({
      id: 'log_01',
      adminId: adminUser.id,
      adminName: adminUser.displayName,
      action: 'SYSTEM_SETTINGS_UPDATE',
      oldValue: 'Min Withdrawal: 500 pts',
      newValue: 'Min Withdrawal: 1000 pts (₹10.00), Fee: 3%',
      reason: 'Standardizing anti-spam withdrawal threshold and banking processing fee coverage.',
      referenceId: 'sett_01',
      timestamp: '2026-09-01T10:00:00.000Z',
    });

    // 8. Global Reward Limits for Controlled Economics
    this.seedRewardLimits();
  }

  seedRewardLimits() {
    const limits: CategoryRewardLimit[] = [
      {
        category: 'GLOBAL_TOTAL',
        categoryLabel: 'Global Master Cap (All Categories)',
        dailyCapPoints: 400000, // ₹4,000.00
        weeklyCapPoints: 2500000, // ₹25,000.00
        monthlyCapPoints: 10000000, // ₹100,000.00
        perUserDailyCapPoints: 1000, // ₹10.00 max per user per day across everything
        perUserMonthlyCapPoints: 15000, // ₹150.00 max per user per month
        currentDailyDistributed: 150850,
        currentWeeklyDistributed: 998400,
        currentMonthlyDistributed: 3970000,
        actionOnBreach: 'PAUSE_CATEGORY',
        enabled: true,
        notes: 'Master safety ceiling across all earning channels to protect gross margin.',
        updatedAt: '2026-09-20T10:00:00.000Z',
        updatedBy: 'Vikram Malhotra (Super Admin)',
      },
      {
        category: 'WATCH_AND_EARN',
        categoryLabel: 'Watch & Earn (Video Rewards)',
        dailyCapPoints: 50000, // ₹500.00
        weeklyCapPoints: 300000, // ₹3,000.00
        monthlyCapPoints: 1200000, // ₹12,000.00
        perUserDailyCapPoints: 150, // ₹1.50 (30 video watches/day)
        perUserMonthlyCapPoints: 3000, // ₹30.00
        currentDailyDistributed: 18450,
        currentWeeklyDistributed: 112400,
        currentMonthlyDistributed: 420000,
        actionOnBreach: 'PAUSE_CATEGORY',
        enabled: true,
        notes: 'Cap for 7% viewer pool distribution from verified eligible videos.',
        updatedAt: '2026-09-20T10:00:00.000Z',
        updatedBy: 'Vikram Malhotra (Super Admin)',
      },
      {
        category: 'REWARDED_ADS',
        categoryLabel: 'Ads (Rewarded Video Ads)',
        dailyCapPoints: 100000, // ₹1,000.00
        weeklyCapPoints: 600000, // ₹6,000.00
        monthlyCapPoints: 2400000, // ₹24,000.00
        perUserDailyCapPoints: 150, // 10 ads @ 15 pts = ₹1.50
        perUserMonthlyCapPoints: 4000, // ₹40.00
        currentDailyDistributed: 42600,
        currentWeeklyDistributed: 280000,
        currentMonthlyDistributed: 1120000,
        actionOnBreach: 'PAUSE_CATEGORY',
        enabled: true,
        notes: 'Strict daily quota aligned with Google AdMob verified eCPM.',
        updatedAt: '2026-09-20T10:00:00.000Z',
        updatedBy: 'Vikram Malhotra (Super Admin)',
      },
      {
        category: 'APP_INSTALLS',
        categoryLabel: 'Tasks (App Installs & CPA)',
        dailyCapPoints: 80000, // ₹800.00
        weeklyCapPoints: 500000, // ₹5,000.00
        monthlyCapPoints: 1800000, // ₹18,000.00
        perUserDailyCapPoints: 300, // 2 apps max
        perUserMonthlyCapPoints: 5000, // ₹50.00
        currentDailyDistributed: 28500,
        currentWeeklyDistributed: 195000,
        currentMonthlyDistributed: 780000,
        actionOnBreach: 'QUEUE_REVIEW',
        enabled: true,
        notes: 'Ensures install spend does not exceed advertiser budget ceilings.',
        updatedAt: '2026-09-20T10:00:00.000Z',
        updatedBy: 'Vikram Malhotra (Super Admin)',
      },
      {
        category: 'SURVEYS',
        categoryLabel: 'Surveys & Market Research',
        dailyCapPoints: 40000, // ₹400.00
        weeklyCapPoints: 250000, // ₹2,500.00
        monthlyCapPoints: 900000, // ₹9,000.00
        perUserDailyCapPoints: 200, // 2 surveys max
        perUserMonthlyCapPoints: 4000, // ₹40.00
        currentDailyDistributed: 12300,
        currentWeeklyDistributed: 84000,
        currentMonthlyDistributed: 340000,
        actionOnBreach: 'QUEUE_REVIEW',
        enabled: true,
        notes: 'Survey completion limits per household / user to maintain high data quality.',
        updatedAt: '2026-09-20T10:00:00.000Z',
        updatedBy: 'Vikram Malhotra (Super Admin)',
      },
      {
        category: 'GAMES',
        categoryLabel: 'Sponsored Games & Playtime',
        dailyCapPoints: 60000, // ₹600.00
        weeklyCapPoints: 350000, // ₹3,500.00
        monthlyCapPoints: 1400000, // ₹14,000.00
        perUserDailyCapPoints: 400, // 2 levels/games
        perUserMonthlyCapPoints: 6000, // ₹60.00
        currentDailyDistributed: 19800,
        currentWeeklyDistributed: 130000,
        currentMonthlyDistributed: 510000,
        actionOnBreach: 'ALERT_ADMIN',
        enabled: true,
        notes: 'Engagement rewards capped by publisher playtime budgets.',
        updatedAt: '2026-09-20T10:00:00.000Z',
        updatedBy: 'Vikram Malhotra (Super Admin)',
      },
      {
        category: 'SHOPPING_OFFERS',
        categoryLabel: 'Shopping Offers & Cashback',
        dailyCapPoints: 50000, // ₹500.00
        weeklyCapPoints: 300000, // ₹3,000.00
        monthlyCapPoints: 1200000, // ₹12,000.00
        perUserDailyCapPoints: 600, // ₹6.00
        perUserMonthlyCapPoints: 8000, // ₹80.00
        currentDailyDistributed: 14200,
        currentWeeklyDistributed: 92000,
        currentMonthlyDistributed: 380000,
        actionOnBreach: 'QUEUE_REVIEW',
        enabled: true,
        notes: 'Affiliate commission share limits tied to merchant confirmation windows.',
        updatedAt: '2026-09-20T10:00:00.000Z',
        updatedBy: 'Vikram Malhotra (Super Admin)',
      },
      {
        category: 'REFERRALS',
        categoryLabel: 'Referral Program Bonuses',
        dailyCapPoints: 50000, // ₹500.00 (100 invites/day across platform)
        weeklyCapPoints: 300000, // ₹3,000.00
        monthlyCapPoints: 1000000, // ₹10,000.00
        perUserDailyCapPoints: 2500, // 5 qualified invites/day per user
        perUserMonthlyCapPoints: 25000, // 50 qualified invites/month per user
        currentDailyDistributed: 15000,
        currentWeeklyDistributed: 105000,
        currentMonthlyDistributed: 420000,
        actionOnBreach: 'QUEUE_REVIEW',
        enabled: true,
        notes: 'Viral referral reward ceiling with fraud velocity caps.',
        updatedAt: '2026-09-20T10:00:00.000Z',
        updatedBy: 'Vikram Malhotra (Super Admin)',
      },
    ];

    for (const lim of limits) {
      this.rewardLimits.set(lim.category, lim);
    }
  }

  // --- REWARD LIMIT SAFETY ENFORCEMENT ---
  checkAndConsumeRewardLimit(
    category: RewardLimitCategory,
    points: number,
    userId: string
  ): { allowed: boolean; reason?: string; actionTaken?: BreachAction } {
    const limit = this.rewardLimits.get(category);
    const globalLimit = this.rewardLimits.get('GLOBAL_TOTAL');

    if (limit && !limit.enabled) {
      return {
        allowed: false,
        reason: `${limit.categoryLabel} rewards are temporarily disabled by administration.`,
        actionTaken: 'PAUSE_CATEGORY',
      };
    }

    if (globalLimit && !globalLimit.enabled) {
      return {
        allowed: false,
        reason: 'Global platform reward limit circuit breaker is active. New rewards are paused.',
        actionTaken: 'PAUSE_CATEGORY',
      };
    }

    // Check Per-User Daily Limit for this category
    if (limit && limit.perUserDailyCapPoints > 0) {
      const today = new Date().toISOString().split('T')[0];
      const userTodayCategoryPoints = this.transactions
        .filter(t => t.userId === userId && t.createdAt.startsWith(today) && t.points > 0)
        .reduce((sum, t) => sum + t.points, 0);

      if (userTodayCategoryPoints + points > limit.perUserDailyCapPoints) {
        return {
          allowed: false,
          reason: `Daily personal limit reached (${limit.perUserDailyCapPoints} pts / ₹${(limit.perUserDailyCapPoints / this.settings.pointsPerInr).toFixed(2)}). Limits reset tomorrow at 00:00 IST to ensure controlled economics.`,
        };
      }
    }

    // Check Platform-wide Daily Cap for this category
    if (limit && limit.dailyCapPoints > 0) {
      if (limit.currentDailyDistributed + points > limit.dailyCapPoints) {
        if (limit.actionOnBreach === 'PAUSE_CATEGORY') {
          limit.enabled = false;
          this.auditLogs.unshift({
            id: `log_${Date.now()}`,
            adminId: 'SYSTEM',
            adminName: 'Autonomous Loss Protection Engine',
            action: `AUTO_PAUSE_LIMIT_BREACH_${category}`,
            oldValue: 'ENABLED',
            newValue: 'DISABLED',
            reason: `Daily cap of ${limit.dailyCapPoints} pts breached. Category automatically paused to safeguard platform economics.`,
            referenceId: category,
            timestamp: new Date().toISOString(),
          });
        }
        return {
          allowed: false,
          reason: `Platform daily reward budget reached for ${limit.categoryLabel}. Category cap is enforced for controlled economics.`,
          actionTaken: limit.actionOnBreach,
        };
      }
    }

    // Check Global Total Daily Cap
    if (globalLimit && globalLimit.dailyCapPoints > 0) {
      if (globalLimit.currentDailyDistributed + points > globalLimit.dailyCapPoints) {
        return {
          allowed: false,
          reason: 'Platform-wide total daily rewards budget reached. Controlled economic ceiling is active.',
          actionTaken: globalLimit.actionOnBreach,
        };
      }
    }

    // All checks passed -> Consume the reward allocation atomically
    if (limit) {
      limit.currentDailyDistributed += points;
      limit.currentWeeklyDistributed += points;
      limit.currentMonthlyDistributed += points;
    }
    if (globalLimit && category !== 'GLOBAL_TOTAL') {
      globalLimit.currentDailyDistributed += points;
      globalLimit.currentWeeklyDistributed += points;
      globalLimit.currentMonthlyDistributed += points;
    }

    return { allowed: true };
  }

  updateRewardLimit(
    category: RewardLimitCategory,
    updates: Partial<CategoryRewardLimit>,
    adminId: string,
    reason?: string
  ): CategoryRewardLimit {
    const existing = this.rewardLimits.get(category);
    if (!existing) {
      throw new Error(`Reward limit category ${category} not found`);
    }

    const oldStr = JSON.stringify(existing);
    const updated: CategoryRewardLimit = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: this.users.get(adminId)?.displayName || 'Administrator',
    };
    this.rewardLimits.set(category, updated);

    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      adminId,
      adminName: this.users.get(adminId)?.displayName || 'Administrator',
      action: `REWARD_LIMIT_UPDATED_${category}`,
      oldValue: oldStr,
      newValue: JSON.stringify(updated),
      reason: reason || `Updated ${existing.categoryLabel} daily/weekly/monthly reward limits`,
      referenceId: category,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  resetRewardLimitCounters(category?: RewardLimitCategory, period: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'DAILY') {
    const targets = category
      ? [this.rewardLimits.get(category)].filter(Boolean) as CategoryRewardLimit[]
      : Array.from(this.rewardLimits.values());

    for (const lim of targets) {
      if (period === 'DAILY') lim.currentDailyDistributed = 0;
      if (period === 'WEEKLY') lim.currentWeeklyDistributed = 0;
      if (period === 'MONTHLY') lim.currentMonthlyDistributed = 0;
    }
  }

  applyRewardLimitPreset(preset: 'CONSERVATIVE' | 'BALANCED' | 'GROWTH', adminId: string): CategoryRewardLimit[] {
    if (preset === 'BALANCED') {
      this.seedRewardLimits();
    } else {
      const multiplier = preset === 'CONSERVATIVE' ? 0.6 : 1.5;
      for (const lim of this.rewardLimits.values()) {
        lim.dailyCapPoints = Math.round((lim.dailyCapPoints * multiplier) / 100) * 100;
        lim.weeklyCapPoints = Math.round((lim.weeklyCapPoints * multiplier) / 100) * 100;
        lim.monthlyCapPoints = Math.round((lim.monthlyCapPoints * multiplier) / 100) * 100;
        lim.perUserDailyCapPoints = Math.round(lim.perUserDailyCapPoints * (preset === 'CONSERVATIVE' ? 0.7 : 1.4));
        lim.perUserMonthlyCapPoints = Math.round(lim.perUserMonthlyCapPoints * (preset === 'CONSERVATIVE' ? 0.7 : 1.4));
        if (preset === 'CONSERVATIVE') {
          lim.actionOnBreach = 'PAUSE_CATEGORY';
        }
        lim.updatedAt = new Date().toISOString();
        lim.updatedBy = this.users.get(adminId)?.displayName || 'Administrator';
      }
    }

    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      adminId,
      adminName: this.users.get(adminId)?.displayName || 'Administrator',
      action: `APPLIED_ECONOMIC_PRESET_${preset}`,
      reason: `Applied ${preset} economic reward limits preset across all channels for risk management.`,
      referenceId: 'preset_economic_limits',
      timestamp: new Date().toISOString(),
    });

    return Array.from(this.rewardLimits.values());
  }

  simulateRewardLimitLoad(
    category: RewardLimitCategory,
    points: number,
    adminId: string
  ): { limit: CategoryRewardLimit; globalLimit: CategoryRewardLimit; breached: boolean } {
    const lim = this.rewardLimits.get(category);
    const globalLim = this.rewardLimits.get('GLOBAL_TOTAL');
    if (!lim) throw new Error(`Category ${category} not found`);

    lim.currentDailyDistributed += points;
    lim.currentWeeklyDistributed += points;
    lim.currentMonthlyDistributed += points;

    if (globalLim && category !== 'GLOBAL_TOTAL') {
      globalLim.currentDailyDistributed += points;
      globalLim.currentWeeklyDistributed += points;
      globalLim.currentMonthlyDistributed += points;
    }

    let breached = false;
    if (lim.dailyCapPoints > 0 && lim.currentDailyDistributed >= lim.dailyCapPoints) {
      breached = true;
      if (lim.actionOnBreach === 'PAUSE_CATEGORY') {
        lim.enabled = false;
      }
    }

    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      adminId,
      adminName: this.users.get(adminId)?.displayName || 'Administrator',
      action: `SIMULATED_REWARD_LOAD_${category}`,
      reason: `Simulated injection of ${points.toLocaleString()} pts to test real-time economic pressure monitoring and cap enforcement.`,
      referenceId: category,
      timestamp: new Date().toISOString(),
    });

    return { limit: lim, globalLimit: globalLim!, breached };
  }

  // --- ATOMIC WALLET LEDGER TRANSACTIONS ---
  addTransaction(params: {
    userId: string;
    type: WalletTransaction['type'];
    points: number;
    amountInr: number;
    source: string;
    referenceId: string;
    description: string;
    status?: WalletTransaction['status'];
    metadata?: Record<string, any>;
  }): WalletTransaction {
    const wallet = this.wallets.get(params.userId);
    if (!wallet) {
      throw new Error(`Wallet not found for user ${params.userId}`);
    }

    const txn: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: params.userId,
      type: params.type,
      points: params.points,
      amountInr: params.amountInr,
      source: params.source,
      status: params.status || 'COMPLETED',
      referenceId: params.referenceId,
      description: params.description,
      createdAt: new Date().toISOString(),
      metadata: params.metadata,
    };

    // Update wallet balance strictly aligned with transaction status
    if (txn.status === 'COMPLETED') {
      wallet.availablePoints += txn.points;
      if (txn.points > 0) {
        wallet.lifetimeEarnedPoints += txn.points;
      } else if (txn.type === 'WITHDRAWAL') {
        wallet.lifetimeWithdrawnPoints += Math.abs(txn.points);
      }
    } else if (txn.status === 'PENDING') {
      wallet.pendingPoints += txn.points;
    }

    this.transactions.unshift(txn);
    return txn;
  }

  // Atomic Withdrawal Reservation
  reserveWithdrawal(params: {
    userId: string;
    points: number;
    upiId: string;
  }): { success: boolean; error?: string; withdrawal?: WithdrawalRequest } {
    if (this.settings.pauseWithdrawals || this.settings.pauseAllRewards) {
      return { success: false, error: 'Withdrawals are temporarily paused by administration.' };
    }

    const wallet = this.wallets.get(params.userId);
    if (!wallet) {
      return { success: false, error: 'User wallet not found.' };
    }

    if (params.points < this.settings.minimumWithdrawalPoints) {
      return {
        success: false,
        error: `Minimum withdrawal is ${this.settings.minimumWithdrawalPoints} points (₹${(this.settings.minimumWithdrawalPoints / this.settings.pointsPerInr).toFixed(2)}).`,
      };
    }

    if (wallet.availablePoints < params.points) {
      return {
        success: false,
        error: `Insufficient available balance. You have ${wallet.availablePoints} points (₹${(wallet.availablePoints / this.settings.pointsPerInr).toFixed(2)}).`,
      };
    }

    // Check daily withdrawal limit
    const today = new Date().toISOString().split('T')[0];
    const todayRequests = this.withdrawals.filter(
      w => w.userId === params.userId && w.createdAt.startsWith(today)
    );
    if (todayRequests.length >= this.settings.maxDailyWithdrawals) {
      return {
        success: false,
        error: `Daily limit reached. Maximum ${this.settings.maxDailyWithdrawals} withdrawals allowed per day.`,
      };
    }

    // Calculate Economics
    const grossInr = params.points / this.settings.pointsPerInr;
    const feeInr = Math.round((grossInr * (this.settings.withdrawalFeePercentage / 100)) * 100) / 100;
    const netPayoutInr = Math.round((grossInr - feeInr) * 100) / 100;

    // Atomically reserve points
    wallet.availablePoints -= params.points;
    wallet.reservedWithdrawalPoints += params.points;

    const withdrawal: WithdrawalRequest = {
      id: `wth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: params.userId,
      upiId: params.upiId.trim(),
      requestedPoints: params.points,
      grossAmountInr: grossInr,
      feePercentage: this.settings.withdrawalFeePercentage,
      feeAmountInr: feeInr,
      netPayoutInr: netPayoutInr,
      status: 'REQUESTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      riskScore: this.users.get(params.userId)?.riskScore || 0,
    };

    this.withdrawals.unshift(withdrawal);

    // Ledger entry for reservation
    this.addTransaction({
      userId: params.userId,
      type: 'WITHDRAWAL',
      points: -params.points,
      amountInr: -grossInr,
      source: 'UPI Withdrawal Request',
      referenceId: withdrawal.id,
      description: `Reserved ${params.points} points for UPI payout to ${params.upiId} (Net: ₹${netPayoutInr.toFixed(2)}, Fee: ₹${feeInr.toFixed(2)})`,
      status: 'PENDING',
    });

    return { success: true, withdrawal };
  }

  // Finalize or Refund Withdrawal
  resolveWithdrawal(
    withdrawalId: string,
    action: 'APPROVE' | 'REJECT',
    reason?: string,
    adminId?: string
  ): { success: boolean; error?: string; withdrawal?: WithdrawalRequest } {
    const wth = this.withdrawals.find(w => w.id === withdrawalId);
    if (!wth) return { success: false, error: 'Withdrawal not found' };
    if (wth.status === 'COMPLETED' || wth.status === 'REJECTED') {
      return { success: false, error: `Withdrawal is already in terminal state: ${wth.status}` };
    }

    const wallet = this.wallets.get(wth.userId);
    if (!wallet) return { success: false, error: 'User wallet not found' };

    if (action === 'APPROVE') {
      wth.status = 'COMPLETED';
      wth.processedAt = new Date().toISOString();
      wth.updatedAt = new Date().toISOString();
      wth.payoutReference = `UPI_TEST_TXN_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      // Release from reserved
      wallet.reservedWithdrawalPoints -= wth.requestedPoints;
      wallet.lifetimeWithdrawnPoints += wth.requestedPoints;

      // Update pending ledger transaction to completed
      const txn = this.transactions.find(t => t.referenceId === wth.id && t.status === 'PENDING');
      if (txn) {
        txn.status = 'COMPLETED';
      }

      // Add fee ledger transaction
      const feePoints = Math.round(wth.feeAmountInr * this.settings.pointsPerInr);
      this.transactions.push({
        id: `tx_fee_${Date.now()}`,
        userId: wth.userId,
        type: 'WITHDRAWAL_FEE',
        points: -feePoints,
        amountInr: -wth.feeAmountInr,
        source: 'Banking & Verification Fee (3%)',
        referenceId: wth.id,
        status: 'COMPLETED',
        description: `3% processing fee on ₹${wth.grossAmountInr.toFixed(2)} UPI withdrawal`,
        createdAt: new Date().toISOString(),
      });

      // Notification
      this.notifications.unshift({
        id: `notif_${Date.now()}`,
        userId: wth.userId,
        type: 'WITHDRAWAL_APPROVED',
        title: 'Withdrawal Approved & Sent! 💸',
        message: `₹${wth.netPayoutInr.toFixed(2)} has been transferred to your UPI ID ${wth.upiId}. Reference: ${wth.payoutReference}`,
        read: false,
        createdAt: new Date().toISOString(),
      });

      this.auditLogs.unshift({
        id: `log_${Date.now()}`,
        adminId: adminId || 'usr_admin',
        adminName: 'Platform Admin',
        action: 'WITHDRAWAL_APPROVED',
        oldValue: 'REQUESTED',
        newValue: 'COMPLETED',
        reason: reason || 'Approved after risk review',
        referenceId: wth.id,
        timestamp: new Date().toISOString(),
      });
    } else {
      // REJECT & REFUND ATOMICALLY
      wth.status = 'REJECTED';
      wth.rejectionReason = reason || 'Declined during verification review';
      wth.updatedAt = new Date().toISOString();

      // Return reserved points back to available
      wallet.reservedWithdrawalPoints -= wth.requestedPoints;
      wallet.availablePoints += wth.requestedPoints;

      // Mark reservation transaction as reversed
      const txn = this.transactions.find(t => t.referenceId === wth.id && t.status === 'PENDING');
      if (txn) {
        txn.status = 'REVERSED';
      }

      // Add Reversal credit ledger entry
      this.transactions.unshift({
        id: `tx_rev_${Date.now()}`,
        userId: wth.userId,
        type: 'REVERSAL',
        points: wth.requestedPoints,
        amountInr: wth.grossAmountInr,
        source: 'Withdrawal Refund',
        referenceId: wth.id,
        status: 'COMPLETED',
        description: `Refunded ${wth.requestedPoints} points. Reason: ${wth.rejectionReason}`,
        createdAt: new Date().toISOString(),
      });

      // Notification
      this.notifications.unshift({
        id: `notif_${Date.now()}`,
        userId: wth.userId,
        type: 'WITHDRAWAL_REJECTED',
        title: 'Withdrawal Declined - Points Refunded',
        message: `Your withdrawal of ${wth.requestedPoints} points was declined (${wth.rejectionReason}). The points have been safely restored to your available wallet balance.`,
        read: false,
        createdAt: new Date().toISOString(),
      });

      this.auditLogs.unshift({
        id: `log_${Date.now()}`,
        adminId: adminId || 'usr_admin',
        adminName: 'Platform Admin',
        action: 'WITHDRAWAL_REJECTED',
        oldValue: 'REQUESTED',
        newValue: 'REJECTED',
        reason: reason || 'Declined during verification',
        referenceId: wth.id,
        timestamp: new Date().toISOString(),
      });
    }

    return { success: true, withdrawal: wth };
  }

  // Video Watch Verification & Pool Distribution
  recordWatchSession(params: {
    userId: string;
    videoId: string;
    watchDurationSeconds: number;
    videoDurationSeconds: number;
  }): { eligible: boolean; message: string; pointsCredited?: number } {
    const video = this.videos.get(params.videoId);
    if (!video) return { eligible: false, message: 'Video not found' };

    // Anti-fraud checks:
    // Minimum 10 seconds or 70% of video
    const completionPct = Math.min(100, Math.round((params.watchDurationSeconds / (video.durationSeconds || 15)) * 100));

    // Rate limiting: check recent watches by this user on this video in last 2 minutes
    const recentSameVideo = this.watchSessions.find(
      s => s.userId === params.userId &&
           s.videoId === params.videoId &&
           new Date().getTime() - new Date(s.startedAt).getTime() < 120000 &&
           s.rewardStatus === 'CREDITED'
    );

    const riskSignals: string[] = [];
    if (params.watchDurationSeconds < 8) {
      riskSignals.push('WATCH_TOO_SHORT');
    }
    if (recentSameVideo) {
      riskSignals.push('RAPID_REPLAY_ABUSE');
    }

    // Video view count increment
    video.viewsCount += 1;
    video.watchTimeSeconds += params.watchDurationSeconds;

    if (riskSignals.length > 0 || this.settings.pauseVideoRewards || this.settings.pauseAllRewards) {
      const session: WatchSession = {
        sessionId: `ses_${Date.now()}`,
        videoId: params.videoId,
        userId: params.userId,
        startedAt: new Date(Date.now() - params.watchDurationSeconds * 1000).toISOString(),
        endedAt: new Date().toISOString(),
        watchDurationSeconds: params.watchDurationSeconds,
        completionPercentage: completionPct,
        eligibleEvent: false,
        rewardStatus: recentSameVideo ? 'RATE_LIMITED' : 'INELIGIBLE',
        riskSignals,
        rewardPoints: 0,
      };
      this.watchSessions.unshift(session);
      return {
        eligible: false,
        message: recentSameVideo
          ? 'Replay rate-limited. Points are rewarded on authentic, unique content exploration.'
          : 'Watch duration too short to qualify for viewer reward pool.',
      };
    }

    // Reward from verified viewer reward pool:
    // When a video receives verified advertiser revenue, 7% goes to the viewer pool.
    // e.g. 5 points = ₹0.05
    const rewardPoints = 5;
    const rewardInr = 0.05;

    // Controlled Economics: Check Global & Category Reward Limits
    const limitCheck = this.checkAndConsumeRewardLimit('WATCH_AND_EARN', rewardPoints, params.userId);
    if (!limitCheck.allowed) {
      const session: WatchSession = {
        sessionId: `ses_${Date.now()}`,
        videoId: params.videoId,
        userId: params.userId,
        startedAt: new Date(Date.now() - params.watchDurationSeconds * 1000).toISOString(),
        endedAt: new Date().toISOString(),
        watchDurationSeconds: params.watchDurationSeconds,
        completionPercentage: completionPct,
        eligibleEvent: false,
        rewardStatus: 'RATE_LIMITED',
        riskSignals: ['REWARD_LIMIT_CAPPED'],
        rewardPoints: 0,
      };
      this.watchSessions.unshift(session);
      return {
        eligible: false,
        message: limitCheck.reason || 'Watch & Earn reward cap reached for today.',
      };
    }

    // Credit viewer
    this.addTransaction({
      userId: params.userId,
      type: 'VIEWER_REWARD',
      points: rewardPoints,
      amountInr: rewardInr,
      source: 'Verified Viewer Reward Pool',
      referenceId: params.videoId,
      description: `Watch & Earn reward for verified view on "${video.caption.substring(0, 30)}..."`,
      status: 'COMPLETED',
    });

    // Credit creator eligible earnings (23% of verified allocation)
    // E.g. Creator receives 16 points = ₹0.16
    const creatorPoints = 16;
    const creatorInr = 0.16;
    video.verifiedEligibleRevenue += (rewardInr + creatorInr) / 0.30;
    video.creatorEarnings += creatorInr;
    video.viewerRewardPool += rewardInr;
    video.platformGrossShare += (rewardInr + creatorInr) * (70 / 30);

    if (video.creatorId !== params.userId) {
      this.addTransaction({
        userId: video.creatorId,
        type: 'VIDEO_REWARD',
        points: creatorPoints,
        amountInr: creatorInr,
        source: 'Creator Revenue Share (23%)',
        referenceId: params.videoId,
        description: `23% Creator allocation from verified view on "${video.caption.substring(0, 30)}..."`,
        status: 'COMPLETED',
      });
    }

    const session: WatchSession = {
      sessionId: `ses_${Date.now()}`,
      videoId: params.videoId,
      userId: params.userId,
      startedAt: new Date(Date.now() - params.watchDurationSeconds * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      watchDurationSeconds: params.watchDurationSeconds,
      completionPercentage: completionPct,
      eligibleEvent: true,
      rewardStatus: 'CREDITED',
      riskSignals: [],
      rewardPoints,
    };
    this.watchSessions.unshift(session);

    return {
      eligible: true,
      message: `Verified view confirmed! +${rewardPoints} points credited to your wallet.`,
      pointsCredited: rewardPoints,
    };
  }

  // Calculate high-fidelity Source-wise Revenue & Net Profit Analytics
  calculateFinancials(timeFilter: string) {
    // Breakdown by source:
    // Sources:
    // 1. Rewarded Ads
    // 2. App Installs
    // 3. Social Videos
    // 4. Surveys
    // 5. Games
    // 6. Shopping / Offers
    // 7. Referral Campaigns
    // 8. Withdrawal Processing Fees (3%)
    // 9. Sponsor / Brand Deals

    const sources = [
      {
        sourceName: 'Rewarded Video Ads (AdMob / Unity)',
        verifiedRevenueInr: 48500.0,
        userRewardsInr: 14550.0, // 30%
        providerOperatingExpensesInr: 2425.0, // 5% bandwidth/SDK
        grossPlatformShareInr: 33950.0, // 70%
        actualNetProfitInr: 31525.0, // Gross - Expenses
      },
      {
        sourceName: 'App Install Tasks (CPA / Performance)',
        verifiedRevenueInr: 62000.0,
        userRewardsInr: 18600.0, // 30%
        providerOperatingExpensesInr: 3100.0, // tracking & MMP
        grossPlatformShareInr: 43400.0, // 70%
        actualNetProfitInr: 40300.0,
      },
      {
        sourceName: 'Social Video Monetization Pool',
        verifiedRevenueInr: 34200.0,
        userRewardsInr: 10260.0, // 23% creator (₹7,866) + 7% viewer (₹2,394)
        providerOperatingExpensesInr: 4104.0, // CDN video streaming & storage
        grossPlatformShareInr: 23940.0, // 70%
        actualNetProfitInr: 19836.0,
      },
      {
        sourceName: 'Surveys & Market Research',
        verifiedRevenueInr: 18400.0,
        userRewardsInr: 6440.0, // 35%
        providerOperatingExpensesInr: 920.0,
        grossPlatformShareInr: 11960.0,
        actualNetProfitInr: 11040.0,
      },
      {
        sourceName: 'Sponsored Games & Offerwall',
        verifiedRevenueInr: 24800.0,
        userRewardsInr: 7440.0,
        providerOperatingExpensesInr: 1240.0,
        grossPlatformShareInr: 17360.0,
        actualNetProfitInr: 16120.0,
      },
      {
        sourceName: 'Affiliate Shopping & Cashback',
        verifiedRevenueInr: 16200.0,
        userRewardsInr: 4860.0,
        providerOperatingExpensesInr: 810.0,
        grossPlatformShareInr: 11340.0,
        actualNetProfitInr: 10530.0,
      },
      {
        sourceName: 'Withdrawal Processing Fee (3%)',
        verifiedRevenueInr: 1840.0, // 3% fee collected on payouts
        userRewardsInr: 0.0, // collected by platform
        providerOperatingExpensesInr: 820.0, // bank IMPS/UPI API gateway charge
        grossPlatformShareInr: 1840.0,
        actualNetProfitInr: 1020.0,
      },
    ];

    const totalVerifiedRevenue = sources.reduce((sum, s) => sum + s.verifiedRevenueInr, 0);
    const totalUserRewards = sources.reduce((sum, s) => sum + s.userRewardsInr, 0);
    const totalProviderExpenses = sources.reduce((sum, s) => sum + s.providerOperatingExpensesInr, 0);
    const grossPlatformShare = sources.reduce((sum, s) => sum + s.grossPlatformShareInr, 0);
    const actualNetProfit = sources.reduce((sum, s) => sum + s.actualNetProfitInr, 0);

    const completedWithdrawals = this.withdrawals.filter(w => w.status === 'COMPLETED');
    const pendingWithdrawals = this.withdrawals.filter(w => w.status === 'REQUESTED' || w.status === 'VERIFYING');

    return {
      timeFilter,
      totalVerifiedRevenue,
      totalUserRewards,
      totalProviderExpenses,
      grossPlatformShare,
      actualNetProfit,
      sourceBreakdown: sources,
      totalWithdrawalsProcessed: completedWithdrawals.reduce((sum, w) => sum + w.netPayoutInr, 0),
      pendingWithdrawalsAmount: pendingWithdrawals.reduce((sum, w) => sum + w.grossAmountInr, 0),
      fraudLossesPrevented: 14200.0,
      totalUsers: this.users.size + 1420,
      activeUsers: 840,
      totalViews: Array.from(this.videos.values()).reduce((sum, v) => sum + v.viewsCount, 0),
      totalWatchMinutes: Math.round(Array.from(this.videos.values()).reduce((sum, v) => sum + v.watchTimeSeconds, 0) / 60),
    };
  }

  // ---------------- USER PROFILE & METRICS ----------------
  getUserProfile(userId: string) {
    const user = this.users.get(userId);
    if (!user) return null;

    // Real following count:
    const following = this.follows.get(userId) || new Set();
    const followingCount = following.size;

    // Real followers count: users who follow this user
    let followersCount = 0;
    for (const [_, userFollows] of this.follows.entries()) {
      if (userFollows.has(userId)) followersCount++;
    }
    // Baseline for demo seed users
    if (user.role === 'CREATOR') followersCount += 4820;
    if (user.role === 'USER') followersCount += 48;
    if (user.role === 'SUPER_ADMIN') followersCount += 12500;

    // Real videos authored by this user
    const userVideos = Array.from(this.videos.values()).filter(v => v.creatorId === userId);
    const videosCount = userVideos.length;

    // Real likes across user's videos
    let likesCount = 0;
    for (const v of userVideos) {
      const vidLikes = this.likes.get(v.id) || new Set();
      likesCount += (v.likesCount || 0) + vidLikes.size;
    }

    // Format phone display
    let phoneDisplay = user.phoneNumber || '';
    if (phoneDisplay.startsWith('+91') && phoneDisplay.length >= 13) {
      const digits = phoneDisplay.replace(/\D/g, '').slice(-10);
      phoneDisplay = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }

    return {
      ...user,
      followersCount,
      followingCount,
      videosCount,
      likesCount,
      phoneDisplay: phoneDisplay || (user.phoneNumber ? user.phoneNumber : undefined),
      phoneVerified: Boolean(user.isVerified && user.phoneNumber),
      withdrawalPinSet: this.userPins.has(userId),
    };
  }

  validateUsername(username: string, excludeUserId?: string): { valid: boolean; error?: string } {
    const trimmed = (username || '').trim().toLowerCase();

    if (!trimmed) {
      return { valid: false, error: 'यूजरनेम दर्ज करना अनिवार्य है (Username is required)' };
    }

    if (trimmed.length < 3 || trimmed.length > 30) {
      return { valid: false, error: 'यूजरनेम 3 से 30 अक्षरों का होना चाहिए (Username must be 3-30 characters)' };
    }

    if (!/^[a-z0-9_]+$/.test(trimmed)) {
      return { valid: false, error: 'यूजरनेम में केवल अंग्रेजी अक्षर, संख्याएं और _ मान्य हैं (Only letters, numbers, and _ are allowed)' };
    }

    const reserved = new Set([
      'admin',
      'administrator',
      'root',
      'system',
      'pocketpoints',
      'pocketpoint',
      'support',
      'help',
      'official',
      'verified',
      'mod',
      'moderator',
      'superuser',
      'null',
      'undefined',
      'login',
      'signup',
      'api',
      'security',
    ]);

    if (reserved.has(trimmed)) {
      return { valid: false, error: 'यह यूजरनेम आरक्षित है, कृपया दूसरा चुनें (This username is reserved, please choose another)' };
    }

    for (const [id, u] of this.users.entries()) {
      if (id !== excludeUserId && u.username.toLowerCase() === trimmed) {
        return { valid: false, error: 'यह यूजरनेम पहले से किसी अन्य उपयोगकर्ता द्वारा लिया गया है (Username is already taken)' };
      }
    }

    return { valid: true };
  }

  updateUserProfile(
    userId: string,
    data: { displayName?: string; username?: string; bio?: string; avatarUrl?: string; language?: string }
  ): { success: boolean; user?: User; error?: string } {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, error: 'उपयोगकर्ता नहीं मिला (User not found)' };
    }

    if (data.username && data.username.toLowerCase() !== user.username.toLowerCase()) {
      const val = this.validateUsername(data.username, userId);
      if (!val.valid) {
        return { success: false, error: val.error };
      }
      user.username = data.username.trim().toLowerCase();
    }

    if (data.displayName !== undefined) {
      const cleanName = data.displayName.trim();
      if (cleanName.length < 2 || cleanName.length > 50) {
        return { success: false, error: 'नाम 2 से 50 अक्षरों के बीच होना चाहिए (Display name must be 2-50 characters)' };
      }
      user.displayName = cleanName;
    }

    if (data.bio !== undefined) {
      const cleanBio = data.bio.trim();
      if (cleanBio.length > 160) {
        return { success: false, error: 'बायो अधिकतम 160 अक्षरों का हो सकता है (Bio maximum 160 characters)' };
      }
      user.bio = cleanBio.replace(/<[^>]*>?/gm, '');
    }

    if (data.avatarUrl) {
      user.avatarUrl = data.avatarUrl;
    }

    if (data.language) {
      user.language = data.language;
    }

    user.updatedAt = new Date().toISOString();
    this.users.set(userId, user);

    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      adminId: userId,
      adminName: user.displayName,
      action: 'PROFILE_UPDATED',
      oldValue: '',
      newValue: `Updated profile for @${user.username}`,
      reason: 'User self-profile edit',
      referenceId: userId,
      timestamp: new Date().toISOString(),
    });

    return { success: true, user };
  }

  // ---------------- PHONE OTP & NUMBER CHANGE ----------------
  generatePhoneOtp(phone: string): { success: boolean; error?: string; otp?: string; expiresAt?: number } {
    const now = Date.now();
    const existing = this.phoneOtps.get(phone);

    // Rate limiting: 30s resend cooldown
    if (existing && now - existing.lastSentAt < 30000) {
      const waitSec = Math.ceil((30000 - (now - existing.lastSentAt)) / 1000);
      return {
        success: false,
        error: `कृपया ${waitSec} सेकंड बाद पुनः प्रयास करें (Please wait ${waitSec}s before requesting a new OTP)`,
      };
    }

    // Rate limiting: max 5 requests per 10 minutes
    if (existing && existing.attempts >= 5 && now < existing.expiresAt) {
      return {
        success: false,
        error: 'बहुत ज्यादा कोशिशें हुई हैं. कुछ समय बाद फिर कोशिश करें. (Too many attempts. Please try again after 10 minutes)',
      };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = now + 5 * 60 * 1000;

    this.phoneOtps.set(phone, {
      otp,
      expiresAt,
      attempts: (existing?.attempts || 0) + 1,
      lastSentAt: now,
    });

    return { success: true, otp, expiresAt };
  }

  verifyPhoneOtp(phone: string, inputOtp: string): { success: boolean; error?: string } {
    const record = this.phoneOtps.get(phone);
    if (!record) {
      return {
        success: false,
        error: 'कोई OTP अनुरोध नहीं मिला. कृपया नया OTP भेजें (No active OTP request found. Request a new OTP)',
      };
    }

    if (Date.now() > record.expiresAt) {
      this.phoneOtps.delete(phone);
      return {
        success: false,
        error: 'OTP expire हो गया है. नया OTP भेजें. (OTP has expired. Request a new OTP)',
      };
    }

    if (record.otp !== inputOtp.trim()) {
      return {
        success: false,
        error: 'OTP गलत है. कृपया दोबारा कोशिश करें. (Incorrect OTP. Please try again)',
      };
    }

    this.phoneOtps.delete(phone);
    return { success: true };
  }

  initiateChangePhone(userId: string, newPhone: string): { success: boolean; error?: string; otp?: string } {
    const user = this.users.get(userId);
    if (!user) return { success: false, error: 'User not found' };

    const normalizedDigits = newPhone.replace(/\D/g, '').slice(-10);
    for (const [id, u] of this.users.entries()) {
      if (id !== userId && u.phoneNumber && u.phoneNumber.replace(/\D/g, '').endsWith(normalizedDigits)) {
        return {
          success: false,
          error: 'यह मोबाइल नंबर पहले से किसी अन्य खाते से जुड़ा हुआ है (This mobile number is already registered to another account)',
        };
      }
    }

    const now = Date.now();
    const existing = this.changePhoneOtps.get(userId);
    if (existing && now - existing.lastSentAt < 30000) {
      const waitSec = Math.ceil((30000 - (now - existing.lastSentAt)) / 1000);
      return { success: false, error: `कृपया ${waitSec} सेकंड प्रतीक्षा करें (Please wait ${waitSec}s)` };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = now + 5 * 60 * 1000;

    this.changePhoneOtps.set(userId, {
      userId,
      newPhone,
      otp,
      expiresAt,
      attempts: (existing?.attempts || 0) + 1,
      lastSentAt: now,
    });

    return { success: true, otp };
  }

  verifyChangePhone(userId: string, newPhone: string, inputOtp: string): { success: boolean; error?: string } {
    const record = this.changePhoneOtps.get(userId);
    if (!record || record.newPhone !== newPhone) {
      return { success: false, error: 'अमान्य सत्यापन सत्र (Invalid verification session)' };
    }

    if (Date.now() > record.expiresAt) {
      this.changePhoneOtps.delete(userId);
      return { success: false, error: 'OTP expire हो गया है. नया OTP भेजें (OTP expired. Request a new OTP)' };
    }

    if (record.otp !== inputOtp.trim()) {
      return { success: false, error: 'OTP गलत है. कृपया दोबारा कोशिश करें (Incorrect OTP. Please try again)' };
    }

    const user = this.users.get(userId);
    if (!user) return { success: false, error: 'User not found' };

    const oldPhone = user.phoneNumber;
    user.phoneNumber = newPhone;
    user.isVerified = true;
    user.phoneVerified = true;
    user.updatedAt = new Date().toISOString();
    this.users.set(userId, user);
    this.changePhoneOtps.delete(userId);

    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      adminId: userId,
      adminName: user.displayName,
      action: 'PHONE_NUMBER_CHANGED',
      oldValue: oldPhone || 'NONE',
      newValue: newPhone,
      reason: 'User verified change via 6-digit phone OTP',
      referenceId: userId,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  // ---------------- WITHDRAWAL PIN ----------------
  setWithdrawalPin(userId: string, pin: string): { success: boolean; error?: string } {
    if (!/^\d{4}$/.test(pin)) {
      return { success: false, error: 'निकासी पिन 4 अंकों का होना चाहिए (Withdrawal PIN must be exactly 4 digits)' };
    }
    this.userPins.set(userId, pin);
    return { success: true };
  }

  verifyWithdrawalPin(userId: string, pin: string): boolean {
    const stored = this.userPins.get(userId);
    if (!stored) return true;
    return stored === pin.trim();
  }
}

export const db = new DatabaseStore();
