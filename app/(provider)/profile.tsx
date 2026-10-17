import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { PhoneVerificationModal } from '@/components/PhoneVerificationModal';
import { useAuth } from '@/context/AuthContext';

export default function ProviderProfileScreen() {
  const router = useRouter();
  const { profile, providerData, logout, toggleAvailability, isMockMode, isPhoneVerified, setPhoneVerified } = useAuth();
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);


  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of FixMate Pro?',
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

  const trade = providerData?.trade || 'Electrician';
  const experienceYears = providerData?.experience_years ?? 5;
  const isAvailable = providerData?.is_available ?? true;
  const approvalStatus = providerData?.approval_status || 'approved';
  const bio =
    providerData?.bio ||
    'Experienced trade specialist providing electrical diagnostics, home wiring, UPS installation, and appliance maintenance.';

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Provider Profile" subtitle="Your FixMate Pro business account" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
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
                : 'PR'}
            </Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{profile?.full_name || 'Tariq Mehmood'}</Text>
            <View style={styles.tradeBadge}>
              <Ionicons name="construct" size={12} color="#FFFFFF" />
              <Text style={styles.tradeBadgeText}>{trade}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Verification: </Text>
              <StatusBadge status={approvalStatus} />
            </View>
          </View>
        </View>

        {/* Availability Switch */}
        <View style={styles.sectionCard}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Accepting New Job Requests</Text>
              <Text style={styles.switchSubtitle}>
                Toggle off if you are occupied with an existing client or off duty.
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={toggleAvailability}
              trackColor={{ false: '#CBD5E1', true: Colors.successLight }}
              thumbColor={isAvailable ? Colors.success : '#94A3B8'}
            />
          </View>
        </View>

        {/* Professional Stats */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Service Record</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statNum}>{providerData?.rating || '4.9'} ★</Text>
              <Text style={styles.statLbl}>Rating Score</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNum}>{experienceYears} Yrs</Text>
              <Text style={styles.statLbl}>Field Experience</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNum}>{providerData?.completed_jobs || 142}</Text>
              <Text style={styles.statLbl}>Completed Jobs</Text>
            </View>
          </View>
        </View>

        {/* Bio / Description */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Professional Summary</Text>
          <Text style={styles.bioText}>{bio}</Text>
        </View>

        {/* Contact info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Business Details</Text>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoVal}>{profile?.email || 'provider@fixmate.com'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={Colors.textSecondary} />
            <View style={styles.infoCol}>
              <View style={styles.phoneLabelRow}>
                <Text style={styles.infoLabel}>Contact Number</Text>
                {isPhoneVerified || profile?.is_phone_verified ? (
                  <View style={styles.verifiedTag}>
                    <Ionicons name="shield-checkmark" size={11} color="#15803D" />
                    <Text style={styles.verifiedTagText}>Verified Pro</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.verifyBtn}
                    onPress={() => setPhoneModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="shield-outline" size={11} color={Colors.primary} />
                    <Text style={styles.verifyBtnText}>Verify Free</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.infoVal}>{profile?.phone || '+92 300 9876543'}</Text>
            </View>
          </View>


          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={18} color={Colors.textSecondary} />
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Standard Visit Fee</Text>
              <Text style={styles.infoVal}>Rs. 1,000 / inspection</Text>
            </View>
          </View>
        </View>

        {/* Pro Support */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Alert.alert('Provider Helpdesk', 'FixMate Pro Helpline: 042-111-FIXPRO\nWhatsApp: +92 312 FIXMATE')}
          >
            <Ionicons name="headset-outline" size={20} color={Colors.accent} />
            <Text style={styles.menuRowText}>Provider Hotline & WhatsApp</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Alert.alert('Safety Standards', 'Maintain safety protocols, wear company jacket, and carry your CNIC.')}
          >
            <Ionicons name="shield-outline" size={20} color={Colors.success} />
            <Text style={styles.menuRowText}>Safety & Code of Conduct</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Mode info */}
        <View style={styles.systemBox}>
          <Text style={styles.systemText}>FixMate Provider Edition v1.0.0</Text>
          <Text style={styles.systemSubtext}>
            Mode: {isMockMode ? 'Local Preview Mode' : 'Supabase Cloud Connected'}
          </Text>
        </View>

        {/* Logout */}
        <Button
          title="Log Out of Provider Portal"
          variant="danger"
          size="lg"
          icon={<Ionicons name="log-out-outline" size={20} color="#FFFFFF" />}
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
      </ScrollView>

      <PhoneVerificationModal
        visible={phoneModalVisible}
        initialPhone={profile?.phone || '+92 300 9876543'}
        onClose={() => setPhoneModalVisible(false)}
        onSuccess={(verifiedPhone) => {
          setPhoneVerified(verifiedPhone);
          Alert.alert(
            'Provider Phone Verified! 🎉',
            `Your number ${verifiedPhone} has been verified as an official FixMate Pro contact.`
          );
        }}
        title="Verify Provider Phone"
        description="Verify your trade business phone number with free instant OTP to receive customer call notifications and job dispatch alerts."
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accent,
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
  tradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 4,
  },
  tradeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  statusLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  switchSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
    paddingRight: 8,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  statCol: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  statLbl: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.divider,
  },
  bioText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
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
    fontSize: 13,
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
  phoneLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  verifyBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
});

