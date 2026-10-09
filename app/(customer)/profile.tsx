import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { profile, logout, isMockMode } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of FixMate?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="My Profile" subtitle="Account settings and preferences" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={[styles.profileCard, Shadows.card]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>
              {profile?.full_name
                ? profile.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                : 'FM'}
            </Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{profile?.full_name || 'Customer'}</Text>
            <Text style={styles.userEmail}>{profile?.email || 'customer@fixmate.com'}</Text>
            <View style={styles.roleTag}>
              <Ionicons name="shield-checkmark" size={12} color="#15803D" />
              <Text style={styles.roleTagText}>Verified Customer</Text>
            </View>
          </View>
        </View>

        {/* Contact details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Contact Information</Text>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={Colors.textSecondary} />
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoVal}>{profile?.phone || '+92 300 1234567'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={Colors.textSecondary} />
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Primary Address</Text>
              <Text style={styles.infoVal}>House # 42, Block B, DHA Phase 5, Lahore</Text>
            </View>
          </View>
        </View>

        {/* Quick Menu */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Preferences & Support</Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Alert.alert('Saved Addresses', 'Add and manage your residential or commercial locations.')}
          >
            <Ionicons name="map-outline" size={20} color={Colors.primary} />
            <Text style={styles.menuRowText}>Saved Addresses</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Alert.alert('Customer Helpline', 'FixMate 24/7 Helpline: 042-111-FIXMATE\nEmail: support@fixmate.pk')}
          >
            <Ionicons name="headset-outline" size={20} color={Colors.accent} />
            <Text style={styles.menuRowText}>Customer Support & FAQ</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Alert.alert('Privacy Policy', 'FixMate guarantees user privacy and data protection.')}
          >
            <Ionicons name="shield-outline" size={20} color={Colors.success} />
            <Text style={styles.menuRowText}>Terms & Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* System & Mode Info */}
        <View style={styles.systemBox}>
          <Text style={styles.systemText}>FixMate Version 1.0.0 (Milestone 1)</Text>
          <Text style={styles.systemSubtext}>
            Environment: {isMockMode ? 'Local Preview Mode' : 'Connected to Supabase Cloud'}
          </Text>
        </View>

        {/* Logout */}
        <Button
          title="Log Out of FixMate"
          variant="danger"
          size="lg"
          icon={<Ionicons name="log-out-outline" size={20} color="#FFFFFF" />}
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
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
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 4,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoVal: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    marginTop: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    gap: 12,
  },
  menuRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  systemBox: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  systemText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  systemSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: Spacing.sm,
  },
});
