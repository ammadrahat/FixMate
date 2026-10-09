import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { login, isMockMode } = useAuth();

  const handleQuickDemo = async (role: 'customer' | 'provider') => {
    if (role === 'customer') {
      await login('customer@fixmate.com', 'password123');
      router.replace('/(customer)');
    } else {
      await login('provider@fixmate.com', 'password123');
      router.replace('/(provider)');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Hero */}
        <View style={styles.heroSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="construct" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>FixMate</Text>
          <Text style={styles.tagline}>Home Services at Your Doorstep</Text>
          <Text style={styles.subtext}>
            Connect with skilled plumbers, electricians, masons, carpenters, and painters across Pakistan.
          </Text>
        </View>

        {/* Trade Badges */}
        <View style={styles.tradeGrid}>
          {[
            { icon: 'water', label: 'Plumbing' },
            { icon: 'flash', label: 'Electrical' },
            { icon: 'construct', label: 'Masonry' },
            { icon: 'hammer', label: 'Carpentry' },
            { icon: 'color-palette', label: 'Painting' },
            { icon: 'cube', label: 'Appliances' },
          ].map((item, index) => (
            <View key={index} style={styles.tradePill}>
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={16}
                color={Colors.primary}
              />
              <Text style={styles.tradePillText}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresCard}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Verified Professionals</Text>
              <Text style={styles.featureSubtitle}>
                Vetted tradespeople with background and skill checks.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="pricetag" size={20} color={Colors.accent} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Upfront Transparent Rates</Text>
              <Text style={styles.featureSubtitle}>
                Clear estimates without hidden charges.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="time" size={20} color={Colors.warning} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Fast Response</Text>
              <Text style={styles.featureSubtitle}>
                Instant confirmation and real-time job updates.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <Button
            title="Create an Account"
            variant="primary"
            size="lg"
            onPress={() => router.push('/(auth)/signup')}
            style={styles.mainButton}
          />
          <Button
            title="Log In"
            variant="outline"
            size="lg"
            onPress={() => router.push('/(auth)/login')}
            style={styles.outlineButton}
          />

          {/* Quick Demo Instant Access */}
          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Quick 1-Click Preview:</Text>
            <View style={styles.demoButtonsRow}>
              <TouchableOpacity
                style={styles.demoChip}
                onPress={() => handleQuickDemo('customer')}
                activeOpacity={0.7}
              >
                <Ionicons name="person-outline" size={14} color={Colors.primary} />
                <Text style={styles.demoChipText}>Demo Customer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoChip}
                onPress={() => handleQuickDemo('provider')}
                activeOpacity={0.7}
              >
                <Ionicons name="briefcase-outline" size={14} color={Colors.accent} />
                <Text style={styles.demoChipText}>Demo Provider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.raised,
  },
  appName: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 320,
  },
  tradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginVertical: Spacing.md,
  },
  tradePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tradePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 6,
  },
  featuresCard: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    ...Shadows.card,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  featureSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  actionSection: {
    width: '100%',
    marginTop: Spacing.md,
  },
  mainButton: {
    marginBottom: Spacing.md,
  },
  outlineButton: {
    marginBottom: Spacing.lg,
  },
  demoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  demoChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 5,
  },
});
