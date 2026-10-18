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

// ─── Reset flow steps ────────────────────────────────────────────────────────
// 'method'   → choose: Email OTP  |  Security Question (fallback)
// 'otp_sent' → OTP emailed; user enters 6-digit code + new password
// 'sq_ask'   → fetch & display security question; user answers + new password
// 'sq_otp'   → security answer verified; user enters OTP sent to confirm change
// 'success'  → done
type ResetStep = 'method' | 'otp_sent' | 'sq_ask' | 'sq_otp' | 'success';

export default function LoginScreen() {
  const router = useRouter();
  const {
    login,
    loginWithGoogle,
    requestPasswordReset,
    confirmPasswordReset,
    getSecurityQuestion,
    verifySecurityAnswer,
  } = useAuth();

  // ── Login form ──────────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // ── Password reset modal ────────────────────────────────────────────────────
  const [resetVisible, setResetVisible] = useState(false);
  const [resetStep, setResetStep] = useState<ResetStep>('method');
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailError, setResetEmailError] = useState('');

  // OTP step
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mockOtpHint, setMockOtpHint] = useState('');

  // Security question step
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [sqNewPassword, setSqNewPassword] = useState('');
  const [sqConfirmPassword, setSqConfirmPassword] = useState('');

  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // ── Login validation ────────────────────────────────────────────────────────
  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setErrorMessage('');
    if (!email.trim()) { setEmailError('Email is required'); valid = false; }
    else if (!/\S+@\S+\.\S+/.test(email.trim())) { setEmailError('Enter a valid email'); valid = false; }
    if (!password) { setPasswordError('Password is required'); valid = false; }
    else if (password.length < 6) { setPasswordError('Minimum 6 characters'); valid = false; }
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const { error } = await login(email.trim(), password);
      if (error) setErrorMessage(error.message || 'Failed to sign in. Please check your credentials.');
      else router.replace('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMessage('');
    try {
      const res = await loginWithGoogle();
      if (res?.error) {
        setErrorMessage(res.error.message || 'Google sign-in could not be completed.');
      } else if (res?.cancelled) {
        // User closed the Google login dialog
      } else {
        router.replace('/');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during Google sign-in.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Reset modal helpers ─────────────────────────────────────────────────────
  const openReset = () => {
    setResetVisible(true);
    setResetStep('method');
    setResetEmail(email.trim());
    setResetEmailError('');
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setMockOtpHint('');
    setSecurityQuestion('');
    setSecurityAnswer('');
    setSqNewPassword('');
    setSqConfirmPassword('');
    setResetError('');
    setResetSuccess('');
  };

  const closeReset = () => setResetVisible(false);

  const validateResetEmail = () => {
    if (!resetEmail.trim()) { setResetEmailError('Email is required'); return false; }
    if (!/\S+@\S+\.\S+/.test(resetEmail.trim())) { setResetEmailError('Enter a valid email address'); return false; }
    setResetEmailError('');
    return true;
  };

  // Step 1a: Send email OTP
  const handleSendOtp = async () => {
    if (!validateResetEmail()) return;
    setResetLoading(true);
    setResetError('');
    try {
      const res = await requestPasswordReset(resetEmail.trim(), 'email');
      if (res.error) {
        setResetError(res.error.message || 'Could not send code. Please try again.');
      } else {
        setMockOtpHint(res.mockOtp || '');
        setResetStep('otp_sent');
        setResetSuccess(res.message || '');
      }
    } catch (err: any) {
      setResetError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  // Step 1b: Load security question
  const handleLoadSecurityQuestion = async () => {
    if (!validateResetEmail()) return;
    setResetLoading(true);
    setResetError('');
    try {
      const { question, error } = await getSecurityQuestion(resetEmail.trim());
      if (error || !question) {
        setResetError(
          error?.message ||
            'No security question is set for this account. Please use Email OTP instead.'
        );
      } else {
        setSecurityQuestion(question);
        setResetStep('sq_ask');
        setResetError('');
      }
    } catch (err: any) {
      setResetError(err.message || 'Could not retrieve security question.');
    } finally {
      setResetLoading(false);
    }
  };

  // Step 2a: Verify OTP + set new password
  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) { setResetError('Please enter the 6-digit code.'); return; }
    if (!newPassword) { setResetError('Please enter a new password.'); return; }
    if (newPassword.length < 6) { setResetError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setResetError('Passwords do not match.'); return; }

    setResetLoading(true);
    setResetError('');
    try {
      const res = await confirmPasswordReset(resetEmail.trim(), otpCode.trim(), newPassword, 'email');
      if (res.error) {
        setResetError(res.error.message || 'Invalid or expired code.');
      } else {
        setResetSuccess(res.message || 'Password updated successfully!');
        setResetStep('success');
      }
    } catch (err: any) {
      setResetError(err.message || 'Failed to update password.');
    } finally {
      setResetLoading(false);
    }
  };

  // Step 2b: Verify security answer (Instant reset — no email needed!)
  const handleVerifySecurityAnswer = async () => {
    if (!securityAnswer.trim()) { setResetError('Please enter your answer.'); return; }
    if (!sqNewPassword) { setResetError('Please enter a new password.'); return; }
    if (sqNewPassword.length < 6) { setResetError('Password must be at least 6 characters.'); return; }
    if (sqNewPassword !== sqConfirmPassword) { setResetError('Passwords do not match.'); return; }

    setResetLoading(true);
    setResetError('');
    try {
      const res = await verifySecurityAnswer(resetEmail.trim(), securityAnswer.trim(), sqNewPassword);
      if (res.error) {
        setResetError(res.error.message || 'Incorrect answer. Please check and try again.');
      } else {
        setResetSuccess(res.message || 'Password updated successfully! You can now sign in with your new password.');
        setResetStep('success');
      }
    } catch (err: any) {
      setResetError(err.message || 'Failed to verify answer.');
    } finally {
      setResetLoading(false);
    }
  };

  const fillDemo = (type: 'customer' | 'provider' | 'root') => {
    const demos = {
      customer: { e: 'customer@fixmate.com', p: 'password123' },
      provider: { e: 'provider@fixmate.com', p: 'password123' },
      root:     { e: 'root@fixmate.com',     p: 'rootadmin123' },
    };
    setEmail(demos[type].e);
    setPassword(demos[type].p);
    setEmailError('');
    setPasswordError('');
    setErrorMessage('');
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  const renderModalContent = () => {
    // ─ Success ───────────────────────────────────────────────────────────────
    if (resetStep === 'success') {
      return (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-done-circle" size={56} color={Colors.success} />
          <Text style={styles.successText}>{resetSuccess}</Text>
          <Button
            title="Back to Sign In"
            variant="primary"
            size="md"
            onPress={() => {
              setEmail(resetEmail);
              setPassword('');
              closeReset();
            }}
            style={{ marginTop: 20, width: '100%' }}
          />
        </View>
      );
    }

    // ─ Step: sq_ask (security question answer) ────────────────────────────
    if (resetStep === 'sq_ask') {
      return (
        <View style={{ width: '100%' }}>
          <View style={styles.questionBox}>
            <Ionicons name="help-circle" size={18} color="#7C3AED" />
            <Text style={styles.questionText}>{securityQuestion}</Text>
          </View>

          <Input
            label="Your Answer"
            placeholder="e.g. Fluffy (not case-sensitive)"
            value={securityAnswer}
            onChangeText={(t) => { setSecurityAnswer(t); if (resetError) setResetError(''); }}
            icon="chatbox-ellipses-outline"
            autoCapitalize="none"
          />
          <Input
            label="New Password"
            placeholder="Minimum 6 characters"
            value={sqNewPassword}
            onChangeText={(t) => { setSqNewPassword(t); if (resetError) setResetError(''); }}
            isPassword
            icon="lock-closed-outline"
          />
          <Input
            label="Confirm New Password"
            placeholder="Repeat new password"
            value={sqConfirmPassword}
            onChangeText={(t) => { setSqConfirmPassword(t); if (resetError) setResetError(''); }}
            isPassword
            icon="lock-closed-outline"
          />

          <Button
            title="Reset Password Instantly"
            variant="primary"
            size="md"
            loading={resetLoading}
            onPress={handleVerifySecurityAnswer}
            style={{ marginTop: 8, width: '100%' }}
          />
          <TouchableOpacity style={styles.linkRow} onPress={() => setResetStep('method')}>
            <Ionicons name="arrow-back-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.linkTextMuted}>Go back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // ─ Step: otp_sent (enter OTP or paste link + new password) ────────────
    if (resetStep === 'otp_sent') {
      return (
        <View style={{ width: '100%' }}>
          <View style={styles.infoBanner}>
            <Ionicons name="mail-outline" size={16} color={Colors.primary} />
            <Text style={styles.infoBannerText}>
              {resetSuccess ||
                `Verification dispatched to ${resetEmail}. Enter the 6-digit code or paste the link from the email.`}
            </Text>
          </View>

          {Boolean(mockOtpHint) && (
            <TouchableOpacity
              style={styles.demoOtpBanner}
              onPress={() => setOtpCode(mockOtpHint)}
              activeOpacity={0.8}
            >
              <Ionicons name="flash" size={13} color="#92400E" />
              <Text style={styles.demoOtpText}>
                Demo code: <Text style={{ fontWeight: '800' }}>{mockOtpHint}</Text>
                {'  '}(tap to fill)
              </Text>
            </TouchableOpacity>
          )}

          <Input
            label="6-Digit Code or Email Link / Token"
            placeholder="e.g. 483920 or paste link from email"
            value={otpCode}
            onChangeText={(t) => { setOtpCode(t); if (resetError) setResetError(''); }}
            icon="shield-checkmark-outline"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: -8, marginBottom: 12 }}>
            💡 Tip: If your email has a verification link, you can paste the entire link here!
          </Text>

          <Input
            label="New Password"
            placeholder="Minimum 6 characters"
            value={newPassword}
            onChangeText={(t) => { setNewPassword(t); if (resetError) setResetError(''); }}
            isPassword
            icon="lock-closed-outline"
          />
          <Input
            label="Confirm New Password"
            placeholder="Repeat new password"
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); if (resetError) setResetError(''); }}
            isPassword
            icon="lock-closed-outline"
          />

          <Button
            title="Reset Password"
            variant="primary"
            size="md"
            loading={resetLoading}
            onPress={handleVerifyOtp}
            style={{ marginTop: 8, width: '100%' }}
          />

          <View style={styles.subActionsRow}>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={handleSendOtp}
              disabled={resetLoading}
            >
              <Ionicons name="refresh-outline" size={14} color={Colors.primary} />
              <Text style={styles.linkText}>Resend Code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => setResetStep('method')}
            >
              <Ionicons name="arrow-back-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.linkTextMuted}>Go back</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // ─ Step: method (choose reset method) ────────────────────────────────
    return (
      <View style={{ width: '100%' }}>
        <Input
          label="Registered Email Address"
          placeholder="name@example.com"
          value={resetEmail}
          onChangeText={(t) => {
            setResetEmail(t);
            if (resetEmailError) setResetEmailError('');
            if (resetError) setResetError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          icon="mail-outline"
          error={resetEmailError}
        />

        {/* Primary: Email OTP / Link */}
        <View style={styles.methodCard}>
          <View style={styles.methodCardHeader}>
            <View style={[styles.methodIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="mail" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodTitle}>Send Code / Link to Email</Text>
              <Text style={styles.methodDesc}>
                We'll email a verification code or link. Enter the 6-digit code or paste the email link into FixMate to reset.
              </Text>
            </View>
          </View>
          <Button
            title="Send Email Code"
            variant="primary"
            size="sm"
            loading={resetLoading}
            onPress={handleSendOtp}
            style={{ marginTop: 10 }}
          />
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or, reset without email</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Fallback: Security Question (e.g. First Pet) */}
        <View style={[styles.methodCard, styles.methodCardAlt]}>
          <View style={styles.methodCardHeader}>
            <View style={[styles.methodIcon, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="help-circle" size={20} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.methodTitle, { color: '#5B21B6' }]}>Security Question (Instant)</Text>
              <Text style={styles.methodDesc}>
                Answer your security question (e.g. "What was the name of your first pet?") to reset your password immediately without waiting for an email.
              </Text>
            </View>
          </View>
          <Button
            title="Reset via Security Question"
            variant="outline"
            size="sm"
            loading={resetLoading}
            onPress={handleLoadSecurityQuestion}
            style={{ marginTop: 10, borderColor: '#7C3AED' }}
          />
        </View>

        <TouchableOpacity style={[styles.linkRow, { justifyContent: 'center', marginTop: 12 }]} onPress={closeReset}>
          <Text style={styles.linkTextMuted}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to manage bookings or provide services</Text>
          </View>

          {Boolean(errorMessage) && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={Colors.danger} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="example@gmail.com"
              value={email}
              onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(''); }}
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
              onChangeText={(t) => { setPassword(t); if (passwordError) setPasswordError(''); }}
              isPassword
              icon="lock-closed-outline"
              error={passwordError}
            />

            <View style={styles.forgotRow}>
              <TouchableOpacity onPress={openReset} activeOpacity={0.7}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
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

            <View style={styles.orDivider}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.orLine} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
              activeOpacity={0.8}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color={Colors.text} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color="#EA4335" />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Demo helper */}
          <View style={styles.demoHelper}>
            <Text style={styles.demoLabel}>Fill Demo Credentials:</Text>
            <View style={styles.demoBtnRow}>
              {(['customer', 'provider', 'root'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.demoPill, type === 'root' && styles.rootPill]}
                  onPress={() => fillDemo(type)}
                >
                  <Text style={[styles.demoPillText, type === 'root' && styles.rootPillText]}>
                    {type === 'root' ? '⚡ Root Mode' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Password Reset Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={resetVisible}
        transparent
        animationType="fade"
        onRequestClose={closeReset}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadows.card]}>
            <ScrollView
              contentContainerStyle={{ alignItems: 'center' }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Modal Header */}
              <View style={styles.modalIconBox}>
                <Ionicons
                  name={resetStep === 'success' ? 'checkmark-circle' : 'key-outline'}
                  size={26}
                  color={resetStep === 'success' ? Colors.success : Colors.primary}
                />
              </View>
              <Text style={styles.modalTitle}>
                {resetStep === 'success'
                  ? 'Password Reset!'
                  : resetStep === 'otp_sent'
                  ? 'Enter Verification Code'
                  : resetStep === 'sq_ask'
                  ? 'Security Question'
                  : resetStep === 'sq_otp'
                  ? 'Confirm via Email Code'
                  : 'Reset Your Password'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {resetStep === 'method'
                  ? 'Choose how you want to verify your identity.'
                  : resetStep === 'otp_sent'
                  ? `Enter the code sent to ${resetEmail} and set a new password.`
                  : resetStep === 'sq_ask'
                  ? `Answer your security question to reset the password for ${resetEmail}.`
                  : resetStep === 'sq_otp'
                  ? 'Enter the code emailed to you to confirm the password change.'
                  : ''}
              </Text>

              {/* Error Banner */}
              {Boolean(resetError) && (
                <View style={styles.errorBannerSmall}>
                  <Ionicons name="alert-circle" size={15} color={Colors.danger} />
                  <Text style={styles.errorBannerSmallText}>{resetError}</Text>
                </View>
              )}

              {renderModalContent()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, flexGrow: 1 },

  backButton: {
    marginTop: Spacing.sm,
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  header: { marginVertical: Spacing.lg },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 6 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    padding: Spacing.md, borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorBannerText: { color: Colors.danger, fontSize: 13, marginLeft: 8, flex: 1, fontWeight: '500' },

  form: { marginTop: Spacing.xs },
  forgotRow: { alignItems: 'flex-end', marginTop: 4, marginBottom: Spacing.sm },
  forgotText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  submitButton: { marginTop: Spacing.md },

  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 8,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    gap: 10,
    ...Shadows.card,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },

  demoHelper: {
    marginTop: Spacing.xl, padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
  },
  demoLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  demoBtnRow: { flexDirection: 'row', gap: 8 },
  demoPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: Colors.borderDark,
    borderRadius: BorderRadius.full,
    paddingVertical: 6, paddingHorizontal: 12,
  },
  demoPillText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  rootPill: { backgroundColor: '#FAF5FF', borderColor: '#C084FC' },
  rootPillText: { color: '#7E22CE', fontWeight: '700' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', paddingTop: Spacing.xl },
  footerText: { fontSize: 14, color: Colors.textSecondary },
  signupLink: { fontSize: 14, fontWeight: '700', color: Colors.primary },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%', maxWidth: 430,
    maxHeight: '90%',
    alignItems: 'center',
  },
  modalIconBox: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  modalSubtitle: {
    fontSize: 13, color: Colors.textSecondary,
    textAlign: 'center', marginTop: 4, marginBottom: Spacing.md,
    lineHeight: 18,
  },

  errorBannerSmall: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    padding: Spacing.sm, borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm, width: '100%', gap: 6,
  },
  errorBannerSmallText: { color: Colors.danger, fontSize: 12, fontWeight: '500', flex: 1 },

  // Method cards
  methodCard: {
    width: '100%',
    backgroundColor: '#F8FAFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: '#BFDBFE',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  methodCardAlt: {
    backgroundColor: '#FAF5FF',
    borderColor: '#DDD6FE',
  },
  methodCardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  methodIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  methodTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  methodDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.sm, gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },

  // Info banner (after OTP sent)
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: '#BFDBFE',
    padding: Spacing.sm, gap: 8, marginBottom: Spacing.md, width: '100%',
  },
  infoBannerText: { fontSize: 12, color: Colors.primary, flex: 1, lineHeight: 17 },

  // Demo OTP hint
  demoOtpBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: 8,
    gap: 6, marginBottom: Spacing.sm, width: '100%',
  },
  demoOtpText: { fontSize: 12, color: '#92400E' },

  // Security question
  questionBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FAF5FF',
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: '#DDD6FE',
    padding: Spacing.sm, gap: 8, marginBottom: Spacing.md, width: '100%',
  },
  questionText: { fontSize: 13, fontWeight: '600', color: '#5B21B6', flex: 1, lineHeight: 18 },

  // Success box
  successBox: { alignItems: 'center', paddingVertical: Spacing.md, width: '100%' },
  successText: {
    fontSize: 14, color: Colors.text, textAlign: 'center',
    marginTop: 12, lineHeight: 20, fontWeight: '500',
  },

  // Link rows
  subActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  linkText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  linkTextMuted: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
});
