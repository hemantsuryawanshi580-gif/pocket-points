// Server-side SMS Dispatcher
// Note: All credentials and API keys are strictly read from server environment secrets.
// No secret credentials are ever exposed to the client.

interface SendSmsResult {
  sent: boolean;
  provider: 'TWILIO' | 'MSG91' | 'NONE';
  error?: string;
  messageId?: string;
}

export async function sendRealSmsOtp(phone: string, otp: string): Promise<SendSmsResult> {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  const twilioMsgServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  const msg91AuthKey = process.env.MSG91_AUTH_KEY;
  const msg91TemplateId = process.env.MSG91_TEMPLATE_ID;

  // 1. Try Twilio if server environment credentials exist
  if (twilioSid && twilioToken && (twilioFrom || twilioMsgServiceSid)) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const bodyParams = new URLSearchParams();
      bodyParams.append('To', phone);
      if (twilioMsgServiceSid) {
        bodyParams.append('MessagingServiceSid', twilioMsgServiceSid);
      } else if (twilioFrom) {
        bodyParams.append('From', twilioFrom);
      }
      bodyParams.append(
        'Body',
        `Your Pocket Points verification OTP is: ${otp}. Valid for 5 minutes. Do not share with anyone.`
      );

      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Twilio SMS dispatch failed:', data);
        return {
          sent: false,
          provider: 'TWILIO',
          error: data.message || 'Twilio SMS dispatch error',
        };
      }

      return {
        sent: true,
        provider: 'TWILIO',
        messageId: data.sid,
      };
    } catch (err: any) {
      console.error('Twilio network error:', err);
      return {
        sent: false,
        provider: 'TWILIO',
        error: err.message || 'Twilio connection failed',
      };
    }
  }

  // 2. Try MSG91 if configured
  if (msg91AuthKey && msg91TemplateId) {
    try {
      const url = `https://control.msg91.com/api/v5/otp?template_id=${msg91TemplateId}&mobile=${phone.replace('+', '')}&authkey=${msg91AuthKey}&otp=${otp}`;
      const response = await fetch(url, { method: 'POST' });
      const data = await response.json();

      if (data.type !== 'success') {
        return {
          sent: false,
          provider: 'MSG91',
          error: data.message || 'MSG91 OTP dispatch failed',
        };
      }

      return {
        sent: true,
        provider: 'MSG91',
        messageId: data.message,
      };
    } catch (err: any) {
      return {
        sent: false,
        provider: 'MSG91',
        error: err.message || 'MSG91 connection failed',
      };
    }
  }

  // 3. No SMS provider configured
  return {
    sent: false,
    provider: 'NONE',
    error: 'SMS provider is not configured. Real OTP cannot be sent yet.',
  };
}

export function isRealSmsProviderConfigured(): { configured: boolean; providerName?: string } {
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID)
  ) {
    return { configured: true, providerName: 'Twilio Programmable SMS' };
  }

  if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    return { configured: true, providerName: 'MSG91 OTP Service' };
  }

  return { configured: false };
}
