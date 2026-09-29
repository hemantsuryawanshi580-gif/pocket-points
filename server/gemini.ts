import { GoogleGenAI } from '@google/genai';
import { db } from './db.ts';

// Shared server-side Gemini client with required User-Agent
const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Gemini client initialization error:', err);
  }
}

export async function askPocketPointsAssistant(params: {
  userId: string;
  prompt: string;
}): Promise<string> {
  const { userId, prompt } = params;

  // Retrieve live authenticated user context and current server configuration
  const user = db.users.get(userId) || Array.from(db.users.values())[0];
  const wallet = db.wallets.get(userId) || {
    userId,
    availablePoints: 0,
    pendingPoints: 0,
    reservedWithdrawalPoints: 0,
    lifetimeEarnedPoints: 0,
    lifetimeWithdrawnPoints: 0,
  };
  const settings = db.settings;
  const userWithdrawals = db.withdrawals.filter(w => w.userId === userId);
  const recentTransactions = db.transactions.filter(t => t.userId === userId).slice(0, 5);

  const availableInr = (wallet.availablePoints / settings.pointsPerInr).toFixed(2);
  const pendingInr = (wallet.pendingPoints / settings.pointsPerInr).toFixed(2);
  const reservedInr = (wallet.reservedWithdrawalPoints / settings.pointsPerInr).toFixed(2);
  const minWithdrawalInr = (settings.minimumWithdrawalPoints / settings.pointsPerInr).toFixed(2);

  // System instruction with real platform ground truth
  const systemInstruction = `You are "Pocket Points AI Assistant", the official in-app helper for the Pocket Points social video and rewards platform.

GROUND TRUTH RULES & CURRENT SERVER CONFIGURATION:
1. Points Conversion: Exactly ${settings.pointsPerInr} points = ₹1.00 INR.
2. Minimum Withdrawal: ${settings.minimumWithdrawalPoints} points = ₹${minWithdrawalInr} INR.
3. Withdrawal Fee: Exactly ${settings.withdrawalFeePercentage}% deducted on UPI withdrawal (e.g. on ₹100 payout, fee is ₹3.00, net payout is ₹97.00).
4. Video Revenue Model (for verified eligible advertiser revenue):
   - Creator Revenue Share: ${settings.videoCreatorPercentage}%
   - Viewer Reward Pool: ${settings.videoViewerPoolPercentage}%
   - Pocket Points Gross Platform Share: ${settings.videoPlatformGrossPercentage}%
   * These percentages are NOT guaranteed earnings per view; rewards are only distributed when advertiser revenue is legitimately verified.
5. Task / Ad Allocations: ${settings.adUserRewardPercentage}% to user, ${settings.adPlatformGrossPercentage}% platform gross share.
6. Referral Bonus: ${settings.referralPoints} points (₹${(settings.referralPoints / settings.pointsPerInr).toFixed(2)}) credited after the invited user completes their first legitimate task.

CURRENT AUTHENTICATED USER STATE:
- User Name: ${user.displayName} (@${user.username})
- Account Role: ${user.role}
- Available Balance: ${wallet.availablePoints} points (₹${availableInr} INR)
- Pending Balance: ${wallet.pendingPoints} points (₹${pendingInr} INR)
- Reserved for Pending Withdrawals: ${wallet.reservedWithdrawalPoints} points (₹${reservedInr} INR)
- Lifetime Earned: ${wallet.lifetimeEarnedPoints} points
- Lifetime Withdrawn: ${wallet.lifetimeWithdrawnPoints} points
- Recent Withdrawals: ${userWithdrawals.length ? JSON.stringify(userWithdrawals.map(w => ({ id: w.id, upi: w.upiId, points: w.requestedPoints, netInr: w.netPayoutInr, status: w.status }))) : 'None'}
- Recent Ledger Transactions: ${recentTransactions.map(t => `${t.type}: ${t.points > 0 ? '+' : ''}${t.points} pts (${t.description}) [${t.status}]`).join('; ')}

CRITICAL BEHAVIOR BOUNDARIES:
- Answer with concise, friendly, step-by-step guidance in clear English (or Hinglish if the user asks in Hindi).
- When asked about balances or withdrawals, report ONLY the verified numbers from the authenticated user state above.
- NEVER invent imaginary points, rewards, or fake payout approvals.
- NEVER promise guaranteed earnings or claim that watching a video has a fixed payout rate.
- Explain that you are an AI assistant and CANNOT modify the financial ledger, execute payments, or bypass fraud review.
- Do NOT expose internal API keys, database secrets, or admin credentials.`;

  // Fallback if API key is not configured or in test environments
  if (!aiClient) {
    return generateSmartAssistantFallback(prompt, {
      availablePoints: wallet.availablePoints,
      availableInr,
      pendingPoints: wallet.pendingPoints,
      pendingInr,
      reservedInr,
      minWithdrawalPoints: settings.minimumWithdrawalPoints,
      minWithdrawalInr,
      feePercentage: settings.withdrawalFeePercentage,
      pointsPerInr: settings.pointsPerInr,
    });
  }

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3, // Low temperature for high factual adherence
        maxOutputTokens: 600,
      },
    });

    return response.text?.trim() || 'I could not generate an answer right now. Please try again.';
  } catch (err: any) {
    console.error('Error invoking Gemini for Pocket Points AI Assistant:', err);
    return generateSmartAssistantFallback(prompt, {
      availablePoints: wallet.availablePoints,
      availableInr,
      pendingPoints: wallet.pendingPoints,
      pendingInr,
      reservedInr,
      minWithdrawalPoints: settings.minimumWithdrawalPoints,
      minWithdrawalInr,
      feePercentage: settings.withdrawalFeePercentage,
      pointsPerInr: settings.pointsPerInr,
    });
  }
}

// Fallback logic when Gemini is offline or API key is pending
function generateSmartAssistantFallback(prompt: string, ctx: any): string {
  const p = prompt.toLowerCase();

  if (p.includes('balance') || p.includes('points') || p.includes('how much') || p.includes('money')) {
    return `Your verified balance is **${ctx.availablePoints} points** (equivalent to **₹${ctx.availableInr}**). You also have **${ctx.pendingPoints} pending points** (₹${ctx.pendingInr}) waiting for advertiser event confirmation. (Conversion: ${ctx.pointsPerInr} points = ₹1.00).`;
  }

  if (p.includes('withdraw') || p.includes('upi') || p.includes('payout') || p.includes('minimum')) {
    return `To withdraw to your UPI ID:\n1. Minimum withdrawal is **${ctx.minWithdrawalPoints} points** (₹${ctx.minWithdrawalInr}).\n2. Open the **Wallet** tab and tap **Withdraw UPI**.\n3. Enter your UPI ID (e.g. name@paytm) and the points amount.\n4. A **${ctx.feePercentage}%** banking verification fee applies.\n5. Points are reserved atomically and processed upon verification.`;
  }

  if (p.includes('watch') || p.includes('video') || p.includes('pool')) {
    return `On Pocket Points, verified video revenue is shared legitimately:\n• **Creator Share:** 23%\n• **Viewer Reward Pool:** 7%\n• **Platform Share:** 70%\n\nTo earn from the viewer pool, watch community videos for at least 15 seconds without rapid skipping. Earnings are verified from advertiser events, not artificial bot views.`;
  }

  if (p.includes('refer') || p.includes('friend') || p.includes('invite')) {
    return `You earn **500 points (₹5.00)** for every friend who signs up using your unique referral code and completes their first legitimate earning task. Share your link from the **Earn** or **Profile** tab!`;
  }

  if (p.includes('task') || p.includes('ad') || p.includes('install') || p.includes('survey')) {
    return `You can earn points through:\n• **Rewarded Ads:** Watch full 15-30s sponsor videos (up to 10/day).\n• **App Installs:** Try partner apps and reach the required milestone.\n• **Surveys:** Share feedback on consumer topics.\n• **Daily Missions:** Check in and explore 5 videos.\n\nAll rewards are credited only after verified event confirmation.`;
  }

  return `Welcome to **Pocket Points**! Here is how our controlled reward system works:\n• **Conversion Rate:** 100 points = ₹1.00 INR.\n• **Minimum Withdrawal:** 1,000 points (₹10.00) directly to any Indian UPI ID with a 3% fee.\n• **Earn:** Watch community videos, complete verified tasks, view rewarded ads, and invite friends.\n\nFeel free to ask me about your wallet balance, withdrawal status, or upload rules!`;
}
