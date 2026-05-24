import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

type Variant = 'title' | 'heading' | 'body' | 'caption' | 'eyebrow' | 'display';
type Tone = 'default' | 'brand' | 'muted' | 'dim' | 'invert' | 'danger' | 'success';
type Align = 'left' | 'center' | 'right';

interface TextProps extends RNTextProps {
  variant?: Variant;
  tone?: Tone;
  align?: Align;
}

const variantClasses: Record<Variant, string> = {
  display: 'font-display font-bold',
  title:   'text-2xl font-display font-bold',
  heading: 'text-[17px] font-display font-bold',
  body:    'text-base',
  caption: 'text-[11px]',
  eyebrow: 'text-eyebrow font-mono uppercase tracking-widest text-ink-muted',
};

const toneClasses: Record<Tone, string> = {
  default: 'text-ink',
  brand:   'text-brand-500',
  muted:   'text-ink-muted',
  dim:     'text-ink-dim',
  invert:  'text-ink-invert',
  danger:  'text-danger',
  success: 'text-success',
};

const alignClasses: Record<Align, string> = {
  left:   'text-left',
  center: 'text-center',
  right:  'text-right',
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
