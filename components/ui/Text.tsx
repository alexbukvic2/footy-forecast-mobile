import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

type Variant = 'title' | 'body' | 'caption';
type Tone = 'default' | 'brand' | 'muted' | 'dim' | 'invert';
type Align = 'left' | 'center' | 'right';

interface TextProps extends RNTextProps {
  variant?: Variant;
  tone?: Tone;
  align?: Align;
}

const variantClasses: Record<Variant, string> = {
  title: 'text-2xl font-display font-bold',
  body: 'text-base',
  caption: 'text-[11px]',
};

const toneClasses: Record<Tone, string> = {
  default: 'text-ink',
  brand: 'text-brand-500',
  muted: 'text-ink-muted',
  dim: 'text-ink-dim',
  invert: 'text-ink-invert',
};

const alignClasses: Record<Align, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function Text({ variant, tone, align, className, ...rest }: TextProps) {
  const classes = [
    'text-ink',
    variant !== undefined ? variantClasses[variant] : undefined,
    tone !== undefined ? toneClasses[tone] : undefined,
    align !== undefined ? alignClasses[align] : undefined,
    className,
  ]
    .filter((c): c is string => c !== undefined)
    .join(' ');

  return <RNText className={classes} {...rest} />;
}
