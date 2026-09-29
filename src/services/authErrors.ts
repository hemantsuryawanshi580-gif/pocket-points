// Bilingual user-friendly error translation for authentication & OTP flows
export function getFriendlyAuthErrorMessage(rawError: string | Error | any): { en: string; hi: string } {
  const errStr = (typeof rawError === 'string' ? rawError : rawError?.message || '').toLowerCase();

  if (errStr.includes('invalid') && (errStr.includes('otp') || errStr.includes('token') || errStr.includes('code'))) {
    return {
      hi: 'OTP गलत है. कृपया दोबारा कोशिश करें.',
      en: 'Incorrect OTP. Please check and try again.',
    };
  }

  if (errStr.includes('expired') || errStr.includes('timeout')) {
    return {
      hi: 'OTP expire हो गया है. नया OTP भेजें.',
      en: 'OTP has expired. Please request a new one.',
    };
  }

  if (errStr.includes('too many') || errStr.includes('rate limit') || errStr.includes('throttle') || errStr.includes('limit exceeded')) {
    return {
      hi: 'बहुत ज्यादा कोशिशें हुई हैं. कुछ समय बाद फिर कोशिश करें.',
      en: 'Too many attempts. Please try again after some time.',
    };
  }

  if (
    errStr.includes('sms provider is not configured') ||
    errStr.includes('sms_provider_not_configured') ||
    errStr.includes('sms provider') ||
    errStr.includes('unsupported phone provider') ||
    errStr.includes('provider is disabled') ||
    errStr.includes('missing sms provider') ||
    errStr.includes('credentials are missing') ||
    (errStr.includes('provider') && errStr.includes('configured'))
  ) {
    return {
      hi: 'SMS प्रदाता कॉन्फ़िगर नहीं है. वास्तविक OTP अभी नहीं भेजा जा सकता.',
      en: 'SMS provider is not configured. Real OTP cannot be sent yet.',
    };
  }

  if (errStr.includes('already registered') || errStr.includes('duplicate') || errStr.includes('already exists')) {
    return {
      hi: 'यह मोबाइल नंबर पहले से किसी अन्य खाते से जुड़ा हुआ है.',
      en: 'This mobile number is already linked to another account.',
    };
  }

  if (errStr.includes('phone') || errStr.includes('number') || errStr.includes('format')) {
    return {
      hi: 'अमान्य मोबाइल नंबर. कृपया 10 अंकों का मान्य नंबर दर्ज करें.',
      en: 'Invalid mobile number. Please enter a valid 10-digit number.',
    };
  }

  if (errStr.includes('network') || errStr.includes('failed to fetch')) {
    return {
      hi: 'नेटवर्क समस्या. कृपया अपना इंटरनेट कनेक्शन जांचें.',
      en: 'Network error. Please check your internet connection.',
    };
  }

  return {
    hi: 'प्रमाणीकरण में समस्या आई. कृपया पुनः प्रयास करें.',
    en: 'Authentication error occurred. Please try again.',
  };
}

// Indian mobile number validator and normalizer
export function normalizeIndianPhone(input: string): {
  isValid: boolean;
  normalized: string; // +91XXXXXXXXXX
  formattedDisplay: string; // +91 98765 43210
  maskedDisplay: string; // +91 98••• ••210
  error?: string;
} {
  // Remove non-digit characters except +
  let cleaned = input.trim().replace(/[\s\-\(\)]/g, '');

  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // Must now be strictly 10 digits
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      normalized: '',
      formattedDisplay: '',
      maskedDisplay: '',
      error: 'मोबाइल नंबर में केवल अंक होने चाहिए (Phone must contain only numbers)',
    };
  }

  if (cleaned.length !== 10) {
    return {
      isValid: false,
      normalized: '',
      formattedDisplay: '',
      maskedDisplay: '',
      error: 'कृपया 10 अंकों का भारतीय मोबाइल नंबर दर्ज करें (Enter 10-digit mobile number)',
    };
  }

  // Indian mobile numbers start with 6, 7, 8, or 9
  if (!/^[6-9]/.test(cleaned)) {
    return {
      isValid: false,
      normalized: '',
      formattedDisplay: '',
      maskedDisplay: '',
      error: 'भारतीय मोबाइल नंबर 6, 7, 8 या 9 से शुरू होना चाहिए (Indian numbers start with 6, 7, 8, or 9)',
    };
  }

  const normalized = `+91${cleaned}`;
  const formattedDisplay = `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
  const maskedDisplay = `+91 ${cleaned.substring(0, 2)}•••• ••${cleaned.substring(8)}`;

  return {
    isValid: true,
    normalized,
    formattedDisplay,
    maskedDisplay,
  };
}
