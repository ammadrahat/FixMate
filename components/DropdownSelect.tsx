import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Theme';

export interface DropdownItem {
  id: string;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface DropdownSelectProps {
  label: string;
  required?: boolean;
  value: string;
  onSelect: (val: string) => void;
  options: (string | DropdownItem)[];
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  searchable?: boolean;
  searchPlaceholder?: string;
  allowCustomInput?: boolean;
  customInputPlaceholder?: string;
  notInListLabel?: string;
  onAddCustomOption?: (val: string) => void;
  error?: string;
  helperText?: string;
}

export function DropdownSelect({
  label,
  required = false,
  value,
  onSelect,
  options,
  placeholder = 'Select option...',
  icon = 'chevron-down-outline',
  searchable = false,
  searchPlaceholder = 'Search options...',
  allowCustomInput = false,
  customInputPlaceholder = 'Enter custom city name...',
  notInListLabel = '➕ Not in the list? (Add custom city)',
  onAddCustomOption,
  error,
  helperText,
}: DropdownSelectProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomSelected, setIsCustomSelected] = useState(false);
  const [customText, setCustomText] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCustomInput, setNewCustomInput] = useState('');

  // Standardize options into DropdownItem format
  const normalizedOptions: DropdownItem[] = useMemo(() => {
    const list: DropdownItem[] = options.map((opt, index) => {
      if (typeof opt === 'string') {
        return {
          id: `opt-${index}-${opt}`,
          label: opt,
        };
      }
      return opt;
    });

    if (allowCustomInput) {
      const hasNotInList = list.some(
        (item) =>
          item.label.toLowerCase().includes('not in the list') ||
          item.label.toLowerCase().includes('not in list') ||
          item.id === 'not_in_list'
      );
      if (!hasNotInList) {
        list.push({
          id: 'not_in_list',
          label: notInListLabel,
          sublabel: 'Add and select a custom city',
          badge: 'Custom',
        });
      }
    }

    return list;
  }, [options, allowCustomInput, notInListLabel]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.sublabel && item.sublabel.toLowerCase().includes(q)) ||
        (item.badge && item.badge.toLowerCase().includes(q)) ||
        item.id === 'not_in_list' // always keep Not in list visible in search
    );
  }, [normalizedOptions, searchQuery]);

  const isNotInListOption = (item: DropdownItem) => {
    return (
      item.id === 'not_in_list' ||
      item.label.toLowerCase().includes('not in the list') ||
      item.label.toLowerCase().includes('not in list')
    );
  };

  const handleSelectItem = (item: DropdownItem) => {
    if (allowCustomInput && isNotInListOption(item)) {
      setIsAddingCustom(true);
      setNewCustomInput(searchQuery.trim());
      return;
    }

    if (
      allowCustomInput &&
      (item.label.toLowerCase().includes('custom') ||
        item.label.toLowerCase().includes('other'))
    ) {
      setIsAddingCustom(true);
      setNewCustomInput('');
      return;
    }

    setIsCustomSelected(false);
    setIsAddingCustom(false);
    onSelect(item.label);
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleConfirmCustomAdd = (manualCity?: string) => {
    const target = (manualCity !== undefined ? manualCity : newCustomInput).trim();
    if (!target) return;

    if (onAddCustomOption) {
      onAddCustomOption(target);
    }
    onSelect(target);
    setIsAddingCustom(false);
    setNewCustomInput('');
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleCustomTextChange = (text: string) => {
    setCustomText(text);
    onSelect(text);
  };

  const displayLabel = value || placeholder;
  const isSelected = Boolean(value);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label} {required && <Text style={styles.requiredStar}>*</Text>}
        </Text>
        {isCustomSelected && (
          <TouchableOpacity
            onPress={() => {
              setIsCustomSelected(false);
              setModalVisible(true);
            }}
          >
            <Text style={styles.backToMenuText}>Select from list</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Select Button (Drag Down Menu Trigger) */}
      {!isCustomSelected ? (
        <TouchableOpacity
          style={[
            styles.selectTrigger,
            modalVisible && styles.selectTriggerActive,
            Boolean(error) && styles.selectTriggerError,
          ]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.leftContent}>
            {icon && (
              <Ionicons
                name={icon}
                size={18}
                color={isSelected ? Colors.primary : Colors.textMuted}
                style={styles.leadingIcon}
              />
            )}
            <Text
              style={[
                styles.triggerText,
                !isSelected && styles.placeholderText,
              ]}
              numberOfLines={1}
            >
              {displayLabel}
            </Text>
          </View>
          <View style={styles.arrowIconContainer}>
            <Ionicons
              name={modalVisible ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Colors.textSecondary}
            />
          </View>
        </TouchableOpacity>
      ) : (
        /* Custom Input Fallback */
        <View style={styles.customInputContainer}>
          <Ionicons
            name="create-outline"
            size={18}
            color={Colors.primary}
            style={styles.leadingIcon}
          />
          <TextInput
            style={styles.customTextInput}
            placeholder={customInputPlaceholder}
            placeholderTextColor={Colors.textMuted}
            value={customText}
            onChangeText={handleCustomTextChange}
            autoFocus
          />
          <TouchableOpacity
            style={styles.clearCustomBtn}
            onPress={() => {
              setIsCustomSelected(false);
              setCustomText('');
            }}
          >
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Helper text or Error */}
      {Boolean(error) ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}

      {/* Dropdown Options Modal / Popover */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setModalVisible(false)}
            activeOpacity={1}
          />
          <View style={[styles.modalCard, Shadows.modal]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons
                  name={isAddingCustom ? 'location' : 'list-outline'}
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.modalTitle}>
                  {isAddingCustom ? 'Add Custom City' : label}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  setModalVisible(false);
                  setIsAddingCustom(false);
                  setSearchQuery('');
                }}
              >
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {isAddingCustom ? (
              <View style={styles.customAddCard}>
                <View style={styles.customAddNoticeBox}>
                  <Ionicons name="information-circle" size={18} color={Colors.primary} />
                  <Text style={styles.customAddSubtitle}>
                    Can't find your city in the list? Enter its name below to add and select it for your account or service request:
                  </Text>
                </View>
                <TextInput
                  style={styles.customModalInput}
                  placeholder={customInputPlaceholder}
                  placeholderTextColor={Colors.textMuted}
                  value={newCustomInput}
                  onChangeText={setNewCustomInput}
                  autoFocus
                />
                <View style={styles.customAddBtnRow}>
                  <TouchableOpacity
                    style={styles.customCancelBtn}
                    onPress={() => setIsAddingCustom(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.customCancelBtnText}>Back to List</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.customConfirmBtn,
                      !newCustomInput.trim() && styles.customConfirmBtnDisabled,
                    ]}
                    disabled={!newCustomInput.trim()}
                    onPress={() => handleConfirmCustomAdd()}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.customConfirmBtnText}>Add & Select City</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                {/* Optional Search Bar */}
                {searchable && (
                  <View style={styles.searchContainer}>
                    <Ionicons
                      name="search"
                      size={16}
                      color={Colors.textSecondary}
                      style={{ marginRight: 6 }}
                    />
                    <TextInput
                      style={styles.searchInput}
                      placeholder={searchPlaceholder}
                      placeholderTextColor={Colors.textMuted}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoCorrect={false}
                    />
                    {Boolean(searchQuery) && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Options List */}
                <FlatList
                  data={filteredOptions}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  style={styles.optionsList}
                  renderItem={({ item }) => {
                    const isItemActive = value === item.label;
                    const isNotInList = isNotInListOption(item);
                    return (
                      <TouchableOpacity
                        style={[
                          styles.optionItem,
                          isItemActive && styles.optionItemActive,
                          isNotInList && styles.notInListOptionItem,
                        ]}
                        onPress={() => handleSelectItem(item)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.optionContent}>
                          <View style={styles.optionTitleRow}>
                            <Text
                              style={[
                                styles.optionLabel,
                                isItemActive && styles.optionLabelActive,
                                isNotInList && styles.notInListOptionLabel,
                              ]}
                            >
                              {item.label}
                            </Text>
                            {Boolean(item.badge) && (
                              <View
                                style={[
                                  styles.badge,
                                  item.badge === 'URGENT' && styles.badgeUrgent,
                                  isNotInList && styles.notInListBadge,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.badgeText,
                                    item.badge === 'URGENT' && styles.badgeTextUrgent,
                                    isNotInList && styles.notInListBadgeText,
                                  ]}
                                >
                                  {item.badge}
                                </Text>
                              </View>
                            )}
                          </View>
                          {Boolean(item.sublabel) && (
                            <Text
                              style={[
                                styles.optionSublabel,
                                isNotInList && styles.notInListOptionSublabel,
                              ]}
                            >
                              {item.sublabel}
                            </Text>
                          )}
                        </View>

                        {isNotInList ? (
                          <Ionicons
                            name="add-circle"
                            size={22}
                            color={Colors.primary}
                          />
                        ) : isItemActive ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={Colors.primary}
                          />
                        ) : (
                          <Ionicons
                            name="radio-button-off"
                            size={18}
                            color={Colors.borderDark}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Ionicons name="location-outline" size={28} color={Colors.textMuted} />
                      <Text style={styles.emptyText}>No matching options found</Text>
                      {allowCustomInput && Boolean(searchQuery.trim()) && (
                        <TouchableOpacity
                          style={styles.addNotFoundBtn}
                          onPress={() => handleConfirmCustomAdd(searchQuery.trim())}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                          <Text style={styles.addNotFoundBtnText}>
                            Add "{searchQuery.trim()}" as custom city
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  }
                />
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  requiredStar: {
    color: Colors.danger,
  },
  backToMenuText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 46,
  },
  selectTriggerActive: {
    borderColor: Colors.primary,
  },
  selectTriggerError: {
    borderColor: Colors.danger,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leadingIcon: {
    marginRight: 8,
  },
  triggerText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },
  placeholderText: {
    color: Colors.textMuted,
    fontWeight: '400',
  },
  arrowIconContainer: {
    marginLeft: 6,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 46,
  },
  customTextInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  clearCustomBtn: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
  },
  helperText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
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
    maxHeight: '75%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    paddingBottom: Spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  closeBtn: {
    padding: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  optionsList: {
    paddingHorizontal: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginVertical: 2,
  },
  optionItemActive: {
    backgroundColor: '#EFF6FF',
  },
  optionContent: {
    flex: 1,
    paddingRight: 8,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  optionLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  optionSublabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeUrgent: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  badgeTextUrgent: {
    color: Colors.danger,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: 6,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  notInListOptionItem: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginVertical: 4,
  },
  notInListOptionLabel: {
    color: '#15803D',
    fontWeight: '700',
  },
  notInListOptionSublabel: {
    color: '#166534',
  },
  notInListBadge: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  notInListBadgeText: {
    color: '#15803D',
  },
  customAddCard: {
    padding: Spacing.md,
  },
  customAddHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  customAddTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  customAddNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: 8,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  customAddSubtitle: {
    fontSize: 12,
    color: Colors.primary,
    flex: 1,
    lineHeight: 17,
  },
  customModalInput: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  customAddBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  customCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  customConfirmBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  customConfirmBtnDisabled: {
    opacity: 0.5,
  },
  customConfirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addNotFoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    gap: 6,
    marginTop: 6,
  },
  addNotFoundBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
