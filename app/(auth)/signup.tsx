import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { PREDEFINED_TRADES } from '@/constants/Categories';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { PhoneVerificationModal } from '@/components/PhoneVerificationModal';
import { validatePakistaniPhone } from '@/lib/phoneVerification';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';


export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();

  const [role, setRole] = useState<UserRole>('customer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Provider specific fields
  const [trade, setTrade] = useState('Plumbing');
  const [experienceYears, setExperienceYears] = useState('3');
  const [bio, setBio] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    setErrorMessage('');

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    const phoneValidation = validatePakistaniPhone(phone);
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneValidation.isValid) {
      newErrors.phone = phoneValidation.error || 'Please enter a valid Pakistani mobile number';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (role === 'provider') {
      if (!trade) {
        newErrors.trade = 'Please select your trade';
      }
      const expNum = parseInt(experienceYears, 10);
      if (isNaN(expNum) || expNum < 0) {
        newErrors.experienceYears = 'Please enter valid experience years';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const result = await signup({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
        trade: role === 'provider' ? trade : undefined,
        experienceYears: role === 'provider' ? parseInt(experienceYears, 10) || 1 : undefined,
        bio: role === 'provider' ? bio.trim() : undefined,
        isPhoneVerified,
      });


      if (result.error) {
        setErrorMessage(result.error.message || 'Failed to create account.');
      } else if (result.needsEmailVerification) {
        Alert.alert(
          'Verification Email Sent',
          'We have sent a confirmation link to your email. Please verify your address and log in.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      } else {
        router.replace('/');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during signup.');
    } finally {
      setLoading(false);
    }
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
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Join FixMate</Text>
            <Text style={styles.subtitle}>
              Create your account to get started
            </Text>
          </View>

          {/* Role Selection Tabs */}
          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>I want to register as:</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'customer' && styles.roleButtonActive,
                ]}
                onPress={() => setRole('customer')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="person"
                  size={20}
                  color={role === 'customer' ? '#FFFFFF' : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    role === 'customer' && styles.roleButtonTextActive,
                  ]}
                >
                  Customer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'provider' && styles.roleButtonActive,
                ]}
                onPress={() => setRole('provider')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="construct"
                  size={20}
                  color={role === 'provider' ? '#FFFFFF' : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    role === 'provider' && styles.roleButtonTextActive,
                  ]}
                >
                  Service Provider
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.roleExplanation}>
              {role === 'customer'
                ? 'Book verified technicians for your home or office.'
                : 'Offer your trade skills, get job requests, and grow your earnings.'}
            </Text>
          </View>

          {/* Error Banner */}
          {Boolean(errorMessage) && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={Colors.danger} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Core Fields */}
          <Input
            label="Full Name"
            placeholder="Muhammad Ali"
            value={fullName}
            onChangeText={setFullName}
            icon="person-outline"
            error={errors.fullName}
          />

          <Input
            label="Email Address"
            placeholder="ali@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            icon="mail-outline"
            error={errors.email}
          />

          {/* Phone Field with Verification Badge */}
          <View style={styles.phoneGroup}>
            <View style={styles.phoneLabelRow}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              {isPhoneVerified ? (
                <View style={styles.verifiedTag}>
                  <Ionicons name="shield-checkmark" size={12} color="#15803D" />
                  <Text style={styles.verifiedTagText}>Verified</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.verifyLink}
                  onPress={() => setPhoneModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="shield-outline" size={12} color={Colors.primary} />
                  <Text style={styles.verifyLinkText}>Verify Free (OTP)</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.phoneInputRow}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    setIsPhoneVerified(false);
                  }}
                  keyboardType="phone-pad"
                  icon="call-outline"
                  error={errors.phone}
                />
              </View>
              {!isPhoneVerified && (
                <TouchableOpacity
                  style={styles.verifyInlineBtn}
                  onPress={() => setPhoneModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.verifyInlineBtnText}>Verify</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>


          <Input
            label="Password"
            placeholder="Create password (6+ characters)"
            value={password}
            onChangeText={setPassword}
            isPassword
            icon="lock-closed-outline"
            error={errors.password}
          />

          <Input
            label="Confirm Password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            icon="lock-closed-outline"
            error={errors.confirmPassword}
          />

          {/* Provider Specific Trade Section */}
          {role === 'provider' && (
            <View style={styles.providerSection}>
              <View style={styles.divider} />
              <Text style={styles.providerSectionTitle}>Provider Details</Text>

              <Text style={styles.fieldLabel}>Select Your Trade / Skill</Text>
              <View style={styles.tradeChipsContainer}>
                {PREDEFINED_TRADES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.tradeChip,
                      trade === t && styles.tradeChipActive,
                    ]}
                    onPress={() => setTrade(t)}
                  >
                    <Text
                      style={[
                        styles.tradeChipText,
                        trade === t && styles.tradeChipTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {Boolean(errors.trade) && (
                <Text style={styles.fieldError}>{errors.trade}</Text>
              )}

              <Input
                label="Experience (Years)"
                placeholder="e.g. 5"
                value={experienceYears}
                onChangeText={setExperienceYears}
                keyboardType="numeric"
                icon="time-outline"
                error={errors.experienceYears}
              />

              <Input
                label="Brief Bio / Specialization"
                placeholder="e.g. Specialist in sanitary pipes, geyser fitting and water pump repair"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                icon="document-text-outline"
                style={{ height: 70 }}
              />
            </View>
          )}

          {/* Submit */}
          <Button
            title={role === 'provider' ? 'Register as Service Provider' : 'Create Customer Account'}
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleSignup}
            style={styles.submitButton}
          />

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PhoneVerificationModal
        visible={phoneModalVisible}
        initialPhone={phone}
        onClose={() => setPhoneModalVisible(false)}
        onSuccess={(verifiedPhone) => {
          setPhone(verifiedPhone);
          setIsPhoneVerified(true);
        }}
        title="Verify Account Phone"
        description="Verify your Pakistani mobile number with free instant OTP to enable priority booking and security alerts."
      />
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
    marginVertical: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  roleContainer: {
    marginBottom: Spacing.lg,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.sm,
    gap: 8,
  },
  roleButtonActive: {
    backgroundColor: Colors.primary,
    ...Shadows.card,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  roleExplanation: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
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
  providerSection: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  providerSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  tradeChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  tradeChip: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  tradeChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  tradeChipText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  tradeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  fieldError: {
    color: Colors.danger,
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  submitButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing.md,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  phoneGroup: {
    marginBottom: Spacing.sm,
  },
  phoneLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  verifyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  verifyLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  verifyInlineBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyInlineBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

