import { Pressable, ActivityIndicator } from 'react-native';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

const containerClasses: Record<Variant, string> = {
  primary:   'bg-brand-500',
  secondary: 'bg-surface-raised border border-line',
  danger:    'bg-danger',
  ghost:     'bg-transparent',
};

const heightClasses: Record<Size, string> = {
  sm: 'h-10',
  md: 'h-12',
  lg: 'h-14',
};

const labelTone: Record<Variant, 'invert' | 'default' | 'muted'> = {
  primary:   'invert',
  secondary: 'default',
  danger:    'invert',
  ghost:     'muted',
};

const spinnerColor: Record<Variant, string> = {
  primary:   '#1A0E08',
  secondary: '#F5E8D2',
  danger:    '#1A0E08',
  ghost:     'rgba(245,232,210,0.55)',
};

export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  loading = false,
  disabled = false,
  onPress,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={[
        'rounded-pill flex-row items-center justify-center gap-2',
        containerClasses[variant],
        heightClasses[size],
        fullWidth ? 'w-full' : 'self-start px-6',
        isDisabled ? 'opacity-40' : '',
      ].join(' ')}
    >
      {loading && (
        <ActivityIndicator size="small" color={spinnerColor[variant]} />
      )}
      <Text
        className="font-semibold text-[15px]"
        tone={labelTone[variant]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
