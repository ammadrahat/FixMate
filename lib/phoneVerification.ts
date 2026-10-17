import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_PREFIX = '@fixmate_verified_phone_';
const PENDING_OTP_KEY = '@fixmate_pending_otp';

// ---------------------------------------------------------------------------
// Textbee.dev configuration (free SMS gateway via your own Android phone)
// Sign up free at https://app.textbee.dev/register — 300 SMS/month, no card
// Then add to your .env file:
//   EXPO_PUBLIC_TEXTBEE_API_KEY=your_api_key_here
//   EXPO_PUBLIC_TEXTBEE_DEVICE_ID=your_device_id_here   (optional, uses default device if omitted)
// ---------------------------------------------------------------------------
const TEXTBEE_API_KEY = process.env.EXPO_PUBLIC_TEXTBEE_API_KEY || '';
const TEXTBEE_DEVICE_ID = process.env.EXPO_PUBLIC_TEXTBEE_DEVICE_ID || '';
const TEXTBEE_BASE_URL = 'https://api.textbee.dev/api/v1';

const isTextbeeConfigured = Boolean(TEXTBEE_API_KEY && TEXTBEE_API_KEY.length > 10);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
  rawDigits?: string;
}

export interface OTPRecord {
  phone: string;
  code: string;
  expiresAt: number;
  channel: 'sms' | 'whatsapp';
}

// ---------------------------------------------------------------------------
// 1. Validation & Formatting
// ---------------------------------------------------------------------------
export function validatePakistaniPhone(rawInput: string): PhoneValidationResult {
  if (!rawInput || !rawInput.trim()) {
    return { isValid: false, error: 'Phone number is required.' };
  }

  // Remove spaces, hyphens, and parentheses
  const cleaned = rawInput.replace(/[\s\-\(\)]/g, '').trim();

  // Extract digits
  let digits = cleaned.replace(/\D/g, '');

  // Handle local Pakistani prefix 03XX... or 923XX...
  if (digits.startsWith('923') && digits.length === 12) {
    // Valid international representation
  } else if (digits.startsWith('03') && digits.length === 11) {
    // Valid local representation
    digits = '92' + digits.substring(1);
  } else if (digits.startsWith('3') && digits.length === 10) {
    // Missing leading zero/country code
    digits = '92' + digits;
  } else {
    return {
      isValid: false,
      error: 'Please enter a valid 11-digit mobile number (e.g. 0300 1234567 or +92 300 1234567).',
    };
  }

  // Check valid network operator code starts with 3 (Jazz/Telenor/Zong/Ufone)
  const networkPrefix = digits.substring(2, 5);
  const operatorDigit = parseInt(networkPrefix.charAt(0), 10);
  if (operatorDigit !== 3) {
    return {
      isValid: false,
      error: 'Please enter a valid Pakistani mobile number starting with 03.',
    };
  }

  // Format nicely: +92 3XX XXXXXXX
  const formatted = `+92 ${digits.substring(2, 5)} ${digits.substring(5)}`;

  return {
    isValid: true,
    formatted,
    rawDigits: digits,
  };
}

// ---------------------------------------------------------------------------
// 2. Generate 6-Digit Verification Code
// ---------------------------------------------------------------------------
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ---------------------------------------------------------------------------
// 3. Send OTP via Textbee.dev (real SMS) or store locally when not configured
// ---------------------------------------------------------------------------
export async function sendFreePhoneOTP(
  phoneNumber: string,
  channel: 'sms' | 'whatsapp' = 'sms'
): Promise<{
  success: boolean;
  formattedPhone: string;
  message: string;
  whatsappUrl?: string;
}> {
  const validation = validatePakistaniPhone(phoneNumber);
  if (!validation.isValid || !validation.formatted) {
    throw new Error(validation.error || 'Invalid phone number');
  }

  const phone = validation.formatted;
  // E.164 format for the SMS API (no spaces): +923001234567
  const e164Phone = '+' + (validation.rawDigits || phone.replace(/\s/g, ''));
  const code = generateVerificationCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  const record: OTPRecord = {
    phone,
    code,
    expiresAt,
    channel,
  };

  // Always store locally so verifyPhoneOTP can check it
  try {
    if (typeof window !== 'undefined') {
      await AsyncStorage.setItem(PENDING_OTP_KEY, JSON.stringify(record));
    }
  } catch (err) {
    console.warn('Could not cache pending OTP:', err);
  }

  if (channel === 'whatsapp') {
    // For WhatsApp: open WhatsApp with a pre-filled message the user can send themselves
    const rawNumber = validation.rawDigits || '923000000000';
    const text = encodeURIComponent(
      `FixMate OTP request — please reply with code: ${code}\n(This is my verification request for FixMate app.)`
    );
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${rawNumber}&text=${text}`;

    return {
      success: true,
      formattedPhone: phone,
      message: `Open WhatsApp to complete verification.`,
      whatsappUrl,
    };
  }

  // --- Real SMS via Textbee.dev ---
  if (isTextbeeConfigured) {
    const body: Record<string, any> = {
      recipients: [e164Phone],
      message: `FixMate verification code: ${code}\nValid for 10 minutes. Do not share this code.`,
    };

    if (TEXTBEE_DEVICE_ID) {
      body.deviceId = TEXTBEE_DEVICE_ID;
    }

    const response = await fetch(`${TEXTBEE_BASE_URL}/gateway/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TEXTBEE_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorMsg = `SMS gateway error (${response.status})`;
      try {
        const errorData = await response.json();
        errorMsg = errorData?.message || errorData?.error || errorMsg;
      } catch {
        // ignore JSON parse errors
      }
      throw new Error(errorMsg);
    }

    return {
      success: true,
      formattedPhone: phone,
      message: `A 6-digit code was sent to ${phone} via SMS.`,
    };
  }

  // --- Fallback: Textbee not configured yet ---
  // Code is saved locally — user must configure Textbee to receive real SMS
  console.warn(
    '[FixMate] Textbee not configured. Add EXPO_PUBLIC_TEXTBEE_API_KEY to .env for real SMS. ' +
    'Sign up free at https://app.textbee.dev — 300 SMS/month, no credit card.'
  );

  return {
    success: true,
    formattedPhone: phone,
    message: `[Setup required] SMS gateway not configured. Use code 123456 to test, or set up Textbee.dev in your .env file.`,
  };
}

// ---------------------------------------------------------------------------
// 4. Verify OTP Code
// ---------------------------------------------------------------------------
export async function verifyPhoneOTP(
  phoneNumber: string,
  inputCode: string
): Promise<{ success: boolean; message: string }> {
  const validation = validatePakistaniPhone(phoneNumber);
  if (!validation.isValid || !validation.formatted) {
    return { success: false, message: 'Invalid phone number format.' };
  }

  const trimmedInput = inputCode.trim();
  if (!trimmedInput) {
    return { success: false, message: 'Please enter the 6-digit verification code.' };
  }

  // Developer / Demo master bypass code for testing
  if (trimmedInput === '123456') {
    await markPhoneAsVerified(validation.formatted);
    return {
      success: true,
      message: 'Phone number verified successfully!',
    };
  }

  try {
    const rawRecord = await AsyncStorage.getItem(PENDING_OTP_KEY);
    if (!rawRecord) {
      return {
        success: false,
        message: 'Verification code expired or not found. Please request a new code.',
      };
    }

    const record: OTPRecord = JSON.parse(rawRecord);

    if (Date.now() > record.expiresAt) {
      await AsyncStorage.removeItem(PENDING_OTP_KEY);
      return { success: false, message: 'Verification code has expired. Please request a new code.' };
    }

    if (record.code !== trimmedInput) {
      return { success: false, message: 'Incorrect verification code. Please check and try again.' };
    }

    // Success! Mark verified
    await markPhoneAsVerified(validation.formatted);
    await AsyncStorage.removeItem(PENDING_OTP_KEY);

    return {
      success: true,
      message: 'Phone number verified successfully! 🎉',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Verification failed. Please try again.',
    };
  }
}

// ---------------------------------------------------------------------------
// 5. Check if Phone is Verified Locally
// ---------------------------------------------------------------------------
export async function isPhoneVerifiedLocally(phoneNumber?: string | null): Promise<boolean> {
  if (!phoneNumber) return false;
  const validation = validatePakistaniPhone(phoneNumber);
  if (!validation.isValid || !validation.formatted) return false;

  try {
    const key = `${STORAGE_KEY_PREFIX}${validation.formatted}`;
    const stored = await AsyncStorage.getItem(key);
    return stored === 'true';
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 6. Mark Phone as Verified
// ---------------------------------------------------------------------------
export async function markPhoneAsVerified(phoneNumber: string): Promise<void> {
  const validation = validatePakistaniPhone(phoneNumber);
  const targetPhone = validation.formatted || phoneNumber;

  try {
    const key = `${STORAGE_KEY_PREFIX}${targetPhone}`;
    await AsyncStorage.setItem(key, 'true');
  } catch (err) {
    console.warn('Could not store verified phone:', err);
  }
}
