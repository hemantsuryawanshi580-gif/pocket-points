import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { getFriendlyAuthErrorMessage, normalizeIndianPhone } from './authErrors.ts';

// Supabase environment variables from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Detect if real Supabase project credentials are configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key')
);

// Initialize Supabase Client
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const supabaseAuthService = {
  isConfigured(): boolean {
    return isSupabaseConfigured;
  },

  /**
   * Request Phone OTP Login
   * Uses real Supabase signInWithOtp if configured, otherwise proxies to backend handler
   */
  async sendPhoneOtp(normalizedPhone: string): Promise<{ success: boolean; message: string; testMode?: boolean }> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
      });

      if (error) {
        const friendly = getFriendlyAuthErrorMessage(error);
        throw new Error(`${friendly.hi} (${friendly.en})`);
      }
      return { success: true, message: 'OTP sent successfully to your mobile number' };
    }

    // Call server endpoint
    const res = await fetch('/api/auth/send-phone-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalizedPhone }),
    });
    const data = await res.json();
    if (!res.ok) {
      const friendly = getFriendlyAuthErrorMessage(data.error || 'Failed to send OTP');
      throw new Error(`${friendly.hi} (${friendly.en})`);
    }
    return data;
  },

  /**
   * Verify Phone OTP
   * Uses real Supabase verifyOtp({ phone, token, type: 'sms' })
   */
  async verifyPhoneOtp(normalizedPhone: string, token: string): Promise<{
    success: boolean;
    session?: Session | null;
    user?: any;
    wallet?: any;
  }> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: token.trim(),
        type: 'sms',
      });

      if (error) {
        const friendly = getFriendlyAuthErrorMessage(error);
        throw new Error(`${friendly.hi} (${friendly.en})`);
      }

      // Sync Supabase authenticated session with our backend user profile
      const res = await fetch('/api/auth/supabase-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUserId: data.user?.id,
          phone: normalizedPhone,
          email: data.user?.email,
        }),
      });
      const synced = await res.json();
      return { success: true, session: data.session, user: synced.user, wallet: synced.wallet };
    }

    // Backend endpoint
    const res = await fetch('/api/auth/verify-phone-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalizedPhone, otp: token.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      const friendly = getFriendlyAuthErrorMessage(data.error || 'Invalid OTP');
      throw new Error(`${friendly.hi} (${friendly.en})`);
    }
    return data;
  },

  /**
   * Initiate Change Mobile Number OTP for currently logged-in user
   * supabase.auth.updateUser({ phone: normalizedPhone })
   */
  async sendChangePhoneOtp(normalizedPhone: string): Promise<{ success: boolean; message: string }> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({
        phone: normalizedPhone,
      });

      if (error) {
        const friendly = getFriendlyAuthErrorMessage(error);
        throw new Error(`${friendly.hi} (${friendly.en})`);
      }
      return { success: true, message: 'OTP sent to verify your new mobile number' };
    }

    const res = await fetch('/api/auth/send-change-phone-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPhone: normalizedPhone }),
    });
    const data = await res.json();
    if (!res.ok) {
      const friendly = getFriendlyAuthErrorMessage(data.error || 'Failed to send OTP for phone update');
      throw new Error(`${friendly.hi} (${friendly.en})`);
    }
    return data;
  },

  /**
   * Verify Change Mobile Number OTP
   */
  async verifyChangePhoneOtp(normalizedPhone: string, token: string): Promise<{ success: boolean; user: any }> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: token.trim(),
        type: 'phone_change',
      });

      if (error) {
        const friendly = getFriendlyAuthErrorMessage(error);
        throw new Error(`${friendly.hi} (${friendly.en})`);
      }

      // Update backend profile
      const res = await fetch('/api/auth/confirm-phone-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPhone: normalizedPhone, supabaseUserId: data.user?.id }),
      });
      const synced = await res.json();
      return { success: true, user: synced.user };
    }

    const res = await fetch('/api/auth/verify-change-phone-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPhone: normalizedPhone, otp: token.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      const friendly = getFriendlyAuthErrorMessage(data.error || 'OTP verification failed');
      throw new Error(`${friendly.hi} (${friendly.en})`);
    }
    return data;
  },

  /**
   * Sign In with Google
   */
  async signInWithGoogle(): Promise<{ error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Google login is currently unavailable.' };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      return { error: error.message || 'Google login is currently unavailable.' };
    }
    return {};
  },

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    await fetch('/api/auth/logout', { method: 'POST' });
  },

  /**
   * Get active session
   */
  async getSession(): Promise<Session | null> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
    return null;
  },
};
