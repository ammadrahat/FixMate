import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { DropdownSelect } from '@/components/DropdownSelect';
import { getBookingDateOptions } from '@/constants/BookingDates';
import { useSyncedOrders, SyncStatusBadge } from '@/context/SyncContext';
import { JobOrder } from '@/types';


type TabKey = 'active' | 'postponed' | 'completed' | 'cancelled';

const SEED_ORDERS: JobOrder[] = [
  {
    id: 'ord-101',
    customer_id: 'cust-1',
    service_title: 'Bathroom Leakage & Angle Valve Repair',
    category: 'Plumbing',
    status: 'in_progress',
    provider_name: 'Usman Ghani (Plumber)',
    scheduled_date: 'Today, 2:30 PM',
    address: 'House # 42, Block B, DHA Phase 5',
    city: 'Lahore',
    amount: 1200,
    created_at: '2026-10-09',
  },
  {
    id: 'ord-102',
    customer_id: 'cust-1',
    service_title: 'Ceiling Fan & LED Chandelier Installation',
    category: 'Electrical Work',
    status: 'completed',
    provider_name: 'Tariq Mehmood (Electrician)',
    scheduled_date: 'Yesterday, 11:00 AM',
    address: 'House # 42, Block B, DHA Phase 5',
    city: 'Lahore',
    amount: 1800,
    created_at: '2026-10-08',
  },
];

const PRESET_DATE_SUGGESTIONS = [
  'Tomorrow, 10:00 AM',
  'Tomorrow, 3:00 PM',
  'This Weekend, 11:00 AM',
  'Next Monday, 2:00 PM',
];

export default function CustomerOrdersScreen() {
  const router = useRouter();
  const {
    orders: syncedOrders,
    cancelOrder,
    postponeOrder,
    createOrder,
    isLoading,
  } = useSyncedOrders();

  const [activeTab, setActiveTab] = useState<TabKey>('active');

  // Postpone modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<JobOrder | null>(null);
  const [newDateInput, setNewDateInput] = useState('');
  const [postponeReason, setPostponeReason] = useState('');
  const [isSubmittingPostpone, setIsSubmittingPostpone] = useState(false);

  // Fallback seeding when context has no orders
  const seedingAttempted = useRef(false);

  useEffect(() => {
    if (!isLoading && syncedOrders.length === 0 && !seedingAttempted.current) {
      seedingAttempted.current = true;
      (async () => {
        try {
          for (const seed of SEED_ORDERS) {
            await createOrder(seed);
          }
        } catch (err) {
          console.warn('Error injecting seed orders:', err);
        }
      })();
    }
  }, [isLoading, syncedOrders.length, createOrder]);

  const orders = syncedOrders.length > 0 ? syncedOrders : (!isLoading ? SEED_ORDERS : []);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'active') {
      return o.status === 'pending' || o.status === 'in_progress' || o.status === 'accepted';
    }
    if (activeTab === 'postponed') {
      return o.status === 'postponed';
    }
    if (activeTab === 'completed') {
      return o.status === 'completed';
    }
    if (activeTab === 'cancelled') {
      return o.status === 'cancelled';
    }
    return false;
  });

  // Tab counts
  const activeCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'in_progress' || o.status === 'accepted'
  ).length;
  const postponedCount = orders.filter((o) => o.status === 'postponed').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'postponed', label: 'Postponed', count: postponedCount },
    { key: 'completed', label: 'Completed', count: completedCount },
    { key: 'cancelled', label: 'Cancelled', count: cancelledCount },
  ];

  const handleCancelOrder = (orderId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this service request? This will notify the service provider.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelOrder(orderId, 'Cancelled by customer');
              Alert.alert('Booking Cancelled', 'Your service request has been cancelled.');
            } catch {
              Alert.alert('Error', 'Unable to cancel this booking. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleOpenPostponeModal = (order: JobOrder) => {
    setSelectedOrder(order);
    setNewDateInput('');
    setPostponeReason('');
    setModalVisible(true);
  };

  const handleClosePostponeModal = () => {
    setModalVisible(false);
    setSelectedOrder(null);
    setNewDateInput('');
    setPostponeReason('');
    setIsSubmittingPostpone(false);
  };

  const handleConfirmPostpone = async () => {
    if (!selectedOrder) return;
    const trimmedDate = newDateInput.trim();
    if (!trimmedDate) {
      Alert.alert('New Date Required', 'Please enter or pick a preferred date and time.');
      return;
    }

    try {
      setIsSubmittingPostpone(true);
      const reason = postponeReason.trim() || undefined;
      await postponeOrder(selectedOrder.id, trimmedDate, reason);
      handleClosePostponeModal();
      Alert.alert(
        'Request Rescheduled',
        `Your booking has been postponed to "${trimmedDate}". Changes will sync automatically.`
      );
    } catch {
      Alert.alert('Error', 'Failed to reschedule order. Please try again.');
    } finally {
      setIsSubmittingPostpone(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="My Orders" subtitle="Track your service requests and past jobs" />

      {/* Sync Status Badge if offline or sync pending */}
      <View style={styles.syncContainer}>
        <SyncStatusBadge />
      </View>

      <View style={styles.container}>
        {/* Filter Tabs */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <View style={styles.tabContentRow}>
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                  {tab.count > 0 && (
                    <View
                      style={[
                        styles.countBadge,
                        isActive && styles.countBadgeActive,
                        tab.key === 'postponed' && styles.countBadgeWarning,
                      ]}
                    >
                      <Text
                        style={[
                          styles.countText,
                          isActive && styles.countTextActive,
                          tab.key === 'postponed' && styles.countTextWarning,
                        ]}
                      >
                        {tab.count}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {filteredOrders.length === 0 ? (
            <EmptyState
              icon={
                activeTab === 'active'
                  ? 'receipt-outline'
                  : activeTab === 'postponed'
                  ? 'calendar-outline'
                  : activeTab === 'completed'
                  ? 'checkmark-done-circle-outline'
                  : 'close-circle-outline'
              }
              title={
                activeTab === 'active'
                  ? 'No Active Orders'
                  : activeTab === 'postponed'
                  ? 'No Postponed Orders'
                  : activeTab === 'completed'
                  ? 'No Completed Orders'
                  : 'No Cancelled Orders'
              }
              description={
                activeTab === 'active'
                  ? 'You do not have any ongoing service bookings right now. Book a trusted home pro today!'
                  : activeTab === 'postponed'
                  ? 'You have not postponed any orders. Rescheduled requests will be displayed here.'
                  : activeTab === 'completed'
                  ? 'When your service requests are finished, you will find their receipts and ratings here.'
                  : 'You have no cancelled service bookings on record.'
              }
              actionTitle="Book a Service"
              onActionPress={() => router.push('/(customer)/services')}
            />
          ) : (
            filteredOrders.map((order) => {
              const isPostponed = order.status === 'postponed';
              const isActiveOrder =
                order.status === 'pending' ||
                order.status === 'in_progress' ||
                order.status === 'accepted';
              const isPastOrder =
                order.status === 'completed' || order.status === 'cancelled';

              return (
                <View
                  key={order.id}
                  style={[
                    styles.orderCard,
                    isPostponed && styles.orderCardPostponed,
                    Shadows.card,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.orderIdBox}>
                      <Text style={styles.orderIdText}>#{order.id}</Text>
                      <Text style={styles.orderCategory}>{order.category}</Text>
                    </View>
                    <StatusBadge status={order.status} />
                  </View>

                  <Text style={styles.serviceTitle}>{order.service_title}</Text>

                  {/* Scheduled Date */}
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={15}
                      color={isPostponed ? Colors.warning : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.detailText,
                        isPostponed && styles.detailTextPostponed,
                      ]}
                    >
                      {order.scheduled_date}
                    </Text>
                    {isPostponed && (
                      <View style={styles.rescheduledTag}>
                        <Text style={styles.rescheduledTagText}>Postponed</Text>
                      </View>
                    )}
                  </View>

                  {/* Address */}
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={15} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>
                      {order.address}, {order.city}
                    </Text>
                  </View>

                  {/* Customer Phone & Verification */}
                  {order.customer_phone ? (
                    <View style={styles.detailRow}>
                      <Ionicons name="call-outline" size={15} color={Colors.textSecondary} />
                      <Text style={styles.detailText}>{order.customer_phone}</Text>
                      {order.customer_phone_verified && (
                        <View style={styles.verifiedPhoneTag}>
                          <Ionicons name="shield-checkmark" size={10} color="#15803D" />
                          <Text style={styles.verifiedPhoneTagText}>Verified</Text>
                        </View>
                      )}
                    </View>
                  ) : null}

                  {/* Assigned Pro */}
                  {order.provider_name && (
                    <View style={styles.detailRow}>
                      <Ionicons name="person-outline" size={15} color={Colors.textSecondary} />
                      <Text style={styles.detailText}>Assigned Pro: {order.provider_name}</Text>
                    </View>
                  )}


                  {/* Card Footer with Amount & Actions */}
                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.amountLabel}>Total Amount</Text>
                      <Text style={styles.amountValue}>Rs. {order.amount.toLocaleString()}</Text>
                    </View>

                    <View style={styles.actionsRow}>
                      {/* Active Order Actions: Cancel + Postpone */}
                      {isActiveOrder && (
                        <>
                          <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => handleCancelOrder(order.id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="close-outline" size={15} color={Colors.danger} />
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.postponeBtn}
                            onPress={() => handleOpenPostponeModal(order)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="calendar-outline" size={15} color={Colors.warning} />
                            <Text style={styles.postponeBtnText}>Postpone</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {/* Postponed Order Actions: Cancel + Reschedule */}
                      {isPostponed && (
                        <>
                          <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => handleCancelOrder(order.id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="close-outline" size={15} color={Colors.danger} />
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.postponeBtn}
                            onPress={() => handleOpenPostponeModal(order)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="time-outline" size={15} color={Colors.warning} />
                            <Text style={styles.postponeBtnText}>Reschedule</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {/* Completed / Cancelled Actions: Book Again */}
                      {isPastOrder && (
                        <TouchableOpacity
                          style={styles.reorderBtn}
                          onPress={() => router.push('/(customer)/services')}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="refresh-outline" size={14} color="#FFFFFF" />
                          <Text style={styles.reorderBtnText}>Book Again</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Postpone / Reschedule Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleClosePostponeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalCard, Shadows.modal]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleBox}>
                <Ionicons name="calendar-outline" size={20} color={Colors.warning} />
                <Text style={styles.modalTitle}>
                  {selectedOrder?.status === 'postponed'
                    ? 'Reschedule Booking'
                    : 'Postpone Service Booking'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClosePostponeModal}
                style={styles.modalCloseIcon}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Selected Order Summary */}
            {selectedOrder && (
              <View style={styles.modalOrderSummary}>
                <Text style={styles.modalOrderTitle} numberOfLines={1}>
                  {selectedOrder.service_title}
                </Text>
                <View style={styles.modalDetailRow}>
                  <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.modalDetailText}>
                    Current: {selectedOrder.scheduled_date}
                  </Text>
                </View>
              </View>
            )}

            {/* Drag Down Menu for New Rescheduled Date */}
            <DropdownSelect
              label="New Preferred Date & Time"
              required
              value={newDateInput}
              onSelect={setNewDateInput}
              options={getBookingDateOptions().map((d) => ({
                id: d.id,
                label: d.label,
                badge: d.badge,
              }))}
              placeholder="Select new date from drag down menu..."
              icon="calendar-outline"
              allowCustomInput
              customInputPlaceholder="Type custom date & time (e.g. Next Tuesday 3:00 PM)..."
            />

            {/* Quick Suggestion Chips */}
            <Text style={styles.modalLabel}>Quick Suggestion Shortcuts</Text>
            <View style={styles.chipRow}>
              {PRESET_DATE_SUGGESTIONS.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  style={[
                    styles.chip,
                    newDateInput === suggestion && styles.chipActive,
                  ]}
                  onPress={() => setNewDateInput(suggestion)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      newDateInput === suggestion && styles.chipTextActive,
                    ]}
                  >
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>


            {/* Optional Reason Input */}
            <Text style={styles.modalLabel}>Reason for Postponing (Optional)</Text>
            <View style={[styles.inputContainer, styles.reasonContainer]}>
              <Ionicons
                name="chatbox-outline"
                size={18}
                color={Colors.textSecondary}
                style={[styles.inputIcon, { marginTop: 10 }]}
              />
              <TextInput
                style={[styles.textInput, styles.reasonInput]}
                placeholder="e.g., Family emergency, out of town, plumber unavailable"
                placeholderTextColor={Colors.textMuted}
                value={postponeReason}
                onChangeText={setPostponeReason}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Modal Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={handleClosePostponeModal}
                disabled={isSubmittingPostpone}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Dismiss</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  !newDateInput.trim() && styles.modalConfirmBtnDisabled,
                ]}
                onPress={handleConfirmPostpone}
                disabled={isSubmittingPostpone || !newDateInput.trim()}
                activeOpacity={0.8}
              >
                {isSubmittingPostpone ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.modalConfirmBtnText}>
                      {selectedOrder?.status === 'postponed'
                        ? 'Confirm Reschedule'
                        : 'Confirm Postpone'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  syncContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: 4,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.primary,
  },
  tabContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: Colors.divider,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  countBadgeActive: {
    backgroundColor: Colors.primaryLight,
  },
  countBadgeWarning: {
    backgroundColor: Colors.warningLight,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  countTextActive: {
    color: '#FFFFFF',
  },
  countTextWarning: {
    color: Colors.warning,
  },
  listContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderCardPostponed: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFFCF8',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  orderIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  orderCategory: {
    fontSize: 11,
    color: Colors.textSecondary,
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  detailTextPostponed: {
    color: '#C2410C',
    fontWeight: '600',
  },
  rescheduledTag: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.xs,
    marginLeft: 4,
  },
  rescheduledTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C2410C',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  amountLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.danger,
    backgroundColor: '#FFF5F5',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.danger,
  },
  postponeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.warning,
    backgroundColor: '#FFFBEB',
  },
  postponeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  reorderBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  modalCloseIcon: {
    padding: 4,
  },
  modalOrderSummary: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  modalOrderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  modalDetailText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
    marginTop: Spacing.xs,
  },
  requiredStar: {
    color: Colors.danger,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning,
  },
  chipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#B45309',
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: '#FFFFFF',
    marginBottom: Spacing.sm,
  },
  reasonContainer: {
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.text,
  },
  reasonInput: {
    minHeight: 52,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: Spacing.md,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.divider,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modalConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.warning,
  },
  modalConfirmBtnDisabled: {
    opacity: 0.5,
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedPhoneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.xs,
    marginLeft: 6,
  },
  verifiedPhoneTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
});

