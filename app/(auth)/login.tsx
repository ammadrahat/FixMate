import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/Theme';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  const fillQuickDemo = (type: 'customer' | 'provider') => {
    if (type === 'customer') {
      setEmail('customer@fixmate.com');
      setPassword('password123');
    } else {
      setEmail('provider@fixmate.com');
      setPassword('password123');
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
                <Text style={styles.demoPillText}>Customer Account</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoPill}
                onPress={() => fillQuickDemo('provider')}
              >
                <Text style={styles.demoPillText}>Provider Account</Text>
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
});
