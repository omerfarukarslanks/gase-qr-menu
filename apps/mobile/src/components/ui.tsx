import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type TextStyle,
  type TextInputProps,
  type ViewStyle,
  type ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MOBILE_THEME } from '@gase/shared';
import { useAppTheme } from '../theme/provider';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

export function Screen({
  children,
  scroll = true,
  contentContainerStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const { colors } = useAppTheme();

  if (!scroll) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.screenContent, contentContainerStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.screenContent, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function AppCard({ children, style, ...props }: ViewProps & { children: React.ReactNode }) {
  const { colors } = useAppTheme();

  return (
    <View
      {...props}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.sectionTitle}>
      {eyebrow ? (
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>{eyebrow}</Text>
      ) : null}
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: colors.mutedForeground }]}>{description}</Text>
      ) : null}
    </View>
  );
}

export function AppButton({
  children,
  variant = 'primary',
  loading = false,
  style,
  textStyle,
  ...props
}: PressableProps & {
  children: React.ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  textStyle?: StyleProp<TextStyle>;
}) {
  const { colors } = useAppTheme();

  const palette =
    variant === 'primary'
      ? {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          color: colors.primaryForeground,
        }
      : variant === 'secondary'
        ? {
            backgroundColor: colors.secondary,
            borderColor: colors.secondary,
            color: colors.secondaryForeground,
          }
        : variant === 'destructive'
          ? {
              backgroundColor: '#dc2626',
              borderColor: '#dc2626',
              color: '#ffffff',
            }
          : {
              backgroundColor: 'transparent',
              borderColor: colors.border,
              color: colors.foreground,
            };

  return (
    <Pressable
      {...props}
      style={(state: PressableStateCallbackType) => {
        const resolvedStyle = typeof style === 'function' ? style(state) : style;

        return [
          styles.button,
          {
            backgroundColor: palette.backgroundColor,
            borderColor: palette.borderColor,
            opacity: props.disabled ? 0.5 : state.pressed ? 0.92 : 1,
          },
          resolvedStyle,
        ];
      }}
    >
      {loading ? (
        <ActivityIndicator color={palette.color} />
      ) : (
        <Text style={[styles.buttonText, { color: palette.color }, textStyle]}>{children}</Text>
      )}
    </Pressable>
  );
}

export function AppChip({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.secondary,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          {
            color: active ? colors.primaryForeground : colors.secondaryForeground,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function AppInput({
  style,
  ...props
}: TextInputProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.mutedForeground}
      style={[
        styles.input,
        {
          backgroundColor: isDark ? colors.muted : colors.card,
          borderColor: colors.border,
          color: colors.foreground,
        },
        style,
      ]}
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  const { colors } = useAppTheme();

  return (
    <AppCard style={styles.emptyState}>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
        {description}
      </Text>
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </AppCard>
  );
}

export function StatPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.statPill, { backgroundColor: colors.secondary }]}>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  screenContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: MOBILE_THEME.radius.xl,
    padding: 18,
    gap: 12,
  },
  sectionTitle: {
    gap: 6,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: MOBILE_THEME.fonts.display,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  button: {
    minHeight: 52,
    borderRadius: MOBILE_THEME.radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  chip: {
    minHeight: 38,
    borderRadius: MOBILE_THEME.radius.pill,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    minHeight: 50,
    borderRadius: MOBILE_THEME.radius.lg,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 26,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyDescription: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  emptyAction: {
    width: '100%',
    marginTop: 8,
  },
  statPill: {
    flex: 1,
    borderRadius: MOBILE_THEME.radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
});
