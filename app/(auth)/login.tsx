import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login, requestPasswordReset, confirmPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password reset modal states & options
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetMethod, setResetMethod] = useState<'email' | 'phone'>('email');
  const [resetStep, setResetStep] = useState<'request' | 'verify' | 'success'>('request');
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [mockOtpPreview, setMockOtpPreview] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validate = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setErrorMessage('');

    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const { error } = await login(email.trim(), password);
      if (error) {
        setErrorMessage(error.message || 'Failed to sign in. Please verify your credentials.');
      } else {
        router.replace('/');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const openResetModal = () => {
    setResetModalVisible(true);
    setResetStep('request');
    setResetMethod('email');
    setResetIdentifier(email.trim());
    setResetToken('');
    setNewPassword('');
    setConfirmNewPassword('');
    setMockOtpPreview('');
    setResetError('');
    setResetMessage('');
  };

  const handleSendResetCode = async () => {
    const cleanId = resetIdentifier.trim();
    if (!cleanId) {
      setResetError(
        `Please enter your ${resetMethod === 'phone' ? 'phone number' : 'email address'}.`
      );
      return;
    }
    if (resetMethod === 'email' && !/\S+@\S+\.\S+/.test(cleanId)) {
      setResetError('Please enter a valid email address.');
      return;
    }
    if (resetMethod === 'phone' && cleanId.length < 10) {
      setResetError('Please enter a valid Pakistani mobile number (e.g. +92 300 1234567).');
      return;
    }

    setResetLoading(true);
    setResetError('');
    setResetMessage('');

    try {
      const res = await requestPasswordReset(cleanId, resetMethod);
      if (res.error) {
        setResetError(res.error.message || 'Failed to dispatch reset code.');
      } else {
        setResetStep('verify');
        setMockOtpPreview(res.mockOtp || '');
        setResetMessage(
          res.message || 'Verification code dispatched successfully. Please enter it below.'
        );
      }
    } catch (err: any) {
      setResetError(err.message || 'An error occurred. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    const cleanId = resetIdentifier.trim();
    const cleanToken = resetToken.trim();

    if (!cleanToken) {
      setResetError('Please enter the 6-digit verification code.');
      return;
    }
    if (!newPassword) {
      setResetError('Please enter your new password.');
      return;
    }
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetLoading(true);
    setResetError('');

    try {
      const res = await confirmPasswordReset(cleanId, cleanToken, newPassword, resetMethod);
      if (res.error) {
        setResetError(res.error.message || 'Invalid or expired verification code.');
      } else {
        setResetStep('success');
        setResetMessage(res.message || 'Password successfully updated!');
      }
    } catch (err: any) {
      setResetError(err.message || 'Failed to update password.');
    } finally {
      setResetLoading(false);
    }
  };

  const fillQuickDemo = (type: 'customer' | 'provider' | 'root') => {
    if (type === 'customer') {
      setEmail('customer@fixmate.com');
      setPassword('password123');
    } else if (type === 'provider') {
      setEmail('provider@fixmate.com');
      setPassword('password123');
    } else {
      setEmail('root@fixmate.com');
      setPassword('rootadmin123');
    }
    setEmailError('');
    setPasswordError('');
    setErrorMessage('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to manage bookings or provide services
            </Text>
          </View>

          {/* Error Banner */}
          {Boolean(errorMessage) && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={Colors.danger} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Form Fields */}
          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="example@gmail.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              icon="mail-outline"
              error={emailError}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              isPassword
              icon="lock-closed-outline"
              error={passwordError}
            />

            <View style={styles.forgotPasswordRow}>
              <TouchableOpacity
                onPress={openResetModal}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Sign In"
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleLogin}
              style={styles.submitButton}
            />
          </View>

          {/* Demo helper */}
          <View style={styles.demoHelper}>
            <Text style={styles.demoHelperLabel}>Fill Demo Credentials:</Text>
            <View style={styles.demoBtnRow}>
              <TouchableOpacity
                style={styles.demoPill}
                onPress={() => fillQuickDemo('customer')}
              >
                <Text style={styles.demoPillText}>Customer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoPill}
                onPress={() => fillQuickDemo('provider')}
              >
                <Text style={styles.demoPillText}>Provider</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.demoPill, styles.rootDemoPill]}
                onPress={() => fillQuickDemo('root')}
              >
                <Text style={styles.rootDemoPillText}>⚡ Root Mode</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Password Reset Modal with In-App Reset Options */}
      <Modal
        visible={resetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadows.card]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <Ionicons
                  name={resetStep === 'success' ? 'checkmark-circle' : 'key-outline'}
                  size={26}
                  color={resetStep === 'success' ? Colors.success : Colors.primary}
                />
              </View>
              <Text style={styles.modalTitle}>
                {resetStep === 'success'
                  ? 'Password Reset Complete'
                  : resetStep === 'verify'
                  ? 'Create New Password'
                  : 'Password Reset Options'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {resetStep === 'success'
                  ? 'Your password has been updated securely. Sign in with your new password below.'
                  : resetStep === 'verify'
                  ? `Enter the 6-digit verification code sent to ${resetIdentifier} and your new password.`
                  : 'Choose how you want to verify your identity to reset your password directly in FixMate.'}
              </Text>
            </View>

            {/* Error Banner */}
            {Boolean(resetError) && (
              <View style={styles.modalErrorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.modalErrorText}>{resetError}</Text>
              </View>
            )}

            {/* Success State */}
            {resetStep === 'success' ? (
              <View style={styles.modalSuccessBox}>
                <Ionicons name="checkmark-done-circle" size={48} color={Colors.success} />
                <Text style={styles.modalSuccessText}>{resetMessage}</Text>
                <Button
                  title="Proceed to Login"
                  variant="primary"
                  size="md"
                  onPress={() => {
                    if (resetMethod === 'email') {
                      setEmail(resetIdentifier);
                    }
                    setPassword(newPassword);
                    setResetModalVisible(false);
                  }}
                  style={{ marginTop: 16, width: '100%' }}
                />
              </View>
            ) : resetStep === 'verify' ? (
              /* Step 2: Enter OTP Code & New Password */
              <View style={{ width: '100%' }}>
                {Boolean(mockOtpPreview) && (
                  <TouchableOpacity
                    style={styles.demoOtpBanner}
                    onPress={() => setResetToken(mockOtpPreview)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="flash" size={14} color="#B45309" />
                    <Text style={styles.demoOtpText}>
                      Demo Code: <Text style={{ fontWeight: '800' }}>{mockOtpPreview}</Text> (Tap to auto-fill)
                    </Text>
                  </TouchableOpacity>
                )}

                <Input
                  label="6-Digit Verification Code"
                  placeholder="e.g. 123456"
                  value={resetToken}
                  onChangeText={(t) => {
                    setResetToken(t);
                    if (resetError) setResetError('');
                  }}
                  keyboardType="numeric"
                  maxLength={6}
                  icon="shield-checkmark-outline"
                />

                <Input
                  label="New Password"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChangeText={(t) => {
                    setNewPassword(t);
                    if (resetError) setResetError('');
                  }}
                  isPassword
                  icon="lock-closed-outline"
                />

                <Input
                  label="Confirm New Password"
                  placeholder="Repeat new password"
                  value={confirmNewPassword}
                  onChangeText={(t) => {
                    setConfirmNewPassword(t);
                    if (resetError) setResetError('');
                  }}
                  isPassword
                  icon="lock-closed-outline"
                />

                <Button
                  title="Reset Password Now"
                  variant="primary"
                  size="md"
                  loading={resetLoading}
                  onPress={handleConfirmReset}
                  style={{ marginTop: 8, width: '100%' }}
                />

                <View style={styles.resetSubActionsRow}>
                  <TouchableOpacity
                    onPress={handleSendResetCode}
                    disabled={resetLoading}
                    style={styles.subActionLink}
                  >
                    <Ionicons name="refresh-outline" size={14} color={Colors.primary} />
                    <Text style={styles.subActionText}>Resend Code</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setResetStep('request')}
                    style={styles.subActionLink}
                  >
                    <Ionicons name="arrow-back-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.subActionTextMuted}>Change Method</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Step 1: Choose Reset Method & Request Code */
              <View style={{ width: '100%' }}>
                {/* Method selector pills */}
                <View style={styles.resetMethodSelector}>
                  <TouchableOpacity
                    style={[
                      styles.resetMethodTab,
                      resetMethod === 'email' && styles.resetMethodTabActive,
                    ]}
                    onPress={() => {
                      setResetMethod('email');
                      setResetIdentifier(email.trim());
                      setResetError('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={16}
                      color={resetMethod === 'email' ? Colors.primary : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.resetMethodTabText,
                        resetMethod === 'email' && styles.resetMethodTabTextActive,
                      ]}
                    >
                      Email Code
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.resetMethodTab,
                      resetMethod === 'phone' && styles.resetMethodTabActive,
                    ]}
                    onPress={() => {
                      setResetMethod('phone');
                      setResetIdentifier('+92 300 ');
                      setResetError('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={16}
                      color={resetMethod === 'phone' ? Colors.primary : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.resetMethodTabText,
                        resetMethod === 'phone' && styles.resetMethodTabTextActive,
                      ]}
                    >
                      Phone SMS (OTP)
                    </Text>
                  </TouchableOpacity>
                </View>

                {resetMethod === 'email' ? (
                  <Input
                    label="Registered Email Address"
                    placeholder="name@example.com"
                    value={resetIdentifier}
                    onChangeText={(t) => {
                      setResetIdentifier(t);
                      if (resetError) setResetError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    icon="mail-outline"
                  />
                ) : (
                  <Input
                    label="Registered Pakistani Mobile Number"
                    placeholder="+92 300 1234567"
                    value={resetIdentifier}
                    onChangeText={(t) => {
                      setResetIdentifier(t);
                      if (resetError) setResetError('');
                    }}
                    keyboardType="phone-pad"
                    icon="call-outline"
                  />
                )}

                <View style={styles.resetDirectInfoBox}>
                  <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
                  <Text style={styles.resetDirectInfoText}>
                    Direct in-app reset: receive a 6-digit code to update your password right here without needing any localhost or external links.
                  </Text>
                </View>

                <View style={styles.modalBtnRow}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    size="md"
                    onPress={() => setResetModalVisible(false)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Send Reset Code"
                    variant="primary"
                    size="md"
                    loading={resetLoading}
                    onPress={handleSendResetCode}
                    style={{ flex: 1.5 }}
                  />
                </View>

                <TouchableOpacity
                  style={styles.alreadyHaveCodeBtn}
                  onPress={() => {
                    setResetStep('verify');
                    setResetError('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.alreadyHaveCodeText}>
                    Already have a 6-digit verification code? <Text style={{ fontWeight: '700', color: Colors.primary }}>Enter Code</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    flexGrow: 1,
  },
  backButton: {
    marginTop: Spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginVertical: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    color: Colors.danger,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  form: {
    marginTop: Spacing.xs,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  demoHelper: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  demoHelperLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  demoBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: BorderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  demoPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  rootDemoPill: {
    backgroundColor: '#FAF5FF',
    borderColor: '#C084FC',
  },
  rootDemoPillText: {
    color: '#7E22CE',
    fontWeight: '700',
  },
  forgotPasswordRow: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: Spacing.xl,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  modalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    width: '100%',
    gap: 6,
  },
  modalErrorText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  modalSuccessBox: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    width: '100%',
  },
  modalSuccessText: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    fontWeight: '500',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.md,
    width: '100%',
  },
  resetMethodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.md,
    gap: 6,
  },
  resetMethodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  resetMethodTabActive: {
    backgroundColor: '#FFFFFF',
    ...Shadows.card,
  },
  resetMethodTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  resetMethodTabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  resetDirectInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  resetDirectInfoText: {
    fontSize: 12,
    color: Colors.primary,
    flex: 1,
    lineHeight: 16,
  },
  alreadyHaveCodeBtn: {
    marginTop: Spacing.md,
    alignItems: 'center',
    paddingVertical: 4,
  },
  alreadyHaveCodeText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  demoOtpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    gap: 6,
    marginBottom: Spacing.sm,
  },
  demoOtpText: {
    fontSize: 12,
    color: '#92400E',
  },
  resetSubActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: 4,
  },
  subActionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  subActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  subActionTextMuted: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
