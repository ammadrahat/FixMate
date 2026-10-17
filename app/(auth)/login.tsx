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
  const { login, resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password reset modal states
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
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

  const handleSendResetPassword = async () => {
    if (!resetEmail.trim()) {
      setResetError('Please enter your email address');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(resetEmail.trim())) {
      setResetError('Please enter a valid email address');
      return;
    }
    setResetLoading(true);
    setResetError('');
    setResetMessage('');
    try {
      const { error, message } = await resetPassword(resetEmail.trim());
      if (error) {
        setResetError(error.message || 'Failed to send reset instructions.');
      } else {
        setResetMessage(message || 'Password reset link sent to your email.');
      }
    } catch (err: any) {
      setResetError(err.message || 'An error occurred. Please try again.');
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
                onPress={() => {
                  setResetEmail(email.trim());
                  setResetError('');
                  setResetMessage('');
                  setResetModalVisible(true);
                }}
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

      {/* Password Reset Modal */}
      <Modal
        visible={resetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadows.card]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <Ionicons name="key-outline" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <Text style={styles.modalSubtitle}>
                Enter your account email to receive password reset instructions.
              </Text>
            </View>

            {Boolean(resetError) && (
              <View style={styles.modalErrorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.modalErrorText}>{resetError}</Text>
              </View>
            )}

            {Boolean(resetMessage) ? (
              <View style={styles.modalSuccessBox}>
                <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
                <Text style={styles.modalSuccessText}>{resetMessage}</Text>
                <Button
                  title="Return to Login"
                  variant="primary"
                  size="md"
                  onPress={() => setResetModalVisible(false)}
                  style={{ marginTop: 14, width: '100%' }}
                />
              </View>
            ) : (
              <View style={{ width: '100%' }}>
                <Input
                  label="Registered Email"
                  placeholder="name@example.com"
                  value={resetEmail}
                  onChangeText={(t) => {
                    setResetEmail(t);
                    if (resetError) setResetError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon="mail-outline"
                />

                <View style={styles.modalBtnRow}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    size="md"
                    onPress={() => setResetModalVisible(false)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Send Link"
                    variant="primary"
                    size="md"
                    loading={resetLoading}
                    onPress={handleSendResetPassword}
                    style={{ flex: 1 }}
                  />
                </View>
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
});
