import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import {
  validatePakistaniPhone,
  sendFreePhoneOTP,
  verifyPhoneOTP,
} from '@/lib/phoneVerification';

interface PhoneVerificationModalProps {
  visible: boolean;
  initialPhone?: string;
  onClose: () => void;
  onSuccess: (verifiedPhone: string) => void;
  title?: string;
  description?: string;
}

export function PhoneVerificationModal({
  visible,
  initialPhone = '',
  onClose,
  onSuccess,
  title = 'Verify Phone Number',
  description = 'Free phone verification via instant SMS OTP or WhatsApp to secure your bookings.',
}: PhoneVerificationModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Simulated in-app SMS toast
  const [simulatedSMS, setSimulatedSMS] = useState<{
    code: string;
    message: string;
  } | null>(null);

  // Resend countdown
  const [countdown, setCountdown] = useState(60);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      if (initialPhone) {
        setPhoneNumber(initialPhone);
      }
      setOtpCode('');
      setErrorMsg('');
      setSuccessMsg('');
      setSimulatedSMS(null);
      setStep('input');
    }
  }, [visible, initialPhone]);

  useEffect(() => {
    if (step === 'otp' && countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, countdown]);

  const handleSendCode = async (channel: 'sms' | 'whatsapp' | 'flash_call' = 'sms') => {
    setErrorMsg('');
    const validation = validatePakistaniPhone(phoneNumber);
    if (!validation.isValid) {
      setErrorMsg(validation.error || 'Please enter a valid Pakistani mobile number.');
      return;
    }

    try {
      setLoading(true);
      const res = await sendFreePhoneOTP(phoneNumber, channel);

      setPhoneNumber(res.formattedPhone);
      setSimulatedSMS({ code: res.code, message: res.message });
      setStep('otp');
      setCountdown(60);

      if (channel === 'whatsapp' && res.whatsappUrl) {
        Linking.openURL(res.whatsappUrl).catch(() => {
          // Fallback if WhatsApp is not installed
        });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setErrorMsg('');
    if (!otpCode.trim()) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      const res = await verifyPhoneOTP(phoneNumber, otpCode);

      if (res.success) {
        setStep('success');
        setSuccessMsg(res.message);
        setTimeout(() => {
          onSuccess(phoneNumber);
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFillCode = () => {
    if (simulatedSMS?.code) {
      setOtpCode(simulatedSMS.code);
      setErrorMsg('');
    }
  };

  const handleInstantFlashCallVerify = async () => {
    setLoading(true);
    setErrorMsg('');
    setTimeout(async () => {
      setLoading(false);
      setStep('success');
      setSuccessMsg('Phone verified via Free Flash Call simulation! 🎉');
      setTimeout(() => {
        onSuccess(phoneNumber);
        onClose();
      }, 1200);
    }, 1200);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={[styles.modalCard, Shadows.modal]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleBox}>
              <View style={styles.shieldIcon}>
                <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.modalTitle}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>{description}</Text>

          {/* Error Message */}
          {Boolean(errorMsg) && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={Colors.danger} />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          )}

          {/* STEP 1: Input Phone */}
          {step === 'input' && (
            <View style={styles.bodyContent}>
              <Text style={styles.fieldLabel}>Mobile Number (Pakistan)</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.flagBox}>
                  <Text style={styles.flagText}>🇵🇰</Text>
                  <Text style={styles.countryCode}>+92</Text>
                </View>
                <TextInput
                  style={styles.phoneTextInput}
                  placeholder="300 1234567"
                  placeholderTextColor={Colors.textMuted}
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    setErrorMsg('');
                  }}
                  keyboardType="phone-pad"
                  autoFocus
                />
              </View>

              <Text style={styles.freeNoticeText}>
                ✨ 100% Free Verification — No charges or telecom carrier fees.
              </Text>

              {/* Action Buttons */}
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={() => handleSendCode('sms')}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>Send Free SMS Code</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Alternative Free Channels */}
              <View style={styles.channelDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR FREE ALTERNATIVES</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.altButtonsRow}>
                <TouchableOpacity
                  style={styles.whatsappBtn}
                  onPress={() => handleSendCode('whatsapp')}
                  disabled={loading}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#15803D" />
                  <Text style={styles.whatsappBtnText}>Verify via WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.flashCallBtn}
                  onPress={handleInstantFlashCallVerify}
                  disabled={loading}
                >
                  <Ionicons name="call-outline" size={18} color={Colors.primary} />
                  <Text style={styles.flashCallBtnText}>Instant Flash Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 2: Enter OTP Code */}
          {step === 'otp' && (
            <View style={styles.bodyContent}>
              {/* Simulated In-App SMS Toast */}
              {simulatedSMS && (
                <View style={styles.simulatedSmsToast}>
                  <View style={styles.smsHeaderRow}>
                    <View style={styles.smsHeaderLeft}>
                      <Ionicons name="mail" size={14} color="#0284C7" />
                      <Text style={styles.smsSender}>FixMate SMS (Free OTP)</Text>
                    </View>
                    <Text style={styles.smsNow}>Now</Text>
                  </View>
                  <Text style={styles.smsBody}>
                    Your 6-digit verification code is{' '}
                    <Text style={styles.smsHighlightCode}>
                      {simulatedSMS.code}
                    </Text>
                    .
                  </Text>
                  <TouchableOpacity
                    style={styles.autoFillBtn}
                    onPress={handleAutoFillCode}
                  >
                    <Ionicons name="flash" size={13} color="#FFFFFF" />
                    <Text style={styles.autoFillBtnText}>
                      Auto-fill Code ({simulatedSMS.code})
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.fieldLabel}>Enter 6-Digit Code</Text>
              <TextInput
                style={styles.otpInput}
                placeholder="• • • • • •"
                placeholderTextColor={Colors.textMuted}
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              <View style={styles.resendRow}>
                <TouchableOpacity
                  onPress={() => setStep('input')}
                  style={styles.editPhoneLink}
                >
                  <Ionicons name="pencil" size={12} color={Colors.textSecondary} />
                  <Text style={styles.editPhoneText}>Change Number</Text>
                </TouchableOpacity>

                {countdown > 0 ? (
                  <Text style={styles.resendTimerText}>
                    Resend in <Text style={{ fontWeight: '700' }}>{countdown}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleSendCode('sms')}
                    disabled={loading}
                  >
                    <Text style={styles.resendActiveText}>Resend Free OTP</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (!otpCode.trim() || loading) && styles.btnDisabled,
                ]}
                onPress={handleVerifyCode}
                disabled={!otpCode.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>Verify & Confirm</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: Success State */}
          {step === 'success' && (
            <View style={styles.successContainer}>
              <View style={styles.successIconBox}>
                <Ionicons name="checkmark" size={36} color="#FFFFFF" />
              </View>
              <Text style={styles.successTitle}>Phone Verified!</Text>
              <Text style={styles.successSubtitle}>
                {successMsg || 'Your phone number has been successfully verified.'}
              </Text>
              <View style={styles.verifiedBadgeRow}>
                <Ionicons name="shield-checkmark" size={16} color="#15803D" />
                <Text style={styles.verifiedPhoneText}>{phoneNumber}</Text>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shieldIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  closeBtn: {
    padding: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
  },
  modalDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: Spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    padding: 10,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: 6,
  },
  errorBannerText: {
    fontSize: 12,
    color: Colors.danger,
    flex: 1,
    fontWeight: '600',
  },
  bodyContent: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    height: 48,
    marginBottom: 8,
  },
  flagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#F1F5F9',
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    gap: 6,
  },
  flagText: {
    fontSize: 18,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  phoneTextInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
  freeNoticeText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    gap: 8,
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  channelDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  altButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  whatsappBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  flashCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  flashCallBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },

  // OTP view styles
  simulatedSmsToast: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  smsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  smsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smsSender: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  smsNow: {
    fontSize: 10,
    color: '#0284C7',
  },
  smsBody: {
    fontSize: 12,
    color: '#0C4A6E',
    marginTop: 2,
  },
  smsHighlightCode: {
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.primary,
  },
  autoFillBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 5,
    borderRadius: BorderRadius.xs,
    marginTop: 6,
  },
  autoFillBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  otpInput: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    height: 52,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 12,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  editPhoneLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editPhoneText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  resendTimerText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  resendActiveText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },

  // Success view
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  successIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  successSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  verifiedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  verifiedPhoneText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
});
