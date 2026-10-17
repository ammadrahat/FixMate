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
  customInputPlaceholder = 'Enter custom value...',
  error,
  helperText,
}: DropdownSelectProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomSelected, setIsCustomSelected] = useState(false);
  const [customText, setCustomText] = useState('');

  // Standardize options into DropdownItem format
  const normalizedOptions: DropdownItem[] = useMemo(() => {
    return options.map((opt, index) => {
      if (typeof opt === 'string') {
        return {
          id: `opt-${index}-${opt}`,
          label: opt,
        };
      }
      return opt;
    });
  }, [options]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.sublabel && item.sublabel.toLowerCase().includes(q)) ||
        (item.badge && item.badge.toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchQuery]);

  const handleSelectItem = (item: DropdownItem) => {
    if (
      allowCustomInput &&
      (item.label.toLowerCase().includes('custom') ||
        item.label.toLowerCase().includes('other'))
    ) {
      setIsCustomSelected(true);
      setCustomText('');
      setModalVisible(false);
      return;
    }

    setIsCustomSelected(false);
    onSelect(item.label);
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
                <Ionicons name="list-outline" size={20} color={Colors.primary} />
                <Text style={styles.modalTitle}>{label}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  setModalVisible(false);
                  setSearchQuery('');
                }}
              >
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

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
                return (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      isItemActive && styles.optionItemActive,
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
                          ]}
                        >
                          {item.label}
                        </Text>
                        {Boolean(item.badge) && (
                          <View
                            style={[
                              styles.badge,
                              item.badge === 'URGENT' && styles.badgeUrgent,
                            ]}
                          >
                            <Text
                              style={[
                                styles.badgeText,
                                item.badge === 'URGENT' && styles.badgeTextUrgent,
                              ]}
                            >
                              {item.badge}
                            </Text>
                          </View>
                        )}
                      </View>
                      {Boolean(item.sublabel) && (
                        <Text style={styles.optionSublabel}>{item.sublabel}</Text>
                      )}
                    </View>

                    {isItemActive ? (
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
                  <Ionicons name="alert-circle-outline" size={28} color={Colors.textMuted} />
                  <Text style={styles.emptyText}>No matching options found</Text>
                </View>
              }
            />
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
});
