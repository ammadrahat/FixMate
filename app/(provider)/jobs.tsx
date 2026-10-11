import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { useSyncedOrders, SyncStatusBadge } from '@/context/SyncContext';

export default function ProviderJobsScreen() {
  const { user, profile } = useAuth();
  const currentProviderId = user?.id || profile?.id || 'prov-1';
  const { orders, completeOrder } = useSyncedOrders();

  const [activeTab, setActiveTab] = useState<'ongoing' | 'completed'>('ongoing');

  const ongoingJobs = orders.filter((o) =>
    (o.status === 'in_progress' || o.status === 'accepted') &&
    (!o.provider_id || o.provider_id === currentProviderId)
  );

  const completedJobs = orders.filter((o) =>
    o.status === 'completed' &&
    (!o.provider_id || o.provider_id === currentProviderId)
  );

  const displayedJobs = activeTab === 'ongoing' ? ongoingJobs : completedJobs;

  const handleMarkComplete = (jobId: string) => {
    Alert.alert(
      'Complete Job',
      'Have you finished all work and received payment confirmation from the customer?',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: async () => {
            try {
              await completeOrder(jobId);
              Alert.alert('Job Completed! 🎉', 'The job has been marked complete and moved to your Completed Jobs tab.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to complete job.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="My Jobs" subtitle="Track in-progress service visits and earnings" />
      <View style={styles.container}>
        <SyncStatusBadge />
        {/* Tab switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'ongoing' && styles.tabItemActive]}
            onPress={() => setActiveTab('ongoing')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'ongoing' && styles.tabTextActive,
              ]}
            >
              Ongoing Jobs ({ongoingJobs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'completed' && styles.tabItemActive]}
            onPress={() => setActiveTab('completed')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'completed' && styles.tabTextActive,
              ]}
            >
              Completed Jobs ({completedJobs.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {displayedJobs.length === 0 ? (
            <EmptyState
              icon={activeTab === 'ongoing' ? 'briefcase-outline' : 'trophy-outline'}
              title={activeTab === 'ongoing' ? 'No Ongoing Jobs' : 'No Completed Jobs Yet'}
              description={
                activeTab === 'ongoing'
                  ? 'You do not have any jobs currently in progress. Head to the Job Requests tab to accept incoming leads.'
                  : 'Jobs you finish and receive payment for will be permanently archived here for your records.'
              }
            />
          ) : (
            displayedJobs.map((job) => (
              <View key={job.id} style={[styles.jobCard, Shadows.card]}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.jobId}>#{job.id}</Text>
                    <Text style={styles.customerName}>
                      {job.customer_name || 'Valued Customer'}
                    </Text>
                  </View>
                  <StatusBadge status={job.status} />
                </View>

                <Text style={styles.serviceTitle}>{job.service_title}</Text>

                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={15} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>
                    {job.address}{job.city ? `, ${job.city}` : ''}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={15} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{job.scheduled_date}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="call-outline" size={15} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>
                    {job.customer_phone || '+92 300 1234567'}
                  </Text>
                </View>

                <View style={styles.footerRow}>
                  <View>
                    <Text style={styles.earningsLabel}>Your Payout</Text>
                    <Text style={styles.earningsValue}>
                      Rs. {job.amount.toLocaleString()}
                    </Text>
                  </View>

                  {job.status !== 'completed' ? (
                    <TouchableOpacity
                      style={styles.completeBtn}
                      onPress={() => handleMarkComplete(job.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                      <Text style={styles.completeBtnText}>Mark as Done</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.ratedPill}>
                      <Ionicons name="star" size={14} color="#D97706" />
                      <Text style={styles.ratedText}>5.0 ★ Completed</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  listContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  jobId: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  earningsLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  earningsValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.success,
  },
  completeBtn: {
    backgroundColor: Colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  ratedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  ratedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
});
