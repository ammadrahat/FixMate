import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/Theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const isOutline = variant === 'outline';
  const isSecondary = variant === 'secondary';
  const isDanger = variant === 'danger';

  const getBackgroundColor = () => {
    if (disabled) return '#CBD5E1';
    if (isOutline) return 'transparent';
    if (isSecondary) return Colors.accentLight;
    if (isDanger) return Colors.danger;
    return Colors.primary;
  };

  const getTextColor = () => {
    if (disabled) return '#94A3B8';
    if (isOutline) return Colors.primary;
    if (isSecondary) return Colors.accent;
    return '#FFFFFF';
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 14 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 24 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 18 };
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || loading}
      style={[
        styles.button,
        getPadding(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: isOutline ? Colors.primary : 'transparent',
          borderWidth: isOutline ? 1.5 : 0,
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: size === 'sm' ? 14 : size === 'lg' ? 17 : 15,
                fontWeight: '600',
              },
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  text: {
    textAlign: 'center',
  },
});
