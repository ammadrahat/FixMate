import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { useSyncedOrders } from '@/context/SyncContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showRoleBadge?: boolean;
  onNotificationPress?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  route?: string;
}

export function Header({
  title = 'FixMate',
  subtitle,
  showRoleBadge = true,
  onNotificationPress,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, role, isMockMode, isRoot } = useAuth();
  const { orders } = useSyncedOrders();

  const [modalVisible, setModalVisible] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [clearedAll, setClearedAll] = useState(false);

  // Generate real notifications based on user role and synced orders
  const notifications = useMemo<NotificationItem[]>(() => {
    if (clearedAll) return [];

    const list: NotificationItem[] = [];

    if (role === 'admin') {
      list.push({
        id: 'admin-welcome',
        title: '⚡ Root Admin Active',
        message: 'Superuser mode: You can delete any service ad directly from catalog or services tab.',
        time: 'Active',
        icon: 'shield-checkmark',
        iconColor: '#7E22CE',
        route: '/(provider)/my-services',
      });
    }

    // Role-specific order notifications
    if (orders && orders.length > 0) {
      orders.slice(0, 5).forEach((order) => {
        if (role === 'provider' || role === 'admin') {
          if (order.status === 'pending') {
            list.push({
              id: `notif-order-pending-${order.id}`,
              title: 'New Job Request Available',
              message: `${order.service_title} in ${order.city || 'your area'} — Rs. ${order.amount.toLocaleString()}`,
              time: order.scheduled_date || 'Upcoming',
              icon: 'flash-outline',
              iconColor: Colors.accent,
              route: '/(provider)/requests',
            });
          } else if (order.status === 'in_progress') {
            list.push({
              id: `notif-order-prog-${order.id}`,
              title: 'Active Job Scheduled',
              message: `${order.service_title} for ${order.customer_name || 'Customer'}`,
              time: order.scheduled_date || 'Today',
              icon: 'time-outline',
              iconColor: Colors.primary,
              route: '/(provider)/jobs',
            });
          } else if (order.status === 'completed') {
            list.push({
              id: `notif-order-done-${order.id}`,
              title: 'Job Completed',
              message: `${order.service_title} has been completed successfully.`,
              time: 'Completed',
              icon: 'checkmark-circle-outline',
              iconColor: Colors.success,
              route: '/(provider)/jobs',
            });
          }
        } else {
          // Customer perspective
          if (order.status === 'pending') {
            list.push({
              id: `notif-cust-pending-${order.id}`,
              title: 'Booking Placed',
              message: `Your booking for ${order.service_title} is being assigned to a verified technician.`,
              time: order.scheduled_date || 'Pending',
              icon: 'receipt-outline',
              iconColor: Colors.accent,
              route: '/(customer)/orders',
            });
          } else if (order.status === 'in_progress') {
            list.push({
              id: `notif-cust-prog-${order.id}`,
              title: 'Technician Assigned',
              message: `${order.provider_name || 'FixMate Pro'} is working on your ${order.service_title}.`,
              time: order.scheduled_date || 'In Progress',
              icon: 'construct-outline',
              iconColor: Colors.primary,
              route: '/(customer)/orders',
            });
          } else if (order.status === 'completed') {
            list.push({
              id: `notif-cust-done-${order.id}`,
              title: 'Service Completed',
              message: `Your service order for ${order.service_title} has been completed.`,
              time: 'Completed',
              icon: 'checkmark-circle-outline',
              iconColor: Colors.success,
              route: '/(customer)/orders',
            });
          }
        }
      });
    }

    // Default welcome notification
    list.push({
      id: 'welcome-notif',
      title: 'Welcome to FixMate',
      message: 'Explore verified plumbers, electricians, and home services with instant booking.',
      time: 'Notice',
      icon: 'sparkles-outline',
      iconColor: Colors.primary,
    });

    return list;
  }, [orders, role, clearedAll]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const handleOpenBell = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      setModalVisible(true);
    }
  };

  const markAllRead = () => {
    const all = new Set(notifications.map((n) => n.id));
    setReadIds(all);
  };

  const handleNotificationPress = (item: NotificationItem) => {
    setReadIds((prev) => new Set([...prev, item.id]));
    setModalVisible(false);
    if (item.route) {
      router.push(item.route as any);
    }
  };

  const isCustomerPath = pathname?.includes('(customer)');
  const isProviderPath = pathname?.includes('(provider)');

  return (
    <View style={styles.container}>
      {isMockMode && (
        <View style={styles.mockBanner}>
          <Ionicons name="information-circle-outline" size={16} color="#B45309" />
          <Text style={styles.mockBannerText}>
            Local preview mode. Configure .env with Supabase keys for production.
          </Text>
        </View>
      )}

      {/* Root Admin Elevated Banner & Portal Switcher */}
      {isRoot && (
        <View style={styles.rootBanner}>
          <View style={styles.rootLeft}>
            <Ionicons name="shield-checkmark" size={16} color="#7E22CE" />
            <Text style={styles.rootBannerText}>Root Superuser: Elevated Delete Privileges</Text>
          </View>
          <TouchableOpacity
            style={styles.rootSwitchBtn}
            onPress={() => {
              if (isProviderPath) {
                router.push('/(customer)');
              } else {
                router.push('/(provider)');
              }
            }}
          >
            <Text style={styles.rootSwitchText}>
              {isProviderPath ? 'Customer Portal ➔' : 'Provider Hub ➔'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.headerRow}>
        <View style={styles.titleArea}>
          <View style={styles.brandRow}>
            <Text style={styles.appName}>FixMate</Text>
            {showRoleBadge && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isRoot
                      ? '#F3E8FF'
                      : role === 'provider'
                      ? Colors.accentLight
                      : '#DCFCE7',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: isRoot
                        ? '#7E22CE'
                        : role === 'provider'
                        ? Colors.accent
                        : '#15803D',
                    },
                  ]}
                >
                  {isRoot ? '⚡ ROOT ADMIN' : role === 'provider' ? 'Provider' : 'Customer'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>
            {subtitle || (profile?.full_name ? `Welcome, ${profile.full_name}` : 'Home Services Marketplace')}
          </Text>
        </View>

        {/* Notification Bell Button */}
        <TouchableOpacity
          style={styles.bellButton}
          onPress={handleOpenBell}
          activeOpacity={0.7}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={22} color={Colors.text} />
          {unreadCount > 0 && (
            <View style={styles.badgeCountPill}>
              <Text style={styles.badgeCountText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Interactive Notification Menu Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, Shadows.card]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="notifications" size={20} color={Colors.primary} />
                <Text style={styles.modalTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.unreadTag}>
                    <Text style={styles.unreadTagText}>{unreadCount} new</Text>
                  </View>
                )}
              </View>

              <View style={styles.modalHeaderActions}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={markAllRead} style={styles.markReadBtn}>
                    <Text style={styles.markReadText}>Mark read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={22} color={Colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* List */}
            <ScrollView
              style={styles.notifScroll}
              contentContainerStyle={styles.notifScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {notifications.length === 0 ? (
                <View style={styles.emptyNotifs}>
                  <Ionicons name="notifications-off-outline" size={40} color={Colors.textMuted} />
                  <Text style={styles.emptyTitle}>No Notifications</Text>
                  <Text style={styles.emptySubtitle}>You're all caught up! New orders and updates will appear here.</Text>
                </View>
              ) : (
                notifications.map((item) => {
                  const isUnread = !readIds.has(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.notifCard, isUnread && styles.notifCardUnread]}
                      onPress={() => handleNotificationPress(item)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.notifIconBox, { backgroundColor: `${item.iconColor}15` }]}>
                        <Ionicons name={item.icon} size={20} color={item.iconColor} />
                      </View>

                      <View style={styles.notifTextCol}>
                        <View style={styles.notifTopRow}>
                          <Text style={[styles.notifItemTitle, isUnread && styles.notifBoldTitle]}>
                            {item.title}
                          </Text>
                          <Text style={styles.notifTime}>{item.time}</Text>
                        </View>
                        <Text style={styles.notifMessage} numberOfLines={2}>
                          {item.message}
                        </Text>
                        {item.route && (
                          <View style={styles.notifActionPrompt}>
                            <Text style={styles.notifActionText}>Tap to view details</Text>
                            <Ionicons name="chevron-forward" size={12} color={Colors.primary} />
                          </View>
                        )}
                      </View>

                      {isUnread && <View style={styles.unreadDot} />}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            {/* Footer */}
            {notifications.length > 0 && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.clearAllBtn}
                  onPress={() => {
                    setClearedAll(true);
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                  <Text style={styles.clearAllText}>Clear All Notifications</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  mockBannerText: {
    fontSize: 11,
    color: '#92400E',
    marginLeft: 6,
    flex: 1,
    fontWeight: '500',
  },
  rootBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  rootLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  rootBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B21A8',
  },
  rootSwitchBtn: {
    backgroundColor: '#7E22CE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  rootSwitchText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleArea: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  badge: {
    marginLeft: Spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeCountPill: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.danger,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    minHeight: '40%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  unreadTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  unreadTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.danger,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markReadBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifScroll: {
    flex: 1,
  },
  notifScrollContent: {
    padding: Spacing.md,
    gap: 10,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  notifCardUnread: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderLeftWidth: 3.5,
    borderLeftColor: Colors.primary,
  },
  notifIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  notifTextCol: {
    flex: 1,
  },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  notifItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 6,
  },
  notifBoldTitle: {
    fontWeight: '800',
    color: Colors.text,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  notifMessage: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  notifActionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  notifActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
  },
  emptyNotifs: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 1.5,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  modalFooter: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.danger,
  },
});

