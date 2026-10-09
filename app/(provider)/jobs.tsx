import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';

interface ProviderJobItem {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceTitle: string;
  address: string;
  status: 'in_progress' | 'completed';
  date: string;
  earnings: number;
}

const INITIAL_JOBS: ProviderJobItem[] = [
  {
    id: 'job-501',
    customerName: 'Ahmed Raza',
    customerPhone: '+92 301 2345678',
    serviceTitle: 'Emergency Water Tank Pipe Burst Fix',
    address: 'Street 4, Sector G, DHA Phase 6, Lahore',
    status: 'in_progress',
    date: 'Today, Started 1:00 PM',
    earnings: 2200,
  },
  {
    id: 'job-502',
    customerName: 'Zainab Bibi',
    customerPhone: '+92 322 8765412',
    serviceTitle: 'Kitchen Sink Drain Replacement',
    address: 'Main Boulevard, Gulberg II, Lahore',
    status: 'completed',
    date: 'Yesterday, Completed 4:30 PM',
    earnings: 1400,
  },
];

export default function ProviderJobsScreen() {
  const [activeTab, setActiveTab] = useState<'ongoing' | 'completed'>('ongoing');
  const [jobs, setJobs] = useState<ProviderJobItem[]>(INITIAL_JOBS);

  const filtered = jobs.filter((j) =>
    activeTab === 'ongoing' ? j.status === 'in_progress' : j.status === 'completed'
  );

  const handleMarkComplete = (jobId: string) => {
    Alert.alert(
      'Complete Job',
      'Have you finished all work and received payment confirmation from the customer?',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: () => {
            setJobs((prev) =>
              prev.map((j) =>
                j.id === jobId
                  ? { ...j, status: 'completed', date: 'Just now, Completed' }
                  : j
              )
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="My Jobs" subtitle="Track in-progress service visits and earnings" />
      <View style={styles.container}>
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
              Ongoing Jobs
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
              Completed Jobs
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <EmptyState
              icon={activeTab === 'ongoing' ? 'briefcase-outline' : 'trophy-outline'}
              title={activeTab === 'ongoing' ? 'No Ongoing Jobs' : 'No Completed Jobs Yet'}
              description={
                activeTab === 'ongoing'
                  ? 'You do not have any jobs currently in progress. Head to the Job Requests tab to accept new work.'
                  : 'Jobs you finish and receive payment for will be permanently archived here for your records.'
              }
            />
          ) : (
            filtered.map((job) => (
              <View key={job.id} style={[styles.jobCard, Shadows.card]}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.jobId}>#{job.id}</Text>
                    <Text style={styles.customerName}>{job.customerName}</Text>
                  </View>
                  <StatusBadge status={job.status} />
                </View>

                <Text style={styles.serviceTitle}>{job.serviceTitle}</Text>

                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={15} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{job.address}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={15} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{job.date}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="call-outline" size={15} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{job.customerPhone}</Text>
                </View>

                <View style={styles.footerRow}>
                  <View>
                    <Text style={styles.earningsLabel}>Your Payout</Text>
                    <Text style={styles.earningsValue}>Rs. {job.earnings.toLocaleString()}</Text>
                  </View>

                  {job.status === 'in_progress' ? (
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
                      <Text style={styles.ratedText}>5.0 ★ Rated</Text>
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
