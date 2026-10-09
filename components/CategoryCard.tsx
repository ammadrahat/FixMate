import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows, Spacing } from '@/constants/Theme';
import { ServiceCategory } from '@/types';

interface CategoryCardProps {
  category: ServiceCategory;
  onPress?: () => void;
  compact?: boolean;
}

export function CategoryCard({
  category,
  onPress,
  compact = false,
}: CategoryCardProps) {
  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactCard, Shadows.card]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.compactIconBox, { backgroundColor: category.bgLight }]}>
          <Ionicons
            name={category.icon as keyof typeof Ionicons.glyphMap}
            size={24}
            color={category.color}
          />
        </View>
        <Text style={styles.compactTitle} numberOfLines={1}>
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.fullCard, Shadows.card]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: category.bgLight }]}>
          <Ionicons
            name={category.icon as keyof typeof Ionicons.glyphMap}
            size={28}
            color={category.color}
          />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{category.name}</Text>
          <Text style={styles.badgeCount}>
            {category.popularServices.length} Services
          </Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {category.description}
      </Text>

      <View style={styles.tagsContainer}>
        {category.popularServices.slice(0, 2).map((srv, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{srv}</Text>
          </View>
        ))}
        {category.popularServices.length > 2 && (
          <View style={[styles.tag, styles.moreTag]}>
            <Text style={styles.moreTagText}>
              +{category.popularServices.length - 2} more
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fullCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  badgeCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  moreTag: {
    backgroundColor: Colors.accentLight,
    borderColor: 'transparent',
  },
  moreTagText: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '600',
  },

  // Compact layout (used in grid/horizontal carousels)
  compactCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  compactIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  compactTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
});
