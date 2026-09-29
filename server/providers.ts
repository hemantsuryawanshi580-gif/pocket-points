/**
 * Pocket Points - External Provider Interfaces & Test/Demo Implementations
 *
 * This module defines production-ready interfaces for:
 * 1. UPI Payout Provider (e.g. RazorpayX, Cashfree Payouts, PayU)
 * 2. Rewarded Ad Network (e.g. Google AdMob, AppLovin, Unity Ads)
 * 3. Offerwall & App Install Provider (e.g. ironSource, Tapjoy)
 * 4. Survey Provider (e.g. Pollfish, CPX Research)
 *
 * Clearly marked with DEMO / TEST MODE behaviors until real API keys are provisioned.
 */

export interface PayoutResult {
  success: boolean;
  referenceId: string;
  providerStatus: 'SUCCESS' | 'PENDING' | 'FAILED';
  rawResponse?: any;
  errorMessage?: string;
}

export interface UpiPayoutProvider {
  validateVpa(upiId: string): Promise<{ valid: boolean; name?: string; message?: string }>;
  initiatePayout(params: {
    withdrawalId: string;
    upiId: string;
    amountInr: number;
    userNote: string;
  }): Promise<PayoutResult>;
}

export class MockUpiPayoutProvider implements UpiPayoutProvider {
  async validateVpa(upiId: string): Promise<{ valid: boolean; name?: string; message?: string }> {
    // Regex for typical Indian VPA (Virtual Payment Address): username@bank or mobile@bank
    const vpaRegex = /^[\w.-]+@[\w.-]+$/i;
    if (!vpaRegex.test(upiId.trim())) {
      return { valid: false, message: 'Invalid UPI ID format. Expected format: username@bank (e.g. 9876543210@paytm or user@okhdfcbank)' };
    }
    return { valid: true, name: 'Verified UPI Beneficiary (Test Mode)' };
  }

  async initiatePayout(params: {
    withdrawalId: string;
    upiId: string;
    amountInr: number;
    userNote: string;
  }): Promise<PayoutResult> {
    const vpaCheck = await this.validateVpa(params.upiId);
    if (!vpaCheck.valid) {
      return {
        success: false,
        referenceId: `ERR_${Date.now()}`,
        providerStatus: 'FAILED',
        errorMessage: vpaCheck.message,
      };
    }

    // In TEST MODE, simulate successful provider payout dispatch
    return {
      success: true,
      referenceId: `UPI_TEST_TXN_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      providerStatus: 'SUCCESS',
      rawResponse: {
        mode: 'TEST_MODE',
        gateway: 'Mock UPI Payout Gateway (Replace with RazorpayX or Cashfree in production)',
        timestamp: new Date().toISOString(),
        payoutAmount: params.amountInr,
      },
    };
  }
}

export interface AdVerificationResult {
  verified: boolean;
  adImpressionId: string;
  verifiedRevenueInr: number;
  userRewardPoints: number;
  errorMessage?: string;
}

export class MockAdNetworkProvider {
  async verifyRewardedAd(params: {
    userId: string;
    adUnitId: string;
    clientCompletionToken: string;
    durationWatchedSeconds: number;
  }): Promise<AdVerificationResult> {
    if (params.durationWatchedSeconds < 15) {
      return {
        verified: false,
        adImpressionId: '',
        verifiedRevenueInr: 0,
        userRewardPoints: 0,
        errorMessage: 'Ad was closed early. Full 15-30 second view required.',
      };
    }

    // Simulated verified advertiser CPM: e.g. ₹0.50 per verified video ad view
    const simulatedRevenueInr = 0.50;
    // User allocation 30% = ₹0.15 = 15 points (at 100 points = ₹1)
    const userRewardPoints = 15;

    return {
      verified: true,
      adImpressionId: `ADMOB_TEST_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      verifiedRevenueInr: simulatedRevenueInr,
      userRewardPoints,
    };
  }
}

export const upiProvider = new MockUpiPayoutProvider();
export const adProvider = new MockAdNetworkProvider();
