import { useRef, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui';

const ITEM_H = 44;
const DIAL_W = 52;

// Data: [null, 0, 1, ..., 99]
// null → index 0 → offset 0
// n    → index n+1 → offset (n+1) * ITEM_H
type DialValue = number | null;
const DIAL_DATA: DialValue[] = [null, ...Array.from({ length: 100 }, (_, i) => i)];

function valueToOffset(v: number | null): number {
  return (v === null ? 0 : v + 1) * ITEM_H;
}

function offsetToValue(offsetY: number): number | null {
  const idx = Math.round(offsetY / ITEM_H);
  if (idx <= 0) return null;
  if (idx > 100) return 99;
  return idx - 1;
}

export interface DialPickerProps {
  value: number | null;
  onChange: (v: number | null) => void;
  disabled?: boolean;
}

export function DialPicker({ value, onChange, disabled = false }: DialPickerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const lastHapticIdx = useRef<number>(-1);
  const isReady = useRef(false);
  const initialValue = useRef(value);
  // True only while the user's finger is on the view. Programmatic scrollTo calls
  // (handleLayout, external value sync) never set this flag, so their scroll-end
  // events are silently ignored and onChange is not called spuriously.
  const userInitiated = useRef(false);

  // Scroll to the correct position once the ScrollView has rendered.
  const handleLayout = useCallback(() => {
    if (isReady.current) return;
    isReady.current = true;
    scrollRef.current?.scrollTo({
      y: valueToOffset(initialValue.current),
      animated: false,
    });
  }, []);

  // Mark the scroll as user-initiated the moment a finger touches the view.
  const handleScrollBeginDrag = useCallback(() => {
    userInitiated.current = true;
  }, []);

  // Fire haptic on each scroll step (both user and programmatic — haptic only fires
  // when the user is dragging anyway because programmatic scrolls move instantly).
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
      if (idx !== lastHapticIdx.current) {
        lastHapticIdx.current = idx;
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [],
  );

  // Commit the value only when the user initiated the scroll.
  // onScrollEndDrag covers slow drags (no momentum); onMomentumScrollEnd covers
  // flicks. Both are guarded by userInitiated so programmatic scrollTo never
  // triggers onChange.
  const handleScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!userInitiated.current) return;
      // Reset after a short delay so that if momentum fires immediately after,
      // onMomentumScrollEnd still sees userInitiated = true.
      setTimeout(() => { userInitiated.current = false; }, 300);
      onChange(offsetToValue(e.nativeEvent.contentOffset.y));
    },
    [onChange],
  );

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!userInitiated.current) return;
      userInitiated.current = false;
      onChange(offsetToValue(e.nativeEvent.contentOffset.y));
    },
    [onChange],
  );

  // Keep dial in sync when value changes externally (does not call onChange).
  useEffect(() => {
    if (!isReady.current) return;
    scrollRef.current?.scrollTo({ y: valueToOffset(value), animated: true });
  }, [value]);

  const ink = disabled ? 'rgba(245,232,210,0.35)' : '#F5E8D2';

  return (
    <View
      style={[styles.container, { width: DIAL_W, height: ITEM_H }]}
      pointerEvents={disabled ? 'none' : 'auto'}
    >
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        scrollEnabled={!disabled}
        scrollEventThrottle={16}
        onLayout={handleLayout}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        {DIAL_DATA.map((item, i) => (
          <View key={i} style={styles.item}>
            <Text style={[styles.itemText, { color: ink }]}>
              {item === null ? '–' : String(item)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,232,210,0.12)',
    backgroundColor: '#231B17',
  },
  item: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 26,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    lineHeight: 32,
  },
});
