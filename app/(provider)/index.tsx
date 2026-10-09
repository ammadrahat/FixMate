import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { useAuth } from '@/context/AuthContext';

export default function ProviderDashboardScreen() {
  const router = useRouter();
  const { profile, providerData, toggleAvailability } = useAuth();

  const isAvailable = providerData?.is_available ?? true;
  const trade = providerData?.trade || 'Home Services Technician';

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Provider Dashboard"
        subtitle={`FixMate Pro — ${trade}`}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Availability Toggle Banner */}
        <View style={[styles.statusCard, isAvailable ? styles.statusActive : styles.statusOffline]}>
          <View style={styles.statusInfo}>
            <View style={styles.statusIndicatorRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isAvailable ? Colors.success : Colors.warning },
                ]}
              />
              <Text style={styles.statusTitle}>
                {isAvailable ? 'Available for New Jobs' : 'Currently Offline (Busy)'}
              </Text>
            </View>
            <Text style={styles.statusDesc}>
              {isAvailable
                ? 'Customers in your area can discover and send you job requests.'
                : 'Turn ON availability when you are ready to receive new service orders.'}
            </Text>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={toggleAvailability}
            trackColor={{ false: '#CBD5E1', true: Colors.successLight }}
            thumbColor={isAvailable ? Colors.success : '#94A3B8'}
          />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, Shadows.card]}>
            <View style={[styles.statIconBox, { backgroundColor: Colors.accentLight }]}>
              <Ionicons name="notifications" size={20} color={Colors.accent} />
            </View>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>New Requests</Text>
          </View>

          <View style={[styles.statBox, Shadows.card]}>
            <View style={[styles.statIconBox, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="briefcase" size={20} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statLabel}>Active Jobs</Text>
          </View>

          <View style={[styles.statBox, Shadows.card]}>
            <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="star" size={20} color={Colors.warning} />
            </View>
            <Text style={styles.statValue}>{providerData?.rating || '4.9'} ★</Text>
            <Text style={styles.statLabel}>Rating ({providerData?.rating_count || 24})</Text>
          </View>

          <View style={[styles.statBox, Shadows.card]}>
            <View style={[styles.statIconBox, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="cash" size={20} color="#7C3AED" />
            </View>
            <Text style={styles.statValue}>Rs. 42k</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        {/* Pending Requests Alert */}
        <View style={[styles.requestCard, Shadows.card]}>
          <View style={styles.requestHeader}>
            <View style={styles.alertBadge}>
              <Ionicons name="flash" size={14} color="#B45309" />
              <Text style={styles.alertBadgeText}>URGENT REQUEST</Text>
            </View>
            <Text style={styles.requestTime}>12 mins ago</Text>
          </View>

          <Text style={styles.requestService}>Main Distribution Breaker Tripping</Text>
          <Text style={styles.requestLocation}>
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} /> Model Town, Block C, Lahore
          </Text>

          <View style={styles.requestFooter}>
            <View>
              <Text style={styles.offeredLabel}>Offered Rate</Text>
              <Text style={styles.offeredValue}>Rs. 1,500</Text>
            </View>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(provider)/requests')}
            >
              <Text style={styles.actionBtnText}>View Requests</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Provider Guidelines */}
        <View style={styles.guidelinesCard}>
          <Text style={styles.guidelinesTitle}>Pro Tips for Success</Text>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.tipText}>Carry your CNIC and FixMate digital badge to every job.</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.tipText}>Always give clear cost breakdown before starting repairs.</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.tipText}>Keep customer rating above 4.5 to receive premium urgent jobs.</Text>
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
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  statusCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statusOffline: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statusInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  statusDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.md,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  alertBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  requestTime: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  requestService: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  requestLocation: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  offeredLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  offeredValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  actionBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  guidelinesCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 4,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});
