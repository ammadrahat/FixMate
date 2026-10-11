import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { PREDEFINED_TRADES } from '@/constants/Categories';
import { useAuth } from '@/context/AuthContext';
import { useSyncedServices } from '@/context/SyncContext';
import { ProviderService } from '@/types';

export default function MyServicesScreen() {
  const { user, profile } = useAuth();
  const currentProviderId = user?.id || profile?.id || 'prov-1';
  const { providerServices, createService, toggleService, deleteService } = useSyncedServices(currentProviderId);

  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(PREDEFINED_TRADES[0] || 'Plumbing');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');

  // Form errors
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    price?: string;
    duration?: string;
  }>({});

  const resetForm = () => {
    setTitle('');
    setCategory(PREDEFINED_TRADES[0] || 'Plumbing');
    setDescription('');
    setPrice('');
    setDuration('');
    setErrors({});
  };

  const handleOpenModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setModalVisible(false);
  };

  const validateForm = () => {
    const newErrors: {
      title?: string;
      description?: string;
      price?: string;
      duration?: string;
    } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    const parsedPrice = parseFloat(price);
    if (!price.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
      newErrors.price = 'Please enter a valid price (PKR)';
    }
    if (!duration.trim()) {
      newErrors.duration = 'Estimated duration is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateService = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await createService({
        provider_id: currentProviderId,
        provider_name: profile?.full_name || 'FixMate Verified Pro',
        title: title.trim(),
        category,
        description: description.trim(),
        price: parseFloat(price.trim()),
        duration: duration.trim(),
      });

      handleCloseModal();
      Alert.alert('Success', 'Your service ad has been created successfully.');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to create service ad. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (service: ProviderService) => {
    if (service.provider_id && service.provider_id !== currentProviderId) {
      Alert.alert('Permission Denied', 'You cannot modify a service created by another provider.');
      return;
    }
    try {
      await toggleService(service.id, currentProviderId);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update service status.');
    }
  };

  const handleDelete = (service: ProviderService) => {
    if (service.provider_id && service.provider_id !== currentProviderId) {
      Alert.alert('Permission Denied', 'You cannot delete a service created by another provider.');
      return;
    }
    Alert.alert(
      'Delete Service Ad',
      `Are you sure you want to delete "${service.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteService(service.id, currentProviderId);
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to delete service.');
            }
          },
        },
      ]
    );
  };

  const services = providerServices || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Header
        title="My Services"
        subtitle="Manage your service ads, rates & availability"
      />

      <View style={styles.topBar}>
        <View>
          <Text style={styles.servicesCount}>
            {services.length} {services.length === 1 ? 'Service Ad' : 'Service Ads'}
          </Text>
          <Text style={styles.servicesSubtext}>Active ads are visible to customers</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleOpenModal}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Post New Ad</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {services.length === 0 ? (
          <EmptyState
            icon="pricetags-outline"
            title="No Services Created Yet"
            description="Offer your skills to customers across the city. Create and post your first service advertisement."
            actionTitle="Post a Service"
            onActionPress={handleOpenModal}
          />
        ) : (
          services.map((service: ProviderService) => (
            <View key={service.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.categoryBadge}>
                  <Ionicons name="briefcase-outline" size={13} color={Colors.primary} />
                  <Text style={styles.categoryBadgeText}>{service.category}</Text>
                </View>

                <View style={styles.statusToggleContainer}>
                  <Text
                    style={[
                      styles.statusLabel,
                      { color: service.is_active ? Colors.success : Colors.textMuted },
                    ]}
                  >
                    {service.is_active ? 'Active' : 'Inactive'}
                  </Text>
                  <Switch
                    value={service.is_active}
                    onValueChange={() => handleToggle(service)}
                    trackColor={{ false: '#E2E8F0', true: Colors.successLight }}
                    thumbColor={service.is_active ? Colors.success : '#94A3B8'}
                    style={styles.switch}
                  />
                </View>
              </View>

              <Text style={styles.cardTitle}>{service.title}</Text>
              <Text style={styles.cardDescription}>{service.description}</Text>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="pricetag-outline" size={15} color={Colors.primary} />
                  <Text style={styles.priceText}>
                    PKR {service.price ? service.price.toLocaleString() : '0'}
                  </Text>
                </View>

                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={15} color={Colors.textSecondary} />
                  <Text style={styles.durationText}>{service.duration}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[
                    styles.footerToggleBtn,
                    service.is_active ? styles.pauseBtn : styles.activateBtn,
                  ]}
                  onPress={() => handleToggle(service)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={service.is_active ? 'pause-circle-outline' : 'play-circle-outline'}
                    size={16}
                    color={service.is_active ? '#B45309' : Colors.success}
                  />
                  <Text
                    style={[
                      styles.footerToggleBtnText,
                      { color: service.is_active ? '#B45309' : Colors.success },
                    ]}
                  >
                    {service.is_active ? 'Pause Ad' : 'Activate Ad'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(service)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Service Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Post Service Ad</Text>
                <Text style={styles.modalSubtitle}>Reach new customers looking for work</Text>
              </View>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalForm}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Service Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Service Title *</Text>
                <TextInput
                  style={[styles.input, errors.title ? styles.inputError : null]}
                  placeholder="e.g. Complete Bathroom Plumbing Repair"
                  placeholderTextColor={Colors.textMuted}
                  value={title}
                  onChangeText={(val) => {
                    setTitle(val);
                    if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                />
                {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
              </View>

              {/* Category Picker using PREDEFINED_TRADES */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category / Trade *</Text>
                <Text style={styles.helperText}>Select the best fitting trade category</Text>
                <View style={styles.tradeChipsContainer}>
                  {PREDEFINED_TRADES.map((trade) => {
                    const isSelected = category === trade;
                    return (
                      <TouchableOpacity
                        key={trade}
                        style={[styles.tradeChip, isSelected && styles.tradeChipSelected]}
                        onPress={() => setCategory(trade)}
                        activeOpacity={0.7}
                      >
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color="#FFFFFF"
                            style={styles.tradeChipCheck}
                          />
                        )}
                        <Text
                          style={[
                            styles.tradeChipText,
                            isSelected && styles.tradeChipTextSelected,
                          ]}
                        >
                          {trade}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    errors.description ? styles.inputError : null,
                  ]}
                  placeholder="Describe the service, what's included, and any equipment needed..."
                  placeholderTextColor={Colors.textMuted}
                  value={description}
                  onChangeText={(val) => {
                    setDescription(val);
                    if (errors.description)
                      setErrors((prev) => ({ ...prev, description: undefined }));
                  }}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                {errors.description && (
                  <Text style={styles.errorText}>{errors.description}</Text>
                )}
              </View>

              {/* Price */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Starting Price (PKR) *</Text>
                <View style={[styles.inputPrefixWrapper, errors.price ? styles.inputError : null]}>
                  <Text style={styles.prefixText}>PKR</Text>
                  <TextInput
                    style={styles.prefixedInput}
                    placeholder="e.g. 1500"
                    placeholderTextColor={Colors.textMuted}
                    value={price}
                    onChangeText={(val) => {
                      setPrice(val.replace(/[^0-9.]/g, ''));
                      if (errors.price) setErrors((prev) => ({ ...prev, price: undefined }));
                    }}
                    keyboardType="numeric"
                  />
                </View>
                {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
              </View>

              {/* Estimated Duration */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Estimated Duration *</Text>
                <TextInput
                  style={[styles.input, errors.duration ? styles.inputError : null]}
                  placeholder="e.g. 1-2 hours, Same day, 30 mins"
                  placeholderTextColor={Colors.textMuted}
                  value={duration}
                  onChangeText={(val) => {
                    setDuration(val);
                    if (errors.duration)
                      setErrors((prev) => ({ ...prev, duration: undefined }));
                  }}
                />
                {errors.duration && <Text style={styles.errorText}>{errors.duration}</Text>}
              </View>

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={handleCloseModal}
                  style={styles.cancelBtn}
                />
                <Button
                  title={isSubmitting ? 'Posting...' : 'Post Service Ad'}
                  onPress={handleCreateService}
                  loading={isSubmitting}
                  style={styles.submitBtn}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  servicesCount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  servicesSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    gap: 6,
    ...Shadows.card,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  statusToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  switch: {
    transform: Platform.OS === 'ios' ? [{ scaleX: 0.8 }, { scaleY: 0.8 }] : [],
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  durationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.sm,
  },
  footerToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.sm,
    gap: 5,
  },
  pauseBtn: {
    backgroundColor: '#FEF3C7',
  },
  activateBtn: {
    backgroundColor: '#DCFCE7',
  },
  footerToggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#FEE2E2',
    gap: 4,
  },
  deleteButtonText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
    paddingBottom: Spacing.xl,
    ...Shadows.modal,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  modalForm: {
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.text,
  },
  textArea: {
    minHeight: 88,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
  },
  tradeChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tradeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tradeChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tradeChipCheck: {
    marginRight: 4,
  },
  tradeChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tradeChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inputPrefixWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginRight: 8,
  },
  prefixedInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  cancelBtn: {
    flex: 1,
  },
  submitBtn: {
    flex: 2,
  },
});
